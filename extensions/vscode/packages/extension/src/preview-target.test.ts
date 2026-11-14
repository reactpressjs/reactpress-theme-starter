import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { themePreviewUrl } from './preview-target'

describe('themePreviewUrl', () => {
  it('opens published articles on the public path', () => {
    assert.equal(themePreviewUrl('http://x.com/', 'abc', 'publish'), 'http://x.com/article/abc')
  })

  it('adds preview=1 for drafts and unknown status', () => {
    assert.equal(
      themePreviewUrl('http://x.com', 'a b', 'draft'),
      'http://x.com/article/a%20b?preview=1'
    )
    assert.equal(themePreviewUrl('http://x.com', 'abc'), 'http://x.com/article/abc?preview=1')
  })
})
