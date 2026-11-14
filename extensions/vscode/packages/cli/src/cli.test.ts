import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import * as fs from 'node:fs/promises'
import * as http from 'node:http'
import * as os from 'node:os'
import * as path from 'node:path'
import { after, before, describe, it } from 'node:test'

import { parseArgs, readTokenFile } from './args'

function runCli(
  args: string[],
  env: NodeJS.ProcessEnv
): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(__dirname, 'cli.js'), ...args], { env })
    let stdout = ''
    let stderr = ''
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', (chunk) => {
      stdout += chunk
    })
    child.stderr.on('data', (chunk) => {
      stderr += chunk
    })
    child.on('close', (code) => resolve({ code, stdout, stderr }))
  })
}

function baseEnv(extra: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  const env = { ...process.env }
  for (const key of [
    'REACTPRESS_TOKEN',
    'REACTPRESS_USER',
    'REACTPRESS_PASSWORD',
    'REACTPRESS_API_URL',
    'CLIENT_SITE_URL',
    'REACTPRESS_SITE_URL',
    'HTTP_PROXY',
    'HTTPS_PROXY',
    'ALL_PROXY',
    'http_proxy',
    'https_proxy',
    'all_proxy',
  ]) {
    delete env[key]
  }
  return { ...env, ...extra }
}

describe('CLI argument helpers', () => {
  it('parses commands, boolean flags, and values', () => {
    const parsed = parseArgs(['--', 'push', 'post.md', '--force', '--api', 'http://api'])
    assert.equal(parsed.command, 'push')
    assert.deepEqual(parsed.positionals, ['post.md'])
    assert.equal(parsed.flags.force, true)
    assert.equal(parsed.flags.api, 'http://api')
  })

  it('reads a token file and reports a missing path', async () => {
    assert.equal(await readTokenFile(undefined), undefined)
    const file = path.join(os.tmpdir(), `rp-token-${Date.now()}.txt`)
    await fs.writeFile(file, '  secret \n', 'utf8')
    assert.equal(await readTokenFile(file), 'secret')
    await fs.rm(file)
    await assert.rejects(() => readTokenFile(file), /Token file not found/)
    await assert.rejects(() => readTokenFile(process.cwd()))
  })
})

describe('reactpress-content login and preview', () => {
  let baseUrl = ''
  let closeServer: () => Promise<void>

  before(async () => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url || '/', 'http://127.0.0.1')
      const auth = String(req.headers.authorization || '')
      const send = (status: number, body: unknown) => {
        res.writeHead(status, { 'content-type': 'application/json' })
        res.end(JSON.stringify(body))
      }

      if (req.method === 'GET' && url.pathname === '/api/user') {
        if (auth !== 'Bearer good') {
          send(401, { success: false, msg: 'unauthorized', statusCode: 401 })
          return
        }
        send(200, { success: true, data: { name: 'admin' } })
        return
      }

      if (req.method === 'GET' && url.pathname.startsWith('/api/article/')) {
        if (auth !== 'Bearer good') {
          send(401, { success: false, msg: 'unauthorized', statusCode: 401 })
          return
        }
        const id = decodeURIComponent(url.pathname.slice('/api/article/'.length))
        send(200, {
          success: true,
          data: {
            id,
            title: 'T',
            status: id === 'draft-1' ? 'draft' : 'publish',
            updateAt: '2026-01-01T00:00:00.000Z',
          },
        })
        return
      }

      send(404, { success: false, msg: 'not found', statusCode: 404 })
    })

    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', resolve)
    })
    const address = server.address()
    if (!address || typeof address === 'string') throw new Error('No port')
    baseUrl = `http://127.0.0.1:${address.port}/api`
    closeServer = () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()))
      })
  })

  after(async () => {
    await closeServer()
  })

  it('rejects a missing token file and an invalid token', async () => {
    const missing = await runCli(
      ['login', '--token-file', path.join(os.tmpdir(), 'missing-rp-token')],
      baseEnv()
    )
    assert.equal(missing.code, 1)
    assert.match(missing.stderr, /Token file not found/)

    const invalid = await runCli(
      ['login', '--token', 'bad'],
      baseEnv({ REACTPRESS_API_URL: baseUrl })
    )
    assert.equal(invalid.code, 1)
    assert.doesNotMatch(invalid.stdout, /OK — authenticated/)
  })

  it('confirms a valid token and previews drafts with preview=1', async () => {
    const login = await runCli(
      ['login', '--token', 'good'],
      baseEnv({ REACTPRESS_API_URL: baseUrl })
    )
    assert.equal(login.code, 0, login.stderr)
    assert.match(login.stdout, /OK — authenticated/)

    const published = await runCli(
      ['preview', 'pub-1', '--token', 'good', '--site', 'http://site.test'],
      baseEnv({ REACTPRESS_API_URL: baseUrl })
    )
    assert.equal(published.code, 0)
    assert.match(published.stdout, /^http:\/\/site\.test\/article\/pub-1\n?$/)

    const draft = await runCli(
      ['preview', 'draft-1', '--token', 'good', '--site', 'http://site.test'],
      baseEnv({ REACTPRESS_API_URL: baseUrl })
    )
    assert.equal(draft.code, 0)
    assert.match(draft.stdout, /http:\/\/site\.test\/article\/draft-1\?preview=1/)

    const anonymous = await runCli(['preview', 'draft-1', '--site', 'http://site.test'], baseEnv())
    assert.equal(anonymous.code, 0)
    assert.match(anonymous.stdout, /^http:\/\/site\.test\/article\/draft-1\n?$/)
  })
})
