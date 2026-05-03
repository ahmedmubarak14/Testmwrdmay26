import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import Constants from "expo-constants";

export default function AccountScreen() {
  const { user, signOut } = useAuth();
  const { t, lang, setLang, isRTL } = useT();

  const handleSignOut = async () => {
    await signOut();
    router.replace("/(auth)/login");
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView contentContainerClassName="px-4 py-6 gap-4">
        {/* Profile card */}
        <View className="rounded-xl bg-white p-5 items-center gap-1">
          <View className="h-16 w-16 rounded-full bg-blue-100 items-center justify-center mb-2">
            <Text className="text-2xl font-bold text-blue-700">
              {user?.real_name?.charAt(0)?.toUpperCase() ?? "?"}
            </Text>
          </View>
          <Text className="text-lg font-bold text-gray-900">{user?.real_name}</Text>
          <Text className="text-sm text-gray-500">{user?.email}</Text>
          <Text className="text-xs text-gray-400">{user?.phone}</Text>
        </View>

        {/* Details */}
        <View className="rounded-xl bg-white p-4 gap-3">
          <InfoRow label={t("role_label")} value={user?.role ?? ""} isRTL={isRTL} />
          <InfoRow label={t("status")} value={user?.status ?? ""} isRTL={isRTL} />
        </View>

        {/* Language */}
        <View className="rounded-xl bg-white p-4">
          <Text
            className="mb-3 text-sm font-semibold text-gray-700"
            style={{ textAlign: isRTL ? "right" : "left" }}
          >
            {t("language")}
          </Text>
          <View className="flex-row gap-3">
            {(["en", "ar"] as const).map((l) => (
              <TouchableOpacity
                key={l}
                onPress={() => setLang(l)}
                className={`flex-1 rounded-lg border py-3 items-center ${
                  lang === l ? "border-blue-600 bg-blue-50" : "border-gray-200 bg-white"
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    lang === l ? "text-blue-700" : "text-gray-600"
                  }`}
                >
                  {l === "en" ? t("english") : t("arabic")}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* App version */}
        <View className="rounded-xl bg-white p-4">
          <InfoRow
            label={t("version")}
            value={Constants.expoConfig?.version ?? "1.0.0"}
            isRTL={isRTL}
          />
        </View>

        {/* Sign out */}
        <TouchableOpacity
          className="rounded-xl border border-red-200 bg-red-50 py-4 items-center"
          onPress={handleSignOut}
        >
          <Text className="text-base font-semibold text-red-600">{t("sign_out")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  label,
  value,
  isRTL,
}: {
  label: string;
  value: string;
  isRTL: boolean;
}) {
  return (
    <View className="flex-row justify-between items-center">
      <Text className="text-sm text-gray-500" style={{ textAlign: isRTL ? "right" : "left" }}>
        {label}
      </Text>
      <Text className="text-sm font-medium text-gray-800 capitalize">
        {value.replace(/_/g, " ")}
      </Text>
    </View>
  );
}
