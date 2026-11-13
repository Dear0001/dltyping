import type { AppLocale, Dict, Vars } from "./types";
import common from "./messages/common";
import navigation from "./messages/navigation";
import authentication from "./messages/authentication";
import footer from "./messages/footer";
import support from "./messages/support";
import dashboard from "./messages/dashboard";
import practice from "./messages/practice";
import games from "./messages/games";
import mastery from "./messages/mastery";
import help from "./messages/help";
import gm from "./messages/gm";
import pets from "./messages/pets";
import progress from "./messages/progress";
import setup from "./messages/setup";
import test from "./messages/test";
import daily from "./messages/daily";
import library from "./messages/library";
import learn from "./messages/learn";
import overview from "./messages/overview";
import arcade from "./messages/arcade";
import space from "./messages/space";
import ui from "./messages/ui";
import legal from "./messages/legal";
import results from "./messages/results";
import achievements from "./messages/achievements";

export type { AppLocale, Vars };

/** Add a namespace file under ./messages and list it here. Keys are "<namespace>.<name>". */
export const namespaces: Record<string, Dict> = { common, navigation, authentication, footer, support, dashboard, practice, games, overview, learn, library, daily, test, setup, progress, pets, gm, help, mastery, arcade, space, ui, legal, results, achievements };

const table: Dict = {};
for (const [name, dict] of Object.entries(namespaces)) {
  for (const [key, value] of Object.entries(dict)) {
    if (process.env.NODE_ENV !== "production" && key in table) throw new Error(`i18n: duplicate key "${key}" (also in ${name})`);
    table[key] = value;
  }
}

/** Looks up `key`, falls back to English, then to the key itself. `{name}` placeholders are filled from `vars`. */
export function translate(locale: AppLocale, key: string, vars?: Vars) {
  const entry = table[key];
  const text = entry ? (entry[locale] || entry.en) : key;
  return vars ? text.replace(/\{(\w+)\}/g, (m, name: string) => (name in vars ? String(vars[name]) : m)) : text;
}

/** The shape of `t()` from useLocale, so library code can take a translator without importing React. */
export type Translate = (key: string, vars?: Vars) => string;
/** Default translator for library code and tests: English. */
export const enT: Translate = (key, vars) => translate("en", key, vars);
