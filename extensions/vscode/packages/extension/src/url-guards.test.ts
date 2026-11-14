import assert from 'node:assert/strict'
import * as path from 'node:path'
import { describe, it } from 'node:test'

import { assertHttpOrHttpsUrl, isLocalHostname, resolveContentDir } from './url-guards'

describe('url-guards', () => {
  it('detects local hostnames', () => {
    assert.equal(isLocalHostname('localhost'), true)
    assert.equal(isLocalHostname('127.0.0.1'), true)
    assert.equal(isLocalHostname('::1'), true)
    assert.equal(isLocalHostname('blog.local'), true)
    assert.equal(isLocalHostname('example.com'), false)
  })

  it('requires http(s) URLs', () => {
    assert.equal(assertHttpOrHttpsUrl('https://a.com', 'Site').protocol, 'https:')
    assert.equal(assertHttpOrHttpsUrl('http://localhost:3001', 'Site').hostname, 'localhost')
    assert.throws(() => assertHttpOrHttpsUrl('file:///etc/passwd', 'Site'), /http:\/\/ or https:\/\//)
    assert.throws(() => assertHttpOrHttpsUrl('not a url', 'API'), /not a valid URL/)
  })

  it('keeps contentPath inside the workspace', () => {
    const root = path.join(path.sep, 'workspace')
    assert.equal(
      resolveContentDir(root, 'content/posts'),
      path.join(root, 'content', 'posts')
    )
    assert.throws(() => resolveContentDir(root, '../outside'), /inside the workspace/)
    assert.throws(() => resolveContentDir(root, path.join('..', 'secret')), /inside the workspace/)
  })
})
