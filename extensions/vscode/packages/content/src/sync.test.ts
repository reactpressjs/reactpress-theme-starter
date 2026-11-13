import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { after, before, describe, it } from 'node:test';

import { ReactPressClient } from './client';
import {
  createNewArticleDocument,
  parseLocalDocument,
  serializeLocalDocument,
} from './frontmatter';
import {
  buildArticlePayload,
  createLocalArticleFile,
  previewUrl,
  publishFile,
  pullArticleToFile,
  pushDocument,
  pushFile,
} from './sync';
import { send, startMockServer } from './test-helpers';
import { SyncConflictError } from './types';

describe('sync core flows', () => {
  let baseUrl = '';
  let close: () => Promise<void>;
  const articles = new Map<string, Record<string, unknown>>();
  let tmpDir = '';

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'rp-content-'));
    const mock = await startMockServer(async (req, res, url, body) => {
      const auth = String(req.headers.authorization || '');

      if (req.method === 'GET' && url.pathname === '/api/category') {
        send(res, 200, {
          success: true,
          data: [{ id: 'cat-1', label: 'Architecture', value: 'architecture' }],
        });
        return true;
      }
      if (req.method === 'GET' && url.pathname === '/api/tag') {
        send(res, 200, {
          success: true,
          data: [{ id: 'tag-1', label: 'ReactPress', value: 'reactpress' }],
        });
        return true;
      }
      if (req.method === 'POST' && url.pathname === '/api/article') {
        if (!auth.includes('tok')) {
          send(res, 401, { success: false, msg: 'unauthorized', statusCode: 401 });
          return true;
        }
        const parsed = JSON.parse(body) as Record<string, unknown>;
        const id = `art-${articles.size + 1}`;
        const article = {
          ...parsed,
          id,
          updateAt: '2026-01-01T00:00:00.000Z',
          category: { id: 'cat-1', label: 'Architecture', value: 'architecture' },
          tags: [{ id: 'tag-1', label: 'ReactPress', value: 'reactpress' }],
        };
        articles.set(id, article);
        send(res, 200, { success: true, data: article });
        return true;
      }
      if (req.method === 'GET' && url.pathname.startsWith('/api/article/')) {
        const id = url.pathname.split('/').pop()!;
        const article = articles.get(id);
        if (!article) {
          send(res, 404, { success: false, msg: 'not found', statusCode: 404 });
          return true;
        }
        send(res, 200, { success: true, data: article });
        return true;
      }
      if (req.method === 'PATCH' && url.pathname.startsWith('/api/article/')) {
        const id = url.pathname.split('/').pop()!;
        const existing = articles.get(id);
        if (!existing) {
          send(res, 404, { success: false, msg: 'not found', statusCode: 404 });
          return true;
        }
        const parsed = JSON.parse(body) as Record<string, unknown>;
        const article = {
          ...existing,
          ...parsed,
          id,
          updateAt: '2026-01-02T00:00:00.000Z',
        };
        articles.set(id, article);
        send(res, 200, { success: true, data: article });
        return true;
      }
      if (req.method === 'POST' && url.pathname === '/api/file/upload') {
        send(res, 200, {
          success: true,
          data: { url: 'https://cdn.example.com/cover.png', id: 'file-cover' },
        });
        return true;
      }
      return false;
    });
    baseUrl = mock.baseUrl;
    close = mock.close;
  });

  after(async () => {
    await close();
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('builds payloads with derived summary and taxonomy resolution', async () => {
    const client = new ReactPressClient({ apiUrl: baseUrl, token: 'tok' });
    const doc = parseLocalDocument(`---
title: Payload
status: draft
category: architecture
tags: [reactpress]
---

# Payload

Hello summary source.
`);
    const payload = await buildArticlePayload(doc, client);
    assert.equal(payload.title, 'Payload');
    assert.equal(payload.category, 'cat-1');
    assert.equal(payload.tags, 'tag-1');
    assert.match(payload.html, /heading-0/);
    assert.ok(payload.summary.includes('Hello summary'));
    assert.equal(payload.cover, '');
    assert.equal(payload.isCommentable, true);
  });

  it('prefers explicit summary and password / recommended flags', async () => {
    const client = new ReactPressClient({ apiUrl: baseUrl, token: 'tok' });
    const doc = parseLocalDocument(`---
title: Flags
status: draft
summary: "Explicit"
isRecommended: true
isCommentable: false
password: secret
---

# Flags
`);
    const payload = await buildArticlePayload(doc, client, { status: 'publish' });
    assert.equal(payload.summary, 'Explicit');
    assert.equal(payload.status, 'publish');
    assert.equal(payload.isRecommended, true);
    assert.equal(payload.isCommentable, false);
    assert.equal(payload.password, 'secret');
    assert.equal(payload.tags, undefined);
  });

  it('uploads relative covers when uploader is provided', async () => {
    const client = new ReactPressClient({ apiUrl: baseUrl, token: 'tok' });
    const coverPath = path.join(tmpDir, 'local-cover.png');
    await fs.writeFile(coverPath, 'png');
    const doc = parseLocalDocument(`---
title: Cover
status: draft
cover: local-cover.png
---

# Cover
`);
    const payload = await buildArticlePayload(doc, client, {
      baseDir: tmpDir,
      uploadLocalFile: async (absolute) => {
        assert.equal(absolute, coverPath);
        return 'https://cdn.example.com/uploaded-cover.png';
      },
    });
    assert.equal(payload.cover, 'https://cdn.example.com/uploaded-cover.png');

    const remoteCover = await buildArticlePayload(
      parseLocalDocument('---\ntitle: R\ncover: https://x.com/a.png\n---\n\n'),
      client,
      { baseDir: tmpDir, uploadLocalFile: async () => 'nope' }
    );
    assert.equal(remoteCover.cover, 'https://x.com/a.png');

    const absCover = await buildArticlePayload(
      parseLocalDocument('---\ntitle: R\ncover: /abs.png\n---\n\n'),
      client,
      { baseDir: tmpDir, uploadLocalFile: async () => 'nope' }
    );
    assert.equal(absCover.cover, '/abs.png');

    const keptRelative = await buildArticlePayload(
      parseLocalDocument('---\ntitle: R\ncover: keep-me.png\n---\n\n'),
      client
    );
    assert.equal(keptRelative.cover, 'keep-me.png');
  });

  it('creates, conflicts, force-updates, and publishes via pushDocument', async () => {
    articles.clear();
    const client = new ReactPressClient({ apiUrl: baseUrl, token: 'tok' });
    const doc = createNewArticleDocument({ title: `Sync ${Date.now()}` });
    doc.content = '# Sync\n\nBody\n';
    doc.frontmatter.category = 'architecture';
    doc.frontmatter.tags = ['reactpress'];
    doc.raw = serializeLocalDocument(doc);

    const created = await pushDocument(client, doc);
    assert.equal(created.created, true);
    assert.ok(created.article.id);
    assert.equal(created.document.frontmatter.id, created.article.id);

    const stale = parseLocalDocument(created.document.raw);
    stale.frontmatter.updatedAt = '2025-01-01T00:00:00.000Z';
    stale.content = '# Changed\n';
    await assert.rejects(
      () => pushDocument(client, stale),
      (err: unknown) => err instanceof SyncConflictError
    );

    const forced = await pushDocument(client, stale, { force: true, status: 'publish' });
    assert.equal(forced.created, false);
    assert.equal(forced.document.frontmatter.status, 'publish');

    // local newer or equal should not conflict
    const fresh = parseLocalDocument(forced.document.raw);
    fresh.content = '# Fresh\n';
    fresh.frontmatter.updatedAt = '2026-01-03T00:00:00.000Z';
    const updated = await pushDocument(client, fresh);
    assert.equal(updated.created, false);
  });

  it('pushFile / publishFile write frontmatter back to disk', async () => {
    articles.clear();
    const client = new ReactPressClient({ apiUrl: baseUrl, token: 'tok' });
    const filePath = path.join(tmpDir, 'post.md');
    await fs.writeFile(
      filePath,
      `---
title: File Post
status: draft
category: architecture
tags: [reactpress]
---

# File Post

Hello
`
    );

    const pushed = await pushFile(client, filePath);
    assert.equal(pushed.created, true);
    const afterPush = await fs.readFile(filePath, 'utf8');
    assert.match(afterPush, /id:/);
    assert.match(afterPush, /updatedAt:/);

    const published = await publishFile(client, filePath, { force: true });
    assert.equal(published.document.frontmatter.status, 'publish');
    const afterPublish = await fs.readFile(filePath, 'utf8');
    assert.match(afterPublish, /status: publish/);
  });

  it('pullArticleToFile writes remote markdown', async () => {
    articles.clear();
    const client = new ReactPressClient({ apiUrl: baseUrl, token: 'tok' });
    const created = await pushDocument(
      client,
      parseLocalDocument(`---
title: Pull Me
status: draft
---

# Pull Me
`)
    );
    const out = path.join(tmpDir, 'pulled', 'article.md');
    const pulled = await pullArticleToFile(client, String(created.article.id), out);
    assert.equal(pulled.filePath, out);
    const raw = await fs.readFile(out, 'utf8');
    assert.match(raw, /title: Pull Me/);
    assert.match(raw, /id:/);
  });

  it('createLocalArticleFile avoids slug collisions', async () => {
    const dir = path.join(tmpDir, 'posts');
    const first = await createLocalArticleFile(dir, 'Hello World');
    assert.equal(path.basename(first.filePath), 'hello-world.md');
    const second = await createLocalArticleFile(dir, 'Hello World');
    assert.equal(path.basename(second.filePath), 'hello-world-1.md');
    const third = await createLocalArticleFile(dir, 'Hello World');
    assert.equal(path.basename(third.filePath), 'hello-world-2.md');
  });

  it('previewUrl strips trailing slashes and encodes ids', () => {
    assert.equal(previewUrl('http://x.com/', 'a b'), 'http://x.com/article/a%20b');
    assert.equal(previewUrl('http://x.com', 'abc'), 'http://x.com/article/abc');
  });

  it('skips conflict when remote timestamp is missing or dates are invalid', async () => {
    articles.clear();
    const client = new ReactPressClient({ apiUrl: baseUrl, token: 'tok' });
    const created = await pushDocument(
      client,
      parseLocalDocument('---\ntitle: NoTs\nstatus: draft\n---\n\n# NoTs\n')
    );

    // remove updateAt from remote to skip comparison
    const id = String(created.article.id);
    const remote = articles.get(id)!;
    delete remote.updateAt;
    articles.set(id, remote);

    const local = parseLocalDocument(created.document.raw);
    local.frontmatter.updatedAt = '2025-01-01T00:00:00.000Z';
    local.content = '# edited\n';
    const result = await pushDocument(client, local);
    assert.equal(result.created, false);

    // invalid dates also skip conflict
    articles.set(id, { ...articles.get(id)!, updateAt: 'not-a-date' });
    local.frontmatter.updatedAt = 'also-bad';
    const again = await pushDocument(client, local, { force: false });
    assert.equal(again.created, false);
  });

  it('conflicts when remote has updateAt but local frontmatter lacks updatedAt', async () => {
    articles.clear();
    const client = new ReactPressClient({ apiUrl: baseUrl, token: 'tok' });
    const created = await pushDocument(
      client,
      parseLocalDocument('---\ntitle: Legacy\nstatus: draft\n---\n\n# Legacy\n')
    );
    const local = parseLocalDocument(created.document.raw);
    delete local.frontmatter.updatedAt;
    local.content = '# legacy edit\n';
    await assert.rejects(
      () => pushDocument(client, local),
      (err: unknown) => err instanceof SyncConflictError && /no updatedAt/.test(err.message)
    );
    const forced = await pushDocument(client, local, { force: true });
    assert.equal(forced.created, false);
  });
});
