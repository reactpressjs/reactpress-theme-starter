import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';

export function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

export function send(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

export function sendRaw(res: ServerResponse, status: number, body: string, contentType = 'text/plain'): void {
  res.statusCode = status;
  res.setHeader('Content-Type', contentType);
  res.end(body);
}

export type MockHandler = (
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
  body: string
) => Promise<boolean | void> | boolean | void;

export async function startMockServer(
  handler: MockHandler
): Promise<{ baseUrl: string; server: Server; close: () => Promise<void> }> {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url || '/', 'http://127.0.0.1');
    const body = ['POST', 'PUT', 'PATCH'].includes(req.method || '') ? await readBody(req) : '';
    const handled = await handler(req, res, url, body);
    if (!handled) {
      send(res, 404, { success: false, msg: `no route ${url.pathname}`, statusCode: 404 });
    }
  });

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('no port');
  const baseUrl = `http://127.0.0.1:${address.port}/api`;

  return {
    baseUrl,
    server,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      }),
  };
}
