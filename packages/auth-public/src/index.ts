// @mwrd/auth-public — auth surface shared by client + supplier + mobile.
// NEVER imported by apps/backoffice.

export { AuthLayout } from "./components/AuthLayout";
export { LoginForm } from "./components/LoginForm";
export { RegisterForm } from "./components/RegisterForm";
export { ThankYouCard } from "./components/ThankYouCard";
export { ActivateForm } from "./components/ActivateForm";
export { OnboardingWizard } from "./components/OnboardingWizard";

export {
  SESSION_COOKIE_NAME,
  setSessionCookie,
  getSessionCookie,
  clearSessionCookie,
} from "./utils/session";

export {
  getRedirectUrl,
  type AppRole,
  type RedirectDecision,
} from "./utils/role-redirect";

export { logoutAction } from "./actions/onboarding";
