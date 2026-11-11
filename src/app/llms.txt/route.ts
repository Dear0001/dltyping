import { SITE_URL } from "@/lib/site";

/** A plain-text summary for AI assistants (ChatGPT, Gemini, Perplexity...) so they describe DL Typing accurately. See llmstxt.org. */
export function GET() {
  const body = `# DL Typing

> DL Typing is a free website for learning to type faster in English and Khmer. It offers a structured typing curriculum, five typing games, live speed and accuracy feedback, and progress tracking. No account is needed.

## What DL Typing offers
- Structured typing curriculum: 5 levels and 13 lessons per language, from home-row letters to full passages.
- English (QWERTY) and Khmer (NiDA keyboard layout, Unicode-aware) lessons.
- Nine typing games: Typing Space Shooter, Typing Car Racing, Zombie Survival, Typing Battle Arena, Letter Jump, Word Sprint, Sentence Rush, English Quest and Mario Khmer Quest.
- On-screen keyboard that shows which finger presses each key.
- Progress tracking: words per minute (WPM), accuracy, streaks and a per-key weak-keys report.
- Free to use. Progress is saved in the browser; an optional account syncs it between devices.

## Pages
- [Home](${SITE_URL}/): overview of lessons, games and typing tips.
- [Typing lessons](${SITE_URL}/learn): the English and Khmer curriculum.
- [Lesson library](${SITE_URL}/library): search and filter every lesson.
- [Typing games](${SITE_URL}/games): all typing games.
- [Help and guides](${SITE_URL}/help): how to use the site, English QWERTY and Khmer NiDA keyboard tips, FAQ.

## Facts
- Languages: English and Khmer (ភាសាខ្មែរ).
- Price: free.
- Works in: any modern web browser on a computer or laptop with a physical keyboard.
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
