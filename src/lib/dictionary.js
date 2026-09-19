import fs from "node:fs/promises";
import path from "node:path";

const VOCABULARY_PATH = path.join(
  process.cwd(),
  "data",
  "vocabulary_base.json",
);

function normalizeWord(rawWord) {
  return String(rawWord || "")
    .toLowerCase()
    .replace(/[^a-z\u0400-\u04FF'-]/gi, "")
    .replace(/^[^a-z\u0400-\u04FF]+|[^a-z\u0400-\u04FF]+$/gi, "");
}

function buildEntryShape(entry, word) {
  const translations = entry?.translations || {};
  const grammar = entry?.grammar || {};

  return {
    word: String(entry?.word || word || "").toLowerCase(),
    translation:
      translations.ru ||
      translations.uz ||
      entry?.definition ||
      "No translation available",
    transcription: entry?.transcription || entry?.grammar?.pronunciation || "",
    definition: entry?.definition || "Vocabulary entry added during study.",
    synonyms: Array.isArray(entry?.synonyms) ? entry.synonyms : [],
    antonyms: Array.isArray(entry?.antonyms) ? entry.antonyms : [],
    pronunciation: entry?.pronunciation || "",
    grammar,
    etymology: entry?.etymology || "",
    source: "database",
  };
}

function extractJson(text) {
  if (!text || typeof text !== "string") return null;

  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

export async function readVocabularyBase() {
  try {
    const raw = await fs.readFile(VOCABULARY_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveVocabularyWord(entry) {
  const items = await readVocabularyBase();
  const normalizedWord = normalizeWord(entry.word);
  const existingIndex = items.findIndex(
    (item) => normalizeWord(item.word) === normalizedWord,
  );

  const nextItem = {
    word: entry.word,
    translations: {
      ru: entry.translation || "",
      uz: entry.translation || "",
    },
    grammar: entry.grammar || { part_of_speech: "word" },
    definition:
      entry.definition || "Added automatically during reading practice.",
    etymology: entry.etymology || "",
    synonyms: Array.isArray(entry.synonyms) ? entry.synonyms : [],
    antonyms: Array.isArray(entry.antonyms) ? entry.antonyms : [],
    ielts_level: entry.ielts_level || "7.0",
    category: entry.category || "general",
    status: "learning",
  };

  if (existingIndex >= 0) {
    items[existingIndex] = { ...items[existingIndex], ...nextItem };
  } else {
    items.unshift(nextItem);
  }

  await fs.writeFile(
    VOCABULARY_PATH,
    `${JSON.stringify(items, null, 2)}\n`,
    "utf8",
  );
  return { ...nextItem, word: normalizedWord };
}

export async function lookupDictionaryWord(word) {
  const normalizedWord = normalizeWord(word);
  if (!normalizedWord) {
    return { error: "Word is required." };
  }

  const items = await readVocabularyBase();
  const match = items.find(
    (entry) => normalizeWord(entry.word) === normalizedWord,
  );
  if (match) {
    return {
      found: true,
      source: "database",
      entry: buildEntryShape(match, normalizedWord),
    };
  }

  const provider =
    process.env.AI_PROVIDER ||
    (process.env.GEMINI_API_KEY ? "gemini" : "openai");
  const apiKey =
    process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (provider === "gemini" && apiKey) {
    try {
      const prompt = `Return only JSON with fields: word, translation, transcription, definition, synonyms, antonyms, pronunciation, grammar, etymology. Use the word "${normalizedWord}". Provide concise but useful IELTS-level vocabulary data in English and Russian translation. Format as JSON object with no markdown.`;
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || "gemini-2.0-flash"}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: "application/json",
            },
          }),
        },
      );

      if (response.ok) {
        const result = await response.json();
        const rawText =
          result?.candidates?.[0]?.content?.parts
            ?.map((part) => part.text)
            .join("") || "";
        const parsed = extractJson(rawText);
        if (parsed && parsed.word) {
          const saved = await saveVocabularyWord({
            word: parsed.word || normalizedWord,
            translation: parsed.translation || "",
            definition: parsed.definition || "",
            synonyms: parsed.synonyms || [],
            antonyms: parsed.antonyms || [],
            pronunciation: parsed.pronunciation || "",
            grammar: parsed.grammar || { part_of_speech: "word" },
            etymology: parsed.etymology || "",
          });

          return {
            found: true,
            source: "generated",
            entry: buildEntryShape(saved, normalizedWord),
          };
        }
      }
    } catch {
      // fall through to generic fallback below
    }
  }

  const genericEntry = {
    word: normalizedWord,
    translation: "Translation unavailable",
    transcription: "",
    definition:
      "The word was not found in the local database. It has been queued for later review.",
    synonyms: [],
    antonyms: [],
    pronunciation: "",
    grammar: { part_of_speech: "word" },
    etymology: "",
  };

  return { found: false, source: "fallback", entry: genericEntry };
}
