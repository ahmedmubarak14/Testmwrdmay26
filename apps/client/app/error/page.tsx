interface PageProps {
  searchParams: Promise<{ code?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const { code } = await searchParams;
  const message =
    code === "wrong_portal"
      ? "This portal is for clients only. Suppliers use supplier.mwrd.io. Backoffice users sign in at backoffice.mwrd.io."
      : "An unexpected error occurred.";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-lg font-semibold text-gray-900">Wrong portal</h1>
        <p className="mt-2 text-sm text-gray-600">{message}</p>
        <a
          href="/login"
          className="mt-4 inline-block rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
        >
          Back to sign-in
        </a>
      </div>
    </div>
  );
}
