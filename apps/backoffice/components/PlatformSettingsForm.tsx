"use client";

import { useState, useTransition } from "react";

import { savePlatformSettingsAction } from "@/app/actions/ops";

interface Props {
  initial: {
    vat_rate: number;
    default_lead_time_days: number;
    rfq_expiry_days: number;
    auto_quote_admin_hold_threshold_sar: number;
    auto_quote_globally_enabled: boolean;
  };
}

export function PlatformSettingsForm({ initial }: Props) {
  const [vat, setVat] = useState(initial.vat_rate);
  const [leadDays, setLeadDays] = useState(initial.default_lead_time_days);
  const [rfqDays, setRfqDays] = useState(initial.rfq_expiry_days);
  const [threshold, setThreshold] = useState(initial.auto_quote_admin_hold_threshold_sar);
  const [autoOn, setAutoOn] = useState(initial.auto_quote_globally_enabled);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      action={() => {
        setMessage(null);
        startTransition(async () => {
          const res = await savePlatformSettingsAction({
            vat_rate: vat,
            default_lead_time_days: leadDays,
            rfq_expiry_days: rfqDays,
            auto_quote_admin_hold_threshold_sar: threshold,
            auto_quote_globally_enabled: autoOn,
          });
          setMessage(res.ok ? "Saved" : res.error ?? "Save failed");
        });
      }}
      className="space-y-6"
    >
      <fieldset>
        <legend className="text-sm font-semibold text-gray-900">Tax</legend>
        <NumberField
          label="VAT rate (0–1)"
          value={vat}
          step="0.01"
          onChange={setVat}
        />
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-gray-900">Operational defaults</legend>
        <NumberField
          label="Default lead time (days)"
          value={leadDays}
          onChange={(v) => setLeadDays(Math.round(v))}
        />
        <NumberField
          label="RFQ expiry (days)"
          value={rfqDays}
          onChange={(v) => setRfqDays(Math.round(v))}
        />
        <NumberField
          label="Auto-quote admin-hold threshold (SAR)"
          value={threshold}
          onChange={setThreshold}
          step="100"
        />
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold text-gray-900">Auto-quote master switch</legend>
        <label className="mt-2 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={autoOn}
            onChange={(e) => setAutoOn(e.target.checked)}
          />
          Enabled platform-wide
        </label>
      </fieldset>

      {message ? (
        <p className={`text-xs ${message === "Saved" ? "text-emerald-700" : "text-red-700"}`}>
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save All"}
      </button>
    </form>
  );
}

function NumberField({
  label,
  value,
  step = "1",
  onChange,
}: {
  label: string;
  value: number;
  step?: string;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type="number"
        value={value}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 block w-48 rounded-md border border-gray-300 px-3 py-2 text-sm"
      />
    </div>
  );
}
