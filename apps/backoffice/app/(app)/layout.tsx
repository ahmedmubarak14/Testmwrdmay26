// Backoffice (app) shell. Authentication enforced at this layout — every
// nested page inherits the guard. Idle timeout (15 min) is checked inside
// getBackofficeSession via touchSession on each request.
//
// Yellow "Backoffice Mode" banner is required by the prompt as a constant
// audit reminder.

import type { ReactNode } from "react";
import Link from "next/link";

import { data } from "@mwrd/shared";

import { logoutAction } from "@/app/actions/auth";
import { getViewer, isSuperadmin } from "@/lib/viewer";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getViewer();
  const superadmin = isSuperadmin(user);

  // Pull badge counts in parallel.
  const [leads, kyc, parsList, offerQueue] = await Promise.all([
    data.listLeadsQueue(),
    data.listKycQueue(),
    data.listAllProductAdditionRequests(),
    data.listOfferApprovalQueue(),
  ]);

  const counts = {
    leads: leads.length,
    kyc: kyc.length,
    product_requests: parsList.filter((p) => p.status === "submitted" || p.status === "under_review")
      .length,
    offer_approvals: offerQueue.length,
    three_way: 0, // wired by /three-way-match data fetch
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-amber-300/70 text-amber-950 text-[11px] uppercase tracking-wider text-center py-1 font-medium">
        Backoffice Mode — actions are audited
      </div>
      <Topbar user={user} />
      <div className="mx-auto flex max-w-[1400px] gap-6 px-4 py-6">
        <Sidebar counts={counts} superadmin={superadmin} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

function Topbar({ user }: { user: { real_name: string; email: string; role: string } }) {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-900 text-sm font-bold text-white">
            M
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">MWRD</p>
            <p className="text-[10px] uppercase tracking-wide text-gray-500">Admin Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs font-medium text-gray-900">{user.real_name}</p>
            <p className="text-[11px] text-gray-500">
              {user.email} · {user.role}
            </p>
          </div>
          <form action={logoutAction}>
            <button className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-900 hover:bg-gray-50">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

interface SidebarProps {
  counts: {
    leads: number;
    kyc: number;
    product_requests: number;
    offer_approvals: number;
    three_way: number;
  };
  superadmin: boolean;
}

function Sidebar({ counts, superadmin }: SidebarProps) {
  return (
    <aside className="hidden w-60 shrink-0 lg:block">
      <NavGroup label="Dashboard">
        <NavLink href="/dashboard">Dashboard</NavLink>
      </NavGroup>
      <NavGroup label="Onboarding">
        <NavLink href="/leads" badge={counts.leads}>
          Leads
        </NavLink>
        <NavLink href="/kyc" badge={counts.kyc}>
          KYC
        </NavLink>
      </NavGroup>
      <NavGroup label="Catalog">
        <NavLink href="/master-catalog">Master Catalog</NavLink>
        <NavLink href="/product-requests" badge={counts.product_requests}>
          Product Requests
        </NavLink>
        <NavLink href="/offer-approvals" badge={counts.offer_approvals}>
          Offer Approvals
        </NavLink>
      </NavGroup>
      <NavGroup label="Operations">
        <NavLink href="/quote-manager">Quote Manager</NavLink>
        <NavLink href="/three-way-match">Three-Way Match</NavLink>
        <NavLink href="/logistics">Logistics</NavLink>
      </NavGroup>
      <NavGroup label="Users">
        <NavLink href="/users/clients">Clients</NavLink>
        <NavLink href="/users/suppliers">Suppliers</NavLink>
        {superadmin ? (
          <NavLink href="/users/internal">Internal Users</NavLink>
        ) : null}
      </NavGroup>
      <NavGroup label="Analytics">
        {superadmin ? <NavLink href="/audit-log">Audit Log</NavLink> : null}
      </NavGroup>
      <NavGroup label="Account">
        <NavLink href="/settings">Settings</NavLink>
      </NavGroup>
    </aside>
  );
}

function NavGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-3">
      <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
        {label}
      </p>
      <ul className="space-y-0.5">{children}</ul>
    </div>
  );
}

function NavLink({
  href,
  children,
  badge,
}: {
  href: string;
  children: ReactNode;
  badge?: number;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
      >
        <span>{children}</span>
        {badge && badge > 0 ? (
          <span className="rounded-full bg-orange-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {badge}
          </span>
        ) : null}
      </Link>
    </li>
  );
}
