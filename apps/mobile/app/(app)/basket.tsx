import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { data } from "@mwrd/shared";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n";

export default function BasketScreen() {
  const { user } = useAuth();
  const { t, lang, isRTL } = useT();
  const qc = useQueryClient();

  const [deliveryCity, setDeliveryCity] = useState("Riyadh");
  const [deliveryDate, setDeliveryDate] = useState(
    new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 10),
  );
  const [rfqTitle, setRfqTitle] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { data: cart, isLoading } = useQuery({
    queryKey: ["cart", user?.id],
    queryFn: () => data.getActiveCart(user!.id),
    enabled: !!user,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["productsAll"],
    queryFn: () => data.listMasterProducts({ page: 1, page_size: 25 }).then((r) => r.items),
  });

  const removeMut = useMutation({
    mutationFn: (itemId: string) => data.removeFromCart(itemId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart", user?.id] }),
  });

  const submitMut = useMutation({
    mutationFn: () => {
      if (!cart || !user) throw new Error("No cart or user");
      return data.submitCartAsRFQ({
        user_id: user.id,
        title: rfqTitle || "Mobile RFQ",
        description: rfqTitle || "Submitted from MWRD mobile app",
        delivery_city: deliveryCity,
        delivery_date: deliveryDate,
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["cart", user?.id] });
      void qc.invalidateQueries({ queryKey: ["rfqs"] });
      setSubmitted(true);
    },
  });

  if (submitted) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white px-6">
        <View className="mb-4 h-16 w-16 rounded-full bg-emerald-100 items-center justify-center">
          <Ionicons name="checkmark-circle" size={36} color="#059669" />
        </View>
        <Text className="mb-2 text-xl font-bold text-gray-900">{t("rfq_submitted")}</Text>
        <Text className="mb-8 text-center text-sm text-gray-500">{t("rfq_submitted_desc")}</Text>
        <TouchableOpacity
          className="rounded-xl bg-blue-600 px-8 py-3"
          onPress={() => {
            setSubmitted(false);
            router.push("/(app)/rfqs/index");
          }}
        >
          <Text className="font-semibold text-white">{t("my_rfqs")}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const items = cart?.items ?? [];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-white px-4 py-4 border-b border-gray-100">
        <Text
          className="text-xl font-bold text-gray-900"
          style={{ textAlign: isRTL ? "right" : "left" }}
        >
          {t("your_basket")}
        </Text>
        {items.length > 0 && (
          <Text className="text-sm text-gray-500">
            {t("items_count", items.length as never)}
          </Text>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator className="mt-8" color="#1D4ED8" />
      ) : items.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="cart-outline" size={56} color="#D1D5DB" />
          <Text className="mt-4 text-base text-gray-500">{t("basket_empty")}</Text>
          <TouchableOpacity
            className="mt-4 rounded-xl bg-blue-600 px-6 py-2.5"
            onPress={() => router.push("/(app)/")}
          >
            <Text className="font-semibold text-white">{t("browse_catalog")}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerClassName="px-4 py-4 gap-3">
          {items.map((item) => {
            const product = products.find((p) => p.id === item.master_product_id);
            const name = product
              ? lang === "ar"
                ? product.name_ar
                : product.name_en
              : item.master_product_id;
            return (
              <View
                key={item.id}
                className="rounded-xl bg-white p-4 flex-row items-center gap-3"
                style={{ shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}
              >
                <View className="flex-1">
                  <Text className="font-medium text-gray-900" numberOfLines={2}>
                    {name}
                  </Text>
                  <Text className="mt-0.5 text-xs text-gray-500">
                    {item.pack_type} × {item.qty}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => removeMut.mutate(item.id)}
                  disabled={removeMut.isPending}
                >
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            );
          })}

          {/* Delivery details */}
          <View className="rounded-xl bg-white p-4 gap-3 mt-2">
            <Text className="font-semibold text-gray-800">{t("delivery")}</Text>

            <View>
              <Text className="mb-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
                {t("delivery_city")}
              </Text>
              <TextInput
                className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm"
                style={{ textAlign: isRTL ? "right" : "left" }}
                value={deliveryCity}
                onChangeText={setDeliveryCity}
              />
            </View>

            <View>
              <Text className="mb-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
                {t("delivery_date")} (YYYY-MM-DD)
              </Text>
              <TextInput
                className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm"
                style={{ textAlign: isRTL ? "right" : "left" }}
                value={deliveryDate}
                onChangeText={setDeliveryDate}
                placeholder="2026-06-01"
              />
            </View>

            <View>
              <Text className="mb-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
                {t("rfq_title")} (optional)
              </Text>
              <TextInput
                className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm"
                style={{ textAlign: isRTL ? "right" : "left" }}
                value={rfqTitle}
                onChangeText={setRfqTitle}
                placeholder="Office supplies Q2"
              />
            </View>
          </View>

          {submitMut.isError && (
            <Text className="text-sm text-red-600">
              {submitMut.error instanceof Error
                ? submitMut.error.message
                : t("save_failed")}
            </Text>
          )}

          <TouchableOpacity
            className="mt-2 rounded-xl bg-blue-600 py-4 items-center"
            onPress={() => submitMut.mutate()}
            disabled={submitMut.isPending}
          >
            {submitMut.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-base font-semibold text-white">{t("submit_rfq")}</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
