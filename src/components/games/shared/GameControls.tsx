import Link from "next/link";
import type { GameStatus } from "@/lib/game-engine";
import { secondaryBtn } from "./GameDialog";

const small = `${secondaryBtn} !px-4 !py-2`;

export default function GameControls({ status, onPause, onResume, onRestart, onFinish, onMenu }: { status: GameStatus; onPause: () => void; onResume: () => void; onRestart: () => void; onFinish?: () => void; onMenu?: () => void }) {
  const playing = status === "playing";
  return <div className="flex flex-wrap items-center gap-2" role="toolbar" aria-label="Game controls">
    {status === "paused"
      ? <button type="button" className={small} onClick={onResume}>▶ Resume</button>
      : <button type="button" className={small} onClick={onPause} disabled={!playing}>⏸ Pause <kbd className="ml-1 text-[10px] font-semibold text-mute">Esc</kbd></button>}
    <button type="button" className={small} onClick={onRestart}>↻ Restart</button>
    {onFinish && <button type="button" className={small} onClick={onFinish} disabled={!playing && status !== "paused"}>🏁 Finish</button>}
    {onMenu && <button type="button" className={small} onClick={onMenu}>☰ Settings</button>}
    <Link href="/games" className={small}>✕ Exit</Link>
  </div>;
}
