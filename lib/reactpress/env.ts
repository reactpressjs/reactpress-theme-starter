/** App/runtime helpers — values are injected via next.config `env` when possible. */
import {
  DEFAULT_LOCAL_ADMIN,
  DEFAULT_LOCAL_API,
  DEFAULT_LOCAL_SITE,
  resolveThemeApiEnv,
} from '../../scripts/resolve-api-env.mjs'

export {
  DEFAULT_LOCAL_ADMIN,
  DEFAULT_LOCAL_API,
  DEFAULT_LOCAL_SITE,
} from '../../scripts/resolve-api-env.mjs'

declare global {
  interface Window {
    /** Injected in root layout at SSR time — avoids stale build-time NEXT_PUBLIC_* in the browser. */
    __REACTPRESS_CLIENT_API__?: string
  }
}

export const RUNTIME_CLIENT_API_KEY = '__REACTPRESS_CLIENT_API__'

export function getClientSiteUrl(): string {
  return (process.env.CLIENT_SITE_URL || DEFAULT_LOCAL_SITE).replace(/\/$/, '')
}

export function getAdminBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_REACTPRESS_ADMIN_URL?.trim()
  if (configured) return configured.replace(/\/$/, '')
  return DEFAULT_LOCAL_ADMIN
}

/** Server-side resolved browser API base (honours runtime env on each request). */
export function getServerResolvedPublicApiUrl(): string {
  return resolveThemeApiEnv().NEXT_PUBLIC_REACTPRESS_API_URL.replace(/\/$/, '')
}

/** Inline script for `<head>` — must run before client bundles evaluate. */
export function buildClientApiRuntimeScript(apiBase: string): string {
  return `window.${RUNTIME_CLIENT_API_KEY}=${JSON.stringify(apiBase.replace(/\/$/, ''))};`
}

function readRuntimeClientApiBaseUrl(): string | undefined {
  if (typeof window === 'undefined') return undefined
  const value = window[RUNTIME_CLIENT_API_KEY]?.trim()
  return value ? value.replace(/\/$/, '') : undefined
}

/** Axios/fetch base URL for browser CSR — never fall back to localhost:3002 in the browser. */
export function resolveClientApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    return (
      process.env.REACTPRESS_API_URL?.trim() ||
      process.env.NEXT_PUBLIC_REACTPRESS_API_URL?.trim() ||
      DEFAULT_LOCAL_API
    ).replace(/\/$/, '')
  }

  const runtime = readRuntimeClientApiBaseUrl()
  if (runtime) return runtime

  const publicUrl = process.env.NEXT_PUBLIC_REACTPRESS_API_URL?.trim()
  if (publicUrl) return publicUrl.replace(/\/$/, '')

  return '/api'
}

export function getApiPreconnectOrigin(): string | null {
  const apiEnv = resolveThemeApiEnv()
  const api = apiEnv.NEXT_PUBLIC_REACTPRESS_API_URL.trim()

  if (!api || api.startsWith('/')) return null

  const origin = api.replace(/\/api\/?$/, '')
  if (/localhost|127\.0\.0\.1/i.test(origin)) return null
  return origin
}
