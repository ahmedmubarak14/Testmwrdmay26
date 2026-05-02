"use client";

import { useState, useTransition } from "react";

import { submitCustomRFQAction } from "@/app/actions/rfq";

interface ItemRow {
  id: string;
  free_text_name: string;
  description: string;
  qty: number;
  unit: string;
}

interface Props {
  categories: { id: string; name_en: string }[];
  defaultDate: string;
}

export function CustomRFQForm({ categories, defaultDate }: Props) {
  const [items, setItems] = useState<ItemRow[]>([
    { id: "1", free_text_name: "", description: "", qty: 1, unit: "piece" },
  ]);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const updateItem = (id: string, patch: Partial<ItemRow>) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const addItem = () =>
    setItems((prev) => [
      ...prev,
      { id: String(prev.length + 1), free_text_name: "", description: "", qty: 1, unit: "piece" },
    ]);

  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  return (
    <form
      action={(fd) => {
        setError(null);
        if (items.some((i) => !i.free_text_name)) {
          setError("Each item needs a name");
          return;
        }
        const payload = {
          title: String(fd.get("title") ?? ""),
          description: String(fd.get("description") ?? ""),
          category_id: String(fd.get("category_id") ?? "") || null,
          delivery_city: String(fd.get("delivery_city") ?? "Riyadh"),
          delivery_date: String(fd.get("delivery_date") ?? defaultDate),
          items: items.map((i) => ({
            free_text_name: i.free_text_name,
            description: i.description,
            qty: i.qty,
            unit: i.unit,
          })),
        };
        startTransition(async () => {
          try {
            await submitCustomRFQAction(payload);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Submission failed");
          }
        });
      }}
      className="space-y-6"
    >
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-gray-900">Basics</legend>
        <Field name="title" label="Title" required />
        <div>
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <select
            name="category_id"
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
        <Field name="delivery_city" label="Delivery City" defaultValue="Riyadh" required />
        <Field name="delivery_date" label="Delivery Date" type="date" defaultValue={defaultDate} required />
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </fieldset>

      <fieldset>
        <div className="mb-3 flex items-center justify-between">
          <legend className="text-sm font-semibold text-gray-900">Items</legend>
          <button
            type="button"
            onClick={addItem}
            className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs"
          >
            + Add item
          </button>
        </div>
        <div className="space-y-3">
          {items.map((it, idx) => (
            <div key={it.id} className="rounded-md border border-gray-200 bg-gray-50 p-3">
              <div className="grid grid-cols-2 gap-2">
                <input
                  placeholder="Item name"
                  value={it.free_text_name}
                  onChange={(e) => updateItem(it.id, { free_text_name: e.target.value })}
                  className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                />
                <input
                  placeholder="Unit (piece, box…)"
                  value={it.unit}
                  onChange={(e) => updateItem(it.id, { unit: e.target.value })}
                  className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                />
              </div>
              <textarea
                placeholder="Description / specs"
                value={it.description}
                onChange={(e) => updateItem(it.id, { description: e.target.value })}
                rows={2}
                className="mt-2 block w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
              />
              <div className="mt-2 flex items-center justify-between">
                <label className="text-xs text-gray-600">
                  Quantity{" "}
                  <input
                    type="number"
                    min={1}
                    value={it.qty}
                    onChange={(e) => updateItem(it.id, { qty: Math.max(1, Number(e.target.value)) })}
                    className="ml-1 w-20 rounded-md border border-gray-300 px-2 py-1 text-sm"
                  />
                </label>
                {idx > 0 ? (
                  <button
                    type="button"
                    onClick={() => removeItem(it.id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
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
        {pending ? "Submitting…" : "Submit Custom Request"}
      </button>
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  required,
  defaultValue,
}: {
  name: string;
  label: string;
  type?: string;
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
        type={type}
        required={required}
        defaultValue={defaultValue}
        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
      />
    </div>
  );
}
