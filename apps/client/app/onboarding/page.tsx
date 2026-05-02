import { redirect } from "next/navigation";
import { data } from "@mwrd/shared";
import { AuthLayout, OnboardingWizard, getSessionCookie } from "@mwrd/auth-public";

export default async function Page() {
  const token = await getSessionCookie();
  if (!token) redirect("/login");
  const user = await data.getCurrentUser(token);
  if (!user) redirect("/login");

  if (user.role !== "client") redirect("/error?code=wrong_portal");
  if (user.onboarding_completed) redirect("/dashboard");

  return (
    <AuthLayout>
      <OnboardingWizard currentApp="client" />
    </AuthLayout>
  );
}
