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

import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
type FormValues = z.infer<typeof schema>;

export default function LoginScreen() {
  const { signIn } = useAuth();
  const { t, isRTL } = useT();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    const res = await signIn(values);
    if (res.ok) {
      router.replace("/(app)/");
    } else {
      setServerError(res.error ?? t("save_failed"));
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerClassName="flex-grow justify-center px-6 py-12">
        <Text
          className="mb-2 text-3xl font-bold text-blue-700"
          style={{ textAlign: isRTL ? "right" : "left" }}
        >
          MWRD
        </Text>
        <Text
          className="mb-8 text-base text-gray-500"
          style={{ textAlign: isRTL ? "right" : "left" }}
        >
          {t("sign_in")}
        </Text>

        <Field label={t("email")} isRTL={isRTL} error={errors.email?.message}>
          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <TextInput
                className="rounded-lg border border-gray-300 px-3 py-3 text-base"
                style={{ textAlign: isRTL ? "right" : "left" }}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="you@company.sa"
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                value={field.value}
              />
            )}
          />
        </Field>

        <Field label={t("password")} isRTL={isRTL} error={errors.password?.message}>
          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <TextInput
                className="rounded-lg border border-gray-300 px-3 py-3 text-base"
                style={{ textAlign: isRTL ? "right" : "left" }}
                secureTextEntry
                placeholder="••••••••"
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                value={field.value}
              />
            )}
          />
        </Field>

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
            <Text className="text-base font-semibold text-white">{t("sign_in")}</Text>
          )}
        </TouchableOpacity>

        <View className="mt-6 flex-row justify-center gap-4">
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity>
              <Text className="text-sm text-blue-600">{t("no_account")}</Text>
            </TouchableOpacity>
          </Link>
        </View>
        <View className="mt-2 flex-row justify-center">
          <Link href="/(auth)/activate" asChild>
            <TouchableOpacity>
              <Text className="text-sm text-blue-600">{t("activate_link")}</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  isRTL,
  error,
  children,
}: {
  label: string;
  isRTL: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mb-4">
      <Text
        className="mb-1 text-sm font-medium text-gray-700"
        style={{ textAlign: isRTL ? "right" : "left" }}
      >
        {label}
      </Text>
      {children}
      {error ? (
        <Text
          className="mt-1 text-xs text-red-600"
          style={{ textAlign: isRTL ? "right" : "left" }}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}
