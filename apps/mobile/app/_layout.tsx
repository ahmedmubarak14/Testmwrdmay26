import "../global.css";

import { useCallback, useEffect, useState } from "react";
import { I18nManager } from "react-native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Localization from "expo-localization";
import { QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "@/lib/auth";
import { queryClient } from "@/lib/query";
import { I18nContext, applyRTL, t, type Language } from "@/lib/i18n";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [langReady, setLangReady] = useState(false);
  const [lang, setLangState] = useState<Language>("en");

  useEffect(() => {
    const deviceLocales = Localization.getLocales();
    const deviceLang = deviceLocales[0]?.languageCode;
    const initial: Language = deviceLang === "ar" ? "ar" : "en";
    applyRTL(initial);
    setLangState(initial);
    setLangReady(true);
    void SplashScreen.hideAsync();
  }, []);

  const setLang = useCallback((l: Language) => {
    applyRTL(l);
    setLangState(l);
  }, []);

  if (!langReady) return null;

  return (
    <I18nContext.Provider
      value={{
        lang,
        setLang,
        t: (key, ...args) => t(lang, key, ...args),
        isRTL: lang === "ar",
      }}
    >
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <AuthProvider>
            <Stack screenOptions={{ headerShown: false }} />
          </AuthProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </I18nContext.Provider>
  );
}
