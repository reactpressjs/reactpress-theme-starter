import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../reactpress-blog')
const zh = {
  Search: '搜索',
  'Switch theme': '切换主题',
  GitHub: 'GitHub',
  Dashboard: '仪表盘',
  Login: '登录',
  Register: '注册',
  'Search articles…': '搜索文章…',
  'Close search': '关闭搜索',
  'Search for:': '搜索：',
  'Submit search': '提交搜索',
  'No posts yet.': '还没有文章。',
  'Recommended readings': '推荐阅读',
  'Previous slide': '上一张',
  'Next slide': '下一张',
  'Slide %1$d of %2$d': '第 %1$d 张，共 %2$d 张',
  Categories: '分类',
  All: '全部',
  '%s — Powered by WordPress': '%s — 由 WordPress 驱动',
  'This site': '本站',
  About: '关于',
  'RSS Feed': 'RSS 订阅',
  'Recommended Readings': '推荐阅读',
  Tags: '标签',
  'No tags yet.': '还没有标签。',
  Comments: '评论',
  'Previous Page': '上一页',
  'Next Page': '下一页',
  Posts: '文章',
  'Loading more…': '正在加载更多…',
  'No more posts': '没有更多文章了',
  'No posts found.': '未找到文章。',
  'Page not found': '页面未找到',
  'The page you are looking for does not exist or has been moved.': '你要找的页面不存在，或已经移动。',
  'Back to home': '返回首页',
  'ReactPress Blog': 'ReactPress Blog',
  'Primary Menu': '主菜单',
  'Switch to light theme': '切换到浅色主题',
  'Switch to dark theme': '切换到深色主题',
  'Toggle menu': '打开或关闭菜单',
  'Back to top': '回到顶部',
  'Load more': '加载更多',
  'Could not load more posts. Retrying…': '无法加载更多文章，正在重试…',
  'Posting…': '发布中…',
  'Comment posted.': '评论已发布。',
  'Your comment is awaiting moderation.': '你的评论正在等待审核。',
  'Could not post your comment. Please try again.': '评论发布失败，请重试。',
  'Header & Identity': '页眉与标识',
  Colors: '颜色',
  'Layout & Feed': '布局与列表',
  'GitHub URL': 'GitHub 地址',
  'Shown as an icon in the site header. Leave empty to hide.': '显示在站点页眉的图标。留空则隐藏。',
  'Show Login / Register buttons': '显示登录 / 注册按钮',
  'Footer / About HTML': '页脚 / 关于 HTML',
  'Shown under About in the footer and sidebar. Leave empty to use the site tagline / fallback.':
    '显示在页脚和侧边栏的「关于」下方。留空则使用站点副标题。',
  'Primary color': '主色',
  'Primary button color': '主按钮颜色',
  'Background color': '背景色',
  'Surface (card) color': '表面（卡片）颜色',
  'Text color': '文字颜色',
  'Link color': '链接颜色',
  'Infinite scroll (load more on scroll)': '无限滚动（滚动时加载更多）',
  'When disabled, classic pagination is shown.': '关闭后显示传统分页。',
  'Posts loaded per page': '每页文章数',
  'Used by the home/archive feed and infinite scroll.': '用于首页、归档列表和无限滚动。',
  'Sidebar width (rem)': '侧边栏宽度（rem）',
  '%s ago': '%s前',
}

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'languages' || entry.name === 'node_modules') continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, acc)
    else if (entry.name.endsWith('.php')) acc.push(full)
  }
  return acc
}

