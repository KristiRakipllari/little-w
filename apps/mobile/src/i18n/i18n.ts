import en from "./locales/en.json";
import sq from "./locales/sq.json";

type Translations = Record<string, any>;

const translations: Record<string, Translations> = { en, sq };

let currentLocale = "sq";

function getNestedValue(obj: any, path: string): string | undefined {
  const keys = path.split(".");
  let result = obj;
  for (const key of keys) {
    if (result == null || typeof result !== "object") return undefined;
    result = result[key];
  }
  return typeof result === "string" ? result : undefined;
}

function translate(key: string, options?: Record<string, any>): string {
  const dict = translations[currentLocale] || translations.sq;
  const fallback = translations.sq;

  let value = getNestedValue(dict, key) ?? getNestedValue(fallback, key) ?? key;

  if (options) {
    for (const [k, v] of Object.entries(options)) {
      value = value.replace(new RegExp(`{{${k}}}`, "g"), String(v));
    }
  }

  return value;
}

const i18n = {
  get locale() {
    return currentLocale;
  },
  set locale(loc: string) {
    currentLocale = loc;
  },
  t: translate,
};

export default i18n;
