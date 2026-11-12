"use client";

import { useEffect, useState } from "react";
import { splitGraphemes } from "@/lib/khmer-unicode";
import { useLocale } from "@/components/shared/LocaleProvider";

/**
 * Decorative preview of the practice screen for the home hero: it "types" an English line, then a Khmer one, with the
 * same correct / wrong / caret colours as the real typing view. Hidden from assistive tech; static with reduced motion.
 */
const SAMPLES = [
  { lang: "en", text: "Small steps become strong habits.", miss: 9 },
  { lang: "km", text: "ការហាត់រាល់ថ្ងៃ ធ្វើឱ្យដៃស្ទាត់។", miss: 5 },
] as const;
const KEYS = ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"];
const HOME = ["A", "S", "D", "F", "G", "H", "J", "K", "L"];

export default function HeroDemo() {
  const { t } = useLocale();
  const [sample, setSample] = useState(0);
  const [pos, setPos] = useState(14);
  const chars = splitGraphemes(SAMPLES[sample].text);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setTimeout(() => {
      if (pos < chars.length + 8) setPos(pos + 1); // a short pause at the end of each line
      else { setSample((s) => (s + 1) % SAMPLES.length); setPos(0); }
    }, pos >= chars.length ? 220 : 110 + ((pos * 37) % 70));
    return () => window.clearTimeout(id);
  }, [pos, chars.length]);

  const typed = Math.min(pos, chars.length);
  const s = SAMPLES[sample];
  const wpm = typed ? 38 + ((typed * 7) % 17) : 0;
  const acc = typed > s.miss ? 97 : 100;
  const nextKey = (chars[typed] ?? "").toUpperCase();

  return (
    <div className="hero-demo" aria-hidden="true">
      <div className="hd-bar"><span /><span /><span /><em>DL Typing · {t(s.lang === "km" ? "category.khmer" : "category.english")}</em></div>
      <div className="hd-stats">
        <div><small>WPM</small><b>{wpm}</b></div>
        <div><small>{t("practice.accuracy")}</small><b>{acc}%</b></div>
        <div className="hd-progress"><i style={{ width: `${Math.round((typed / chars.length) * 100)}%` }} /></div>
      </div>
      <p className={`hd-text${s.lang === "km" ? " font-khmer" : ""}`} lang={s.lang}>
        {chars.map((c, i) => <span key={`${sample}-${i}`} className={i < typed ? (i === s.miss ? "is-wrong" : "is-ok") : i === typed ? "is-caret" : ""}>{c}</span>)}
      </p>
      <div className="hd-keys">
        {[KEYS, HOME].map((row, r) => <div key={r} className="hd-row">{row.map((k) => <span key={k} className={k === nextKey ? "is-next" : k === "F" || k === "J" ? "is-home" : ""}>{k}</span>)}</div>)}
        <div className="hd-row"><span className="hd-space" /></div>
      </div>
    </div>
  );
}
