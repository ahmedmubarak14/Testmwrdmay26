import { data } from "@mwrd/shared";

import { InternalActivateForm } from "@/components/InternalActivateForm";

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const { token } = await searchParams;
  const user = token ? await data.getUserByActivationToken(token) : null;
  const tokenIsValid =
    user &&
    (user.role === "admin" || user.role === "ops" || user.role === "finance" || user.role === "cs");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="mb-8 text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-md bg-gray-900 text-lg font-bold text-white">
          M
        </div>
        <p className="mt-2 text-sm font-medium text-gray-900">MWRD Backoffice</p>
      </div>
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        {!token || !tokenIsValid ? (
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Invalid activation link</h1>
            <p className="mt-2 text-sm text-gray-600">
              The link is invalid or has expired. Ask your superadmin to resend the
              invite.
            </p>
          </div>
        ) : (
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Set your password</h1>
            <p className="mt-1 text-sm text-gray-500">
              Welcome, {user.real_name}. After activation you&apos;ll be signed in to the
              backoffice.
            </p>
            <div className="mt-4">
              <InternalActivateForm token={token} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
