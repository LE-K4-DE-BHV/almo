import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import de from "./locales/de.json";
import en from "./locales/en.json";
import fr from "./locales/fr.json";

// Translations are bundled inline (not lazy-loaded per language) since the
// catalog is small so far. Revisit with i18next-http-backend if the DE/EN/FR
// files grow large enough that shipping all three upfront becomes a real
// payload cost - not a concern yet with ~one key each.
i18n
  .use(LanguageDetector) // picks the language from browser/localStorage before first render
  .use(initReactI18next)
  .init({
    resources: {
      de: { translation: de },
      en: { translation: en },
      fr: { translation: fr },
    },
    // German is the source language the product copy is written in first
    // (see almofrontenddesign/js/i18n.js), so it's the safest fallback if a
    // key is missing in EN/FR rather than showing nothing.
    fallbackLng: "de",
    supportedLngs: ["de", "en", "fr"],
    interpolation: { escapeValue: false }, // React already escapes output, i18next doesn't need to
  });

export default i18n;
