/**
 * Mock-aware SSR data loaders. Prefer these over calling toolkit fetch* helpers
 * directly so Cloudflare mock demos never depend on same-zone self-fetch.
 */
import {
  buildMockArchivesPageProps,
  buildMockArticleDetailProps,
  buildMockCategoryArchivePageProps,
  buildMockCmsPageProps,
  buildMockHomePageProps,
  buildMockKnowledgeBookPageProps,
  buildMockKnowledgeChapterPageProps,
  buildMockKnowledgeIndexPageProps,
  buildMockSearchPageProps,
  buildMockTagArchivePageProps,
  mockOrApiEnabled,
} from '@/lib/mock-api/ssr'
import { mockArticles, mockCategories, mockSetting, mockTags } from '@/lib/mock-api/data'
import {
  fetchArchivesPageProps,
  fetchArticleDetailProps,
  fetchCategoryArchivePageProps,
  fetchCmsPageProps,
  fetchHomePageProps,
  fetchKnowledgeBookPageProps,
  fetchKnowledgeChapterPageProps,
  fetchKnowledgeIndexPageProps,
  fetchSearchPageProps,
  fetchSiteMeta,
  fetchTagArchivePageProps,
  themeApi,
  unwrapSetting,
  withApiRetry,
} from '@fecommunity/reactpress-toolkit/theme/server'

export async function loadHomePageProps() {
  if (mockOrApiEnabled()) return buildMockHomePageProps()
  return withApiRetry(() => fetchHomePageProps(themeApi))
}

export async function loadCategoryArchivePageProps(categoryValue: string) {
  if (mockOrApiEnabled()) return buildMockCategoryArchivePageProps(categoryValue)
  return withApiRetry(() => fetchCategoryArchivePageProps(themeApi, categoryValue))
}

export async function loadTagArchivePageProps(tagValue: string) {
  if (mockOrApiEnabled()) return buildMockTagArchivePageProps(tagValue)
  return withApiRetry(() => fetchTagArchivePageProps(themeApi, tagValue))
}

export async function loadArchivesPageProps() {
  if (mockOrApiEnabled()) return buildMockArchivesPageProps()
  return withApiRetry(() => fetchArchivesPageProps(themeApi))
}

export async function loadSearchPageProps(keyword: string) {
  if (mockOrApiEnabled()) return buildMockSearchPageProps(keyword)
  return fetchSearchPageProps(themeApi, keyword)
}

export async function loadCmsPageProps(id: string) {
  if (mockOrApiEnabled()) return buildMockCmsPageProps(id)
  return withApiRetry(() => fetchCmsPageProps(themeApi, id))
}

export async function loadArticleDetailProps(id: string) {
  if (mockOrApiEnabled()) return buildMockArticleDetailProps(id)
  return withApiRetry(() => fetchArticleDetailProps(themeApi, id))
}

export async function loadKnowledgeIndexPageProps(pageSize = 12) {
  if (mockOrApiEnabled()) return buildMockKnowledgeIndexPageProps(pageSize)
  return withApiRetry(() => fetchKnowledgeIndexPageProps(themeApi, pageSize))
}

export async function loadKnowledgeBookPageProps(pId: string) {
  if (mockOrApiEnabled()) return buildMockKnowledgeBookPageProps(pId)
  return withApiRetry(() => fetchKnowledgeBookPageProps(themeApi, pId))
}

export async function loadKnowledgeChapterPageProps(pId: string, id: string) {
  if (mockOrApiEnabled()) return buildMockKnowledgeChapterPageProps(pId, id)
  return withApiRetry(() => fetchKnowledgeChapterPageProps(themeApi, pId, id))
}

export async function loadSiteMeta() {
  if (mockOrApiEnabled()) {
    return {
      siteName: mockSetting.systemTitle,
      siteDescription: mockSetting.systemSubTitle,
      siteUrl: mockSetting.systemUrl,
    }
  }
  return withApiRetry(() => fetchSiteMeta(themeApi))
}

export async function loadSiteSetting() {
  if (mockOrApiEnabled()) {
    return unwrapSetting(mockSetting)
  }
  return withApiRetry(() => themeApi.setting.findAll()).then(unwrapSetting)
}

export function loadMockArticleIds(limit = 200) {
  return mockArticles.slice(0, limit).map((article) => ({ id: article.id }))
}

export function loadMockTagValues(limit = 200) {
  return mockTags.slice(0, limit).map((tag) => ({ tag: tag.value }))
}

export function loadMockCategoryValues(limit = 200) {
  return mockCategories.slice(0, limit).map((category) => ({ category: category.value }))
}
