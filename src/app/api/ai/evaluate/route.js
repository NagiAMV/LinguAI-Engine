import { NextResponse } from "next/server";

import {
  buildSmartEvaluationPrompt,
  parseStructuredFeedback,
} from "@/lib/ai-evaluation";

const allowedModes = new Set(["writing", "speaking"]);

function getProviderConfig() {
  const chosenProvider = (
    process.env.AI_PROVIDER ||
    (process.env.GEMINI_API_KEY ? "gemini" : "openai")
  ).toLowerCase();

  if (chosenProvider === "gemini") {
    const apiKey =
      process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    return {
      provider: "gemini",
      apiKey,
      endpoint: `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || "gemini-2.0-flash"}:generateContent?key=${apiKey || ""}`,
    };
  }

  if (chosenProvider === "ollama") {
    return {
      provider: "ollama",
      apiKey: "",
      endpoint: `${process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434"}/v1/chat/completions`,
      model: process.env.OLLAMA_MODEL || "llama3.2:3b",
    };
  }

  return {
    provider: "openai",
    apiKey: process.env.OPENAI_API_KEY,
    endpoint:
      process.env.OPENAI_API_URL ||
      "https://api.openai.com/v1/chat/completions",
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
  };
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const { mode, submission, task = "" } = body || {};
  if (
    !allowedModes.has(mode) ||
    typeof submission !== "string" ||
    submission.trim().length < 10
  ) {
    return NextResponse.json(
      {
        error:
          "Provide mode (writing or speaking) and a submission of at least 10 characters.",
      },
      { status: 400 },
    );
  }

  const providerConfig = getProviderConfig();
  const isGemini = providerConfig.provider === "gemini";
  const isOllama = providerConfig.provider === "ollama";

  if (isGemini && !providerConfig.apiKey) {
    return NextResponse.json(
      {
        error:
          "Gemini is not configured. Add GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY to the server.",
      },
      { status: 503 },
    );
  }

  if (!isGemini && !isOllama && !providerConfig.apiKey) {
    return NextResponse.json(
      {
        error:
          "AI evaluation is not configured. Set AI_PROVIDER=gemini, AI_PROVIDER=ollama or add OPENAI_API_KEY on the server.",
      },
      { status: 503 },
    );
  }

  try {
    let payload;
    let result;

    if (isGemini) {
      const response = await fetch(providerConfig.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: buildSmartEvaluationPrompt(
                    mode,
                    submission.trim(),
                    task,
                  ),
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini provider returned ${response.status}`);
      }

      result = await response.json();
      payload =
        result?.candidates?.[0]?.content?.parts
          ?.map((part) => part.text)
          .join("") || "";
    } else {
      const response = await fetch(providerConfig.endpoint, {
        method: "POST",
        headers: {
          ...(providerConfig.apiKey
            ? { Authorization: `Bearer ${providerConfig.apiKey}` }
            : {}),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: providerConfig.model,
          temperature: 0.2,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "user",
              content: buildSmartEvaluationPrompt(
                mode,
                submission.trim(),
                task,
              ),
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`AI provider returned ${response.status}`);
      }

      result = await response.json();
      payload = result?.choices?.[0]?.message?.content;
    }

    if (!payload) {
      throw new Error("AI provider returned an empty response");
    }

    return NextResponse.json({
      mode,
      feedback: parseStructuredFeedback(payload),
    });
  } catch (error) {
    console.error("AI evaluation failed", error);
    return NextResponse.json(
      { error: "AI evaluation is temporarily unavailable." },
      { status: 502 },
    );
  }
}
