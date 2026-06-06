import https from 'https';
import { NextResponse } from 'next/server';

const REMOTE_API_URL =
  process.env.REMOTE_API_URL || 'https://printing-kappa.vercel.app';

function proxyWithHttps(request: Request, body: string) {
  return new Promise<NextResponse>((resolve, reject) => {
    const url = new URL(request.url);
    const target = new URL(`${REMOTE_API_URL}${url.pathname}${url.search}`);

    const headers: Record<string, string> = {};
    const contentType = request.headers.get('content-type');
    if (contentType) headers['content-type'] = contentType;

    const req = https.request(
      {
        hostname: target.hostname,
        port: target.port || 443,
        path: `${target.pathname}${target.search}`,
        method: request.method,
        headers,
        rejectUnauthorized: process.env.NODE_ENV === 'production',
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        res.on('end', () => {
          resolve(
            new NextResponse(Buffer.concat(chunks), {
              status: res.statusCode || 500,
              headers: {
                'content-type': res.headers['content-type'] || 'application/json',
              },
            }),
          );
        });
      },
    );

    req.on('error', reject);

    if (body) {
      req.write(body);
    }
    req.end();
  });
}

export async function proxyToRemote(request: Request) {
  const body =
    request.method !== 'GET' && request.method !== 'HEAD'
      ? await request.text()
      : '';

  return proxyWithHttps(request, body);
}

export function shouldUseRemoteApi() {
  return process.env.USE_REMOTE_API === 'true';
}

export async function maybeProxy(request: Request) {
  if (!shouldUseRemoteApi()) return null;
  try {
    return await proxyToRemote(request);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Remote API unreachable: ${message}` }, { status: 502 });
  }
}
