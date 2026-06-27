#!/usr/bin/env node
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { DEFAULT_ADMIN_STATIC_PORT, resolveAdminStaticOrigin } = require('./embed-admin.cjs')

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')

function resolveAdminBin() {
  const local = path.join(
    projectRoot,
    'node_modules',
    '@fecommunity/reactpress-web',
    'bin',
    'reactpress-web.js'
  )
  if (fs.existsSync(local)) return local
  throw new Error(
    'Missing @fecommunity/reactpress-web. Run pnpm install (see package.json dependency).'
  )
}

function adminPortFromOrigin(origin) {
  try {
    const url = new URL(origin)
    if (url.port) return Number(url.port)
    return url.protocol === 'https:' ? 443 : 80
  } catch {
    return DEFAULT_ADMIN_STATIC_PORT
  }
}

/**
 * Start embedded Admin static server. Returns child process (stdio inherited).
 * @param {NodeJS.ProcessEnv} [processEnv]
 */
export function spawnEmbeddedAdmin(processEnv = process.env) {
  const origin = resolveAdminStaticOrigin(processEnv)
  const port = adminPortFromOrigin(origin)
  const bin = resolveAdminBin()

  return spawn(process.execPath, [bin, 'start', '--port', String(port), '--host', '127.0.0.1'], {
    cwd: projectRoot,
    env: processEnv,
    stdio: 'inherit',
  })
}
