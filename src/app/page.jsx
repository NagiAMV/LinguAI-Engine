import { Suspense } from "react";
import LinguAIBridgeApp from "@/components/app/LinguAIBridgeApp";

export default function HomePage() {
  return <Suspense fallback={<main className="page-shell">Loading workspace…</main>}><LinguAIBridgeApp /></Suspense>;
}