const call =
  /(?:esc_html_e|esc_attr_e|esc_html__|esc_attr__|__|_e)\(\s*(?:\/\*[\s\S]*?\*\/\s*)?(['"])((?:\\.|(?!\1)[\s\S])*)\1/g

const entries = new Map()
for (const file of walk(root)) {
  const text = fs.readFileSync(file, 'utf8')
  const rel = path.relative(root, file).split(path.sep).join('/')
  const lines = text.split('\n')
  let match
  call.lastIndex = 0
  while ((match = call.exec(text))) {
    const msgid = match[2].replace(/\\'/g, "'").replace(/\\"/g, '"')
    const index = text.lastIndexOf('\n', match.index) + 1
    const line = text.slice(0, index).split('\n').length
    const prev = lines[line - 2] || ''
    const translator = prev.match(/translators:\s*(.+)\*\//)?.[1]?.trim()
    const ref = `${rel}:${line}`
    const current = entries.get(msgid) || { refs: [], translator }
    if (!current.refs.includes(ref)) current.refs.push(ref)
    if (translator) current.translator = translator
    entries.set(msgid, current)
  }
}

const missing = [...entries.keys()].filter((id) => !zh[id])
if (missing.length) {
  console.error('Missing translations:\n' + missing.map((id) => JSON.stringify(id)).join('\n'))
  process.exit(1)
}

const potHeader =
  'Project-Id-Version: ReactPress Blog 1.3.13\\n' +
  'Report-Msgid-Bugs-To: https://github.com/reactpressjs/reactpress-theme-starter/issues\\n' +
  'POT-Creation-Date: 2026-11-13T00:00:00+00:00\\n' +
  'PO-Revision-Date: YEAR-MO-DA HO:MI+ZONE\\n' +
  'Last-Translator: FULL NAME <EMAIL@ADDRESS>\\n' +
  'Language-Team: LANGUAGE <LL@li.org>\\n' +
  'MIME-Version: 1.0\\n' +
  'Content-Type: text/plain; charset=UTF-8\\n' +
  'Content-Transfer-Encoding: 8bit\\n' +
  'X-Domain: reactpress-blog\\n'
const poHeader =
  'Project-Id-Version: ReactPress Blog 1.3.13\\n' +
  'Report-Msgid-Bugs-To: https://github.com/reactpressjs/reactpress-theme-starter/issues\\n' +
  'POT-Creation-Date: 2026-11-13T00:00:00+00:00\\n' +
  'PO-Revision-Date: 2026-11-13T00:00:00+00:00\\n' +
  'Last-Translator: ReactPress\\n' +
  'Language-Team: 简体中文\\n' +
  'Language: zh_CN\\n' +
  'MIME-Version: 1.0\\n' +
  'Content-Type: text/plain; charset=UTF-8\\n' +
  'Content-Transfer-Encoding: 8bit\\n' +
  'Plural-Forms: nplurals=1; plural=0;\\n' +
  'X-Domain: reactpress-blog\\n'

function escapePo(value) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')
}

function block(msgid, item, msgstr) {
  const lines = []
  if (item?.translator) lines.push(`#. translators: ${item.translator}`)
  for (const ref of item?.refs || []) lines.push(`#: ${ref}`)
  lines.push(`msgid "${escapePo(msgid)}"`)
  lines.push(`msgstr "${escapePo(msgstr)}"`)
  return `${lines.join('\n')}\n`
}

const ids = [...entries.keys()].sort((a, b) => a.localeCompare(b))
const pot = [
  '# Copyright (C) 2026 ReactPress',
  '# This file is distributed under the GNU General Public License v2 or later.',
  'msgid ""',
  'msgstr ""',
  ...potHeader
    .trim()
    .split('\\n')
    .filter(Boolean)
    .map((line) => `"${line}\\n"`),
  '',
  ...ids.map((id) => block(id, entries.get(id), '')),
  '',
].join('\n')

const po = [
  '# Copyright (C) 2026 ReactPress',
  '# This file is distributed under the GNU General Public License v2 or later.',
  'msgid ""',
  'msgstr ""',
  ...poHeader
    .trim()
    .split('\\n')
    .filter(Boolean)
    .map((line) => `"${line}\\n"`),
  '',
  ...ids.map((id) => block(id, entries.get(id), zh[id])),
  '',
].join('\n')

const lang = path.join(root, 'languages')
fs.writeFileSync(path.join(lang, 'reactpress-blog.pot'), pot)
fs.writeFileSync(path.join(lang, 'zh_CN.po'), po)

function encodeMo(pairs) {
  const originals = []
  const translations = []
  let offset = 28 + pairs.length * 16
  const originalBytes = []
  for (const [id] of pairs) {
    const bytes = Buffer.from(id, 'utf8')
    originals.push([bytes.length, offset])
    originalBytes.push(bytes, Buffer.from([0]))
    offset += bytes.length + 1
  }
  const translationBytes = []
  for (const [, str] of pairs) {
    const bytes = Buffer.from(str, 'utf8')
    translations.push([bytes.length, offset])
    translationBytes.push(bytes, Buffer.from([0]))
    offset += bytes.length + 1
  }
  const header = Buffer.alloc(28)
  header.writeUInt32LE(0x950412de, 0)
  header.writeUInt32LE(0, 4)
  header.writeUInt32LE(pairs.length, 8)
  header.writeUInt32LE(28, 12)
  header.writeUInt32LE(28 + pairs.length * 8, 16)
  const originalTable = Buffer.alloc(pairs.length * 8)
  const translationTable = Buffer.alloc(pairs.length * 8)
  pairs.forEach((_, index) => {
    originalTable.writeUInt32LE(originals[index][0], index * 8)
    originalTable.writeUInt32LE(originals[index][1], index * 8 + 4)
    translationTable.writeUInt32LE(translations[index][0], index * 8)
    translationTable.writeUInt32LE(translations[index][1], index * 8 + 4)
  })
  return Buffer.concat([
    header,
    originalTable,
    translationTable,
    ...originalBytes,
    ...translationBytes,
  ])
}

const pairs = [
  ['', poHeader.replace(/\\n/g, '\n')],
  ...ids.map((id) => [id, zh[id]]),
].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))

fs.writeFileSync(path.join(lang, 'reactpress-blog-zh_CN.mo'), encodeMo(pairs))
console.log(`Wrote ${ids.length} strings`)
