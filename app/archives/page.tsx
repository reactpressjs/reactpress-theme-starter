import ArchivesClient from '@/components/views/ArchivesClient'
import { buildLocalizedListPageMetadata } from '@/lib/reactpress/siteMetadata'
import { loadArchivesPageProps } from '@/lib/reactpress/ssrFetch'
import type { ArchiveTree } from '@fecommunity/reactpress-toolkit/theme/server'
import type { Metadata } from 'next'

export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  return buildLocalizedListPageMetadata('archives', undefined, { path: '/archives' })
}

export default async function ArchivesPage() {
  let articles: ArchiveTree = {}

  try {
    const data = await loadArchivesPageProps()
    articles = data.articles
  } catch (error) {
    console.error('[reactpress-theme-starter] archives fetch failed', error)
  }

  return <ArchivesClient articles={articles} />
}
