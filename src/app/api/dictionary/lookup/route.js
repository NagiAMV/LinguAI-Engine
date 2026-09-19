import { NextResponse } from "next/server";

import { lookupDictionaryWord, saveVocabularyWord } from "@/lib/dictionary";

export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const word = params.get("word") || "";

  if (!word) {
    return NextResponse.json({ error: "Word is required." }, { status: 400 });
  }

  try {
    const result = await lookupDictionaryWord(word);
    if (result?.found) {
      const payload = result.entry || result;
      await saveVocabularyWord({
        word: payload.word || word,
        translation: payload.translation || "",
        definition: payload.definition || "",
        synonyms: payload.synonyms || [],
        antonyms: payload.antonyms || [],
        pronunciation: payload.pronunciation || "",
        grammar: payload.grammar || { part_of_speech: "word" },
        etymology: payload.etymology || "",
      });
      return NextResponse.json({ entry: payload, saved: true });
    }

    return NextResponse.json(
      { entry: result.entry || { word }, saved: false },
      { status: 200 },
    );
  } catch (error) {
    console.error("Dictionary lookup failed", error);
    return NextResponse.json(
      { error: "Dictionary lookup is temporarily unavailable." },
      { status: 502 },
    );
  }
}
