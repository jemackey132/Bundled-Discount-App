// @ts-check

/**
 * Cart Transform: Customizable Bundle
 *
 * When a customer adds individual products that belong to a customizable
 * bundle, this function detects the complete set and merges them into a
 * grouped bundle with the configured percentage discount applied.
 *
 * Each component product variant must have these metafields (namespace: "custom"):
 *   component_parents:    JSON array of parent bundle variant GIDs
 *   component_quantities: JSON array of required quantities per bundle (parallel to component_parents)
 *   price_adjustment:     Percentage discount to apply when bundled (e.g. "10" for 10% off)
 *
 * @typedef {import("../generated/api").InputQuery} InputQuery
 * @typedef {import("../generated/api").FunctionResult} FunctionResult
 * @typedef {import("../generated/api").CartOperation} CartOperation
 */

/** @type {FunctionResult} */
const NO_CHANGES = { operations: [] };

export default /**
 * @param {InputQuery} input
 * @returns {FunctionResult}
 */
(input) => {
  const lines = input.cart.lines;

  // ── 1. Group component lines by their parent bundle variant GID ─────────────
  // Map: parentVariantGid → [{ cartLineId, quantity, requiredQty, priceAdjustment }]
  /** @type {Map<string, Array<{ cartLineId: string, quantity: number, requiredQty: number, priceAdjustment: number }>>} */
  const parentMap = new Map();

  for (const line of lines) {
    const { merchandise } = line;
    if (merchandise.__typename !== "ProductVariant") continue;

    const parentsRaw = merchandise.component_parents?.value;
    const quantitiesRaw = merchandise.component_quantities?.value;
    const priceRaw = merchandise.price_adjustment?.value;

    if (!parentsRaw) continue;

    let parents;
    let quantities;
    try {
      parents = JSON.parse(parentsRaw);
      quantities = quantitiesRaw ? JSON.parse(quantitiesRaw) : [];
    } catch {
      continue; // skip malformed metafields
    }

    if (!Array.isArray(parents) || parents.length === 0) continue;

    const discount = priceRaw ? parseFloat(priceRaw) : 0;

    parents.forEach((parentGid, idx) => {
      const requiredQty = quantities[idx] ?? 1;
      if (!parentMap.has(parentGid)) parentMap.set(parentGid, []);
      parentMap.get(parentGid).push({
        cartLineId: line.id,
        quantity: line.quantity,
        requiredQty,
        priceAdjustment: discount,
      });
    });
  }

  if (parentMap.size === 0) return NO_CHANGES;

  // ── 2. Build merge operations for complete bundle groups ────────────────────
  /** @type {CartOperation[]} */
  const operations = [];

  for (const [parentVariantId, components] of parentMap.entries()) {
    // Every component must have sufficient quantity in the cart
    const allPresent = components.every((c) => c.quantity >= c.requiredQty);
    if (!allPresent) continue;

    // How many complete bundles can we form?
    const bundleCount = Math.min(
      ...components.map((c) => Math.floor(c.quantity / c.requiredQty))
    );
    if (bundleCount < 1) continue;

    const percentageDiscount = components[0]?.priceAdjustment ?? 0;

    /** @type {CartOperation} */
    const mergeOp = {
      merge: {
        cartLines: components.map((c) => ({
          cartLineId: c.cartLineId,
          quantity: c.requiredQty * bundleCount,
        })),
        parentVariantId,
        ...(percentageDiscount > 0
          ? { price: { percentageDecrease: { value: percentageDiscount } } }
          : {}),
      },
    };

    operations.push(mergeOp);
  }

  return operations.length > 0 ? { operations } : NO_CHANGES;
};