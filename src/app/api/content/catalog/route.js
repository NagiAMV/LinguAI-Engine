import { NextResponse } from "next/server";

import { fetchEngnovateResource } from "@/lib/engnovate";

const resourceTypes = new Set(["listening", "reading", "writing", "speaking"]);

export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const type = params.get("type") || "listening";
  const query = params.get("query") || "";

  if (!resourceTypes.has(type)) {
    return NextResponse.json({ error: "Unsupported content type." }, { status: 400 });
  }

  try {
    const payload = await fetchEngnovateResource(type, query);
    if (!payload) {
      return NextResponse.json(
        { error: "ENGNOVATE_SCRAPER_URL is not configured.", items: [] },
        { status: 503 },
      );
    }
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=900" },
    });
  } catch (error) {
    console.error("Content catalog request failed", error);
    return NextResponse.json({ error: "Content catalog is temporarily unavailable.", items: [] }, { status: 502 });
  }
}