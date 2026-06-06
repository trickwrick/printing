import { NextResponse } from 'next/server';
import { connectDB, isDbConfigured } from '@/server/db';
import { maybeProxy } from '@/server/remote-proxy';

async function ensureDb() {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await connectDB();
      return;
    } catch (err) {
      lastError = err;
      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

export async function withDb<T>(
  request: Request,
  handler: () => Promise<T>,
  status = 200,
) {
  const proxied = await maybeProxy(request);
  if (proxied) return proxied;

  try {
    if (!isDbConfigured()) {
      return NextResponse.json(
        { error: 'Database not configured. Add MONGO_URI in Vercel env.' },
        { status: 503 },
      );
    }
    await ensureDb();
    const result = await handler();
    return NextResponse.json(result, { status });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const code =
      err && typeof err === 'object' && 'code' in err
        ? (err as { code: number }).code
        : undefined;
    if (code === 11000) {
      return NextResponse.json({ error: 'Duplicate entry' }, { status: 400 });
    }
    if (message.includes('Invalid email or password')) {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    if (
      message.includes('already exists') ||
      message.includes('required') ||
      message.includes('Failed to save') ||
      message.includes('Invalid job card id')
    ) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    if (message.includes('not found') || message.includes('Not Found')) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    if (
      message.includes('Could not connect') ||
      message.includes('whitelist') ||
      message.includes('MongoServerSelectionError') ||
      message.includes('MONGO_URI not configured')
    ) {
      return NextResponse.json({ error: message }, { status: 503 });
    }
    console.error('API error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
