import { LoginForm } from "@/components/LoginForm";

interface PageProps {
  searchParams: Promise<{ reason?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const sp = await searchParams;
  const reason =
    sp.reason === "expired"
      ? "Your session expired due to inactivity (15-minute idle timeout)."
      : undefined;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="mb-8 text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-md bg-gray-900 text-lg font-bold text-white">
          M
        </div>
        <p className="mt-2 text-sm font-medium text-gray-900">MWRD Backoffice</p>
        <p className="text-[11px] uppercase tracking-wide text-gray-500">
          Internal users only
        </p>
      </div>
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <LoginForm reasonNote={reason} />
      </div>
    </div>
  );
}
