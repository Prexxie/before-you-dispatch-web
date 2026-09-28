// Links the vendor sends out. The message is only the link plus one line of
// context; there is no bot or reply handling (CLAUDE.md, messaging notes).

export function customerLink(customerToken: string): string {
  return `${window.location.origin}/confirm/${customerToken}`;
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

export function customerMessage(link: string): string {
  return `Your delivery is going out today. Tap to confirm you're ready and show us where to find you: ${link}`;
}

export function riderLink(riderToken: string): string {
  return `${window.location.origin}/rider/${riderToken}`;
}

export function riderMessage(link: string, customerFirstName: string): string {
  return `New delivery for ${customerFirstName}. Their pin and landmark note are here: ${link}`;
}

// Opens Google Maps (app or web) with directions to the customer's pin.
export function directionsLink(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}
