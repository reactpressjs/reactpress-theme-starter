/**
 * In-process mock SSR helpers.
 *
 * On Cloudflare Workers, SSR HTTP calls to the same public hostname are routed
 * to the zone origin (bypassing this Worker) unless `global_fetch_strictly_public`
 * is enabled. Mock mode therefore serves catalog + page props from local data
 * and never depends on that self-fetch loop.
 */
import { isMockApiEnabled } from '@/lib/mock-api/config'
import {
  filterMockArticlesByCategory,
  filterMockArticlesByTag,
  getMockArticleById,
  getMockCategoryByValue,
  getMockKnowledgeById,
  getMockPageById,
  getMockTagByValue,
  mockArchives,
  mockArticles,
  mockCategories,
  mockKnowledgeBooks,
  mockPages,
  mockSetting,
  mockTags,
  searchMockArticles,
} from '@/lib/mock-api/data'
import {
  createDefaultAppBootstrap,
  resolveCarouselArticles,
  slimArchiveTree,
  slimArticlesForList,
  type AppBootstrapResult,
} from '@fecommunity/reactpress-toolkit/theme/server'
import type { IArticle } from '@fecommunity/reactpress-toolkit/types'
import type { IncomingMessage } from 'http'

/** Mock fixtures are intentionally looser than IArticle for demo content. */
function asArticles<T>(items: T[]): IArticle[] {
  return items as unknown as IArticle[]
}

const DEFAULT_PAGE_SIZE = 12

function parseJson<T>(raw: string | undefined, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function resolveLocale(req?: IncomingMessage): string {
  const i18n = parseJson<Record<string, unknown>>(mockSetting.i18n, {})
  const locales = Object.keys(i18n)
  const header = req?.headers?.['accept-language']
  const accept = Array.isArray(header) ? header[0] : header
  if (accept) {
    const preferred = accept
      .split(',')
      .map((part) => part.trim().split(';')[0]?.toLowerCase())
      .find(Boolean)
    if (preferred) {
      const exact = locales.find((locale) => locale.toLowerCase() === preferred)
      if (exact) return exact
      const prefix = preferred.split('-')[0]
      const byPrefix = locales.find((locale) => locale.toLowerCase().startsWith(prefix))
      if (byPrefix) return byPrefix
    }
  }
  return locales.includes('zh') ? 'zh' : (locales[0] ?? 'zh')
}

export function mockOrApiEnabled(): boolean {
  return isMockApiEnabled()
}

export function buildMockAppBootstrap(req?: IncomingMessage): AppBootstrapResult {
  const i18n = parseJson<Record<string, unknown>>(mockSetting.i18n, {})
  const globalSettingRaw = parseJson<Record<string, unknown>>(mockSetting.globalSetting, {})
  const locale = resolveLocale(req)
  const locales = Object.keys(i18n)
  const globalSetting = (globalSettingRaw?.[locale] ?? undefined) as
    | AppBootstrapResult['globalSetting']
    | undefined
  const themeBlock =
    typeof globalSettingRaw.theme === 'object' && globalSettingRaw.theme !== null
      ? (globalSettingRaw.theme as Record<string, unknown>)
      : {}
  const themeMods =
    typeof themeBlock.mods === 'object' && themeBlock.mods !== null
      ? (themeBlock.mods as AppBootstrapResult['themeMods'])
      : ({} as AppBootstrapResult['themeMods'])

  return {
    ...createDefaultAppBootstrap({ initialLocale: locale, locales }),
    setting: mockSetting as unknown as AppBootstrapResult['setting'],
    tags: mockTags as unknown as AppBootstrapResult['tags'],
    categories: mockCategories as unknown as AppBootstrapResult['categories'],
    pages: mockPages as unknown as AppBootstrapResult['pages'],
    i18n: i18n as AppBootstrapResult['i18n'],
    globalSetting,
    siteConfig: {},
    locales: locales.length ? locales : ['zh', 'en'],
    initialLocale: locale,
    colorPrimary: '#087ea4',
    themeMods,
  }
}

export async function buildMockHomePageProps(pageSize = DEFAULT_PAGE_SIZE) {
  const rawArticles = asArticles(mockArticles.slice(0, pageSize))
  const recommendedArticles = await resolveCarouselArticles(rawArticles, {
    fetchRecommended: async () =>
      asArticles(mockArticles.filter((article) => article.isRecommended)),
  })
  return {
    articles: slimArticlesForList(rawArticles),
    total: mockArticles.length,
    recommendedArticles,
  }
}

export function buildMockCategoryArchivePageProps(
  categoryValue: string,
  pageSize = DEFAULT_PAGE_SIZE
) {
  const articles = asArticles(filterMockArticlesByCategory(categoryValue))
  const category = getMockCategoryByValue(categoryValue) ?? {
    value: categoryValue,
    label: categoryValue,
  }
  return {
    articles: slimArticlesForList(articles.slice(0, pageSize)),
    total: articles.length,
    category,
  }
}

export function buildMockTagArchivePageProps(tagValue: string, pageSize = DEFAULT_PAGE_SIZE) {
  const articles = asArticles(filterMockArticlesByTag(tagValue))
  const tag = getMockTagByValue(tagValue) ?? { value: tagValue, label: tagValue }
  return {
    articles: slimArticlesForList(articles.slice(0, pageSize)),
    total: articles.length,
    tag,
  }
}

export function buildMockArchivesPageProps() {
  return {
    articles: slimArchiveTree(mockArchives as never),
  }
}

export function buildMockSearchPageProps(keyword: string) {
  const trimmed = keyword.trim()
  if (!trimmed) return { keyword: '', articles: [] as IArticle[] }
  const articles = asArticles(
    searchMockArticles(trimmed).filter((article) => article.status === 'publish')
  )
  return { keyword: trimmed, articles }
}

export function buildMockCmsPageProps(id: string) {
  return { page: getMockPageById(id) as never }
}

export function buildMockArticleDetailProps(id: string) {
  return { article: getMockArticleById(id) as unknown as IArticle }
}

export function buildMockKnowledgeIndexPageProps(pageSize = DEFAULT_PAGE_SIZE) {
  return {
    books: mockKnowledgeBooks.slice(0, pageSize),
    total: mockKnowledgeBooks.length,
  }
}

export function buildMockKnowledgeBookPageProps(pId: string) {
  const book = getMockKnowledgeById(pId)
  return {
    pId,
    book,
    otherBooks: mockKnowledgeBooks.filter((item) => item.id !== pId).slice(0, 6),
  }
}

export function buildMockKnowledgeChapterPageProps(pId: string, id: string) {
  return {
    pId,
    book: getMockKnowledgeById(pId),
    id,
    chapter: getMockKnowledgeById(id),
  }
}
