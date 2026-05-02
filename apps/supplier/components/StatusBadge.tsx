export function StatusBadge({ status }: { status: string }) {
  const colour = (() => {
    switch (status) {
      case "draft":
      case "submitted":
      case "draft_auto":
      case "draft_manual":
      case "pending":
        return "bg-gray-100 text-gray-700";
      case "active":
      case "confirmed":
      case "in_transit":
      case "approved":
      case "submitted_to_client":
        return "bg-blue-100 text-blue-700";
      case "accepted":
      case "delivered":
      case "completed":
        return "bg-green-100 text-green-700";
      case "partially_accepted":
      case "pending_admin_review":
        return "bg-amber-100 text-amber-800";
      case "rejected":
      case "cancelled":
      case "expired":
      case "inactive":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  })();
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${colour}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
