import themeManifest from '../../theme.json'
import { buildMockAppBootstrap, mockOrApiEnabled } from '@/lib/mock-api/ssr'
import {
  createDefaultAppBootstrap,
  fetchAppBootstrap,
  slimAppBootstrapForRoute,
  type AppBootstrapResult,
} from '@fecommunity/reactpress-toolkit/theme/server'
import type { IncomingMessage } from 'http'

type BootstrapCategory = {
  value: string
  label: string
  articleCount?: number
}

/**
 * Public bootstrap is cacheable. Visitor locale is applied on the client
 * (`VisitorLocaleBootstrap`) so the root layout can use ISR instead of
 * reading cookies/headers, which would force every page to be dynamic.
 */
function buildVisitorRequest(): IncomingMessage {
  return { headers: {} } as IncomingMessage
}

function slimBootstrap(bootstrap: AppBootstrapResult, pathname: string): AppBootstrapResult {
  const slimmed = slimAppBootstrapForRoute(bootstrap, pathname)
  const categories = (bootstrap.categories as BootstrapCategory[]).map(
    ({ value, label, articleCount }) => ({ value, label, articleCount })
  )
  return { ...slimmed, categories }
}

export async function loadAppBootstrap(pathname = '/'): Promise<AppBootstrapResult> {
  const req = buildVisitorRequest()

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
