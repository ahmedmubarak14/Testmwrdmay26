import type { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-12">
      <div className="mb-8 text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-md bg-gray-900 text-lg font-bold text-white">
          M
        </div>
        <p className="mt-2 text-sm font-medium text-gray-600">MWRD</p>
      </div>
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-sm border border-gray-200">
        {children}
      </div>
    </div>
  );
}
