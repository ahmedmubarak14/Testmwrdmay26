import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { data } from "@mwrd/shared";
import { useT } from "@/lib/i18n";
import { StatusBadge } from "@/components/StatusBadge";

const SAR = (n: number) =>
  n.toLocaleString("en-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 2 });

const STATUS_STEPS: string[] = [
  "awaiting_approval",
  "confirmed",
  "in_progress",
  "delivered",
];

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, isRTL } = useT();

  const { data: po, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: () => data.getPO(id),
    enabled: !!id,
  });

  if (isLoading || !po) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#1D4ED8" />
      </SafeAreaView>
    );
  }

  const currentStep = STATUS_STEPS.indexOf(po.status);
  const vat = po.total_sar * 0.15;
  const grandTotal = po.total_sar + vat;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center bg-white px-4 py-3 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={24} color="#374151" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="font-semibold text-gray-900">{po.po_number}</Text>
          <Text className="text-xs text-gray-400">{po.type}</Text>
        </View>
        <StatusBadge status={po.status} />
      </View>

      <ScrollView contentContainerClassName="px-4 py-4 gap-4">
        {/* Status timeline */}
        {po.type === "CPO" && (
          <View className="rounded-xl bg-white p-4">
            <Text className="mb-3 font-semibold text-gray-800">{t("timeline")}</Text>
            {STATUS_STEPS.map((step, idx) => {
              const done = currentStep >= idx;
              const current = currentStep === idx;
              return (
                <View key={step} className="flex-row items-center gap-3 mb-2">
                  <View
                    className={`h-6 w-6 rounded-full items-center justify-center ${
                      done ? "bg-blue-600" : "bg-gray-100"
                    }`}
                  >
                    {done ? (
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    ) : (
                      <View className="h-2 w-2 rounded-full bg-gray-300" />
                    )}
                  </View>
                  <Text
                    className={`text-sm capitalize ${
                      current
                        ? "font-semibold text-blue-700"
                        : done
                        ? "text-gray-700"
                        : "text-gray-400"
                    }`}
                  >
                    {step.replace(/_/g, " ")}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Order meta */}
        <View className="rounded-xl bg-white p-4 gap-2">
          <Row label={t("po_number")} value={po.po_number} />
          <Row label="Created" value={new Date(po.created_at).toLocaleDateString()} />
          <Row label="Ref" value={po.transaction_ref} />
        </View>

        {/* Line items */}
        <View className="rounded-xl bg-white p-4">
          <Text className="mb-3 font-semibold text-gray-800">{t("items")}</Text>
          {po.items.map((item, i) => (
            <View key={item.id} className={`py-2 ${i > 0 ? "border-t border-gray-100" : ""}`}>
              <View className="flex-row justify-between">
                <Text className="flex-1 text-sm text-gray-700" numberOfLines={2}>
                  {item.master_product_id ?? item.description}
                </Text>
                <Text className="text-sm font-medium text-gray-900 ml-2">
                  {SAR(item.unit_price_sar)} × {item.qty}
                </Text>
              </View>
            </View>
          ))}

          <View className="mt-3 gap-1 border-t border-gray-100 pt-3">
            <View className="flex-row justify-between">
              <Text className="text-xs text-gray-500">{t("total")}</Text>
              <Text className="text-xs text-gray-700">{SAR(po.total_sar)}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-xs text-gray-500">{t("vat")}</Text>
              <Text className="text-xs text-gray-700">{SAR(vat)}</Text>
            </View>
            <View className="flex-row justify-between mt-1">
              <Text className="text-sm font-semibold text-gray-900">{t("grand_total")}</Text>
              <Text className="text-sm font-bold text-blue-700">{SAR(grandTotal)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between">
      <Text className="text-xs text-gray-500">{label}</Text>
      <Text className="text-xs font-medium text-gray-800">{value}</Text>
    </View>
  );
}
