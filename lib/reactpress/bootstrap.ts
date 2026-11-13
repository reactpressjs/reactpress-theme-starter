import themeManifest from '../../theme.json'
import { buildMockAppBootstrap, mockOrApiEnabled } from '@/lib/mock-api/ssr'
import {
  createDefaultAppBootstrap,
  fetchAppBootstrap,
  slimAppBootstrapForRoute,
  type AppBootstrapResult,
} from '@fecommunity/reactpress-toolkit/theme/server'
import type { IncomingMessage } from 'http'
import { cookies, headers } from 'next/headers'

type BootstrapCategory = {
  value: string
  label: string
  articleCount?: number
}

async function buildVisitorRequest(): Promise<IncomingMessage> {
  const cookieStore = await cookies()
  const headerStore = await headers()
  const cookieHeader = cookieStore
    .getAll()
    .map((item) => `${item.name}=${encodeURIComponent(item.value)}`)
    .join('; ')

  return {
    headers: {
      cookie: cookieHeader,
      'accept-language': headerStore.get('accept-language') ?? '',
    },
  } as IncomingMessage
}

function slimBootstrap(bootstrap: AppBootstrapResult, pathname: string): AppBootstrapResult {
  const slimmed = slimAppBootstrapForRoute(bootstrap, pathname)
  const categories = (bootstrap.categories as BootstrapCategory[]).map(
    ({ value, label, articleCount }) => ({ value, label, articleCount })
  )
  return { ...slimmed, categories }
}

export async function loadAppBootstrap(pathname = '/'): Promise<AppBootstrapResult> {
  const req = await buildVisitorRequest()

  if (mockOrApiEnabled()) {
    return slimBootstrap(buildMockAppBootstrap(req), pathname)
  }

  try {
    const bootstrap = await fetchAppBootstrap({ manifest: themeManifest, req })
    return slimBootstrap(bootstrap, pathname)
  } catch (error) {
    console.error('[reactpress-theme-starter] fetchAppBootstrap failed, using defaults', error)
    return createDefaultAppBootstrap()
  }
}

export { themeManifest }
