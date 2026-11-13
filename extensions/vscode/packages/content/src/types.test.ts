import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import * as api from './index';
import { ReactPressApiError, SyncConflictError } from './types';

describe('error types + public exports', () => {
  it('constructs ReactPressApiError with status and body', () => {
    const err = new ReactPressApiError('boom', 418, { a: 1 });
    assert.equal(err.name, 'ReactPressApiError');
    assert.equal(err.message, 'boom');
    assert.equal(err.statusCode, 418);
    assert.deepEqual(err.body, { a: 1 });
    assert.ok(err instanceof Error);
  });

  it('constructs SyncConflictError with timestamps', () => {
    const err = new SyncConflictError('conflict', 'local', 'remote');
    assert.equal(err.name, 'SyncConflictError');
    assert.equal(err.localUpdatedAt, 'local');
    assert.equal(err.remoteUpdatedAt, 'remote');
  });

  it('re-exports the public kit surface', () => {
    assert.equal(typeof api.ReactPressClient, 'function');
    assert.equal(typeof api.ReactPressHttp, 'function');
    assert.equal(typeof api.parseLocalDocument, 'function');
    assert.equal(typeof api.serializeLocalDocument, 'function');
    assert.equal(typeof api.remoteArticleToDocument, 'function');
    assert.equal(typeof api.createNewArticleDocument, 'function');
    assert.equal(typeof api.renderMarkdown, 'function');
    assert.equal(typeof api.pushDocument, 'function');
    assert.equal(typeof api.pushFile, 'function');
    assert.equal(typeof api.publishFile, 'function');
    assert.equal(typeof api.pullArticleToFile, 'function');
    assert.equal(typeof api.createLocalArticleFile, 'function');
    assert.equal(typeof api.previewUrl, 'function');
    assert.equal(typeof api.slugifyTitle, 'function');
    assert.equal(typeof api.deriveSummary, 'function');
    assert.equal(typeof api.buildArticlePayload, 'function');
    assert.equal(api.ReactPressApiError, ReactPressApiError);
    assert.equal(api.SyncConflictError, SyncConflictError);
  });
});
