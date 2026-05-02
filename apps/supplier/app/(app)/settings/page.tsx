import { data } from "@mwrd/shared";

import { getViewer } from "@/lib/viewer";

export default async function Page() {
  const user = await getViewer();
  const company = user.company_id ? await data.getCompany(user.company_id) : null;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-gray-900">Profile</h2>
        <dl className="mt-2 grid grid-cols-2 gap-3 text-sm">
          <Item label="Name" value={user.real_name} />
          <Item label="Email" value={user.email} />
          <Item label="Phone" value={user.phone} />
          <Item label="Platform alias" value={user.platform_alias} mono />
          <Item label="Language" value={user.language === "ar" ? "العربية" : "English"} />
        </dl>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-gray-900">Company</h2>
        {company ? (
          <dl className="mt-2 grid grid-cols-2 gap-3 text-sm">
            <Item label="Real name (private)" value={company.real_name} />
            <Item label="Platform alias" value={company.platform_alias} mono />
            <Item label="CR number" value={company.cr_number ?? "—"} />
            <Item label="VAT number" value={company.vat_number ?? "—"} />
            <Item
              label="Categories served"
              value={`${company.categories_served?.length ?? 0} category groups`}
            />
          </dl>
        ) : (
          <p className="mt-2 text-xs text-gray-500">No company on file.</p>
        )}
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-gray-900">Notifications</h2>
        <p className="mt-1 text-xs text-gray-500">
          New RFQ alerts, order updates, payment notifications — preferences land in v2.
        </p>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-gray-900">Security</h2>
        <p className="mt-1 text-xs text-gray-500">
          Password reset is available via support@mwrd.io. Phase 2 wires Supabase Auth.
        </p>
      </section>
    </div>
  );
}

function Item({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className={`text-gray-900 ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}
