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
import { useT } from "@/lib/i18n";

const schema = z.object({
  real_name: z.string().min(2),
  company_real_name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().regex(/^\+9665\d{8}$/, "Enter a valid phone (+9665xxxxxxxx)"),
  role: z.enum(["client", "supplier"]),
});
type FormValues = z.infer<typeof schema>;

export default function RegisterScreen() {
  const { t, isRTL } = useT();
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: "client" },
  });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      await data.registerPublic(values);
      setDone(true);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : t("save_failed"));
    }
  };

  if (done) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="mb-3 text-2xl font-bold text-gray-900">{t("registration_pending")}</Text>
        <Text className="mb-8 text-center text-base text-gray-500">
          {t("registration_pending_desc")}
        </Text>
        <TouchableOpacity
          className="rounded-xl bg-blue-600 px-8 py-3"
          onPress={() => router.replace("/(auth)/login")}
        >
          <Text className="font-semibold text-white">{t("sign_in")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerClassName="flex-grow px-6 py-12">
        <Text
          className="mb-8 text-2xl font-bold text-gray-900"
          style={{ textAlign: isRTL ? "right" : "left" }}
        >
          {t("register")}
        </Text>

        <Field label={t("full_name")} isRTL={isRTL} error={errors.real_name?.message}>
          <Controller
            control={control}
            name="real_name"
            render={({ field }) => (
              <TextInput
                className="rounded-lg border border-gray-300 px-3 py-3 text-base"
                style={{ textAlign: isRTL ? "right" : "left" }}
                placeholder="Ahmed Al-Rashid"
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                value={field.value}
              />
            )}
          />
        </Field>

        <Field label={t("company_name")} isRTL={isRTL} error={errors.company_real_name?.message}>
          <Controller
            control={control}
            name="company_real_name"
            render={({ field }) => (
              <TextInput
                className="rounded-lg border border-gray-300 px-3 py-3 text-base"
                style={{ textAlign: isRTL ? "right" : "left" }}
                placeholder="Acme Trading Co."
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                value={field.value}
              />
            )}
          />
        </Field>

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

        <Field label={t("phone")} isRTL={isRTL} error={errors.phone?.message}>
          <Controller
            control={control}
            name="phone"
            render={({ field }) => (
              <TextInput
                className="rounded-lg border border-gray-300 px-3 py-3 text-base"
                style={{ textAlign: isRTL ? "right" : "left" }}
                keyboardType="phone-pad"
                placeholder="+966500000000"
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                value={field.value}
              />
            )}
          />
        </Field>

        <View className="mb-4">
          <Text
            className="mb-2 text-sm font-medium text-gray-700"
            style={{ textAlign: isRTL ? "right" : "left" }}
          >
            {t("role")}
          </Text>
          <Controller
            control={control}
            name="role"
            render={({ field }) => (
              <View className="flex-row gap-3">
                {(["client", "supplier"] as const).map((r) => (
                  <TouchableOpacity
                    key={r}
                    onPress={() => field.onChange(r)}
                    className={`flex-1 rounded-lg border py-3 items-center ${
                      field.value === r
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        field.value === r ? "text-blue-700" : "text-gray-600"
                      }`}
                    >
                      {r === "client" ? t("role_client") : t("role_supplier")}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          />
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
            <Text className="text-base font-semibold text-white">{t("register")}</Text>
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
        <Text className="mt-1 text-xs text-red-600" style={{ textAlign: isRTL ? "right" : "left" }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
