import { redirect } from "next/navigation";
import { data } from "@mwrd/shared";
import { getSessionCookie, logoutAction } from "@mwrd/auth-public";

export default async function Page() {
  const token = await getSessionCookie();
  if (!token) redirect("/login");
  const user = await data.getCurrentUser(token);
  if (!user) redirect("/login");

  if (user.role !== "client") redirect("/error?code=wrong_portal");
  if (!user.onboarding_completed) redirect("/onboarding");

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Client portal</p>
            <h1 className="mt-1 text-2xl font-semibold text-gray-900">
              Welcome, {user.real_name}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Signed in as <span className="font-mono">{user.platform_alias}</span>
            </p>
          </div>
          <form action={logoutThenRedirect}>
            <button className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50">
              Sign out
            </button>
          </form>
        </div>

        <div className="mt-8 rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
          <p className="text-sm text-gray-500">
            Catalog browse, RFQ creation, quotes, and orders ship in Prompt 4.
          </p>
        </div>
      </div>
    </div>
  );
}

async function logoutThenRedirect() {
  "use server";
  await logoutAction();
  redirect("/login");
}
