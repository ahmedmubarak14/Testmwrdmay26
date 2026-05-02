"use client";

import { useState, useTransition } from "react";

import {
  saveRateCardSettingsAction,
  type RateCardSettingsInput,
} from "@/app/actions/offers";

interface Props {
  initial: RateCardSettingsInput;
}

export function RateCardSettingsForm({ initial }: Props) {
  const [window, setWindow] = useState(initial.auto_quote_review_window);
  const [enabled, setEnabled] = useState(initial.auto_quote_globally_enabled);
  const [pad, setPad] = useState(initial.default_lead_time_pad_days);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        startTransition(async () => {
          const res = await saveRateCardSettingsAction({
            auto_quote_review_window: window,
            auto_quote_globally_enabled: enabled,
            default_lead_time_pad_days: pad,
          });
          setMessage(res.ok ? "Settings saved" : res.error ?? "Save failed");
        });
      }}
      className="space-y-6"
    >
      <fieldset>
        <legend className="text-sm font-medium text-gray-900">
          Auto-Quote Review Window
        </legend>
        <p className="text-xs text-gray-500">
          How long auto-drafted quotes wait before being sent for you.
        </p>
        <div className="mt-2 space-y-1.5 text-sm">
          {(["instant", "30min", "2hr"] as const).map((w) => (
            <label key={w} className="flex items-center gap-2">
              <input
                type="radio"
                name="window"
                value={w}
                checked={window === w}
                onChange={() => setWindow(w)}
              />
              {w === "instant"
                ? "Instant — auto-send to MWRD as soon as RFQ matches"
                : w === "30min"
                  ? "30 minutes — default; auto-send if no action"
                  : "2 hours — longer review window"}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium text-gray-900">
          Auto-Quote Globally Enabled
        </legend>
        <p className="text-xs text-gray-500">
          Master kill switch. Turn off to disable auto-quotes for all your offers
          without changing per-offer toggles.
        </p>
        <label className="mt-2 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          Enabled
        </label>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium text-gray-900">
          Default Lead Time Pad (days)
        </legend>
        <p className="text-xs text-gray-500">
          Automatically add this many days to all your offers&apos; lead times.
          Useful during high-demand periods.
        </p>
        <input
          type="number"
          min={0}
          value={pad}
          onChange={(e) => setPad(Number(e.target.value))}
          className="mt-2 w-32 rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </fieldset>

      {message ? (
        <p className={`text-xs ${message.includes("saved") ? "text-emerald-700" : "text-red-700"}`}>
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
