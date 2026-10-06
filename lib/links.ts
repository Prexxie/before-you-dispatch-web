import type { VendorInfo } from "./api";

// Links the vendor sends out. Each message is the link plus a line saying
// which business it's from; there is no bot or reply handling (CLAUDE.md,
// messaging notes).

export function customerLink(customerToken: string): string {
  return `${window.location.origin}/confirm/${customerToken}`;
}

export function riderLink(riderToken: string): string {
  return `${window.location.origin}/rider/${riderToken}`;
}

// Same rule as the API's normalizePhone: local Nigerian numbers
// ("0803 123 4567") become international digits ("2348031234567"),
// which is the form wa.me expects.
export function toWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("0")) {
    return `234${digits.slice(1)}`;
  }
  // "803 123 4567": the leading 0 left off.
  if (digits.length === 10 && /^[789]/.test(digits)) return `234${digits}`;
  return digits;
}

export function whatsappLink(phone: string, message: string): string {
  return `https://wa.me/${toWhatsAppNumber(phone)}?text=${encodeURIComponent(message)}`;
}

// Opens the phone's SMS app with the message ready, for people who aren't on
// WhatsApp. "?&body=" is the form both iOS and Android accept.
export function smsLink(phone: string, message: string): string {
  return `sms:${phone.replace(/[^\d+]/g, "")}?&body=${encodeURIComponent(message)}`;
}

// Opens Google Maps (app or web) with directions to the customer's pin.
export function directionsLink(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

// Same, but to a text address (the vendor's pickup point has no pin).
export function directionsLinkToAddress(address: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
}

export const firstName = (name: string) => name.trim().split(/\s+/)[0];

// Design: "Vendor: Link Generated" message preview. Three wordings:
//  - first message: says who it's from, that no rider is sent until they
//    confirm, and what tapping the link involves (yes/not now, then a pin);
//  - after they declined and the vendor retriggered ("retriggeredAt"): more
//    careful, acknowledges the earlier "not ready" and that the old link is
//    closed, no pressure;
//  - after a failed delivery was redelivered ("attempt" above 1): apologises,
//    and says their saved location will load.
// The follow-ups say "Hello" rather than "Hi", a step more formal.
export function customerMessage(
  link: string,
  order: {
    customerName: string;
    itemDescription: string;
    attempt?: number;
    retriggeredAt?: string | null;
  },
  vendor: VendorInfo | null,
  // First name of the person who owns the vendor account, so the message
  // reads "this is Chuka from Precious Food Business". Composed on the
  // vendor's page from their own account; never sent to customers or riders
  // by the API.
  sender: string | null = null,
): string {
  const business = vendor?.name ?? "your delivery business";
  // The 📍 marks the business's address in the message.
  const contact = vendor
    ? ` (${[vendor.address && `📍 ${vendor.address}`, vendor.phone].filter(Boolean).join(", ")})`
    : "";
  const who = `this is ${sender ? `${sender} from ` : ""}${business}${contact}`;
  const name = firstName(order.customerName);
  const item = order.itemDescription.trim();
  const choose = `Tap the link to say "Yes, I'm ready" or "Not now".`;

  if ((order.attempt ?? 1) > 1) {
    return `Hello ${name}, ${who}.\n\nWe're sorry we couldn't complete your earlier delivery (${item}). We'd like to try again today. We won't send the rider until you confirm you're ready.\n\n${choose} Your saved location will load; please check it's still right. This link replaces the old one.\n${link}`;
  }
  if (order.retriggeredAt) {
    return `Hello ${name}, ${who}.\n\nEarlier you told us you weren't ready to receive your order (${item}), so we closed that link. If you're ready now, we can still deliver it today. This new link replaces the old one.\n\nWe won't send the rider until you confirm. ${choose} If you're ready, you'll drop a pin on the map so the rider finds you without calling.\n${link}`;
  }
  return `Hi ${name}, ${who}.\n\nYour order (${item}) is going out today. We won't send the rider until you confirm you're ready.\n\n${choose} If you're ready, you'll drop a pin on the map so the rider finds you without calling.\n${link}`;
}

// Design: "Vendor: Rider Link Generated" message preview. The pin stays
// locked until the rider confirms pickup, so the message sequences it: the
// link first shows the pickup point, and the customer's pin appears after
// they tap "I've Picked Up the Order".
export function riderMessage(
  link: string,
  order: {
    orderNumber: number;
    customerName: string;
    itemDescription: string;
    rider: { name: string };
    attempt?: number;
  },
  vendor: VendorInfo | null,
  sender: string | null = null,
): string {
  const phone = vendor?.phone ? ` (${vendor.phone})` : "";
  const intro = sender
    ? `this is ${sender} from ${vendor?.name ?? "your delivery business"}${phone}. New delivery`
    : `new delivery${vendor ? ` from ${vendor.name}${phone}` : ""}`;
  const attempt = (order.attempt ?? 1) > 1 ? ` (attempt ${order.attempt}, redelivery)` : "";
  const customer = firstName(order.customerName);
  const lines = [
    `Hi ${firstName(order.rider.name)}, ${intro}. Order #${order.orderNumber}${attempt}.`,
    "",
    ...(vendor?.address ? [`Pick up: ${vendor.address}`] : []),
    `Deliver to: ${order.customerName.trim()}`,
    `Items: ${order.itemDescription.trim()}`,
    "",
    `${customer} has confirmed they're ready and shared their location. Open the link for directions to the pickup point. Once you have the items, tap "I've Picked Up the Order" to see ${customer}'s pin, address and landmark note.`,
    link,
  ];
  return lines.join("\n");
}

// "tel:" link from a phone number as typed.
export function telLink(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

// "+2348012345678" / "2348012345678" -> "0801 234 5678" for display. Other
// numbers are shown as typed.
export function displayPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const local =
    digits.length === 13 && digits.startsWith("234")
      ? `0${digits.slice(3)}`
      : digits.length === 11 && digits.startsWith("0")
        ? digits
        : null;
  if (!local) return phone;
  return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
}
