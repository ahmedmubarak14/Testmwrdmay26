"use client";

import { useState, useTransition } from "react";

import { submitCartAsRFQAction } from "@/app/actions/rfq";

export function SubmitRFQForm({ defaultDate }: { defaultDate: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      action={(fd) => {
        setError(null);
        const title = String(fd.get("title") ?? "").trim();
        const description = String(fd.get("description") ?? "");
        const delivery_city = String(fd.get("delivery_city") ?? "Riyadh");
        const delivery_date = String(fd.get("delivery_date") ?? defaultDate);
        if (!title) {
          setError("Title is required");
          return;
        }
        startTransition(async () => {
          try {
            await submitCartAsRFQAction({ title, description, delivery_city, delivery_date });
          } catch (err) {
            setError(err instanceof Error ? err.message : "Submission failed");
          }
        });
      }}
      className="space-y-4"
    >
      <Field name="title" label="RFQ Title" required />
      <Field name="delivery_city" label="Delivery City" defaultValue="Riyadh" required />
      <Field name="delivery_date" label="Required Delivery Date" type="date" defaultValue={defaultDate} required />
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description / additional context
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
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
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {pending ? "Submitting…" : "Submit RFQ"}
      </button>
    </form>
  );
}

function Field({
  name,
  label,
  required,
  type = "text",
  defaultValue,
}: {
  name: string;
  label: string;
  required?: boolean;
  type?: string;
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
