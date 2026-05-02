"use client";

import { useState, useTransition } from "react";

import { loginAction } from "@/app/actions/auth";

export function LoginForm({ reasonNote }: { reasonNote?: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      action={(fd) => {
        setError(null);
        const email = String(fd.get("email") ?? "").trim();
        const password = String(fd.get("password") ?? "");
        startTransition(async () => {
          const res = await loginAction({ email, password });
          if (!res.ok) {
            setError(res.error ?? "Sign-in failed");
            return;
          }
          window.location.href = "/dashboard";
        });
      }}
      className="space-y-4"
    >
      {reasonNote ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          {reasonNote}
        </div>
      ) : null}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      {error ? (
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-gray-900 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>

      <p className="text-center text-xs text-gray-500">
        Forgot password? Contact your superadmin.
      </p>
    </form>
  );
}
