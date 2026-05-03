import {
  ActivityIndicator,
  Alert,
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
import type { Quote } from "@mwrd/shared";
import { useAuth } from "@/lib/auth";
import { useT, type I18nContextValue } from "@/lib/i18n";
import { StatusBadge } from "@/components/StatusBadge";

const SAR = (n: number) =>
  n.toLocaleString("en-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 2 });

export default function RFQDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { t, isRTL } = useT();
  const qc = useQueryClient();

  const { data: rfq, isLoading: loadingRfq } = useQuery({
    queryKey: ["rfq", id],
    queryFn: () => data.getRFQ(id),
    enabled: !!id,
  });

  const { data: quotes = [], isLoading: loadingQuotes } = useQuery({
    queryKey: ["quotes", id],
    queryFn: () => data.listQuotesForRFQ(id),
    enabled: !!id,
  });

  const acceptMut = useMutation({
    mutationFn: (quoteId: string) =>
      data.acceptQuoteFullBasket(user!.id, quoteId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["rfq", id] });
      void qc.invalidateQueries({ queryKey: ["quotes", id] });
      void qc.invalidateQueries({ queryKey: ["orders"] });
      Alert.alert(t("quote_accepted"), "");
    },
  });

  const clientQuotes = quotes.filter(
    (q: Quote) => q.status === "submitted_to_client",
  );

  if (loadingRfq || !rfq) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#1D4ED8" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center bg-white px-4 py-3 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={24} color="#374151" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="font-semibold text-gray-900" numberOfLines={1}>
            {rfq.title}
          </Text>
          <Text className="text-xs font-mono text-gray-400">{rfq.rfq_number}</Text>
        </View>
        <StatusBadge status={rfq.status} />
      </View>

      <ScrollView contentContainerClassName="px-4 py-4 gap-4">
        {/* RFQ meta */}
        <View className="rounded-xl bg-white p-4 gap-2">
          <Row label={t("delivery")} value={`${rfq.delivery_city} · ${rfq.delivery_date}`} />
          <Row label={t("submitted")} value={new Date(rfq.created_at).toLocaleDateString()} />
          <Row label={t("expires")} value={new Date(rfq.expires_at).toLocaleDateString()} />
        </View>

        {/* RFQ items */}
        <View className="rounded-xl bg-white p-4">
          <Text className="mb-3 font-semibold text-gray-800">{t("items")}</Text>
          {rfq.items.map((item, i) => (
            <View key={item.id} className={`py-2 ${i > 0 ? "border-t border-gray-100" : ""}`}>
              <Text className="text-sm font-medium text-gray-900">
                {item.free_text_name ?? item.master_product_id ?? "Item"}
              </Text>
              <Text className="text-xs text-gray-500">
                {item.qty} {item.unit} {item.pack_type ? `· ${item.pack_type}` : ""}
              </Text>
            </View>
          ))}
        </View>

        {/* Quotes */}
        <Text className="text-base font-bold text-gray-900">{t("quotes")}</Text>

        {loadingQuotes ? (
          <ActivityIndicator color="#1D4ED8" />
        ) : clientQuotes.length === 0 ? (
          <View className="rounded-xl bg-white p-6 items-center">
            <Text className="text-sm text-gray-500">{t("no_quotes")}</Text>
          </View>
        ) : (
          clientQuotes.map((quote) => <QuoteCard
            key={quote.id}
            quote={quote}
            onAccept={() => acceptMut.mutate(quote.id)}
            accepting={acceptMut.isPending}
            t={t}
          />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function QuoteCard({
  quote,
  onAccept,
  accepting,
  t,
}: {
  quote: Quote;
  onAccept: () => void;
  accepting: boolean;
  t: I18nContextValue["t"];
}) {
  const subtotal = quote.items.reduce(
    (sum, i) => sum + i.final_unit_price_sar * i.qty_available,
    0,
  );
  const vat = subtotal * 0.15;
  const total = subtotal + vat;

  return (
    <View
      className="rounded-xl bg-white p-4"
      style={{ shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}
    >
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-xs font-mono text-gray-400">{quote.quote_number}</Text>
        <StatusBadge status={quote.status} />
      </View>

      {quote.items.map((item) => (
        <View key={item.id} className="flex-row justify-between py-1.5 border-b border-gray-100">
          <Text className="flex-1 text-sm text-gray-700" numberOfLines={1}>
            {"Item " + (quote.items.indexOf(item) + 1)}
          </Text>
          <Text className="text-sm font-medium text-gray-900">
            {SAR(item.final_unit_price_sar)} × {item.qty_available}
          </Text>
        </View>
      ))}

      <View className="mt-3 gap-1">
        <View className="flex-row justify-between">
          <Text className="text-xs text-gray-500">{t("total")}</Text>
          <Text className="text-xs text-gray-700">{SAR(subtotal)}</Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-xs text-gray-500">{t("vat")}</Text>
          <Text className="text-xs text-gray-700">{SAR(vat)}</Text>
        </View>
        <View className="flex-row justify-between border-t border-gray-100 pt-2 mt-1">
          <Text className="text-sm font-semibold text-gray-900">{t("grand_total")}</Text>
          <Text className="text-sm font-bold text-blue-700">{SAR(total)}</Text>
        </View>
      </View>

      <TouchableOpacity
        className="mt-4 rounded-xl bg-emerald-600 py-3 items-center"
        onPress={onAccept}
        disabled={accepting}
      >
        {accepting ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text className="text-sm font-semibold text-white">{t("accept_quote")}</Text>
        )}
      </TouchableOpacity>
    </View>
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
