"use client";

import { useState, useTransition } from "react";

import type { PackType } from "@mwrd/shared";

import { createMasterProductAction } from "@/app/actions/ops";

const PACK_OPTIONS: PackType[] = ["Each", "Box", "Carton"];

interface SpecRow {
  id: string;
  key: string;
  value: string;
}

interface Props {
  categories: { id: string; name_en: string; name_ar: string }[];
}

export function MasterProductForm({ categories }: Props) {
  const [packs, setPacks] = useState<PackType[]>(["Each"]);
  const [specs, setSpecs] = useState<SpecRow[]>([{ id: "1", key: "", value: "" }]);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const togglePack = (pt: PackType) =>
    setPacks((prev) =>
      prev.includes(pt) ? prev.filter((x) => x !== pt) : [...prev, pt],
    );

  return (
    <form
      action={(fd) => {
        setError(null);
        if (packs.length === 0) {
          setError("Select at least one pack type.");
          return;
        }
        const proposedSpecs: Record<string, string> = {};
        for (const s of specs) if (s.key) proposedSpecs[s.key] = s.value;
        startTransition(async () => {
          const res = await createMasterProductAction({
            name_en: String(fd.get("name_en") ?? ""),
            name_ar: String(fd.get("name_ar") ?? ""),
            description_en: String(fd.get("description_en") ?? ""),
            description_ar: String(fd.get("description_ar") ?? ""),
            category_id: String(fd.get("category_id") ?? ""),
            specs: proposedSpecs,
            pack_types: packs,
            default_unit: String(fd.get("default_unit") ?? "piece"),
          });
          if (!res.ok) {
            setError(res.error ?? "Save failed");
            return;
          }
          window.location.href = "/master-catalog";
        });
      }}
      className="space-y-6"
    >
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-gray-900">Basics</legend>
        <Field name="name_en" label="Name (English)" required />
        <Field name="name_ar" label="Name (Arabic)" required />
        <Field name="description_en" label="Description (English)" />
        <Field name="description_ar" label="Description (Arabic)" />
        <div>
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <select
            name="category_id"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">— Select —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name_en}
              </option>
            ))}
          </select>
        </div>
      </fieldset>

      <fieldset>
        <div className="mb-2 flex items-center justify-between">
          <legend className="text-sm font-semibold text-gray-900">Specs</legend>
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
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold text-gray-900">Pack types</legend>
        <div className="mt-2 flex gap-2 text-sm">
          {PACK_OPTIONS.map((p) => (
            <label
              key={p}
              className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 ${
                packs.includes(p) ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300"
              }`}
            >
              <input
                type="checkbox"
                checked={packs.includes(p)}
                onChange={() => togglePack(p)}
                className="hidden"
              />
              {p}
            </label>
          ))}
        </div>
        <Field name="default_unit" label="Default unit" defaultValue="piece" />
      </fieldset>

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
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}

function Field({
  name,
  label,
  required,
  defaultValue,
}: {
  name: string;
  label: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        required={required}
        defaultValue={defaultValue}
        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
      />
    </div>
  );
}
