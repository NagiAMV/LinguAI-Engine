import Link from "next/link";

import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function VocabularyPage() {
  const { data: words, error } = await supabase
    .from("vocabulary")
    .select("id, word, definition, ielts_level, category, status")
    .order("id", { ascending: true })

  if (error) {
    return (
      <main className="page-shell">
        <h1>Vocabulary</h1>
        <p className="error">Failed to load vocabulary: {error.message}</p>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <Link href="/">Back</Link>
      <h1>Vocabulary</h1>
      <p className="lead">First 10 words from your Supabase vocabulary table.</p>

      <ul className="vocabulary-list">
        {words.map((item) => (
          <li className="vocabulary-item" key={item.id}>
            <h2>{item.word}</h2>
            <p>{item.definition}</p>
            <p className="meta">
              IELTS {item.ielts_level} | {item.category} | {item.status}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
