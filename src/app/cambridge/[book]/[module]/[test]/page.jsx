import { readFile } from "node:fs/promises";
import path from "node:path";
import { notFound } from "next/navigation";
import catalog from "@/data/cambridge-import.json";
import CambridgeExam from "@/components/content/CambridgeExam";
import { withHeadingLists } from "@/components/content/heading-options.mjs";
import { withQuestionCorrections } from "@/components/content/question-corrections.mjs";
import questionCorrections from "@/data/cambridge-question-corrections.json";
import reviewExplanations from "@/data/cambridge-review-explanations.json";
import answerKeys from "@/data/cambridge-answer-keys.json";

export default async function CambridgeExamPage({ params }) {
  const route = await params;
  const item = catalog.items.find((entry) => String(entry.bookId) === route.book && entry.resource === route.module && String(entry.testNumber) === route.test);
  if (!item) notFound();
  const test = JSON.parse(await readFile(path.join(process.cwd(), "public", item.contentUrl), "utf8"));
  return <CambridgeExam key={test.id} test={withHeadingLists(withQuestionCorrections(test, questionCorrections))} answerKey={answerKeys[test.id] || null} explanations={reviewExplanations.tests[test.id] || {}} />;
}
