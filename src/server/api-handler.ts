import { NextResponse } from 'next/server';
import { connectDB, isDbConfigured } from '@/server/db';

export async function withDb<T>(handler: () => Promise<T>, status = 200) {
  try {
    if (!isDbConfigured()) {
      return NextResponse.json(
        { error: 'Database not configured. Add MONGO_URI in Vercel env.' },
        { status: 503 },
      );
    }
    await connectDB();
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
      message.includes('Failed to save')
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
