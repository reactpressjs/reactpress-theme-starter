import fs from 'node:fs'
import path from 'node:path'
import { bindings, defineConfig, defineWorker } from 'cf/config'

/** Fill unset keys from the gitignored `.env` so deploy config is not committed. */
function loadLocalEnv() {
  const envPath = path.resolve(process.cwd(), '.env')
  if (!fs.existsSync(envPath)) return
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = value
  }
}

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(
      `Missing ${name}. Set it in the environment or .env before deploying (see .env.example).`
    )
  }
  return value
}

loadLocalEnv()

function siteOrigin(value: string | undefined): string {
  const trimmed = value?.trim().replace(/\/+$/, '') ?? ''
  if (!trimmed) return ''
  return /^https?:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`
}

const domain = siteOrigin(process.env.CLOUDFLARE_DOMAIN || process.env.CLIENT_SITE_URL)
const accountId = requiredEnv('CLOUDFLARE_ACCOUNT_ID')
const kvNamespaceId = requiredEnv('CLOUDFLARE_KV_NAMESPACE_ID')
if (!domain) {
  throw new Error(
    'Missing CLOUDFLARE_DOMAIN or CLIENT_SITE_URL. Set one before deploying (see .env.example).'
  )
}

export default defineConfig({
  accountId,
  worker: defineWorker({
    name: 'reactpress-theme-starter',
    entrypoint: 'vinext/server/fetch-handler',
    compatibilityDate: '2026-11-12',
    // Same-zone SSR fetch (e.g. the public hostname → /api) must loop back to this
    // Worker. Without the flag, Cloudflare sends those subrequests to the zone origin
    // and the mock /api routes are never hit — home feed + bootstrap stay empty.
    compatibilityFlags: ['global_fetch_strictly_public'],
    domains: [domain.replace(/^https?:\/\//, '')],
    assets: {
      htmlHandling: 'none',
      notFoundHandling: 'none',
      runWorkerFirst: ['/*', '!/_next/static/*', '!/*/_next/static/*'],
    },
    env: {
      ASSETS: bindings.assets(),
      VINEXT_KV_CACHE: bindings.kv({ id: kvNamespaceId }),
      REACTPRESS_MOCK_API: bindings.text('1'),
      REACTPRESS_BUNDLE_ADMIN: bindings.text('1'),
      REACTPRESS_API_URL: bindings.text(`${domain}/api`),
      NEXT_PUBLIC_REACTPRESS_API_URL: bindings.text('/api'),
      NEXT_PUBLIC_REACTPRESS_ADMIN_URL: bindings.text('/admin'),
      CLIENT_SITE_URL: bindings.text(domain),
    },
  }),
})
