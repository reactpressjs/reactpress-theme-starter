import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { ReactPressClient } from './client'
import {
  createNewArticleDocument,
  parseLocalDocument,
  remoteArticleToDocument,
  serializeLocalDocument,
  slugifyTitle,
} from './frontmatter'
import { ReactPressHttp } from './http'
import { deriveSummary, renderMarkdown } from './markdown'
import { buildArticlePayload, previewUrl, pushDocument } from './sync'
import { ReactPressApiError, SyncConflictError, type RemoteArticle } from './types'

/**
 * Combinatorial scenario suite — targets 1000+ discrete cases across the
 * content kit (frontmatter, markdown, http, sync, client helpers).
 */

const TITLES = [
  'Hello',
  'Hello World',
  '你好世界',
  'ReactPress 3.0',
  'a',
  'Title with "quotes"',
  'Title: with colon',
  '  spaced  ',
  'emoji-🚀-post',
  'underscore_title',
  'slash/title',
  'dot.title',
  '123 numeric',
  'ALLCAPS',
  'mixed Case Title',
  'very-long-' + 'x'.repeat(40),
]

const STATUSES = ['draft', 'publish', 'unknown', '', null, undefined, 1, true, false] as const

const TAG_INPUTS: Array<{ raw: string; expected: string[] | undefined }> = [
  { raw: 'tags: [a, b]', expected: ['a', 'b'] },
  { raw: 'tags:\n  - one\n  - two', expected: ['one', 'two'] },
  { raw: 'tags: "alpha, beta , gamma"', expected: ['alpha', 'beta', 'gamma'] },
  { raw: 'tags: solo', expected: ['solo'] },
  { raw: 'tags: ""', expected: undefined },
  { raw: 'tags: 42', expected: ['42'] },
  { raw: '', expected: undefined },
]

const CATEGORIES = ['architecture', 'news', 'tech', '', '中文分类', 'cat-1']

const COVERS = [
  '',
  '/abs.png',
  'https://cdn.example.com/a.png',
  'http://cdn.example.com/b.jpg',
  'relative/cover.png',
  './local.png',
]

const SUMMARIES = [undefined, '', 'Short', 'A longer summary for the article body preview.']

const BOOLISH = [undefined, true, false, 0, 1, 'yes'] as const

