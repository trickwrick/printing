import { NextResponse } from 'next/server';
import { connectDB, getDbStatus, isDbConfigured } from '@/server/db';

export async function GET(request: Request) {
  if (isDbConfigured()) {
    try {
      await connectDB();
    } catch {
      /* connection attempt failed */
    }
  }
  return NextResponse.json({
    status: 'Active',
    database: getDbStatus(),
    message: 'CRM API running stable 🚀',
  });
}
