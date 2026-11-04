"use client";

import { useState } from "react";

const pill = "inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-navy transition hover:border-brand hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

/** Plain share links (no third-party scripts, so nothing tracks visitors) plus a copy-link button. */
export default function ShareButtons({ url, text }: { url: string; text: string }) {
  const [copied, setCopied] = useState(false);
  const u = encodeURIComponent(url), t = encodeURIComponent(text);
  const links = [
    ["Share on Facebook", `https://www.facebook.com/sharer/sharer.php?u=${u}`],
    ["Share on X", `https://twitter.com/intent/tweet?url=${u}&text=${t}`],
    ["Share on LinkedIn", `https://www.linkedin.com/sharing/share-offsite/?url=${u}`],
    ["Share on Telegram", `https://t.me/share/url?url=${u}&text=${t}`],
    ["Share on WhatsApp", `https://wa.me/?text=${t}%20${u}`],
  ] as const;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("Copy this link", url);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {links.map(([label, href]) => <a key={label} href={href} target="_blank" rel="noopener noreferrer" className={pill}>{label}</a>)}
      <a href={`mailto:?subject=${encodeURIComponent("Free English and Khmer typing practice")}&body=${t}%20${u}`} className={pill}>Share by email</a>
      <button type="button" onClick={() => void copy()} className={pill}>{copied ? "Link copied ✓" : "Copy link"}</button>
    </div>
  );
}
