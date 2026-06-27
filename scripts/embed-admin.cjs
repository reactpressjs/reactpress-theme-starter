/** Shared helpers for embedding @fecommunity/reactpress-web (CJS — next.config.js). */

const DEFAULT_ADMIN_STATIC_PORT = 3000

function trimUrl(value) {
  if (typeof value !== 'string') return ''
  return value.trim().replace(/\/$/, '')
}

function isEmbedAdminEnabled(processEnv = process.env) {
  const flag = processEnv.REACTPRESS_EMBED_ADMIN
  if (flag === '0' || flag === 'false') return false
  if (flag === '1' || flag === 'true') return true
  // Default on for local theme dev when not on Vercel.
  return processEnv.VERCEL !== '1' && processEnv.REACTPRESS_MOCK_API !== '1'
}

function resolveAdminStaticOrigin(processEnv = process.env) {
  const explicit = trimUrl(processEnv.REACTPRESS_ADMIN_STATIC_ORIGIN)
  if (explicit) return explicit
  const port = Number(processEnv.WEB_ADMIN_PORT || DEFAULT_ADMIN_STATIC_PORT)
  return `http://127.0.0.1:${port}`
}

/** Next.js rewrites — browser hits /admin on the theme origin, upstream serves static SPA. */
function createLocalAdminRewrites(processEnv = process.env) {
  const adminOrigin = resolveAdminStaticOrigin(processEnv)
  return [
    { source: '/admin', destination: `${adminOrigin}/admin/` },
    { source: '/admin/:path*', destination: `${adminOrigin}/admin/:path*` },
  ]
}

function resolveEmbeddedAdminPublicUrl(processEnv = process.env, clientSiteUrl) {
  const site = trimUrl(clientSiteUrl)
  if (!site) return null
  return `${site}/admin`
}

/**
 * Vercel / serverless: copy @fecommunity/reactpress-web/dist into public/admin at build time.
 * REACTPRESS_EMBED_ADMIN=0 only disables the Node custom-server embed, not bundled static admin.
 */
function isBundledAdminEnabled(processEnv = process.env) {
  const flag = processEnv.REACTPRESS_BUNDLE_ADMIN
  if (flag === '0' || flag === 'false') return false
  if (flag === '1' || flag === 'true') return true
  return processEnv.VERCEL === '1' && processEnv.REACTPRESS_MOCK_API !== '1'
}

/** SPA fallback — use in Next.js rewrites().fallback after public/admin static files. */
function createBundledAdminFallbackRewrites() {
  return [
    { source: '/admin', destination: '/admin/index.html' },
    { source: '/admin/:path*', destination: '/admin/index.html' },
  ]
}

module.exports = {
  DEFAULT_ADMIN_STATIC_PORT,
  isEmbedAdminEnabled,
  isBundledAdminEnabled,
  resolveAdminStaticOrigin,
  createLocalAdminRewrites,
  createBundledAdminFallbackRewrites,
  resolveEmbeddedAdminPublicUrl,
}
