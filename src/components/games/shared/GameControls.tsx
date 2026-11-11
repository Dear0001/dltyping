import Link from "next/link";
import { useSettings } from "@/hooks/use-stored-value";
import type { GameStatus } from "@/lib/game-engine";
import { secondaryBtn } from "./GameDialog";
import { useLocale } from "@/components/shared/LocaleProvider";

const small = `${secondaryBtn} !px-4 !py-2`;

export default function GameControls({ status, onPause, onResume, onRestart, onFinish, onMenu }: { status: GameStatus; onPause: () => void; onResume: () => void; onRestart: () => void; onFinish?: () => void; onMenu?: () => void }) {
  const { t } = useLocale();
  const [settings, updateSettings] = useSettings();
  const playing = status === "playing";
  const preference = "rounded-xl border-2 px-3 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-brand";
  return <div className="flex flex-wrap items-center gap-2" role="toolbar" aria-label={t("gm.controls")}>
    {status === "paused"
      ? <button type="button" className={small} onClick={onResume}>{t("gm.resumeBtn")}</button>
      : <button type="button" className={small} onClick={onPause} disabled={!playing}>{t("gm.pauseBtn")} <kbd className="ml-1 text-[10px] font-semibold text-mute">Esc</kbd></button>}
    <button type="button" className={small} onClick={onRestart}>{t("gm.restartBtn")}</button>
    {onFinish && <button type="button" className={small} onClick={onFinish} disabled={!playing && status !== "paused"}>{t("gm.finishBtn")}</button>}
    {onMenu && <button type="button" className={small} onClick={onMenu}>{t("gm.settingsBtn")}</button>}
    <span className="mx-1 hidden h-7 border-l border-slate-200 sm:block" aria-hidden="true" />
    <button type="button" aria-pressed={settings.sound} onClick={() => updateSettings({ sound: !settings.sound })} className={`${preference} ${settings.sound ? "border-brand bg-blue-50 text-brand" : "border-slate-300 bg-white text-mute"}`}>{t(settings.sound ? "gm.soundOn" : "gm.soundOff")}</button>
    <button type="button" aria-pressed={settings.animations} onClick={() => updateSettings({ animations: !settings.animations })} className={`${preference} ${settings.animations ? "border-brand bg-blue-50 text-brand" : "border-slate-300 bg-white text-mute"}`}>{t(settings.animations ? "gm.animOn" : "gm.animOff")}</button>
    <Link href="/games" className={small}>{t("gm.exit")}</Link>
  </div>;
}
