import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";

import { data } from "@mwrd/shared";
import { getSessionCookie, logoutAction } from "@mwrd/auth-public";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const token = await getSessionCookie();
  if (!token) redirect("/login");
  const user = await data.getCurrentUser(token);
  if (!user) redirect("/login");
  if (user.role !== "supplier") redirect("/error?code=wrong_portal");
  if (!user.onboarding_completed) redirect("/onboarding");

  return (
    <div className="min-h-screen bg-gray-50">
      <Topbar
        platformAlias={user.platform_alias}
        realName={user.real_name}
        email={user.email}
      />
      <div className="mx-auto flex max-w-[1280px] gap-6 px-4 py-6">
        <Sidebar />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

function Topbar({
  platformAlias,
  realName,
  email,
}: {
  platformAlias: string;
  realName: string;
  email: string;
}) {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-900 text-sm font-bold text-white">
            M
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">MWRD</p>
            <p className="text-[10px] uppercase tracking-wide text-gray-500">
              Supplier Portal
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs font-medium text-gray-900">{realName}</p>
            <p className="text-[11px] text-gray-500">
              <span className="font-mono">{platformAlias}</span> · {email}
            </p>
          </div>
          <form action={logoutAndGo}>
            <button className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-900 hover:bg-gray-50">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

async function logoutAndGo() {
  "use server";
  await logoutAction();
  redirect("/login");
}

function Sidebar() {
  return (
    <aside className="hidden w-56 shrink-0 lg:block">
      <NavGroup label="Main">
        <NavLink href="/dashboard">Dashboard</NavLink>
        <NavLink href="/catalog">Browse Master Catalog</NavLink>
        <NavLink href="/rate-card">My Rate Card</NavLink>
        <NavLink href="/rfqs">RFQ Requests</NavLink>
        <NavLink href="/quotes">My Quotes</NavLink>
        <NavLink href="/orders">Orders</NavLink>
      </NavGroup>
      <NavGroup label="Management">
        <NavLink href="/product-requests">Product Addition Requests</NavLink>
      </NavGroup>
      <NavGroup label="Account">
        <NavLink href="/settings">Settings</NavLink>
        <NavLink href="/help">Help</NavLink>
      </NavGroup>
    </aside>
  );
}

function NavGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-4">
      <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
        {label}
      </p>
      <ul className="space-y-0.5">{children}</ul>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="block rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
      >
        {children}
      </Link>
    </li>
  );
}
