import { ActivateForm } from "@mwrd/auth-public";

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const { token } = await searchParams;
  if (!token) {
    return (
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Activation link issue</h1>
        <p className="mt-2 text-sm text-red-700">No activation token was provided.</p>
      </div>
    );
  }
  return <ActivateForm token={token} />;
}
