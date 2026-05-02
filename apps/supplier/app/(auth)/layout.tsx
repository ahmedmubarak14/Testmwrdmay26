import type { ReactNode } from "react";
import { AuthLayout } from "@mwrd/auth-public";

export default function Layout({ children }: { children: ReactNode }) {
  return <AuthLayout>{children}</AuthLayout>;
}
