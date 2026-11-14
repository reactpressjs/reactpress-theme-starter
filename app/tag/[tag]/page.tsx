import TagArchiveClient from '@/components/views/TagArchiveClient'
import { buildLocalizedListPageMetadata } from '@/lib/reactpress/siteMetadata'
import { generateTagStaticParams } from '@/lib/reactpress/staticParams'
import { loadTagArchivePageProps } from '@/lib/reactpress/ssrFetch'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

export const revalidate = 60

export async function generateStaticParams() {
  return generateTagStaticParams()
}

interface PageProps {
  params: Promise<{ tag: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tag } = await params
  const tagValue = decodeURIComponent(tag)

  try {
    const data = await loadTagArchivePageProps(tagValue)
    if (!data.tag) return {}
    const label = data.tag.label || tagValue
    return buildLocalizedListPageMetadata(
      'pageTitleTag',
      { label },
      {
        path: `/tag/${encodeURIComponent(tagValue)}`,
      }
    )
  } catch {
    return buildLocalizedListPageMetadata(
      'pageTitleTag',
      { label: tagValue },
      {
        path: `/tag/${encodeURIComponent(tagValue)}`,
      }
    )
  }
}

export default async function TagArchivePage({ params }: PageProps) {
  const { tag } = await params
  const tagValue = decodeURIComponent(tag)

  try {
    const data = await loadTagArchivePageProps(tagValue)
    if (!data.tag) {
      notFound()
    }
    return <TagArchiveClient initialArticles={data.articles} total={data.total} tag={data.tag} />
  } catch (error) {
    console.error('[reactpress-theme-starter] tag archive fetch failed', error)
    notFound()
  }
}
