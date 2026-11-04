import type { Metadata } from "next";
import { Suspense } from "react";
import LetterJumpGame from "@/components/games/letter-jump/LetterJumpGame";
import { parseChars } from "@/lib/progress/drill-params";

export const metadata: Metadata = {
  title: "Letter Jump — DL Typing",
  description: "Type the glowing target to hop between floating platforms. Practise key recognition and accuracy in English or Khmer with three levels, timed or endless play.",
};

type Props = { searchParams: Promise<{ lang?: string; keys?: string }> };

async function LetterJumpContent({ searchParams }: Props) {
  const { lang, keys } = await searchParams;
  // `?lang=&keys=` comes from the dashboard's weak-key recommendations.
  const language = lang === "khmer" ? "khmer" : lang === "english" ? "english" : undefined;
  const focusKeys = language ? parseChars(language, keys) : [];
  return <LetterJumpGame focusKeys={focusKeys} focusLanguage={language} />;
}

export default function LetterJumpPage(props: Props) {
  return <Suspense fallback={<LetterJumpGame />}><LetterJumpContent {...props} /></Suspense>;
}
