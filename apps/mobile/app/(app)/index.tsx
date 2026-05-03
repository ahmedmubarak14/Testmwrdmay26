import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";

import { data } from "@mwrd/shared";
import type { Category } from "@mwrd/shared";
import { useT } from "@/lib/i18n";
import { ProductCard } from "@/components/ProductCard";

export default function CatalogScreen() {
  const { t, lang, isRTL } = useT();
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => data.listCategories(),
  });

  const topLevel = categories.filter((c: Category) => c.parent_id === null);

  const { data: productsResult, isLoading } = useQuery({
    queryKey: ["products", selectedCat, search, page],
    queryFn: () =>
      data.listMasterProducts({
        category_id: selectedCat,
        search: search || undefined,
        page,
        page_size: 25,
      }),
    placeholderData: (prev) => prev,
  });

  const products = productsResult?.items ?? [];
  const total = productsResult?.total ?? 0;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Search bar */}
      <View className="bg-white px-4 pb-3 pt-4">
        <TextInput
          className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm"
          style={{ textAlign: isRTL ? "right" : "left" }}
          placeholder={t("search_products")}
          value={search}
          onChangeText={(v) => {
            setSearch(v);
            setPage(1);
          }}
          returnKeyType="search"
        />
      </View>

      {/* Category chips */}
      <FlatList
        data={[
          { id: "", name_en: t("all_categories"), name_ar: t("all_categories"), sort_order: 0, parent_id: null, icon_url: "", slug: "all" } as Category,
          ...topLevel,
        ]}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="px-4 py-2 gap-2"
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => {
              setSelectedCat(item.id || undefined);
              setPage(1);
            }}
            className={`rounded-full px-4 py-1.5 ${
              (item.id === "" ? !selectedCat : selectedCat === item.id)
                ? "bg-blue-600"
                : "bg-white border border-gray-200"
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                (item.id === "" ? !selectedCat : selectedCat === item.id)
                  ? "text-white"
                  : "text-gray-700"
              }`}
            >
              {lang === "ar" ? item.name_ar : item.name_en}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Product grid */}
      {isLoading ? (
        <ActivityIndicator className="mt-8" color="#1D4ED8" />
      ) : products.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500">{t("no_products")}</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-3 pb-4"
          columnWrapperClassName="gap-3"
          ItemSeparatorComponent={() => <View className="h-3" />}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              lang={lang}
              onPress={() => router.push(`/(app)/catalog/${item.id}`)}
            />
          )}
          ListFooterComponent={
            total > page * 25 ? (
              <TouchableOpacity
                className="mt-4 rounded-xl border border-gray-300 py-3 items-center"
                onPress={() => setPage((p) => p + 1)}
              >
                <Text className="text-sm text-gray-700">Load more</Text>
              </TouchableOpacity>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
