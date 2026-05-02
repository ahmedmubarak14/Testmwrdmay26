export function StatusBadge({ status }: { status: string }) {
  const colour = (() => {
    switch (status) {
      case "draft":
      case "open":
      case "submitted":
      case "awaiting_approval":
      case "draft_auto":
      case "draft_manual":
        return "bg-gray-100 text-gray-700";
      case "quoted":
      case "submitted_to_client":
      case "confirmed":
      case "in_transit":
        return "bg-blue-100 text-blue-700";
      case "awarded":
      case "delivered":
      case "completed":
      case "accepted":
        return "bg-green-100 text-green-700";
      case "partially_awarded":
      case "partially_accepted":
      case "pending_admin_review":
        return "bg-amber-100 text-amber-800";
      case "cancelled":
      case "rejected":
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
