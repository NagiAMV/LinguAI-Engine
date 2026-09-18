import { NextResponse } from "next/server";

const allowedModes = new Set(["writing", "speaking"]);

function buildPrompt(mode, submission, task) {
  return `You are an IELTS ${mode} examiner and supportive coach. Evaluate the submission against IELTS criteria. Return strict JSON with keys: bandScore (number), summary (string), strengths (array of strings), improvements (array of strings), corrections (array of objects with original, corrected, explanation), nextSteps (array of strings). Do not invent missing evidence.\n\nTask:\n${task || "Not provided"}\n\nSubmission:\n${submission}`;
}

function parseFeedback(content) {
  try {
    return JSON.parse(content);
  } catch {
    const jsonBlock = content.match(/\{[\s\S]*\}/)?.[0];
    if (!jsonBlock) throw new Error("AI response was not valid JSON");
    return JSON.parse(jsonBlock);
  }
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const { mode, submission, task = "" } = body || {};
  if (!allowedModes.has(mode) || typeof submission !== "string" || submission.trim().length < 10) {
    return NextResponse.json({ error: "Provide mode (writing or speaking) and a submission of at least 10 characters." }, { status: 400 });
  }

  const provider = process.env.AI_PROVIDER || "openai";
  const isOllama = provider === "ollama";
  const apiKey = process.env.OPENAI_API_KEY;
  const endpoint = isOllama
    ? `${process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434"}/v1/chat/completions`
    : process.env.OPENAI_API_URL || "https://api.openai.com/v1/chat/completions";
  if (!isOllama && !apiKey) {
    return NextResponse.json({ error: "AI evaluation is not configured. Set AI_PROVIDER=ollama or add OPENAI_API_KEY on the server." }, { status: 503 });
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}), "Content-Type": "application/json" },
      body: JSON.stringify({
        model: isOllama ? process.env.OLLAMA_MODEL || "llama3.2:3b" : process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [{ role: "system", content: buildPrompt(mode, submission.trim(), task) }],
      }),
    });
    if (!response.ok) throw new Error(`AI provider returned ${response.status}`);
    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;
    if (!content) throw new Error("AI provider returned an empty response");
    return NextResponse.json({ mode, feedback: parseFeedback(content) });
  } catch (error) {
    console.error("AI evaluation failed", error);
    return NextResponse.json({ error: "AI evaluation is temporarily unavailable." }, { status: 502 });
  }
}