import { supabase } from "@/lib/supabase";

// Это Server Component, он делает запрос напрямую в базу данных Supabase при загрузке страницы
export default async function VocabularyPage() {
  // Запрашиваем все строки из таблицы 'vocabulary'
  const { data: words, error } = await supabase.from("vocabulary").select("*");

  if (error) {
    return (
      <div className="p-8 text-red-500 font-mono">
        Ошибка при загрузке данных: {error.message}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 md:p-12">
      <header className="max-w-5xl mx-auto mb-10 border-b border-slate-800 pb-6">
        <h1 className="text-3xl font-bold text-sky-400">LinguAI Bridge</h1>
        <p className="text-slate-400 mt-2">
          Словарь EdTech-платформы. Успешно загружено карточек:{" "}
          <span className="text-emerald-400 font-semibold">
            {words?.length || 0}
          </span>
        </p>
      </header>

      <main className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {words &&
          words.map((item) => (
            <div
              key={item.id}
              className="bg-slate-800 border border-slate-700/50 rounded-xl p-6 shadow-md hover:border-sky-500/50 transition-all"
            >
              {/* Верхняя строка: Слово и Транскрипция */}
              <div className="flex justify-between items-start mb-3">
                <h2 className="text-xl font-bold text-white tracking-wide">
                  {item.word}
                </h2>
                {item.transcription && (
                  <span className="text-sm font-mono text-sky-300 bg-sky-950/50 px-2 py-0.5 rounded border border-sky-900/50">
                    [{item.transcription}]
                  </span>
                )}
              </div>

              {/* Перевод */}
              <p className="text-slate-200 text-lg mb-4 font-medium">
                {item.translation || item.translation_ru || item.translation_uz}
              </p>

              {/* Синонимы (массив TEXT[]) */}
              {item.synonyms && item.synonyms.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-700/60">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                    Синонимы:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {item.synonyms.map((syn, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-slate-700 text-slate-300 px-2.5 py-1 rounded-full border border-slate-600/30"
                      >
                        {syn}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
      </main>
    </div>
  );
}
