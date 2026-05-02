"use client";

import { useState, useTransition } from "react";

import { setMarginAction } from "@/app/actions/ops";

interface CategoryMargin {
  id: string;
  name_en: string;
  pct: number | null; // null = falls back to global
}

interface Props {
  global_pct: number;
  categories: CategoryMargin[];
}

export function MarginConfig({ global_pct, categories }: Props) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr,2fr]">
      <UniversalMargin initial={global_pct} />
      <CategoryMargins items={categories} />
    </div>
  );
}

function UniversalMargin({ initial }: { initial: number }) {
  const [pct, setPct] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-gray-900">Universal Margin</h3>
      <p className="mt-1 text-xs text-gray-500">
        Default margin applied to all quotes when no category-specific margin is set.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <input
          type="number"
          min={0}
          max={200}
          step="0.1"
          value={pct}
          onChange={(e) => setPct(Number(e.target.value))}
          className="w-24 rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <span className="text-sm text-gray-700">%</span>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setMessage(null);
              const res = await setMarginAction({ scope: "global", pct });
              setMessage(res.ok ? "Saved" : res.error ?? "Save failed");
            })
          }
          className="rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
      {message ? (
        <p className={`mt-1 text-[11px] ${message === "Saved" ? "text-emerald-700" : "text-red-700"}`}>
          {message}
        </p>
      ) : null}
    </section>
  );
}

function CategoryMargins({ items }: { items: CategoryMargin[] }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-gray-900">Category Margins</h3>
      <p className="mt-1 text-xs text-gray-500">
        Override the universal margin for specific categories. Empty = uses universal.
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {items.map((c) => (
          <CategoryMarginTile key={c.id} category={c} />
        ))}
      </div>
    </section>
  );
}

function CategoryMarginTile({ category }: { category: CategoryMargin }) {
  const [pct, setPct] = useState<number | "">(category.pct ?? "");
  const [pending, startTransition] = useTransition();

  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 p-2">
      <p className="text-xs font-medium text-gray-900">{category.name_en}</p>
      <div className="mt-1 flex items-center gap-1">
        <input
          type="number"
          min={0}
          max={200}
          step="0.1"
          value={pct}
          onChange={(e) => setPct(e.target.value === "" ? "" : Number(e.target.value))}
          placeholder="—"
          className="w-20 rounded-md border border-gray-300 px-2 py-1 text-xs"
        />
        <span className="text-xs text-gray-700">%</span>
        <button
          type="button"
          disabled={pending || pct === ""}
          onClick={() =>
            startTransition(async () => {
              if (pct === "") return;
              await setMarginAction({ scope: "category", scope_id: category.id, pct });
            })
          }
          className="rounded-md bg-gray-900 px-2 py-1 text-[11px] font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          Save
        </button>
      </div>
    </div>
  );
}
