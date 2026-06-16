import { NextResponse } from 'next/server';
import { matchAll } from '@/services/matcher';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const url = new URL(request.url);
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && !url.hostname.includes('localhost')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const count = await matchAll();
    return NextResponse.json({ success: true, matched: count });
  } catch (err) {
    console.error('match cron error:', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
