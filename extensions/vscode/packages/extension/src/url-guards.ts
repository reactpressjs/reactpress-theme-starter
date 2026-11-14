import * as path from 'path'

/** True for localhost / loopback / .local hosts (cleartext HTTP is acceptable). */
export function isLocalHostname(hostname: string): boolean {
  const host = hostname.toLowerCase()
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '::1' ||
    host === '[::1]' ||
    host.endsWith('.local')
  )
}

/** Parse and require http(s). Throws a user-facing Error on failure. */
export function assertHttpOrHttpsUrl(raw: string, label: string): URL {
  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    throw new Error(`${label} is not a valid URL`)
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`${label} must use http:// or https://`)
  }
  return parsed
}

/**
 * Resolve `contentPath` under `workspaceRoot` and refuse path traversal.
 * Returns the absolute directory path.
 */
export function resolveContentDir(workspaceRoot: string, contentPath: string): string {
  const root = path.resolve(workspaceRoot)
  const resolved = path.resolve(root, contentPath)
  const rel = path.relative(root, resolved)
  if (rel.startsWith(`..${path.sep}`) || rel === '..' || path.isAbsolute(rel)) {
    throw new Error('reactpress.contentPath must stay inside the workspace folder')
  }
  return resolved
}
