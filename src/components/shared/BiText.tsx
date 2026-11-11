import { translate, type Vars } from "@/lib/i18n";

/**
 * Renders a label in both languages; CSS shows the one matching html[data-locale] (set before paint).
 * For always-visible chrome like the navbar, so Khmer visitors never see English labels while the page hydrates.
 * Identical on server and client, so it can't cause a hydration mismatch.
 */
export default function BiText({ k, vars }: { k: string; vars?: Vars }) {
  return <><span className="l-en" lang="en">{translate("en", k, vars)}</span><span className="l-km" lang="km">{translate("km", k, vars)}</span></>;
}
