"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  activateAction,
  verifyActivationTokenAction,
  type VerifyTokenResult,
} from "../actions/activate";

const PasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Z]/, "Include an uppercase letter")
      .regex(/[a-z]/, "Include a lowercase letter")
      .regex(/[0-9]/, "Include a number"),
    confirm: z.string(),
    terms: z.literal(true, {
      errorMap: () => ({ message: "Accept the terms to continue" }),
    }),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });
type PasswordInput = z.infer<typeof PasswordSchema>;

interface ActivateFormProps {
  token: string;
}

export function ActivateForm({ token }: ActivateFormProps) {
  const [tokenStatus, setTokenStatus] = useState<VerifyTokenResult | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PasswordInput>({
    resolver: zodResolver(PasswordSchema),
  });

  useEffect(() => {
    void verifyActivationTokenAction(token).then(setTokenStatus);
  }, [token]);

  const onSubmit = async (values: PasswordInput) => {
    setServerError(null);
    const res = await activateAction({ token, password: values.password });
    if (!res.ok) {
      setServerError(res.error ?? "Activation failed");
      return;
    }
    window.location.href = res.redirect_to ?? "/onboarding";
  };

  if (!tokenStatus) {
    return <p className="text-sm text-gray-500">Checking activation link…</p>;
  }
  if (!tokenStatus.ok) {
    return (
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Activation link issue</h1>
        <p className="mt-2 text-sm text-red-700">{tokenStatus.error}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900">Set your password</h1>
      <p className="mt-1 text-sm text-gray-500">Welcome, {tokenStatus.real_name}.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            New password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            {...register("password")}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          />
          {errors.password ? (
            <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="confirm" className="block text-sm font-medium text-gray-700">
            Confirm password
          </label>
          <input
            id="confirm"
            type="password"
            autoComplete="new-password"
            {...register("confirm")}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          />
          {errors.confirm ? (
            <p className="mt-1 text-xs text-red-600">{errors.confirm.message}</p>
          ) : null}
        </div>

        <label className="flex items-start gap-2 text-xs text-gray-700">
          <input type="checkbox" {...register("terms")} className="mt-0.5" />
          <span>
            I accept the MWRD terms of service and privacy policy.
          </span>
        </label>
        {errors.terms ? (
          <p className="text-xs text-red-600">{errors.terms.message}</p>
        ) : null}

        {serverError ? (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"
          >
            {serverError}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-gray-900 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {isSubmitting ? "Activating…" : "Activate account"}
        </button>
      </form>
    </div>
  );
}
