// Cross-portal redirect resolution.
// CLAUDE.md auth split rule: backoffice users never reach the public auth.
//
// Reads URL bases from env so dev (localhost) and prod (subdomains) both work:
//   NEXT_PUBLIC_CLIENT_URL, NEXT_PUBLIC_SUPPLIER_URL, NEXT_PUBLIC_BACKOFFICE_URL

import type { User } from "@mwrd/shared";

export type AppRole = "client" | "supplier";

export interface RedirectDecision {
  // Absolute URL to send the user to. Null means stay on currentApp's domain.
  url: string | null;
  // True when redirect happens BECAUSE the user is on the wrong portal.
  is_cross_portal: boolean;
  // True when the user is a backoffice role on a public auth — error path.
  is_backoffice_user: boolean;
}

function urlFor(role: AppRole | "backoffice"): string {
  switch (role) {
    case "client":
      return process.env.NEXT_PUBLIC_CLIENT_URL ?? "http://localhost:3000";
    case "supplier":
      return process.env.NEXT_PUBLIC_SUPPLIER_URL ?? "http://localhost:3001";
    case "backoffice":
      return process.env.NEXT_PUBLIC_BACKOFFICE_URL ?? "http://localhost:3002";
  }
}

export function getRedirectUrl(user: User, currentApp: AppRole): RedirectDecision {
  // Backoffice users on public auth: deliberately do NOT provide a helpful link.
  if (user.role !== "client" && user.role !== "supplier") {
    return { url: null, is_cross_portal: false, is_backoffice_user: true };
  }

  // Wrong portal — send them to the right one.
  if (user.role !== currentApp) {
    const target = urlFor(user.role);
    const path = user.onboarding_completed ? "/dashboard" : "/onboarding";
    return { url: `${target}${path}`, is_cross_portal: true, is_backoffice_user: false };
  }

  // Same portal — relative redirect.
  return {
    url: user.onboarding_completed ? "/dashboard" : "/onboarding",
    is_cross_portal: false,
    is_backoffice_user: false,
  };
}
