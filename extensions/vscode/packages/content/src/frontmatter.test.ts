import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  createNewArticleDocument,
  parseLocalDocument,
  remoteArticleToDocument,
  serializeLocalDocument,
  slugifyTitle,
} from './frontmatter';

describe('frontmatter.parseLocalDocument', () => {
  it('parses full frontmatter including optional fields', () => {
    const doc = parseLocalDocument(`---
title: Full
status: publish
summary: "A summary"
cover: /img.png
category: architecture
tags:
  - a
  - b
isRecommended: true
isCommentable: false
password: secret
id: art-1
updatedAt: "2026-01-01T00:00:00.000Z"
---

Body
`);
    assert.equal(doc.frontmatter.title, 'Full');
    assert.equal(doc.frontmatter.status, 'publish');
    assert.equal(doc.frontmatter.summary, 'A summary');
    assert.equal(doc.frontmatter.cover, '/img.png');
    assert.equal(doc.frontmatter.category, 'architecture');
    assert.deepEqual(doc.frontmatter.tags, ['a', 'b']);
    assert.equal(doc.frontmatter.isRecommended, true);
    assert.equal(doc.frontmatter.isCommentable, false);
    assert.equal(doc.frontmatter.password, 'secret');
    assert.equal(doc.frontmatter.id, 'art-1');
    assert.equal(doc.frontmatter.updatedAt, '2026-01-01T00:00:00.000Z');
    assert.match(doc.content, /^Body/);
  });

  it('defaults draft status and commentable true', () => {
    const doc = parseLocalDocument('---\ntitle: X\n---\n\nhi\n');
    assert.equal(doc.frontmatter.status, 'draft');
    assert.equal(doc.frontmatter.isCommentable, true);
    assert.equal(doc.frontmatter.isRecommended, false);
  });

  it('parses comma-separated tags string', () => {
    const doc = parseLocalDocument('---\ntitle: X\ntags: a, b , c\n---\n\n');
    assert.deepEqual(doc.frontmatter.tags, ['a', 'b', 'c']);
  });

  it('parses scalar tag as single-item array', () => {
    const doc = parseLocalDocument('---\ntitle: X\ntags: 42\n---\n\n');
    assert.deepEqual(doc.frontmatter.tags, ['42']);
  });

  it('treats empty tags as undefined', () => {
    const doc = parseLocalDocument('---\ntitle: X\ntags: ""\n---\n\n');
    assert.equal(doc.frontmatter.tags, undefined);
  });

  it('rejects missing or blank title', () => {
    assert.throws(() => parseLocalDocument('---\nstatus: draft\n---\n\nhi\n'), /title/);
    assert.throws(() => parseLocalDocument('---\ntitle: "  "\n---\n\nhi\n'), /title/);
  });
});

