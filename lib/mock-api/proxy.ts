import { resolveUpstreamApiBase } from './config'

/** Strip hop-by-hop / encoding headers — fetch may decompress the body. */
function sanitizeProxyResponseHeaders(headers: Headers): Headers {
  const next = new Headers(headers)
  for (const name of ['content-encoding', 'content-length', 'transfer-encoding', 'connection']) {
    next.delete(name)
  }
  return next
}

export async function proxyToUpstreamApi(request: Request, segments: string[]): Promise<Response> {
  const base = resolveUpstreamApiBase()
  const pathname = segments.map((segment) => decodeURIComponent(segment)).join('/')
  const incoming = new URL(request.url)
  const target = new URL(pathname ? `${base}/${pathname}` : base)
  target.search = incoming.search

  const headers = new Headers(request.headers)
  headers.delete('host')
  headers.delete('connection')

  const body =
    request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.arrayBuffer()

  const upstream = await fetch(target, {
    method: request.method,
    headers,
    body,
    redirect: 'manual',
  })

  // Buffer body — piping upstream.body through a new Response is unreliable on Vercel.
  const upstreamBody = request.method === 'HEAD' ? null : Buffer.from(await upstream.arrayBuffer())

  return new Response(upstreamBody, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: sanitizeProxyResponseHeaders(upstream.headers),
  })
}
