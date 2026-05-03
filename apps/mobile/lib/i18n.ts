import { createContext, useContext } from "react";
import { I18nManager } from "react-native";

import en, { type TranslationKey } from "@/locales/en";
import ar from "@/locales/ar";

export type Language = "en" | "ar";

const translations: Record<Language, typeof en> = { en, ar: ar as typeof en };

export function t(lang: Language, key: TranslationKey, ...args: never[]): string {
  const dict = translations[lang];
  const val = dict[key];
  if (typeof val === "function") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (val as (...a: any[]) => string)(...args);
  }
  return String(val);
}

export function applyRTL(lang: Language): void {
  const isRTL = lang === "ar";
  if (I18nManager.isRTL !== isRTL) {
    I18nManager.allowRTL(isRTL);
    I18nManager.forceRTL(isRTL);
  }
}

export interface I18nContextValue {
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: TranslationKey, ...args: never[]) => string;
  isRTL: boolean;
}

export const I18nContext = createContext<I18nContextValue>({
  lang: "en",
  setLang: () => undefined,
  t: (key) => key as string,
  isRTL: false,
});

export function useT(): I18nContextValue {
  return useContext(I18nContext);
}
