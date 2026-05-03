import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";

import { data } from "@mwrd/shared";
import type { PO } from "@mwrd/shared";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import { StatusBadge } from "@/components/StatusBadge";

export default function OrdersScreen() {
  const { user } = useAuth();
  const { t, isRTL } = useT();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders", user?.id],
    queryFn: () => data.listPOsForUser({ user_id: user!.id }),
    enabled: !!user,
  });

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-white px-4 py-4 border-b border-gray-100">
        <Text
          className="text-xl font-bold text-gray-900"
          style={{ textAlign: isRTL ? "right" : "left" }}
        >
          {t("my_orders")}
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator className="mt-8" color="#1D4ED8" />
      ) : orders.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500">{t("no_orders")}</Text>
        </View>
      ) : (
        <FlatList
          data={[...orders].reverse()}
          keyExtractor={(item: PO) => item.id}
          contentContainerClassName="px-4 py-4 gap-3"
          renderItem={({ item }: { item: PO }) => (
            <TouchableOpacity
              onPress={() => router.push(`/(app)/orders/${item.id}`)}
              className="rounded-xl bg-white p-4"
              style={{ shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900" numberOfLines={1}>
                    {item.po_number}
                  </Text>
                  <Text className="mt-0.5 text-xs text-gray-400">{item.type}</Text>
                </View>
                <StatusBadge status={item.status} />
              </View>
              <View className="mt-3 flex-row justify-between">
                <Text className="text-xs text-gray-500">
                  {item.items.length} {item.items.length === 1 ? "line" : "lines"}
                </Text>
                <Text className="text-xs font-medium text-blue-700">
                  {item.total_sar.toLocaleString("en-SA", {
                    style: "currency",
                    currency: "SAR",
                    maximumFractionDigits: 0,
                  })}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}
