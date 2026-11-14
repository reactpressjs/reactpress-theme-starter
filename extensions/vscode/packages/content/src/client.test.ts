import assert from 'node:assert/strict'
import { after, before, describe, it } from 'node:test'

import { ReactPressClient } from './client'
import { send, startMockServer } from './test-helpers'
import { ReactPressApiError } from './types'

describe('ReactPressClient', () => {
  let baseUrl = ''
  let close: () => Promise<void>
  const articles = new Map<string, Record<string, unknown>>()
  let loginPayload: Record<string, unknown> = { name: 'admin', token: 'test-token' }
  let categoryPayload: unknown = [{ id: 'cat-1', label: 'Architecture', value: 'architecture' }]
  let tagPayload: unknown = [{ id: 'tag-1', label: 'ReactPress', value: 'reactpress' }]
  let uploadPayload: Record<string, unknown> = {
    url: 'https://cdn.example.com/uploads/demo.png',
    id: 'file-1',
  }
  let lastAuth = ''

  before(async () => {
    const mock = await startMockServer(async (req, res, url, body) => {
      lastAuth = String(req.headers.authorization || '')

      if (req.method === 'POST' && url.pathname === '/api/auth/login') {
        const parsed = JSON.parse(body) as { name: string; password: string }
        if (parsed.name !== 'admin' || parsed.password !== 'admin') {
          send(res, 401, { success: false, msg: 'bad credentials', statusCode: 401 })
          return true
        }
        send(res, 200, { success: true, data: loginPayload })
        return true
      }

      if (req.method === 'GET' && url.pathname === '/api/user') {
        if (!lastAuth.includes('test-token')) {
          send(res, 401, { success: false, msg: 'unauthorized', statusCode: 401 })
          return true
        }
        send(res, 200, { success: true, data: { id: 'u1', name: 'admin' } })
        return true
      }

      if (req.method === 'GET' && url.pathname === '/api/category') {
        send(res, 200, { success: true, data: categoryPayload })
        return true
      }

      if (req.method === 'GET' && url.pathname === '/api/tag') {
        send(res, 200, { success: true, data: tagPayload })
        return true
      }

      if (req.method === 'GET' && url.pathname === '/api/article') {
        send(res, 200, {
          success: true,
          data: {
            data: [{ id: 'listed', title: 'Listed', status: 'draft' }],
          },
        })
        return true
      }

      if (req.method === 'POST' && url.pathname === '/api/article') {
        const parsed = JSON.parse(body) as Record<string, unknown>
        const id = `art-${articles.size + 1}`
        const article = { ...parsed, id, updateAt: '2026-01-01T00:00:00.000Z' }
        articles.set(id, article)
        send(res, 200, { success: true, data: article })
        return true
      }

      if (req.method === 'GET' && url.pathname.startsWith('/api/article/')) {
        const id = url.pathname.split('/').pop()!
        const article = articles.get(id)
        if (!article) {
          send(res, 404, { success: false, msg: 'not found', statusCode: 404 })
          return true
        }
        send(res, 200, { success: true, data: article })
        return true
      }

      if (req.method === 'PATCH' && url.pathname.startsWith('/api/article/')) {
        const id = url.pathname.split('/').pop()!
        const existing = articles.get(id)
        if (!existing) {
          send(res, 404, { success: false, msg: 'not found', statusCode: 404 })
          return true
        }
        const parsed = JSON.parse(body) as Record<string, unknown>
        const article = { ...existing, ...parsed, id, updateAt: '2026-01-02T00:00:00.000Z' }
        articles.set(id, article)
        send(res, 200, { success: true, data: article })
        return true
      }

      if (req.method === 'POST' && url.pathname === '/api/file/upload') {
        if (!lastAuth.includes('test-token')) {
          send(res, 401, { success: false, msg: 'unauthorized', statusCode: 401 })
          return true
        }
        send(res, 200, { success: true, data: uploadPayload })
        return true
      }

      return false
    })
    baseUrl = mock.baseUrl
    close = mock.close
  })

  after(async () => {
    await close()
  })

  it('logs in with token field and rejects bad credentials', async () => {
    loginPayload = { name: 'admin', token: 'test-token' }
    const client = new ReactPressClient({ apiUrl: baseUrl })
    await assert.rejects(
      () => client.login({ name: 'admin', password: 'nope' }),
      (err: unknown) => err instanceof ReactPressApiError
    )
    const login = await client.login({ name: 'admin', password: 'admin' })
    assert.equal(login.token, 'test-token')
    assert.equal(client.http.token, 'test-token')
  })

  it('logs in with accessToken fallback', async () => {
    loginPayload = { name: 'admin', accessToken: 'access-tok' }
    const client = new ReactPressClient({ apiUrl: baseUrl })
    const login = await client.login({ name: 'admin', password: 'admin' })
    assert.equal(login.token, 'access-tok')
  })

  it('rejects login responses without token', async () => {
    loginPayload = { name: 'admin' }
    const client = new ReactPressClient({ apiUrl: baseUrl })
    await assert.rejects(
      () => client.login({ name: 'admin', password: 'admin' }),
      /no token was returned/
    )
  })

  it('unwraps article list shapes', async () => {
    const client = new ReactPressClient({ apiUrl: baseUrl, token: 't' })

    // nested { data: [...] }
    let list = await client.listArticles()
    assert.equal(list[0]?.id, 'listed')

    // plain array
    categoryPayload = [
      { id: 'cat-1', label: 'Architecture', value: 'architecture' },
      { id: 'cat-2', label: 'News', value: 'news' },
    ]
    client.clearTaxonomyCache()
    assert.equal((await client.listCategories()).length, 2)

    // [items, total] tuple
    categoryPayload = [[{ id: 'cat-9', label: 'X', value: 'x' }], 1]
    client.clearTaxonomyCache()
    assert.equal((await client.listCategories())[0]?.id, 'cat-9')

    // unknown shape → []
    categoryPayload = { weird: true }
    client.clearTaxonomyCache()
    assert.deepEqual(await client.listCategories(), [])

    // restore
    categoryPayload = [{ id: 'cat-1', label: 'Architecture', value: 'architecture' }]
    client.clearTaxonomyCache()
    void list
  })

  it('resolves categories by id/value/label and falls back', async () => {
    categoryPayload = [
      { id: 'cat-1', label: 'Architecture', value: 'architecture' },
      { id: 'cat-2', label: 'News', value: 'news' },
    ]
    const client = new ReactPressClient({ apiUrl: baseUrl, token: 't' })
    assert.equal(await client.resolveCategoryId('architecture'), 'cat-1')
    assert.equal(await client.resolveCategoryId('News'), 'cat-2')
    assert.equal(await client.resolveCategoryId('cat-1'), 'cat-1')
    assert.equal(await client.resolveCategoryId('missing-ref'), 'missing-ref')
    assert.equal(await client.resolveCategoryId(), 'cat-1')

    categoryPayload = []
    client.clearTaxonomyCache()
    assert.equal(await client.resolveCategoryId(), undefined)
    categoryPayload = [{ id: 'cat-1', label: 'Architecture', value: 'architecture' }]
    client.clearTaxonomyCache()
  })

  it('resolves tag ids and joins them', async () => {
    tagPayload = [
      { id: 'tag-1', label: 'ReactPress', value: 'reactpress' },
      { id: 'tag-2', label: 'Next', value: 'next' },
    ]
    const client = new ReactPressClient({ apiUrl: baseUrl, token: 't' })
    assert.equal(await client.resolveTagIds([]), undefined)
    assert.equal(await client.resolveTagIds(['reactpress', 'Next', 'custom']), 'tag-1,tag-2,custom')
    // Cached tags reused on second resolve
    assert.equal(await client.resolveTagIds(['reactpress']), 'tag-1')
    assert.equal(await client.resolveTagIds(['']), undefined)
  })

  it('clears taxonomy cache after list failures so later calls retry', async () => {
    let categoryCalls = 0
    let tagCalls = 0
    const client = new ReactPressClient({
      apiUrl: 'http://example.invalid/api',
      fetchImpl: (async (input) => {
        const url = String(input)
        if (url.includes('/category')) {
          categoryCalls += 1
          if (categoryCalls === 1) {
            return new Response(JSON.stringify({ success: false, msg: 'down' }), { status: 500 })
          }
          return new Response(
            JSON.stringify({
              success: true,
              data: [{ id: 'c1', label: 'L', value: 'v' }],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        }
        if (url.includes('/tag')) {
          tagCalls += 1
          if (tagCalls === 1) {
            return new Response(JSON.stringify({ success: false, msg: 'down' }), { status: 500 })
          }
          return new Response(
            JSON.stringify({
              success: true,
              data: [{ id: 't1', label: 'T', value: 't' }],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        }
        return new Response(JSON.stringify({ success: true, data: {} }), { status: 200 })
      }) as typeof fetch,
    })

    await assert.rejects(() => client.listCategories(), ReactPressApiError)
    assert.equal((await client.listCategories())[0]?.id, 'c1')
    await assert.rejects(() => client.listTags(), ReactPressApiError)
    assert.equal((await client.listTags())[0]?.id, 't1')
  })

  it('creates/updates/gets articles', async () => {
    articles.clear()
    const client = new ReactPressClient({ apiUrl: baseUrl, token: 'test-token' })
    const created = await client.createArticle({ title: 'T', status: 'draft' })
    assert.ok(created.id)
    const got = await client.getArticle(String(created.id))
    assert.equal(got.title, 'T')
    const updated = await client.updateArticle(String(created.id), { title: 'T2' })
    assert.equal(updated.title, 'T2')
  })

  it('uploads files from Buffer and Blob, accepts path fallback', async () => {
    const client = new ReactPressClient({ apiUrl: baseUrl, token: 'test-token' })
    uploadPayload = { url: 'https://cdn.example.com/uploads/demo.png', id: 'file-1' }
    const fromBuffer = await client.uploadFile(Buffer.from('fake'), 'demo.png')
    assert.equal(fromBuffer.url, 'https://cdn.example.com/uploads/demo.png')
    assert.equal(fromBuffer.id, 'file-1')

    const fromBlob = await client.uploadFile(new Blob(['x']), 'blob.png')
    assert.ok(fromBlob.url)

    const fromBytes = await client.uploadFile(Uint8Array.from([1, 2, 3]), 'bytes.png')
    assert.ok(fromBytes.url)

    uploadPayload = { path: '/uploads/via-path.png' }
    const viaPath = await client.uploadFile(Buffer.from('x'), 'p.png')
    assert.equal(viaPath.url, '/uploads/via-path.png')
    assert.equal(viaPath.id, undefined)

    uploadPayload = {}
    await assert.rejects(
      () => client.uploadFile(Buffer.from('x'), 'missing.png'),
      /no url was returned/
    )
    uploadPayload = { url: 'https://cdn.example.com/uploads/demo.png', id: 'file-1' }
  })

  it('falls back when global File is unavailable', async () => {
    const client = new ReactPressClient({ apiUrl: baseUrl, token: 'test-token' })
    uploadPayload = { url: 'https://cdn.example.com/uploads/nofile.png' }
    const OriginalFile = globalThis.File
    // Simulate older runtimes without the File constructor.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).File
    try {
      const uploaded = await client.uploadFile(Buffer.from('x'), 'nofile.png')
      assert.equal(uploaded.url, 'https://cdn.example.com/uploads/nofile.png')
    } finally {
      globalThis.File = OriginalFile
    }
  })

  it('verifies a stored token and rejects an invalid one', async () => {
    const client = new ReactPressClient({ apiUrl: baseUrl, token: 'test-token' })
    const user = await client.verifySession()
    assert.equal(user.name, 'admin')

    const invalid = new ReactPressClient({ apiUrl: baseUrl, token: 'nope' })
    await assert.rejects(() => invalid.verifySession(), ReactPressApiError)
  })

  it('listArticles forwards status/page/pageSize query defaults', async () => {
    const client = new ReactPressClient({ apiUrl: baseUrl, token: 't' })
    const listed = await client.listArticles({ status: 'draft', page: 2, pageSize: 10 })
    assert.ok(Array.isArray(listed))
  })
})
