import { NextResponse } from "next/server";

const directAudioMap = {
  cambridge_19_test_1: process.env.LISTENING_CAMBRIDGE_19_TEST_1_URL,
};
const streamCache = globalThis.__linguaiListeningCache || new Map();
globalThis.__linguaiListeningCache = streamCache;

async function fetchAudio(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Audio source returned ${response.status}`);
  return {
    buffer: Buffer.from(await response.arrayBuffer()),
    contentType: response.headers.get("content-type") || "audio/mpeg",
  };
}

async function fetchFromScraper(testId) {
  const scraperUrl = process.env.LISTENING_SCRAPER_URL;
  if (!scraperUrl) return null;
  const response = await fetch(
    `${scraperUrl}?testId=${encodeURIComponent(testId)}`,
    { headers: { accept: "audio/mpeg" }, cache: "no-store" },
  );
  if (!response.ok)
    throw new Error(`Listening scraper returned ${response.status}`);
  return {
    buffer: Buffer.from(await response.arrayBuffer()),
    contentType: response.headers.get("content-type") || "audio/mpeg",
  };
}

export async function GET(request) {
  const testId = new URL(request.url).searchParams.get("testId");
  if (!testId || !/^cambridge_\d+_test_[1-4]$/.test(testId))
    return NextResponse.json(
      { error: "A valid listening testId is required." },
      { status: 400 },
    );
  try {
    const cachedAudio = streamCache.get(testId);
    const audio =
      cachedAudio ||
      (await (directAudioMap[testId]
        ? fetchAudio(directAudioMap[testId])
        : fetchFromScraper(testId)));
    if (!audio)
      return NextResponse.json(
        {
          error:
            "No direct audio map or scraper service is configured for this test.",
        },
        { status: 503 },
      );
    if (!cachedAudio) streamCache.set(testId, audio);
    return new Response(audio.buffer, {
      headers: {
        "Content-Type": audio.contentType,
        "Content-Length": String(audio.buffer.length),
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        "Accept-Ranges": "bytes",
      },
    });
  } catch (error) {
    try {
      const fallbackAudio = await fetchFromScraper(testId);
      if (fallbackAudio) {
        streamCache.set(testId, fallbackAudio);
        return new Response(fallbackAudio.buffer, {
          headers: {
            "Content-Type": fallbackAudio.contentType,
            "Content-Length": String(fallbackAudio.buffer.length),
            "Cache-Control": "public, max-age=3600",
          },
        });
      }
    } catch (fallbackError) {
      console.error("Listening fallback failed", fallbackError);
    }
    console.error("Listening proxy failed", error);
    return NextResponse.json(
      { error: "The listening recording is temporarily unavailable." },
      { status: 502 },
    );
  }
}
