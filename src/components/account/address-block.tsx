import type { Address } from "@/lib/account";

/** A delivery address as the courier's label would print it. */
export function AddressBlock({ address, className = "" }: { address: Address; className?: string }) {
  return (
    <address className={`not-italic leading-relaxed ${className}`}>
      {address.recipient}
      {address.organisation && <><br />{address.organisation}</>}
      <br />
      {address.line1}
      {address.line2 && `, ${address.line2}`}
      <br />
      {address.city}, {address.region} {address.postal}
      <br />
      {address.country}
      {address.phone && <><br />{address.phone}</>}
    </address>
  );
}
