import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { deriveSummary, renderMarkdown } from './markdown';

describe('markdown.renderMarkdown', () => {
  it('builds heading anchors and toc', () => {
    const { html, toc } = renderMarkdown('# One\n\n## Two\n\nText');
    assert.match(html, /id="heading-0"/);
    assert.match(html, /id="heading-1"/);
    const parsed = JSON.parse(toc) as Array<[number, string, string]>;
    assert.deepEqual(parsed[0], [1, 'heading-0', 'One']);
    assert.deepEqual(parsed[1], [2, 'heading-1', 'Two']);
  });

  it('highlights known languages and escapes unknown / unlabeled fences', () => {
    const known = renderMarkdown('```js\nconst x = 1\n```\n');
    assert.match(known.html, /<pre class="hljs">/);
    assert.match(known.html, /hljs-/);

    const unknown = renderMarkdown('```notalang\nfoo <bar>\n```\n');
    assert.match(unknown.html, /<pre class="hljs">/);
    assert.match(unknown.html, /foo &lt;bar&gt;/);
    assert.ok(!unknown.html.includes('foo <bar>'));

    const unlabeled = renderMarkdown('```\nplain & stuff\n```\n');
    assert.match(unlabeled.html, /<pre class="hljs">/);
    assert.match(unlabeled.html, /plain &amp; stuff/);
  });
});

describe('markdown.deriveSummary', () => {
  it('strips frontmatter, code, images and markdown noise', () => {
    const summary = deriveSummary(`---
title: X
---

# Title

![alt](img.png)

See [link](https://example.com) here.

\`\`\`js
secret()
\`\`\`

Hello world body.
`);
    assert.ok(!summary.includes('secret'));
    assert.ok(!summary.includes('img.png'));
    assert.ok(summary.includes('link'));
    assert.ok(summary.includes('Hello world'));
  });

  it('truncates long plain text with ellipsis', () => {
    const long = 'word '.repeat(80);
    const summary = deriveSummary(long, 40);
    assert.ok(summary.length <= 42);
    assert.ok(summary.endsWith('…'));
  });

  it('returns short text unchanged', () => {
    assert.equal(deriveSummary('Short'), 'Short');
  });
});
