import type { Metadata } from "next";
import LetterJumpGame from "@/components/games/letter-jump/LetterJumpGame";

export const metadata: Metadata = {
  title: "Letter Jump — DL Typing",
  description: "Type the glowing target to hop between floating platforms. English and Khmer, three difficulties, timed or endless.",
};

export default function LetterJumpPage() {
  return <LetterJumpGame />;
}
