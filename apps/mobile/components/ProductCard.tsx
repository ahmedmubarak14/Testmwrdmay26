import { Text, TouchableOpacity, View } from "react-native";

import type { MasterProduct } from "@mwrd/shared";
import type { Language } from "@/lib/i18n";

interface Props {
  product: MasterProduct;
  lang: Language;
  onPress: () => void;
}

export function ProductCard({ product, lang, onPress }: Props) {
  const name = lang === "ar" ? product.name_ar : product.name_en;

  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-1 rounded-xl bg-white p-3"
      style={{ shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}
    >
      {/* Placeholder image area */}
      <View className="mb-2 h-24 w-full rounded-lg bg-gray-100 items-center justify-center">
        <Text className="text-3xl">📦</Text>
      </View>

      {/* Product code */}
      <Text className="text-[10px] font-mono text-gray-400 mb-0.5">
        {product.master_product_code}
      </Text>

      {/* Name */}
      <Text className="text-sm font-semibold text-gray-900" numberOfLines={2}>
        {name}
      </Text>

      {/* Pack types */}
      <View className="mt-1.5 flex-row flex-wrap gap-1">
        {product.pack_types.map((pt) => (
          <View key={pt} className="rounded-full bg-gray-100 px-2 py-0.5">
            <Text className="text-[10px] text-gray-500">{pt}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}