describe('frontmatter.serializeLocalDocument', () => {
  it('round-trips and omits empty optional fields', () => {
    const raw = serializeLocalDocument({
      frontmatter: {
        title: 'Hello',
        status: 'draft',
        isCommentable: true,
        tags: [],
      },
      content: '# Hello\n',
    });
    const again = parseLocalDocument(raw);
    assert.equal(again.frontmatter.title, 'Hello');
    assert.equal(again.frontmatter.status, 'draft');
    assert.equal(again.frontmatter.isCommentable, true);
    assert.equal(again.frontmatter.id, undefined);
    assert.equal(again.frontmatter.isRecommended, false);
  });

  it('defaults isCommentable to true when serializing undefined', () => {
    const raw = serializeLocalDocument({
      frontmatter: {
        title: 'Default Commentable',
        status: 'draft',
      },
      content: 'body',
    });
    const doc = parseLocalDocument(raw);
    assert.equal(doc.frontmatter.isCommentable, true);
  });

  it('serializes recommended, password, id and updatedAt when set', () => {
    const raw = serializeLocalDocument({
      frontmatter: {
        id: '1',
        title: 'T',
        status: 'publish',
        summary: 's',
        cover: 'c',
        category: 'cat',
        tags: ['x'],
        isRecommended: true,
        isCommentable: false,
        password: 'p',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      content: 'body',
    });
    const doc = parseLocalDocument(raw);
    assert.equal(doc.frontmatter.id, '1');
    assert.equal(doc.frontmatter.isRecommended, true);
    assert.equal(doc.frontmatter.password, 'p');
    assert.equal(doc.frontmatter.updatedAt, '2026-01-01T00:00:00.000Z');
    assert.deepEqual(doc.frontmatter.tags, ['x']);
  });
});

describe('frontmatter.remoteArticleToDocument', () => {
  it('maps taxonomy objects and updateAt', () => {
    const doc = remoteArticleToDocument({
      id: 'a1',
      title: 'Remote',
      status: 'publish',
      content: '# Hi',
      summary: 'sum',
      cover: 'https://x/y.png',
      category: { id: 'c1', label: 'Arch', value: 'architecture' },
      tags: [
        { id: 't1', label: 'RP', value: 'reactpress' },
        { id: 't2', label: 'OnlyLabel', value: '' },
      ],
      isRecommended: true,
      isCommentable: false,
      password: 'pw',
      updateAt: '2026-02-01T00:00:00.000Z',
    });
    assert.equal(doc.frontmatter.id, 'a1');
    assert.equal(doc.frontmatter.category, 'architecture');
    assert.deepEqual(doc.frontmatter.tags, ['reactpress', 'OnlyLabel']);
    assert.equal(doc.frontmatter.updatedAt, '2026-02-01T00:00:00.000Z');
    assert.equal(doc.frontmatter.isCommentable, false);
    assert.match(doc.raw, /title: Remote/);
  });

  it('maps string category/tags and defaults content', () => {
    const doc = remoteArticleToDocument({
      id: 'a2',
      title: 'S',
      status: 'draft',
      category: 'plain-cat',
      tags: 'one, two',
    });
    assert.equal(doc.frontmatter.category, 'plain-cat');
    assert.deepEqual(doc.frontmatter.tags, ['one', 'two']);
    assert.equal(doc.content, '');
    assert.equal(doc.frontmatter.isCommentable, true);
  });

  it('falls back to category id when value/label missing', () => {
    const doc = remoteArticleToDocument({
      id: 'a3',
      title: 'C',
      status: 'draft',
      category: { id: 'only-id', label: '', value: '' },
      tags: [null as unknown as string, { id: 'tid', label: '', value: '' }],
    });
    assert.equal(doc.frontmatter.category, 'only-id');
    assert.deepEqual(doc.frontmatter.tags, ['tid']);
  });

  it('handles null tags/category', () => {
    const doc = remoteArticleToDocument({
      id: 'a4',
      title: 'N',
      status: 'draft',
      category: null,
      tags: null,
      content: null,
      summary: null,
      cover: null,
      updateAt: null,
    });
    assert.equal(doc.frontmatter.category, undefined);
    assert.equal(doc.frontmatter.tags, undefined);
    assert.equal(doc.content, '');
    assert.equal(doc.frontmatter.updatedAt, undefined);
  });

  it('ignores empty-string category and object category without ids', () => {
    assert.equal(
      remoteArticleToDocument({
        id: 'a5',
        title: 'E',
        status: 'draft',
        category: '',
      }).frontmatter.category,
      undefined
    );
    assert.equal(
      remoteArticleToDocument({
        id: 'a6',
        title: 'E2',
        status: 'draft',
        category: { id: '', label: '', value: '' },
      }).frontmatter.category,
      ''
    );
    assert.equal(
      remoteArticleToDocument({
        id: 'a7',
        title: 'E3',
        status: 'draft',
        category: { id: undefined as unknown as string, label: '', value: '' },
      }).frontmatter.category,
      undefined
    );
  });
});

describe('frontmatter.createNewArticleDocument + slugifyTitle', () => {
  it('creates a draft shell document', () => {
    const doc = createNewArticleDocument({ title: 'New Post' });
    assert.equal(doc.frontmatter.title, 'New Post');
    assert.equal(doc.frontmatter.status, 'draft');
    assert.equal(doc.frontmatter.summary, '');
    assert.equal(doc.frontmatter.cover, '');
    assert.deepEqual(doc.frontmatter.tags, []);
    assert.match(doc.content, /^# New Post/);
    assert.match(doc.raw, /title: New Post/);
  });

  it('slugifies titles and falls back to untitled', () => {
    assert.equal(slugifyTitle('Hello World!'), 'hello-world');
    assert.equal(slugifyTitle('  你好 World  '), '你好-world');
    assert.equal(slugifyTitle('!!!'), 'untitled');
    assert.equal(slugifyTitle(''), 'untitled');
    assert.ok(slugifyTitle('a'.repeat(120)).length <= 80);
  });
});
