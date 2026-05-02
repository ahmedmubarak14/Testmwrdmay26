"use client";

import { useState, useTransition } from "react";

import { submitPARAction } from "@/app/actions/offers";

interface SpecRow {
  id: string;
  key: string;
  value: string;
}

interface Props {
  categories: { id: string; name_en: string }[];
}

export function PARForm({ categories }: Props) {
  const [specs, setSpecs] = useState<SpecRow[]>([{ id: "1", key: "", value: "" }]);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      action={(fd) => {
        setError(null);
        const proposedSpecs: Record<string, string> = {};
        for (const s of specs) if (s.key) proposedSpecs[s.key] = s.value;
        startTransition(async () => {
          try {
            await submitPARAction({
              proposed_name_en: String(fd.get("name_en") ?? ""),
              proposed_name_ar: String(fd.get("name_ar") ?? ""),
              proposed_category_id: String(fd.get("category_id") ?? ""),
              proposed_description: String(fd.get("description") ?? ""),
              proposed_specs: proposedSpecs,
              reason_for_addition: String(fd.get("reason") ?? ""),
              estimated_demand: (fd.get("demand") as string) || null,
            });
          } catch (err) {
            setError(err instanceof Error ? err.message : "Submit failed");
          }
        });
      }}
      className="space-y-4"
    >
      <Field name="name_en" label="Proposed Product Name (English)" required />
      <Field name="name_ar" label="Proposed Product Name (Arabic)" required />

      <div>
        <label className="block text-sm font-medium text-gray-700">Category</label>
        <select
          name="category_id"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">— Select category —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name_en}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          name="description"
          rows={3}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">Specs</label>
          <button
            type="button"
            onClick={() =>
              setSpecs((prev) => [...prev, { id: String(prev.length + 1), key: "", value: "" }])
            }
            className="text-xs text-gray-700 underline-offset-2 hover:underline"
          >
            + Add row
          </button>
        </div>
        <div className="space-y-2">
          {specs.map((s, idx) => (
            <div key={s.id} className="grid grid-cols-2 gap-2">
              <input
                placeholder="Key"
                value={s.key}
                onChange={(e) =>
                  setSpecs((prev) => {
                    const c = [...prev];
                    c[idx] = { ...c[idx]!, key: e.target.value };
                    return c;
                  })
                }
                className="rounded-md border border-gray-300 px-2 py-1 text-sm"
              />
              <input
                placeholder="Value"
                value={s.value}
                onChange={(e) =>
                  setSpecs((prev) => {
                    const c = [...prev];
                    c[idx] = { ...c[idx]!, value: e.target.value };
                    return c;
                  })
                }
                className="rounded-md border border-gray-300 px-2 py-1 text-sm"
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Reason for addition
        </label>
        <textarea
          name="reason"
          rows={3}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <Field name="demand" label="Estimated demand (optional)" placeholder="e.g. 100 units/month" />

      {error ? (
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {pending ? "Submitting…" : "Submit Request"}
      </button>
    </form>
  );
}

function Field({
  name,
  label,
  placeholder,
  required,
}: {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        placeholder={placeholder}
        required={required}
        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
      />
    </div>
  );
}
