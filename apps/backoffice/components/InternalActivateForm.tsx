"use client";

import { useState, useTransition } from "react";

import { activateInternalAction } from "@/app/actions/auth";

export function InternalActivateForm({ token }: { token: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      action={(fd) => {
        setError(null);
        const password = String(fd.get("password") ?? "");
        const confirm = String(fd.get("confirm") ?? "");
        if (password.length < 8) {
          setError("Password must be at least 8 characters.");
          return;
        }
        if (password !== confirm) {
          setError("Passwords do not match.");
          return;
        }
        startTransition(async () => {
          const res = await activateInternalAction({ activation_token: token, password });
          if (!res.ok) {
            setError(res.error ?? "Activation failed");
            return;
          }
          window.location.href = res.redirect_to ?? "/dashboard";
        });
      }}
      className="space-y-4"
    >
      <div>
        <label className="block text-sm font-medium text-gray-700">New password</label>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Confirm password</label>
        <input
          name="confirm"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
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
        {pending ? "Activating…" : "Activate account"}
      </button>
    </form>
  );
}
