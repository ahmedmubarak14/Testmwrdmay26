import { redirect } from "next/navigation";
import { data } from "@mwrd/shared";
import { AuthLayout, OnboardingWizard, getSessionCookie } from "@mwrd/auth-public";

export default async function Page() {
  const token = await getSessionCookie();
  if (!token) redirect("/login");
  const user = await data.getCurrentUser(token);
  if (!user) redirect("/login");

  if (user.role !== "supplier") redirect("/error?code=wrong_portal");
  if (user.onboarding_completed) redirect("/dashboard");

  const allCategories = await data.listCategories();
  const tops = allCategories
    .filter((c) => c.parent_id === null)
    .map((c) => ({ id: c.id, name_en: c.name_en }));

  return (
    <AuthLayout>
      <OnboardingWizard currentApp="supplier" categoryOptions={tops} />
    </AuthLayout>
  );
}
