import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Link, router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { data } from "@mwrd/shared";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n";

const schema = z.object({
  activation_token: z.string().min(8),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
type FormValues = z.infer<typeof schema>;

export default function ActivateScreen() {
  const { signIn } = useAuth();
  const { t, isRTL } = useT();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async ({ activation_token, password }: FormValues) => {
    setServerError(null);
    try {
      const user = await data.activateAccount({ activation_token, password });
      const res = await signIn({ email: user.email, password });
      if (res.ok) {
        router.replace("/(app)/");
      } else {
        router.replace("/(auth)/login");
      }
    } catch (err) {
      setServerError(err instanceof Error ? err.message : t("save_failed"));
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerClassName="flex-grow justify-center px-6 py-12">
        <Text
          className="mb-8 text-2xl font-bold text-gray-900"
          style={{ textAlign: isRTL ? "right" : "left" }}
        >
          {t("activate_account")}
        </Text>

        <View className="mb-4">
          <Text
            className="mb-1 text-sm font-medium text-gray-700"
            style={{ textAlign: isRTL ? "right" : "left" }}
          >
            {t("activation_token")}
          </Text>
          <Controller
            control={control}
            name="activation_token"
            render={({ field }) => (
              <TextInput
                className="rounded-lg border border-gray-300 px-3 py-3 text-base font-mono"
                style={{ textAlign: isRTL ? "right" : "left" }}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="act_xxxxxxxx…"
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                value={field.value}
              />
            )}
          />
          {errors.activation_token ? (
            <Text className="mt-1 text-xs text-red-600">{errors.activation_token.message}</Text>
          ) : null}
        </View>

        <View className="mb-4">
          <Text
            className="mb-1 text-sm font-medium text-gray-700"
            style={{ textAlign: isRTL ? "right" : "left" }}
          >
            {t("password")}
          </Text>
          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <TextInput
                className="rounded-lg border border-gray-300 px-3 py-3 text-base"
                style={{ textAlign: isRTL ? "right" : "left" }}
                secureTextEntry
                placeholder="Choose a password (8+ chars)"
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                value={field.value}
              />
            )}
          />
          {errors.password ? (
            <Text className="mt-1 text-xs text-red-600">{errors.password.message}</Text>
          ) : null}
        </View>

        {serverError ? (
          <Text className="mb-3 text-sm text-red-600">{serverError}</Text>
        ) : null}

        <TouchableOpacity
          className="mt-2 rounded-xl bg-blue-600 py-4 items-center"
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-base font-semibold text-white">{t("activate_account")}</Text>
          )}
        </TouchableOpacity>

        <View className="mt-4 flex-row justify-center">
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text className="text-sm text-blue-600">{t("have_account")}</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
