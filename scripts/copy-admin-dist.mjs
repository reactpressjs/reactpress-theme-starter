#!/usr/bin/env node
/**
 * Copy @fecommunity/reactpress-web/dist → public/admin for Vercel / serverless deploys.
 * Admin SPA expects base /admin/ and same-origin /api (proxied by app/api/[[...path]]).
 */
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const { isBundledAdminEnabled } = require('./embed-admin.cjs')

function resolveAdminDistDir() {
  const dist = path.join(projectRoot, 'node_modules', '@fecommunity/reactpress-web', 'dist')
  return fs.realpathSync(dist)
}

async function copyEntry(src, dest) {
  const stat = await fsp.stat(src)
  if (stat.isDirectory()) {
    await fsp.mkdir(dest, { recursive: true })
    for (const name of await fsp.readdir(src)) {
      await copyEntry(path.join(src, name), path.join(dest, name))
    }
    return
  }
  await fsp.copyFile(src, dest)
}

async function main() {
  if (!isBundledAdminEnabled()) {
    console.log('[copy-admin] skipped (REACTPRESS_BUNDLE_ADMIN=0 or not a Vercel production build)')
    return
  }

  const src = resolveAdminDistDir()
  const indexHtml = path.join(src, 'index.html')
  if (!fs.existsSync(indexHtml)) {
    throw new Error(
      `Admin dist not found at ${src}. Ensure @fecommunity/reactpress-web is installed.`
    )
  }

  const dest = path.join(projectRoot, 'public/admin')
  await fsp.rm(dest, { recursive: true, force: true })
  await copyEntry(src, dest)

  console.log(`[copy-admin] copied ${src} → public/admin`)
}

main().catch((error) => {
  console.error('[copy-admin]', error.message || error)
  process.exit(1)
})
