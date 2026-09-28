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
  return digits;
}

export function whatsappLink(phone: string, message: string): string {
  return `https://wa.me/${toWhatsAppNumber(phone)}?text=${encodeURIComponent(message)}`;
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

// Design: "Vendor: Link Generated" message preview.
// "Hi Amaka, this is Precious Food Business, 12 Allen Avenue, Ikeja
// (0803 214 7765). Your delivery (…) is going out today. Tap to confirm…"
export function customerMessage(
  link: string,
  order: { customerName: string; itemDescription: string },
  vendor: VendorInfo | null,
): string {
  const who = vendor
    ? `this is ${vendor.name}${vendor.address ? `, ${vendor.address}` : ""}${vendor.phone ? ` (${vendor.phone})` : ""}. `
    : "";
  return `Hi ${firstName(order.customerName)}, ${who}Your delivery (${order.itemDescription.trim()}) is going out today. Tap to confirm you're ready and show us where to find you: ${link}`;
}

// Design: "Vendor: Rider Link Generated" message preview.
// "Hi Tunde, new delivery from Precious Food Business (0803 214 7765).
// Pick up at 12 Allen Avenue, Ikeja. Deliver to Amaka Obi: … Pin, landmark
// note and directions: …"
export function riderMessage(
  link: string,
  order: { customerName: string; itemDescription: string; rider: { name: string } },
  vendor: VendorInfo | null,
): string {
  const from = vendor
    ? ` from ${vendor.name}${vendor.phone ? ` (${vendor.phone})` : ""}`
    : "";
  const pickup = vendor?.address ? ` Pick up at ${vendor.address}.` : "";
  return `Hi ${firstName(order.rider.name)}, new delivery${from}.${pickup} Deliver to ${order.customerName.trim()}: ${order.itemDescription.trim()}. Pin, landmark note and directions: ${link}`;
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
