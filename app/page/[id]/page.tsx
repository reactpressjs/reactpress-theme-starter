import CmsPageClient from '@/components/article/CmsPageClient'
import { buildCmsPageMetadata, parseSiteSeoContext } from '@/lib/reactpress/contentSeo'
import { coercePublishedPage } from '@/lib/reactpress/coercePublishedPage'
import { loadCmsPageProps, loadSiteMeta, loadSiteSetting } from '@/lib/reactpress/ssrFetch'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

export const revalidate = 60

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params

  try {
    const [{ page: rawPage }, siteMeta, settingRow] = await Promise.all([
      loadCmsPageProps(id),
      loadSiteMeta(),
      loadSiteSetting(),
    ])

    const page = coercePublishedPage(rawPage)
    if (!page) {
      return {}
    }

    const site = parseSiteSeoContext(settingRow, siteMeta)
    return buildCmsPageMetadata(page, site)
  } catch (error) {
    console.error('[reactpress-theme-starter] cms page metadata fetch failed', error)
    return {}
  }
}

export default async function CmsPage({ params }: PageProps) {
  const { id } = await params

  try {
    const { page: rawPage } = await loadCmsPageProps(id)
    const page = coercePublishedPage(rawPage)
    if (!page) {
      notFound()
    }
    return <CmsPageClient page={page} />
  } catch (error) {
    console.error('[reactpress-theme-starter] cms page fetch failed', error)
    notFound()
  }
}
