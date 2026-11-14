import {
  mockArticles,
  mockKnowledgeBooks,
  mockKnowledgeChapters,
  mockPages,
} from '@/lib/mock-api/data'
import { mockOrApiEnabled } from '@/lib/mock-api/ssr'
import { getClientSiteUrl } from '@/lib/reactpress/env'
import { MetadataRoute } from 'next'
import {
  themeApi,
  unpackPaginatedPair,
  withApiRetry,
} from '@fecommunity/reactpress-toolkit/theme/server'
import type { IArticle } from '@fecommunity/reactpress-toolkit/types'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getClientSiteUrl()

  const staticRoutes = ['', 'tags', 'archives', 'search', 'knowledge', 'suggestions'].map(
    (route) => ({
      url: route ? `${siteUrl}/${route}` : siteUrl,
      lastModified: new Date(),
    })
  )

  let articleRoutes: MetadataRoute.Sitemap = []
  let contentRoutes: MetadataRoute.Sitemap = []

  try {
    if (mockOrApiEnabled()) {
      articleRoutes = mockArticles.map((article) => ({
        url: `${siteUrl}/article/${article.id}`,
        lastModified: article.updateAt ?? article.publishAt ?? new Date(),
      }))
      contentRoutes = [
        ...mockKnowledgeBooks.map((book) => ({
          url: `${siteUrl}/knowledge/${book.id}`,
          lastModified: book.updateAt ?? new Date(),
        })),
        ...mockKnowledgeChapters
          .filter((chapter) => chapter.parentId)
          .map((chapter) => ({
            url: `${siteUrl}/knowledge/${chapter.parentId}/${chapter.id}`,
            lastModified: chapter.updateAt ?? new Date(),
          })),
        ...mockPages.map((page) => ({
          url: `${siteUrl}/page/${page.id}`,
          lastModified: page.updateAt ?? new Date(),
        })),
      ]
    } else {
      const response = await withApiRetry(() =>
        themeApi.article.findAll({
          query: { page: 1, pageSize: 500, status: 'publish' },
        } as never)
      )
      const [articles] = unpackPaginatedPair<IArticle>(response)
      articleRoutes = articles.map((article) => ({
        url: `${siteUrl}/article/${article.id}`,
        lastModified: article.updateAt ?? article.publishAt ?? new Date(),
      }))
    }
  } catch (error) {
    console.error('[reactpress-theme-starter] sitemap fetch failed', error)
  }

  return [...staticRoutes, ...articleRoutes, ...contentRoutes]
}