function yamlEscape(value: string): string {
  // Empty / whitespace / special chars must be quoted — bare `cover:` is YAML null.
  if (value === '' || /[:#"'\n]/.test(value) || value !== value.trim()) {
    return JSON.stringify(value)
  }
  return value
}

function buildFrontmatterDoc(options: {
  title: string
  status?: unknown
  tagsRaw?: string
  category?: string
  cover?: string
  summary?: string
  isRecommended?: unknown
  isCommentable?: unknown
  password?: string
  id?: string
  updatedAt?: string
  body?: string
}): string {
  const lines = ['---', `title: ${yamlEscape(options.title)}`]
  if (options.status !== undefined) lines.push(`status: ${JSON.stringify(options.status)}`)
  if (options.tagsRaw) lines.push(options.tagsRaw)
  if (options.category !== undefined) lines.push(`category: ${yamlEscape(options.category)}`)
  if (options.cover !== undefined) lines.push(`cover: ${yamlEscape(options.cover)}`)
  if (options.summary !== undefined) lines.push(`summary: ${yamlEscape(options.summary)}`)
  if (options.isRecommended !== undefined) {
    lines.push(`isRecommended: ${JSON.stringify(options.isRecommended)}`)
  }
  if (options.isCommentable !== undefined) {
    lines.push(`isCommentable: ${JSON.stringify(options.isCommentable)}`)
  }
  if (options.password !== undefined) lines.push(`password: ${yamlEscape(options.password)}`)
  if (options.id) lines.push(`id: ${yamlEscape(options.id)}`)
  if (options.updatedAt) lines.push(`updatedAt: ${JSON.stringify(options.updatedAt)}`)
  lines.push('---', '', options.body ?? `# ${options.title.trim()}\n\nBody.\n`)
  return lines.join('\n')
}

describe('scenario matrix ≥1000', () => {
  let scenarioCount = 0

  const track = (name: string, fn: () => void | Promise<void>) => {
    scenarioCount += 1
    it(name, fn)
  }

  describe('frontmatter parse × serialize round-trips', () => {
    for (const title of TITLES) {
      for (const status of ['draft', 'publish'] as const) {
        for (const tagCase of TAG_INPUTS) {
          const label = `parse:${title.slice(0, 12)}/${status}/${tagCase.raw.slice(0, 20) || 'no-tags'}`
          track(label, () => {
            const raw = buildFrontmatterDoc({
              title,
              status,
              tagsRaw: tagCase.raw || undefined,
              category: 'architecture',
              body: `# ${title.trim()}\n\nHello.\n`,
            })
            const doc = parseLocalDocument(raw)
            assert.equal(doc.frontmatter.title, title.trim())
            assert.equal(doc.frontmatter.status, status)
            assert.deepEqual(doc.frontmatter.tags, tagCase.expected)
            const again = parseLocalDocument(serializeLocalDocument(doc))
            assert.equal(again.frontmatter.title, doc.frontmatter.title)
            assert.equal(again.frontmatter.status, doc.frontmatter.status)
          })
        }
      }
    }

    for (const category of CATEGORIES) {
      for (const cover of COVERS) {
        for (const summary of SUMMARIES) {
          track(
            `fields:${category || '∅'}/${cover.slice(0, 16) || '∅'}/${summary?.slice(0, 8) || '∅'}`,
            () => {
              const raw = buildFrontmatterDoc({
                title: 'Field Matrix',
                status: 'draft',
                category,
                cover,
                summary,
                password: 'secret',
                id: 'art-fields',
                updatedAt: '2026-01-01T00:00:00.000Z',
              })
              const doc = parseLocalDocument(raw)
              assert.equal(doc.frontmatter.category, category)
              assert.equal(doc.frontmatter.cover, cover)
              if (summary !== undefined) assert.equal(doc.frontmatter.summary, summary)
              assert.equal(doc.frontmatter.password, 'secret')
              assert.equal(doc.frontmatter.id, 'art-fields')
            }
          )
        }
      }
    }

    for (const status of STATUSES) {
      track(`asStatus:${String(status)}`, () => {
        const raw = buildFrontmatterDoc({ title: 'Status', status })
        const doc = parseLocalDocument(raw)
        assert.equal(doc.frontmatter.status, status === 'publish' ? 'publish' : 'draft')
      })
    }

    for (const flag of BOOLISH) {
      track(`recommended:${String(flag)}`, () => {
        const raw = buildFrontmatterDoc({ title: 'Rec', isRecommended: flag })
        const doc = parseLocalDocument(raw)
        assert.equal(doc.frontmatter.isRecommended, Boolean(flag))
      })
      track(`commentable:${String(flag)}`, () => {
        const raw = buildFrontmatterDoc({ title: 'Com', isCommentable: flag })
        const doc = parseLocalDocument(raw)
        if (flag === undefined) assert.equal(doc.frontmatter.isCommentable, true)
        else assert.equal(doc.frontmatter.isCommentable, Boolean(flag))
      })
    }

    for (const bad of ['', '   ', null, undefined]) {
      track(`reject-title:${String(bad)}`, () => {
        assert.throws(() => {
          parseLocalDocument(
            `---\ntitle: ${bad === undefined || bad === null ? '' : JSON.stringify(bad)}\n---\n\nhi\n`
          )
        }, /title/)
      })
    }
  })

  describe('slugifyTitle scenarios', () => {
    const extras = [
      '',
      '!!!',
      '---',
      'Hello___World',
      '  trim me  ',
      'ÄÖÜ',
      '日本語タイトル',
      'foo@bar',
      'a'.repeat(200),
      'one two three four five',
      'with\ttab',
      'with\nnewline',
      ...Array.from({ length: 80 }, (_, i) => `slug-case-${i}-Title Value`),
    ]
    for (const title of [...TITLES, ...extras]) {
      track(`slug:${title.slice(0, 24) || 'empty'}`, () => {
        const slug = slugifyTitle(title)
        assert.ok(slug.length > 0)
        assert.ok(slug.length <= 80)
        assert.ok(!slug.startsWith('-'))
        assert.ok(!slug.endsWith('-'))
        if (!title.trim().replace(/[^\p{L}\p{N}]+/gu, '')) {
          assert.equal(slug, 'untitled')
        }
      })
    }
  })

  describe('createNewArticleDocument scenarios', () => {
    for (const title of TITLES) {
      track(`new:${title.slice(0, 20)}`, () => {
        const doc = createNewArticleDocument({ title: title.trim() || 'Untitled' })
        assert.equal(doc.frontmatter.status, 'draft')
        assert.equal(doc.frontmatter.isCommentable, true)
        assert.match(doc.content, new RegExp(`^# ${title.trim() || 'Untitled'}`))
        assert.match(doc.raw, /title:/)
      })
    }
  })

  describe('markdown render + summary scenarios', () => {
    const bodies = [
      '# Only',
      '# A\n\n## B\n\n### C\n',
      '```js\nconst x = 1\n```\n',
      '```ts\ntype X = 1\n```\n',
      '```\nplain\n```\n',
      '```unknownlang\nfoo\n```\n',
      'paragraph only',
      '> quote\n\n- list\n- item\n',
      '![alt](img.png)\n\n[link](https://x.com)\n',
      '---\ntitle: X\n---\n\n# From fm\n',
      '`' + 'code`' + ' and **bold**',
      '# ' + 'Long '.repeat(30),
      Array.from({ length: 8 }, (_, i) => `${'#'.repeat((i % 3) + 1)} H${i}`).join('\n\n'),
    ]

    for (const body of bodies) {
      for (const title of TITLES) {
        track(`md:${title.slice(0, 10)}/${body.slice(0, 12).replace(/\n/g, ' ')}`, () => {
          const content = `${body}\n\n${title}\n`
          const { html, toc } = renderMarkdown(content)
          assert.ok(typeof html === 'string')
          assert.ok(html.length > 0)
          const parsed = JSON.parse(toc) as unknown[]
          assert.ok(Array.isArray(parsed))
          const summary = deriveSummary(content, 80)
          assert.ok(typeof summary === 'string')
          assert.ok(summary.length <= 81)
        })
      }
    }

    for (const max of [10, 20, 40, 80, 160, 320]) {
      track(`summary-max:${max}`, () => {
        const summary = deriveSummary('word '.repeat(200), max)
        assert.ok(summary.length <= max + 1)
        if (summary.length > max) assert.ok(summary.endsWith('…'))
      })
    }
  })

  describe('previewUrl scenarios', () => {
    const sites = [
      'http://localhost:3001',
      'http://localhost:3001/',
      'https://blog.example.com',
      'https://blog.example.com/',
      'https://blog.example.com/app',
      'https://blog.example.com/app/',
    ]
    const ids = [
      'abc',
      'a b',
      '你好',
      'id/with/slash',
      'id?x=1',
      encodeURIComponent('already'),
      '1',
      'art-' + 'z'.repeat(40),
    ]
    for (const site of sites) {
      for (const id of ids) {
        track(`preview:${site}:${id.slice(0, 12)}`, () => {
          const url = previewUrl(site, id)
          assert.ok(url.startsWith(site.replace(/\/+$/, '') + '/article/'))
          assert.ok(!url.includes('//article'))
        })
      }
    }
  })

  describe('remoteArticleToDocument scenarios', () => {
    const remotes: RemoteArticle[] = []
    for (const status of ['draft', 'publish', 'other'] as const) {
      for (const category of [
        null,
        'plain',
        { id: 'c1', label: 'L', value: 'v' },
        { id: 'c2', label: 'OnlyLabel', value: '' },
        { id: 'c3', label: '', value: '' },
      ] as const) {
        for (const tags of [
          null,
          'a, b',
          ['x', 'y'],
          [{ id: 't1', label: 'T', value: 'tv' }],
          [{ id: 't2', label: 'L2', value: '' }],
          [null as unknown as string],
        ] as const) {
          remotes.push({
            id: `r-${remotes.length}`,
            title: `Remote ${remotes.length}`,
            status,
            category: category as RemoteArticle['category'],
            tags: tags as RemoteArticle['tags'],
            content: `# Remote ${remotes.length}`,
            summary: remotes.length % 2 ? 'sum' : null,
            cover: remotes.length % 3 ? 'https://x/y.png' : null,
            isRecommended: remotes.length % 2 === 0,
            isCommentable: remotes.length % 3 !== 0,
            updateAt: remotes.length % 2 ? '2026-01-01T00:00:00.000Z' : null,
          })
        }
      }
    }

    for (const article of remotes) {
      track(`remote:${article.id}/${article.status}`, () => {
        const doc = remoteArticleToDocument(article)
        assert.equal(doc.frontmatter.id, article.id)
        assert.equal(doc.frontmatter.title, article.title)
        assert.equal(doc.frontmatter.status, article.status === 'publish' ? 'publish' : 'draft')
        assert.ok(doc.raw.includes(article.title))
      })
    }
  })

  describe('http envelope scenarios via fetchImpl', () => {
    const cases: Array<{
      name: string
      status: number
      body: string
      ok?: boolean
      expectError?: RegExp | string
      expectData?: unknown
    }> = []

    for (const path of ['/a', '/b', 'c', '/d/e']) {
      for (const payload of [
        { success: true, data: { n: 1 } },
        { success: true, data: { n: 2, nested: true } },
        { success: true, hello: 'bare' },
      ]) {
        cases.push({
          name: `ok:${path}:${JSON.stringify(payload).slice(0, 40)}`,
          status: 200,
          body: JSON.stringify(payload),
          expectData: 'data' in payload ? payload.data : payload,
        })
      }
    }

    for (const status of [400, 401, 403, 404, 500, 502]) {
      cases.push({
        name: `http-fail:${status}`,
        status,
        body: JSON.stringify({ success: false, msg: `err-${status}`, statusCode: status }),
        expectError: `err-${status}`,
      })
      cases.push({
        name: `http-fail-empty:${status}`,
        status,
        body: '',
        expectError: new RegExp(`Request failed:.*\\(${status}\\)`),
      })
      cases.push({
        name: `http-fail-silent:${status}`,
        status,
        body: JSON.stringify({ success: false }),
        expectError: new RegExp(`Request failed:.*\\(${status}\\)`),
      })
    }

    cases.push({
      name: 'null-data',
      status: 200,
      body: JSON.stringify({ success: true, data: null }),
      expectError: /Empty API data/,
    })
    cases.push({
      name: 'invalid-json',
      status: 200,
      body: 'not-json{',
      expectError: /Invalid JSON/,
    })
    cases.push({
      name: 'logical-fail-200',
      status: 200,
      body: JSON.stringify({ success: false, msg: 'nope', statusCode: 422 }),
      expectError: 'nope',
    })

    for (const c of cases) {
      track(`http:${c.name}`, async () => {
        const http = new ReactPressHttp({
          apiUrl: 'http://example.invalid/api',
          fetchImpl: (async () =>
            ({
              ok: c.status >= 200 && c.status < 300,
              status: c.status,
              async text() {
                return c.body
              },
            }) as Response) as typeof fetch,
        })
        if (c.expectError) {
          await assert.rejects(
            () => http.get('/x'),
            (err: unknown) => {
              assert.ok(err instanceof ReactPressApiError)
              if (typeof c.expectError === 'string') assert.equal(err.message, c.expectError)
              else assert.match(err.message, c.expectError as RegExp)
              return true
            }
          )
        } else {
          const data = await http.get('/x')
          assert.deepEqual(data, c.expectData)
        }
      })
    }
  })

  describe('sync conflict time matrix', () => {
    const times = [
      '2025-01-01T00:00:00.000Z',
      '2026-01-01T00:00:00.000Z',
      '2026-06-01T12:00:00.000Z',
      '2027-01-01T00:00:00.000Z',
      'not-a-date',
      '',
    ]

    for (const remote of times) {
      for (const local of [...times, undefined]) {
        track(`conflict:${remote || '∅'}:${local ?? 'missing'}`, async () => {
          const article: RemoteArticle = {
            id: 'art-1',
            title: 'T',
            status: 'draft',
            content: '# T',
            updateAt: remote || null,
          }
          const client = new ReactPressClient({
            apiUrl: 'http://example.invalid/api',
            token: 't',
            fetchImpl: (async (input: RequestInfo | URL, init?: RequestInit) => {
              const url = String(input)
              const method = init?.method || 'GET'
              if (url.includes('/category') || url.includes('/tag')) {
                return new Response(JSON.stringify({ success: true, data: [] }), { status: 200 })
              }
              if (method === 'GET' && url.includes('/article/')) {
                return new Response(JSON.stringify({ success: true, data: article }), {
                  status: 200,
                })
              }
              if (method === 'PATCH') {
                return new Response(
                  JSON.stringify({
                    success: true,
                    data: { ...article, updateAt: '2026-12-01T00:00:00.000Z', title: 'T' },
                  }),
                  { status: 200 }
                )
              }
              return new Response(JSON.stringify({ success: false, msg: 'unexpected' }), {
                status: 500,
              })
            }) as typeof fetch,
          })

          const doc = parseLocalDocument(`---
title: T
status: draft
id: art-1
${local !== undefined && local !== '' ? `updatedAt: ${JSON.stringify(local)}` : ''}
---

# T
`)
          // Ensure id is set even if yaml omitted empty updatedAt.
          doc.frontmatter.id = 'art-1'
          if (local === undefined) delete doc.frontmatter.updatedAt
          else if (local === '') doc.frontmatter.updatedAt = ''

          const remoteTime = remote ? Date.parse(remote) : Number.NaN
          const localTime = local ? Date.parse(local) : Number.NaN
          // Missing or unreadable timestamps fail closed. Empty strings are missing.
          const expectConflict =
            !remote ||
            !local ||
            Number.isNaN(remoteTime) ||
            Number.isNaN(localTime) ||
            remoteTime > localTime

          if (expectConflict) {
            await assert.rejects(
              () => pushDocument(client, doc),
              (err: unknown) => err instanceof SyncConflictError
            )
            const forced = await pushDocument(client, doc, { force: true })
            assert.equal(forced.created, false)
          } else {
            const result = await pushDocument(client, doc)
            assert.equal(result.created, false)
          }
        })
      }
    }
  })

  describe('buildArticlePayload cover matrix', () => {
    const client = new ReactPressClient({
      apiUrl: 'http://example.invalid/api',
      token: 't',
      fetchImpl: (async (input: RequestInfo | URL) => {
        const url = String(input)
        if (url.includes('/category')) {
          return new Response(
            JSON.stringify({
              success: true,
              data: [{ id: 'cat-1', label: 'Architecture', value: 'architecture' }],
            }),
            { status: 200 }
          )
        }
        if (url.includes('/tag')) {
          return new Response(
            JSON.stringify({
              success: true,
              data: [{ id: 'tag-1', label: 'ReactPress', value: 'reactpress' }],
            }),
            { status: 200 }
          )
        }
        return new Response(JSON.stringify({ success: false, msg: 'nope' }), { status: 404 })
      }) as typeof fetch,
    })

    for (const cover of COVERS) {
      for (const status of ['draft', 'publish'] as const) {
        for (const withUploader of [true, false]) {
          track(`payload:${cover.slice(0, 18) || '∅'}/${status}/up=${withUploader}`, async () => {
            const doc = parseLocalDocument(
              buildFrontmatterDoc({
                title: 'Payload',
                status,
                cover,
                category: 'architecture',
                tagsRaw: 'tags: [reactpress]',
                body: '# Payload\n\nHello summary.\n',
              })
            )
            const payload = await buildArticlePayload(doc, client, {
              baseDir: '/tmp',
              uploadLocalFile: withUploader
                ? async () => 'https://cdn.example.com/uploaded.png'
                : undefined,
            })
            assert.equal(payload.status, status)
            assert.equal(payload.category, 'cat-1')
            assert.equal(payload.tags, 'tag-1')
            if (!cover) assert.equal(payload.cover, '')
            else if (/^https?:\/\//i.test(cover) || cover.startsWith('/')) {
              assert.equal(payload.cover, cover)
            } else if (withUploader) {
              assert.equal(payload.cover, 'https://cdn.example.com/uploaded.png')
            } else {
              assert.equal(payload.cover, cover)
            }
          })
        }
      }
    }
  })

  describe('client taxonomy resolution scenarios', () => {
    const categories = [
      { id: 'c1', label: 'Architecture', value: 'architecture' },
      { id: 'c2', label: 'News', value: 'news' },
      { id: 'c3', label: 'Tech', value: 'tech' },
    ]
    const tags = [
      { id: 't1', label: 'ReactPress', value: 'reactpress' },
      { id: 't2', label: 'Next', value: 'next' },
      { id: 't3', label: 'Node', value: 'node' },
    ]
    const refs = [
      'architecture',
      'News',
      'c1',
      'missing',
      'tech',
      'Tech',
      undefined,
      ...categories.map((c) => c.value),
      ...categories.map((c) => c.label),
      ...categories.map((c) => c.id),
    ]
    const tagRefSets = [
      [],
      ['reactpress'],
      ['Next', 'node'],
      ['reactpress', 'custom', ''],
      ['t1', 't2', 't3'],
      ['missing-a', 'missing-b'],
      ...tags.map((t) => [t.value]),
      ...tags.map((t) => [t.label]),
      ...tags.map((t) => [t.id]),
      ['reactpress', 'Next', 'node', 'extra'],
    ]

    for (const ref of refs) {
      track(`resolve-cat:${String(ref)}`, async () => {
        const client = new ReactPressClient({
          apiUrl: 'http://example.invalid/api',
          fetchImpl: (async () =>
            new Response(JSON.stringify({ success: true, data: categories }), {
              status: 200,
            })) as typeof fetch,
        })
        const id = await client.resolveCategoryId(ref)
        if (!ref) assert.equal(id, 'c1')
        else if (ref === 'missing') assert.equal(id, 'missing')
        else assert.ok(id)
      })
    }

    for (const set of tagRefSets) {
      track(`resolve-tags:${set.join(',') || 'empty'}`, async () => {
        const client = new ReactPressClient({
          apiUrl: 'http://example.invalid/api',
          fetchImpl: (async () =>
            new Response(JSON.stringify({ success: true, data: tags }), {
              status: 200,
            })) as typeof fetch,
        })
        const joined = await client.resolveTagIds(set)
        if (!set.filter(Boolean).length) assert.equal(joined, undefined)
        else assert.ok(joined && joined.length > 0)
      })
    }
  })

  describe('login token shape scenarios', () => {
    for (const [name, payload, expectToken, expectError] of [
      ['token', { token: 'tok-a' }, 'tok-a', null],
      ['accessToken', { accessToken: 'tok-b' }, 'tok-b', null],
      ['prefer-token', { token: 'tok-c', accessToken: 'tok-d' }, 'tok-c', null],
      ['empty-token', { token: '' }, null, /no token/],
      ['missing', { name: 'admin' }, null, /no token/],
      ['nullish', {}, null, /no token/],
    ] as const) {
      track(`login:${name}`, async () => {
        const client = new ReactPressClient({
          apiUrl: 'http://example.invalid/api',
          fetchImpl: (async () =>
            new Response(JSON.stringify({ success: true, data: payload }), {
              status: 200,
            })) as typeof fetch,
        })
        if (expectError) {
          await assert.rejects(() => client.login({ name: 'a', password: 'b' }), expectError)
        } else {
          const result = await client.login({ name: 'a', password: 'b' })
          assert.equal(result.token, expectToken)
          assert.equal(client.http.token, expectToken)
        }
      })
    }
  })

  describe('list unwrap shape scenarios', () => {
    const shapes: unknown[] = [
      [{ id: '1', title: 'A', status: 'draft' }],
      [[{ id: '2', title: 'B', status: 'draft' }], 1],
      { data: [{ id: '3', title: 'C', status: 'draft' }] },
      { weird: true },
      42,
      'x',
      [],
      [[], 0],
      { data: [] },
      ...Array.from({ length: 40 }, (_, i) => [
        { id: `gen-${i}`, title: `T${i}`, status: 'draft' },
      ]),
    ]
    for (const [i, shape] of shapes.entries()) {
      track(`unwrap:${i}`, async () => {
        const client = new ReactPressClient({
          apiUrl: 'http://example.invalid/api',
          fetchImpl: (async () =>
            new Response(JSON.stringify({ success: true, data: shape }), {
              status: 200,
            })) as typeof fetch,
        })
        const list = await client.listArticles()
        assert.ok(Array.isArray(list))
      })
    }
  })

  // Harden frontmatter against YAML null → String("null") footguns.
  describe('nullish optional field normalization', () => {
    for (const field of ['cover', 'summary', 'password', 'category'] as const) {
      for (const value of [null, '', 'ok']) {
        track(`nullish-field:${field}:${String(value)}`, () => {
          const raw = `---\ntitle: N\n${field}: ${value === '' ? '""' : value === null ? 'null' : value}\n---\n\n# N\n`
          const doc = parseLocalDocument(raw)
          const actual = (doc.frontmatter as unknown as Record<string, unknown>)[field]
          if (value === null) {
            // YAML null should not become the literal string "null".
            assert.equal(actual, undefined)
          } else {
            assert.equal(actual, value)
          }
        })
      }
    }
  })

  it('reports at least 1000 registered scenarios', () => {
    // scenarioCount is incremented when each track() registers an it().
    // Subtract this meta assertion itself (not tracked).
    assert.ok(scenarioCount >= 1000, `expected ≥1000 scenarios, got ${scenarioCount}`)
  })
})
