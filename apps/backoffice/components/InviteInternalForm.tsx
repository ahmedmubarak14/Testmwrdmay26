"use client";

import { useState, useTransition } from "react";

import { inviteInternalAction } from "@/app/actions/auth";

export function InviteInternalForm() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        + Invite Internal User
      </button>
    );
  }

  return (
    <form
      action={(fd) => {
        setMessage(null);
        startTransition(async () => {
          const res = await inviteInternalAction({
            email: String(fd.get("email") ?? ""),
            real_name: String(fd.get("real_name") ?? ""),
            phone: String(fd.get("phone") ?? "+966500000000"),
            role: (fd.get("role") as "admin" | "ops" | "finance" | "cs") ?? "ops",
          });
          if (!res.ok) {
            setMessage(res.error ?? "Invite failed");
            return;
          }
          setMessage("Invitation sent. Check the dev console for the activation link.");
          setOpen(false);
        });
      }}
      className="space-y-2 rounded-md border border-gray-200 bg-gray-50 p-3"
    >
      <div className="grid grid-cols-2 gap-2">
        <input
          name="real_name"
          required
          placeholder="Full name"
          className="rounded-md border border-gray-300 px-2 py-1 text-sm"
        />
        <input
          name="email"
          type="email"
          required
          placeholder="Email"
          className="rounded-md border border-gray-300 px-2 py-1 text-sm"
        />
        <input
          name="phone"
          required
          placeholder="+9665xxxxxxxx"
          className="rounded-md border border-gray-300 px-2 py-1 text-sm"
        />
        <select
          name="role"
          className="rounded-md border border-gray-300 px-2 py-1 text-sm"
          defaultValue="ops"
        >
          <option value="admin">admin</option>
          <option value="ops">ops</option>
          <option value="finance">finance</option>
          <option value="cs">cs</option>
        </select>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? "Inviting…" : "Send invite"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs"
        >
          Cancel
        </button>
      </div>
      {message ? (
        <p className={`text-[11px] ${message.includes("sent") ? "text-emerald-700" : "text-red-700"}`}>
          {message}
        </p>
      ) : null}
    </form>
  );
}
