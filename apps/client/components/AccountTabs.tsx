import Link from "next/link";

export function AccountTabs({ current }: { current: string }) {
  const tabs = [
    { key: "users", href: "/account/users", label: "Users" },
    { key: "roles", href: "/account/roles", label: "Roles" },
    { key: "approval", href: "/account/approval-tree", label: "Approval Tree" },
    { key: "addresses", href: "/account/addresses", label: "Addresses" },
  ];
  return (
    <div className="border-b border-gray-200">
      <nav className="flex gap-4 text-sm">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={t.href}
            className={`inline-block border-b-2 px-1 pb-2 ${
              current === t.key
                ? "border-gray-900 font-semibold text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
