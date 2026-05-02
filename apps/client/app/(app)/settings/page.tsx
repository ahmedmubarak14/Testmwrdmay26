import { data } from "@mwrd/shared";

import { getViewer } from "@/lib/viewer";

export default async function Page() {
  const user = await getViewer();
  const company = user.company_id ? await data.listAllUsers().then(() => null) : null;
  void company;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
      <section className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-gray-900">Profile</h2>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <Item label="Name" value={user.real_name} />
          <Item label="Email" value={user.email} />
          <Item label="Phone" value={user.phone} />
          <Item label="Platform alias" value={user.platform_alias} mono />
          <Item label="Language" value={user.language === "ar" ? "العربية" : "English"} />
        </dl>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-gray-900">Notifications</h2>
        <p className="mt-1 text-xs text-gray-500">
          Notification preferences land in v2.
        </p>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-gray-900">Security</h2>
        <p className="mt-1 text-xs text-gray-500">
          Password reset is available via support@mwrd.io. Phase 2 wires Supabase
          Auth and self-service reset.
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
