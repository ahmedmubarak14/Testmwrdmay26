"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { loginAction } from "../actions/login";
import type { AppRole } from "../utils/role-redirect";

const LoginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type LoginInput = z.infer<typeof LoginSchema>;

interface LoginFormProps {
  currentApp: AppRole;
}

export function LoginForm({ currentApp }: LoginFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
  });

  const [serverError, setServerError] = useState<string | null>(null);
  const [showForgot, setShowForgot] = useState(false);

  const onSubmit = async (values: LoginInput) => {
    setServerError(null);
    const res = await loginAction({ ...values, currentApp });
    if (!res.ok || !res.redirect) {
      setServerError(res.error ?? "Sign-in failed");
      return;
    }
    if (res.redirect.url) {
      // Cross-portal or same-portal redirect.
      window.location.href = res.redirect.url;
    }
  };

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900">Sign in to MWRD</h1>
      <p className="mt-1 text-sm text-gray-500">
        {currentApp === "client" ? "Client portal" : "Supplier portal"}
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register("email")}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          />
          {errors.email ? (
            <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register("password")}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          />
          {errors.password ? (
            <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => setShowForgot(true)}
          className="text-xs text-gray-500 underline-offset-2 hover:text-gray-900 hover:underline"
        >
          Forgot password?
        </button>

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
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>

        <p className="text-center text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <a href="/register" className="font-medium text-gray-900 underline">
            Register
          </a>
        </p>
      </form>

      {showForgot ? (
        <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700">
          To reset your password, email{" "}
          <a className="underline" href="mailto:support@mwrd.io">
            support@mwrd.io
          </a>
          .
        </div>
      ) : null}
    </div>
  );
}
