import ArticleViewClient from '@/components/article/ArticleViewClient'
import {
  buildArticleJsonLd,
  buildArticleMetadata,
  parseSiteSeoContext,
} from '@/lib/reactpress/contentSeo'
import { generateArticleStaticParams } from '@/lib/reactpress/staticParams'
import { loadArticleDetailProps, loadSiteMeta, loadSiteSetting } from '@/lib/reactpress/ssrFetch'
import { resolveImageUrl } from '@fecommunity/reactpress-toolkit/theme/server'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

export const revalidate = 60

export async function generateStaticParams() {
  return generateArticleStaticParams()
}

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ preview?: string | string[] }>
}

function isArticlePreview(value: string | string[] | undefined) {
  const flag = Array.isArray(value) ? value[0] : value
  return flag === '1'
}

function resolveAbsoluteImageUrl(cover: string | undefined, siteUrl?: string) {
  if (!cover) return undefined
  const imageUrl = resolveImageUrl(cover, 'large')
  if (!siteUrl) return imageUrl
  try {
    return new URL(imageUrl, siteUrl).href
  } catch {
    return imageUrl
  }
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { id } = await params
  const preview = isArticlePreview((await searchParams).preview)

  try {
    const [{ article }, siteMeta, settingRow] = await Promise.all([
      loadArticleDetailProps(id),
      loadSiteMeta(),
      loadSiteSetting(),
    ])

    if (!article?.id || (article.status !== 'publish' && !preview)) {
      return {}
    }

    const site = parseSiteSeoContext(settingRow, siteMeta)
    const imageUrl = resolveAbsoluteImageUrl(article.cover, site.siteUrl)
    const metadata = buildArticleMetadata(article, site, imageUrl)
    if (article.status !== 'publish') {
      return { ...metadata, robots: { index: false, follow: false } }
    }
    return metadata
  } catch (error) {
    console.error('[reactpress-theme-starter] article metadata fetch failed', error)
    return {}
  }
}

export default async function ArticlePage({ params, searchParams }: PageProps) {
  const { id } = await params
  const preview = isArticlePreview((await searchParams).preview)

  try {
    const [{ article }, siteMeta] = await Promise.all([loadArticleDetailProps(id), loadSiteMeta()])

    if (!article?.id || (article.status !== 'publish' && !preview)) {
      notFound()
    }

    const coverUrl = resolveAbsoluteImageUrl(article.cover, siteMeta.siteUrl)
    const jsonLd = buildArticleJsonLd(article, siteMeta.siteUrl, coverUrl)

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ArticleViewClient article={article} />
      </>
    )
  } catch (error) {
    console.error('[reactpress-theme-starter] article page fetch failed', error)
    notFound()
  }
}
