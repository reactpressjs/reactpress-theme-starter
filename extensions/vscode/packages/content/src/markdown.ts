import hljs from 'highlight.js/lib/common';
import { marked, Renderer } from 'marked';

function escapeHtml(code: string): string {
  return code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Aligns with reactpress-v2 server/src/utils/markdown.util.ts
 * so published html/toc match Admin / comment rendering.
 * Uses highlight.js common languages only to keep the VS Code bundle small.
 * Unknown / unlabeled fences are HTML-escaped (no highlightAuto) for CPU safety.
 */
export function renderMarkdown(content: string): { html: string; toc: string } {
  const toc: Array<[number, string, string]> = [];
  const renderer = new Renderer();

  renderer.heading = (text: string, level: number) => {
    const anchor = `heading-${toc.length}`;
    toc.push([level, anchor, text]);
    return `<h${level} id="${anchor}">${text}</h${level}>`;
  };

  // Pass options per call — avoid marked.setOptions mutating shared global state.
  let html = marked.parse(content, {
    renderer,
    highlight(code: string, lang: string) {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value;
      }
      return escapeHtml(code);
    },
  } as Parameters<typeof marked.parse>[1]) as string;
  html = html.replace(/<pre>/gi, '<pre class="hljs">');

  return {
    html,
    toc: JSON.stringify(toc, null, 2),
  };
}

export function deriveSummary(content: string, maxLength = 160): string {
  const plain = content
    .replace(/^---[\s\S]*?---\s*/m, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/!\[[^\]]*]\([^)]+\)/g, '')
    .replace(/\[([^\]]*)]\([^)]+\)/g, '$1')
    .replace(/[#>*_`~\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (plain.length <= maxLength) {
    return plain;
  }
  return `${plain.slice(0, maxLength).trim()}…`;
}
