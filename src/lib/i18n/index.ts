import { fr } from "./fr";
import { en } from "./en";

export type Locale = "fr" | "en";

export type Translations = typeof fr;

const translations = { fr, en } as unknown as Record<Locale, Translations>;

export function getTranslations(locale: Locale): Translations {
  return translations[locale] || translations.fr;
}

export { fr, en };
