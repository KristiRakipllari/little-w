import { useCallback } from "react";
import i18n from "./i18n";
import { useAppStore } from "@/store/appStore";

export function useTranslation() {
  const locale = useAppStore((s) => s.locale);
  i18n.locale = locale;

  const t = useCallback(
    (key: string, options?: Record<string, any>) => i18n.t(key, options),
    [locale]
  );

  return { t, locale };
}
