import { FlatList, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";

import { data } from "@mwrd/shared";
import type { RFQ } from "@mwrd/shared";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import { StatusBadge } from "@/components/StatusBadge";

export default function RFQsScreen() {
  const { user } = useAuth();
  const { t, isRTL } = useT();

  const { data: rfqs = [], isLoading } = useQuery({
    queryKey: ["rfqs", user?.company_id],
    queryFn: () => data.listRFQsForClient(user!.company_id!),
    enabled: !!user?.company_id,
  });

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-white px-4 py-4 border-b border-gray-100">
        <Text
          className="text-xl font-bold text-gray-900"
          style={{ textAlign: isRTL ? "right" : "left" }}
        >
          {t("my_rfqs")}
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator className="mt-8" color="#1D4ED8" />
      ) : rfqs.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500">{t("no_rfqs")}</Text>
        </View>
      ) : (
        <FlatList
          data={[...rfqs].reverse()}
          keyExtractor={(item: RFQ) => item.id}
          contentContainerClassName="px-4 py-4 gap-3"
          renderItem={({ item }: { item: RFQ }) => (
            <TouchableOpacity
              onPress={() => router.push(`/(app)/rfqs/${item.id}`)}
              className="rounded-xl bg-white p-4"
              style={{ shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900" numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text className="mt-0.5 text-xs font-mono text-gray-400">
                    {item.rfq_number}
                  </Text>
                </View>
                <StatusBadge status={item.status} />
              </View>
              <View className="mt-3 flex-row justify-between">
                <Text className="text-xs text-gray-500">
                  {item.items.length} {item.items.length === 1 ? "item" : "items"}
                </Text>
                <Text className="text-xs text-gray-400">
                  {new Date(item.created_at).toLocaleDateString()}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}
