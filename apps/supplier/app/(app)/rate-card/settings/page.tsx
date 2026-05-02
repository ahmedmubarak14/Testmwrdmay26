import Link from "next/link";

import { data } from "@mwrd/shared";

import { getViewer } from "@/lib/viewer";
import { RateCardSettingsForm } from "@/components/RateCardSettingsForm";

export default async function Page() {
  const user = await getViewer();
  const company = user.company_id ? await data.getCompany(user.company_id) : null;

  const initial = {
    auto_quote_review_window: company?.auto_quote_review_window ?? ("30min" as const),
    auto_quote_globally_enabled: company?.auto_quote_globally_enabled ?? true,
    default_lead_time_pad_days: company?.default_lead_time_pad_days ?? 0,
  };

  return (
    <div className="space-y-4">
      <Link href="/rate-card" className="text-xs text-gray-500 hover:underline">
        ← Back to rate card
      </Link>
      <h1 className="text-2xl font-semibold text-gray-900">Rate Card Settings</h1>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <RateCardSettingsForm initial={initial} />
      </div>
    </div>
  );
}
