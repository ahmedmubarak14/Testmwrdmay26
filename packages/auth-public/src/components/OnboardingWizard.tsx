"use client";

import { useState } from "react";

import {
  completeOnboardingAction,
  saveCompanyDetailsAction,
  saveSupplierCategoriesAction,
} from "../actions/onboarding";
import type { AppRole } from "../utils/role-redirect";

interface CategoryOption {
  id: string;
  name_en: string;
}

interface OnboardingWizardProps {
  currentApp: AppRole;
  // Supplier-only: list of top-level categories to choose from.
  categoryOptions?: CategoryOption[];
}

export function OnboardingWizard({ currentApp, categoryOptions = [] }: OnboardingWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900">Set up your account</h1>
      <ol className="mt-3 flex gap-2 text-xs text-gray-500">
        <li className={step >= 1 ? "font-medium text-gray-900" : ""}>1. Company</li>
        <li>·</li>
        <li className={step >= 2 ? "font-medium text-gray-900" : ""}>
          2. {currentApp === "supplier" ? "Categories" : "Team"}
        </li>
        <li>·</li>
        <li className={step >= 3 ? "font-medium text-gray-900" : ""}>3. Done</li>
      </ol>

      {error ? (
        <div
          role="alert"
          className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"
        >
          {error}
        </div>
      ) : null}

      <div className="mt-6">
        {step === 1 ? (
          <CompanyStep
            onNext={() => {
              setError(null);
              setStep(2);
            }}
            onError={setError}
          />
        ) : null}

        {step === 2 ? (
          currentApp === "supplier" ? (
            <SupplierCategoriesStep
              options={categoryOptions}
              onNext={() => {
                setError(null);
                setStep(3);
              }}
              onError={setError}
            />
          ) : (
            <ClientTeamStep
              onSkip={() => {
                setError(null);
                setStep(3);
              }}
            />
          )
        ) : null}

        {step === 3 ? (
          <DoneStep
            onError={setError}
          />
        ) : null}
      </div>
    </div>
  );
}

function CompanyStep({ onNext, onError }: { onNext: () => void; onError: (msg: string) => void }) {
  const [pending, setPending] = useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setPending(true);
        const fd = new FormData(e.currentTarget);
        const res = await saveCompanyDetailsAction({
          cr_number: String(fd.get("cr_number") ?? ""),
          vat_number: String(fd.get("vat_number") ?? ""),
          full_address: String(fd.get("full_address") ?? ""),
        });
        setPending(false);
        if (!res.ok) {
          onError(res.error ?? "Save failed");
          return;
        }
        onNext();
      }}
      className="space-y-4"
    >
      <h2 className="text-base font-medium text-gray-900">About your company</h2>
      <Field name="cr_number" label="CR Number" required />
      <Field name="vat_number" label="VAT Number" required />
      <Field name="full_address" label="Business Address" required />

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-gray-900 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Continue"}
      </button>
    </form>
  );
}

function SupplierCategoriesStep({
  options,
  onNext,
  onError,
}: {
  options: CategoryOption[];
  onNext: () => void;
  onError: (msg: string) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [pending, setPending] = useState(false);

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (selected.length === 0) {
          onError("Pick at least one category");
          return;
        }
        setPending(true);
        const res = await saveSupplierCategoriesAction({ category_ids: selected });
        setPending(false);
        if (!res.ok) {
          onError(res.error ?? "Save failed");
          return;
        }
        onNext();
      }}
      className="space-y-4"
    >
      <h2 className="text-base font-medium text-gray-900">Categories you serve</h2>
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => (
          <label
            key={opt.id}
            className={`flex items-center gap-2 rounded-md border p-2 text-sm ${
              selected.includes(opt.id)
                ? "border-gray-900 bg-gray-50"
                : "border-gray-200"
            }`}
          >
            <input
              type="checkbox"
              checked={selected.includes(opt.id)}
              onChange={() => toggle(opt.id)}
            />
            {opt.name_en}
          </label>
        ))}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-gray-900 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Continue"}
      </button>
    </form>
  );
}

function ClientTeamStep({ onSkip }: { onSkip: () => void }) {
  return (
    <div className="space-y-4">
      <h2 className="text-base font-medium text-gray-900">Set up your team</h2>
      <p className="text-sm text-gray-600">
        You can invite team members and configure roles now or later.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onSkip}
          className="flex-1 rounded-md border border-gray-300 bg-white py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
        >
          Skip for now
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="flex-1 rounded-md bg-gray-900 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Continue with setup
        </button>
      </div>
      <p className="text-xs text-gray-500">
        Team setup wizard ships in Prompt 4. Both buttons advance for now.
      </p>
    </div>
  );
}

function DoneStep({ onError }: { onError: (msg: string) => void }) {
  const [pending, setPending] = useState(false);
  return (
    <div className="space-y-4 text-center">
      <h2 className="text-base font-medium text-gray-900">You&apos;re done</h2>
      <p className="text-sm text-gray-600">You can now start using MWRD.</p>
      <button
        type="button"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          const res = await completeOnboardingAction();
          setPending(false);
          if (!res.ok) {
            onError(res.error ?? "Failed to finish onboarding");
            return;
          }
          window.location.href = "/dashboard";
        }}
        className="w-full rounded-md bg-gray-900 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {pending ? "Finishing…" : "Go to Dashboard"}
      </button>
    </div>
  );
}

function Field({ name, label, required }: { name: string; label: string; required?: boolean }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        required={required}
        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
      />
    </div>
  );
}
