import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import { ReactPressHttp } from './http';
import { send, sendRaw, startMockServer } from './test-helpers';
import { ReactPressApiError } from './types';

describe('ReactPressHttp', () => {
  let baseUrl = '';
  let close: () => Promise<void>;
  let lastAuth = '';
  let lastQuery = '';
  let lastMethod = '';
  let lastPath = '';
  let lastContentType = '';

  before(async () => {
    const mock = await startMockServer(async (req, res, url, body) => {
      lastAuth = String(req.headers.authorization || '');
      lastQuery = url.search;
      lastMethod = req.method || '';
      lastPath = url.pathname;
      lastContentType = String(req.headers['content-type'] || '');

      if (url.pathname === '/api/ok') {
        send(res, 200, { success: true, data: { hello: 'world' } });
        return true;
      }
      if (url.pathname === '/api/no-slash-ok') {
        send(res, 200, { success: true, data: { ok: true } });
        return true;
      }
      if (url.pathname === '/api/bare') {
        send(res, 200, { success: true, hello: 'bare' });
        return true;
      }
      if (url.pathname === '/api/empty-body') {
        res.statusCode = 204;
        res.end();
        return true;
      }
      if (url.pathname === '/api/null-data') {
        send(res, 200, { success: true, data: null });
        return true;
      }
      if (url.pathname === '/api/fail-msg') {
        send(res, 400, { success: false, msg: 'bad request', statusCode: 400 });
        return true;
      }
      if (url.pathname === '/api/fail-silent') {
        send(res, 500, { success: false });
        return true;
      }
      if (url.pathname === '/api/fail-empty') {
        res.statusCode = 502;
        res.end();
        return true;
      }
      if (url.pathname === '/api/fail-ok-false') {
        send(res, 200, { success: false, msg: 'logical failure', statusCode: 422 });
        return true;
      }
      if (url.pathname === '/api/invalid-json') {
        sendRaw(res, 200, 'not-json');
        return true;
      }
      if (url.pathname === '/api/echo') {
        send(res, 200, { success: true, data: { body: body ? JSON.parse(body) : null, query: Object.fromEntries(url.searchParams) } });
        return true;
      }
      if (url.pathname === '/api/form') {
        send(res, 200, { success: true, data: { form: true, unique: url.searchParams.get('unique') } });
        return true;
      }
      return false;
    });
    baseUrl = mock.baseUrl;
    close = mock.close;
  });

  after(async () => {
    await close();
  });

  it('normalizes trailing slashes on apiUrl', () => {
    const http = new ReactPressHttp({ apiUrl: `${baseUrl}///` });
    assert.equal(http.apiUrl, baseUrl.replace(/\/+$/, '') || baseUrl);
    assert.ok(!http.apiUrl.endsWith('/'));
  });

  it('get/post/patch with auth header and query filtering', async () => {
    const http = new ReactPressHttp({ apiUrl: baseUrl, token: 'tok' });
    const data = await http.get<{ hello: string }>('/ok', { a: 1, b: '', c: undefined, d: 'x' });
    assert.equal(data.hello, 'world');
    assert.equal(lastAuth, 'Bearer tok');
    assert.equal(lastMethod, 'GET');
    assert.match(lastQuery, /a=1/);
    assert.match(lastQuery, /d=x/);
    assert.ok(!lastQuery.includes('b='));
    assert.ok(!lastQuery.includes('c='));

    http.setToken('tok2');
    await http.post('/echo', { n: 1 });
    assert.equal(lastAuth, 'Bearer tok2');
    assert.equal(lastMethod, 'POST');
    assert.match(lastContentType, /application\/json/);

    await http.patch('/echo', { n: 2 });
    assert.equal(lastMethod, 'PATCH');
  });

  it('accepts paths without leading slash', async () => {
    const http = new ReactPressHttp({ apiUrl: baseUrl });
    const data = await http.get<{ ok: boolean }>('no-slash-ok');
    assert.equal(data.ok, true);
    assert.equal(lastPath, '/api/no-slash-ok');
  });

  it('returns envelope when data key is absent', async () => {
    const http = new ReactPressHttp({ apiUrl: baseUrl });
    const data = await http.get<{ success: boolean; hello: string }>('/bare');
    assert.equal(data.hello, 'bare');
  });

  it('handles empty response body', async () => {
    const http = new ReactPressHttp({ apiUrl: baseUrl });
    const data = await http.get<unknown>('/empty-body');
    assert.equal(data, null);
  });

  it('rejects null data envelopes', async () => {
    const http = new ReactPressHttp({ apiUrl: baseUrl });
    await assert.rejects(
      () => http.post('/null-data', {}),
      (err: unknown) => err instanceof ReactPressApiError && /Empty API data/.test(err.message)
    );
  });

  it('maps API failures with and without msg', async () => {
    const http = new ReactPressHttp({ apiUrl: baseUrl });
    await assert.rejects(
      () => http.get('/fail-msg'),
      (err: unknown) =>
        err instanceof ReactPressApiError && err.message === 'bad request' && err.statusCode === 400
    );
    await assert.rejects(
      () => http.get('/fail-silent'),
      (err: unknown) =>
        err instanceof ReactPressApiError &&
        /Request failed: GET \/fail-silent \(500\)/.test(err.message) &&
        err.statusCode === 500
    );
    await assert.rejects(
      () => http.get('/fail-empty'),
      (err: unknown) =>
        err instanceof ReactPressApiError &&
        err.statusCode === 502 &&
        /Request failed: GET \/fail-empty \(502\)/.test(err.message)
    );
    await assert.rejects(
      () => http.get('/fail-ok-false'),
      (err: unknown) =>
        err instanceof ReactPressApiError && err.statusCode === 422 && err.message === 'logical failure'
    );
  });

  it('rejects invalid JSON bodies', async () => {
    const http = new ReactPressHttp({ apiUrl: baseUrl });
    await assert.rejects(
      () => http.get('/invalid-json'),
      (err: unknown) => err instanceof ReactPressApiError && /Invalid JSON/.test(err.message)
    );
  });

  it('posts multipart form data without forcing json content-type', async () => {
    const http = new ReactPressHttp({ apiUrl: baseUrl, token: 'tok' });
    const form = new FormData();
    form.append('file', new Blob(['x']), 'x.txt');
    const data = await http.postForm<{ form: boolean; unique: string }>('/form', form, { unique: 1 });
    assert.equal(data.form, true);
    assert.equal(data.unique, '1');
    assert.equal(lastAuth, 'Bearer tok');
    assert.ok(!lastContentType.includes('application/json'));
  });

  it('uses custom fetchImpl when provided', async () => {
    let called = false;
    const http = new ReactPressHttp({
      apiUrl: 'http://example.invalid/api',
      fetchImpl: (async () => {
        called = true;
        return new Response(JSON.stringify({ success: true, data: { via: 'custom' } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }) as typeof fetch,
    });
    const data = await http.get<{ via: string }>('/any');
    assert.equal(called, true);
    assert.equal(data.via, 'custom');
  });
});
