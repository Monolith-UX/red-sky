import { type CatalogItem, canWaitlist } from "@/lib/catalog";
import { FavoriteButton } from "./favorite-button";
import { WaitlistButton } from "./waitlist-button";

/**
 * The icon column in a product image's corner: the heart, and beneath it the
 * waitlist bell for anything that cannot be ordered yet. Tips open to the left
 * so the upper one never covers the lower.
 */
export function ProductActions({
  item,
  variant = "card",
}: {
  item: CatalogItem;
  variant?: "card" | "detail";
}) {
  return (
    <div className="flex flex-col items-center">
      <FavoriteButton slug={item.slug} name={item.name} variant={variant} />
      {canWaitlist(item) && <WaitlistButton item={item} variant={variant} />}
    </div>
  );
}
