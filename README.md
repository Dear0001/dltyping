# DL Typing — English & Khmer typing practice and games

Next.js (App Router) + TypeScript + Tailwind. No backend, database or login: progress is stored in `localStorage` on the current device.

## Routes
| Route | What it is |
| --- | --- |
| `/` | Landing page |
| `/setup`, `/learn/english`, `/learn/khmer` | Guided practice (lessons, live WPM/accuracy, pause/finish, completion summary) |
| `/games` | Game hub with language / difficulty / category filters |
| `/games/letter-jump` | Hop between platforms by typing targets (EN + KM, timed or endless) |
| `/games/word-sprint` | Timed word race with WPM, accuracy and combos (EN + KM, 30/60/120 s) |
| `/games/mario-khmer-quest` | Five-level Khmer platform adventure with original art |

## Structure
- `src/lib/khmer-unicode.ts` – normalization and grapheme-cluster splitting (Intl.Segmenter + fallback, COENG merge)
- `src/lib/typing-engine.ts` – WPM / accuracy / per-cluster character states
- `src/lib/keyboard-layouts.ts` – QWERTY + Khmer NiDA key maps (`event.code` → character)
- `src/lib/game-engine.ts` – difficulty rules, combo/score, pure seeded RNG
- `src/lib/local-progress.ts` + `src/hooks/use-stored-value.ts` – hydration-safe, validated storage
- `src/components/games/shared/*` – reusable game UI; each game is a reducer + one component
- `src/data/games.ts`, `src/data/game-content.ts` – game catalog and content banks

Adding a game: add an entry to `typingGames`, a page under `src/app/games/<slug>/`, and reuse the shared components and hooks.

## Scripts
`npm run dev`, `npm run build`, `npm run lint`. Deploys to Vercel with no environment variables.

## Database & sync (optional)
Neon Postgres via Prisma 7 (`@prisma/adapter-neon`). Copy `.env.example` to `.env.local`.
- Schema is applied with `npm run db:migrate` (SQL in `db/migrations`); `prisma/schema.prisma` is introspected from it (`npm run db:pull`, then `npm run db:generate`). The generated client in `src/generated/` is git-ignored and built by `postinstall`.
- `POST /api/sync` merges a device's local progress (keeps the higher score/stars/WPM/accuracy) and returns the merged result. `ProgressSync` calls it in the background; the UI keeps reading `localStorage`, so everything works offline or without a database.
- Accounts are optional (email + password, scrypt-hashed; HttpOnly session cookie, only a token hash stored; sign-in attempts are rate-limited). Without an account, progress syncs per browser (`dlt.device` id). Signing in merges that device's progress into the account (higher value wins), and signing out clears local progress so shared browsers stay separate.
- Auth routes: `/api/auth/{signup,login,logout,me}`. Deploy Vercel functions in `iad1` to sit next to this Neon region.
