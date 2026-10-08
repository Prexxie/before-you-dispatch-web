import {
  DeliveryConfirmer,
  FAILURE_REASON_LABELS,
  FailureReason,
  OrderStatus,
} from "./api";

// How each order status looks on the vendor side (design: "Vendor:
// Dashboard"), per the six-statuses decision plus the receipt step.
export function statusBadge(order: {
  status: OrderStatus;
  hasLocation: boolean;
  pickedUpAt: string | null;
  riderDeclinedAt: string | null;
  arrivedAt: string | null;
  receivedAt: string | null;
  failureReason: FailureReason | null;
  deliveryConfirmedBy: DeliveryConfirmer | null;
}): { className: string; label: string } {
  switch (order.status) {
    case "pending_confirmation":
      return { className: "badge-warning", label: "Awaiting confirmation" };
    case "confirmed":
      // Design: dashboard row "Rider declined – pick another" (red: needs
      // the vendor to act).
      if (order.riderDeclinedAt) {
        return { className: "badge-danger", label: "Rider declined – pick another" };
      }
      return order.hasLocation
        ? { className: "badge-filled", label: "Confirmed – ready to send" }
        : { className: "badge-filled", label: "Confirmed – waiting for pin" };
    case "not_ready":
      return { className: "badge-neutral", label: "Declined – link closed" };
    case "dispatched":
      if (order.receivedAt) {
        return { className: "badge-success", label: "Received – rider to complete" };
      }
      if (order.arrivedAt) {
        return { className: "badge-accent", label: "Arrived – waiting for confirmation" };
      }
      return order.pickedUpAt
        ? { className: "badge-filled", label: "Picked up – on the way" }
        : { className: "badge-info", label: "Dispatched" };
    case "delivered":
      return order.deliveryConfirmedBy === "vendor"
        ? { className: "badge-success", label: "Delivered – confirmed by you" }
        : { className: "badge-success", label: "Delivered" };
    case "failed":
      return {
        className: "badge-danger",
        label: order.failureReason
          ? `Failed – ${FAILURE_REASON_LABELS[order.failureReason].toLowerCase()}`
          : "Failed",
      };
  }
}
