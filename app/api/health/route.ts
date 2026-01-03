import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { env } from '@/lib/env';
import OpenAI from 'openai';
import { Redis } from '@upstash/redis';

export const dynamic = 'force-dynamic';

export async function GET() {
  const status: any = {
    database: 'checking',
    openai: 'checking',
    clerk: 'checking',
    redis: 'checking',
    timestamp: new Date().toISOString(),
  };

  // 1. Check Database
  try {
    await prisma.$queryRaw`SELECT 1`;
    status.database = 'connected';
  } catch (e: any) {
    status.database = `error: ${e.message}`;
  }

  // 2. Check OpenAI (Optional test call)
  if (env.OPENAI_API_KEY) {
    try {
      const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
      await openai.models.list(); // Lightweight check
      status.openai = 'connected';
    } catch (e: any) {
      status.openai = `error: ${e.message}`;
    }
  } else {
    status.openai = 'missing_key';
  }

  // 3. Check Clerk
  if (env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    status.clerk = 'configured';
  } else {
    status.clerk = 'missing_keys';
  }

  // 4. Check Redis
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      await redis.ping();
      status.redis = 'connected';
    } catch (e: any) {
      status.redis = `error: ${e.message}`;
    }
  } else {
    status.redis = 'not_configured (using in-memory fallback)';
  }

  const allOk = status.database === 'connected' &&
    (status.openai === 'connected' || status.openai === 'missing_key');

  return NextResponse.json(status, { status: allOk ? 200 : 500 });
}
