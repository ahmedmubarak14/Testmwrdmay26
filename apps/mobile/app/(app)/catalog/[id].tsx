import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { data } from "@mwrd/shared";
import type { PackType } from "@mwrd/shared";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n";

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { t, lang, isRTL } = useT();
  const qc = useQueryClient();

  const [qty, setQty] = useState(1);
  const [selectedPack, setSelectedPack] = useState<PackType>("Each");
  const [added, setAdded] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => data.getMasterProduct(id),
    enabled: !!id,
  });

  const addMut = useMutation({
    mutationFn: () =>
      data.addToCart(user!.id, {
        master_product_id: id,
        qty,
        pack_type: selectedPack,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["cart", user?.id] });
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    },
  });

  if (isLoading || !product) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#1D4ED8" />
      </SafeAreaView>
    );
  }

  const name = lang === "ar" ? product.name_ar : product.name_en;
  const description = lang === "ar" ? (product.description_ar || product.description_en) : product.description_en;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="flex-1 text-lg font-semibold text-gray-900" numberOfLines={1}>
          {name}
        </Text>
      </View>

      <ScrollView contentContainerClassName="px-4 py-4">
        {/* Product code */}
        <Text className="mb-1 text-xs font-mono text-gray-400">{product.master_product_code}</Text>

        {/* Name */}
        <Text
          className="mb-3 text-xl font-bold text-gray-900"
          style={{ textAlign: isRTL ? "right" : "left" }}
        >
          {name}
        </Text>

        {/* Category badge */}
        <View className="mb-4 self-start rounded-full bg-blue-50 px-3 py-1">
          <Text className="text-xs text-blue-700">{t("category")}</Text>
        </View>

        {/* Description */}
        {description ? (
          <View className="mb-4 rounded-xl bg-gray-50 p-4">
            <Text
              className="text-sm leading-relaxed text-gray-700"
              style={{ textAlign: isRTL ? "right" : "left" }}
            >
              {description}
            </Text>
          </View>
        ) : null}

        {/* Specs */}
        {product.specs && Object.keys(product.specs).length > 0 ? (
          <View className="mb-4">
            <Text className="mb-2 text-sm font-semibold text-gray-700">{t("specs")}</Text>
            {Object.entries(product.specs).map(([k, v]) => (
              <View key={k} className="flex-row justify-between py-1.5 border-b border-gray-100">
                <Text className="text-sm text-gray-500 capitalize">{k.replace(/_/g, " ")}</Text>
                <Text className="text-sm font-medium text-gray-800">{String(v)}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Pack type selector */}
        {user?.role === "client" && (
          <>
            <Text className="mb-2 text-sm font-semibold text-gray-700">{t("pack_type")}</Text>
            <View className="mb-4 flex-row gap-2">
              {product.pack_types.map((pt) => (
                <TouchableOpacity
                  key={pt}
                  onPress={() => setSelectedPack(pt)}
                  className={`rounded-lg border px-4 py-2 ${
                    selectedPack === pt
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      selectedPack === pt ? "text-blue-700" : "text-gray-600"
                    }`}
                  >
                    {pt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Qty stepper */}
            <Text className="mb-2 text-sm font-semibold text-gray-700">{t("qty")}</Text>
            <View className="mb-6 flex-row items-center gap-4">
              <TouchableOpacity
                onPress={() => setQty((q) => Math.max(1, q - 1))}
                className="h-10 w-10 rounded-full border border-gray-300 items-center justify-center"
              >
                <Ionicons name="remove" size={18} color="#374151" />
              </TouchableOpacity>
              <Text className="text-lg font-semibold text-gray-900 w-8 text-center">{qty}</Text>
              <TouchableOpacity
                onPress={() => setQty((q) => q + 1)}
                className="h-10 w-10 rounded-full border border-gray-300 items-center justify-center"
              >
                <Ionicons name="add" size={18} color="#374151" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      {/* Add to basket CTA */}
      {user?.role === "client" && (
        <View className="border-t border-gray-100 px-4 py-4">
          <TouchableOpacity
            className={`rounded-xl py-4 items-center ${
              added ? "bg-emerald-600" : "bg-blue-600"
            }`}
            onPress={() => addMut.mutate()}
            disabled={addMut.isPending || added}
          >
            {addMut.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-base font-semibold text-white">
                {added ? t("added") : t("add_to_basket")}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
