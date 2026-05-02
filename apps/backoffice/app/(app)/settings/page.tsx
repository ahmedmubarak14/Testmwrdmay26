import { data } from "@mwrd/shared";

import { PlatformSettingsForm } from "@/components/PlatformSettingsForm";

export default async function Page() {
  const settings = await data.getPlatformSettings();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Platform Settings</h1>
        <p className="mt-1 text-sm text-gray-600">
          Tax, operational defaults, and the auto-quote master switch.
        </p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <PlatformSettingsForm
          initial={{
            vat_rate: settings.vat_rate,
            default_lead_time_days: settings.default_lead_time_days,
            rfq_expiry_days: settings.rfq_expiry_days,
            auto_quote_admin_hold_threshold_sar: settings.auto_quote_admin_hold_threshold_sar,
            auto_quote_globally_enabled: settings.auto_quote_globally_enabled,
          }}
        />
      </div>
    </div>
  );
}
