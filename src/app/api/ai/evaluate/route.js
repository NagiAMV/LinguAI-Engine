import { NextResponse } from 'next/server';
import review from '@/lib/ai-review-service';

const limiter = globalThis.__linguaiReviewLimiter ||= review.createLimiter();
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET() {
  return NextResponse.json({ available: review.config().available }, { headers: { 'Cache-Control': 'no-store' } });
}
async function readBody(request) {
  const reader = request.body?.getReader();
  if (!reader) throw new review.ReviewError('Request body is required.', 400);
  const chunks = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > 65536) { await reader.cancel(); throw new review.ReviewError('Request is too large.', 413); }
      chunks.push(Buffer.from(value));
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch (error) {
    if (error instanceof review.ReviewError) throw error;
    throw new review.ReviewError('Request body must be valid JSON.', 400);
  } finally { reader.releaseLock(); }
}
export async function POST(request) {
  let release;
  try {
    const cfg = review.config();
    if (!cfg.available) throw new review.ReviewError('AI review is not enabled yet. Your draft can still be saved or downloaded.', 503);
    const input = review.validateInput(await readBody(request));
    release = limiter.acquire(cfg.daily);
    const feedback = await review.evaluate(input, cfg);
    return NextResponse.json({ mode: input.mode, feedback });
  } catch (error) {
    return NextResponse.json({ error: error instanceof review.ReviewError ? error.message : 'AI review is temporarily unavailable.' }, { status: error instanceof review.ReviewError ? error.status : 502 });
  } finally { release?.(); }
}
