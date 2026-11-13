import SearchClient from '@/components/views/SearchClient'
import { mockSetting } from '@/lib/mock-api/data'
import { mockOrApiEnabled } from '@/lib/mock-api/ssr'
import { SettingProvider } from '@/lib/providers/server'
import { buildLocalizedListPageMetadata } from '@/lib/reactpress/siteMetadata'
import { getServerTranslator } from '@/lib/reactpress/serverLocale'
import { loadSearchPageProps } from '@/lib/reactpress/ssrFetch'
import { fetchSiteNavConfig } from '@fecommunity/reactpress-toolkit/theme/server'
import themeManifest from '../../theme.json'
import type { Metadata } from 'next'

export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  return buildLocalizedListPageMetadata('search', undefined, { path: '/search' })
}

interface PageProps {
  searchParams: Promise<{ keyword?: string }>
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { keyword = '' } = await searchParams
  const trimmed = keyword.trim()
  const { locale } = await getServerTranslator()

  let articles = []
  let navConfig
  try {
    const [searchData, navData] = await Promise.all([
      loadSearchPageProps(trimmed),
      fetchSiteNavConfig({
        locale,
        manifest: themeManifest,
        getSetting: () =>
          mockOrApiEnabled()
            ? Promise.resolve(mockSetting as never)
            : SettingProvider.getSetting(),
      }),
    ])
    articles = searchData.articles
    navConfig = navData
  } catch (error) {
    console.error('[reactpress-theme-starter] search page fetch failed', error)
  }

  return <SearchClient keyword={trimmed} articles={articles} navConfig={navConfig} />
}
