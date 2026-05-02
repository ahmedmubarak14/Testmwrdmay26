"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { registerAction, type RegisterActionInput } from "../actions/register";

const RegisterSchema = z.object({
  real_name: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email"),
  phone: z
    .string()
    .regex(/^\+966[0-9]{9}$/, "Use Saudi format: +9665xxxxxxxx"),
  company_real_name: z.string().min(2, "Enter your company name"),
});
type RegisterInput = z.infer<typeof RegisterSchema>;

export function RegisterForm() {
  const [accountType, setAccountType] = useState<"client" | "supplier" | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { phone: "+966" },
  });

  const onSubmit = async (values: RegisterInput) => {
    if (!accountType) {
      setServerError("Choose an account type first");
      return;
    }
    setServerError(null);
    const payload: RegisterActionInput = { ...values, role: accountType };
    const res = await registerAction(payload);
    if (!res.ok) {
      setServerError(res.error ?? "Registration failed");
      return;
    }
    window.location.href = "/register/thank-you";
  };

  if (!accountType) {
    return (
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Create your MWRD account</h1>
        <p className="mt-1 text-sm text-gray-500">Choose an account type</p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setAccountType("client")}
            className="rounded-md border border-gray-300 bg-white p-4 text-left hover:border-gray-900"
          >
            <p className="text-sm font-medium text-gray-900">Client</p>
            <p className="mt-1 text-xs text-gray-500">I want to source goods</p>
          </button>
          <button
            type="button"
            onClick={() => setAccountType("supplier")}
            className="rounded-md border border-gray-300 bg-white p-4 text-left hover:border-gray-900"
          >
            <p className="text-sm font-medium text-gray-900">Supplier</p>
            <p className="mt-1 text-xs text-gray-500">I want to sell goods</p>
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <a href="/login" className="font-medium text-gray-900 underline">
            Sign in
          </a>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900">
        Register as a {accountType === "client" ? "client" : "supplier"}
      </h1>
      <button
        type="button"
        onClick={() => setAccountType(null)}
        className="mt-1 text-xs text-gray-500 underline-offset-2 hover:underline"
      >
        ← Change account type
      </button>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
        <Field
          id="real_name"
          label="Full name"
          inputProps={register("real_name")}
          error={errors.real_name?.message}
        />
        <Field
          id="email"
          label="Email"
          inputProps={{ ...register("email"), type: "email", autoComplete: "email" }}
          error={errors.email?.message}
        />
        <Field
          id="phone"
          label="Phone (+9665xxxxxxxx)"
          inputProps={register("phone")}
          error={errors.phone?.message}
        />
        <Field
          id="company_real_name"
          label="Company name"
          inputProps={register("company_real_name")}
          error={errors.company_real_name?.message}
        />

        {serverError ? (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"
          >
            {serverError}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-gray-900 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {isSubmitting ? "Submitting…" : "Submit"}
        </button>

        <p className="text-center text-sm text-gray-500">
          Already have an account?{" "}
          <a href="/login" className="font-medium text-gray-900 underline">
            Sign in
          </a>
        </p>
      </form>
    </div>
  );
}

interface FieldProps {
  id: string;
  label: string;
  inputProps: React.InputHTMLAttributes<HTMLInputElement>;
  error?: string;
}

function Field({ id, label, inputProps, error }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={id}
        {...inputProps}
        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
      />
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
