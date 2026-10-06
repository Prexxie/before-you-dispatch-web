import type { VendorInfo } from "@/lib/api";
import { displayPhone, telLink } from "@/lib/links";
import { AddressPinIcon, StoreIcon } from "./icons";

// "Which business is this from" strip (design: "Customer: Confirm Ready").
export default function VendorStrip({ vendor }: { vendor: VendorInfo | null }) {
  if (!vendor) return null;
  return (
    <div className="vendor-strip">
      <span className="vendor-icon">
        {vendor.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- a data
          // URL stored on the vendor, not a servable static asset.
          <img src={vendor.logoUrl} alt="" />
        ) : (
          <StoreIcon />
        )}
      </span>
      <div>
        <strong>{vendor.name}</strong>
        <VendorContact vendor={vendor} />
      </div>
    </div>
  );
}

// "12 Allen Avenue, Ikeja · 0803 214 7765" with the phone tap-to-call.
export function VendorContact({ vendor }: { vendor: VendorInfo }) {
  if (!vendor.address && !vendor.phone) return null;
  return (
    <span>
      {vendor.address && <AddressPinIcon size={16} className="addr-pin" />}
      {vendor.address}
      {vendor.address && vendor.phone && " · "}
      {vendor.phone && <a href={telLink(vendor.phone)}>{displayPhone(vendor.phone)}</a>}
    </span>
  );
}
