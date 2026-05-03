import { Text, View } from "react-native";

const BADGE: Record<string, { bg: string; text: string; label: string }> = {
  open: { bg: "bg-blue-100", text: "text-blue-700", label: "Open" },
  draft_auto: { bg: "bg-gray-100", text: "text-gray-600", label: "Auto-draft" },
  draft_manual: { bg: "bg-gray-100", text: "text-gray-600", label: "Draft" },
  submitted_to_client: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Submitted" },
  pending_admin_review: { bg: "bg-amber-100", text: "text-amber-700", label: "Under review" },
  accepted: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Accepted" },
  rejected: { bg: "bg-red-100", text: "text-red-700", label: "Not accepted" },
  awaiting_approval: { bg: "bg-amber-100", text: "text-amber-700", label: "Awaiting approval" },
  confirmed: { bg: "bg-blue-100", text: "text-blue-700", label: "Confirmed" },
  in_progress: { bg: "bg-indigo-100", text: "text-indigo-700", label: "In progress" },
  delivered: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Delivered" },
  cancelled: { bg: "bg-red-100", text: "text-red-700", label: "Cancelled" },
  active: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Active" },
  suspended: { bg: "bg-red-100", text: "text-red-700", label: "Suspended" },
  pending_kyc: { bg: "bg-amber-100", text: "text-amber-700", label: "Pending KYC" },
};

export function StatusBadge({ status }: { status: string }) {
  const style = BADGE[status] ?? { bg: "bg-gray-100", text: "text-gray-600", label: status };
  return (
    <View className={`rounded-full px-2.5 py-0.5 ${style.bg}`}>
      <Text className={`text-xs font-medium ${style.text}`}>{style.label}</Text>
    </View>
  );
}
