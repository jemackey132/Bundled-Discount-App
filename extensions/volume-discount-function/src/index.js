// @ts-nocheck
/**
 * Combined Discount Function
 *
 * Handles two discount types:
 *
 * 1. Volume Discounts — tiered percentage or fixed-amount discounts based on
 *    quantity. Rules stored as a JSON metafield on each product:
 *    namespace: "custom", key: "volume_tiers"
 *    Format: [{ min_quantity, discount_type, discount_value, label }]
 *
 * 2. Buy X Get Y (BOGO) — percentage discount on a "get" product when a
 *    "buy" product is present in the cart at sufficient quantity.
 *    Rules stored as a JSON shop metafield:
 *    namespace: "custom", key: "bogo_rules"
 *    Format: [{ id, buy_product_id, buy_quantity, get_product_id, get_quantity, discount_value }]
 */

const NO_CHANGES = {
  discounts: [],
  discountApplicationStrategy: "FIRST",
};

export function run(input) {
  const lines = input.cart.lines;
  if (!lines || lines.length === 0) return NO_CHANGES;

  const discounts = [];

  // ── 1. Volume discounts ────────────────────────────────────────────────────
  // Group cart lines by product ID, summing quantities
  const productMap = new Map();

  for (const line of lines) {
    const product = line.merchandise?.product;
    if (!product?.volume_tiers?.value) continue;

    const productId = product.id;
    if (!productMap.has(productId)) {
      productMap.set(productId, {
        totalQuantity: 0,
        tiers: JSON.parse(product.volume_tiers.value),
        variantId: line.merchandise.id,
      });
    }
    productMap.get(productId).totalQuantity += line.quantity;
  }

  for (const [, { totalQuantity, tiers, variantId }] of productMap) {
    const applicableTier = tiers
      .filter((t) => totalQuantity >= t.min_quantity)
      .sort((a, b) => b.min_quantity - a.min_quantity)[0];

    if (!applicableTier) continue;

    const value =
      applicableTier.discount_type === "percentage"
        ? { percentage: { value: applicableTier.discount_value.toString() } }
        : { fixedAmount: { amount: applicableTier.discount_value.toString() } };

    discounts.push({
      message: applicableTier.label || "Volume discount",
      targets: [{ productVariant: { id: variantId } }],
      value,
    });
  }

  // ── 2. Buy X Get Y ────────────────────────────────────────────────────────
  // bogo_rules is stored on the buy product as a JSON metafield.
  // Format: [{ id, buy_quantity, get_product_id, get_quantity, discount_value }]
  //
  // Build cart maps first (product ID → qty, product ID → variant IDs)
  const cartProductQty = new Map();
  const cartProductVariants = new Map();

  for (const line of lines) {
    const product = line.merchandise?.product;
    if (!product) continue;
    const pid = product.id;
    cartProductQty.set(pid, (cartProductQty.get(pid) || 0) + line.quantity);
    if (!cartProductVariants.has(pid)) cartProductVariants.set(pid, []);
    cartProductVariants.get(pid).push(line.merchandise.id);
  }

  for (const line of lines) {
    const product = line.merchandise?.product;
    if (!product?.bogo_rules?.value) continue;

    let bogoRules;
    try {
      bogoRules = JSON.parse(product.bogo_rules.value);
    } catch (e) {
      continue;
    }

    const buyQtyInCart = cartProductQty.get(product.id) || 0;

    for (const rule of bogoRules) {
      if (buyQtyInCart < rule.buy_quantity) continue;

      // Buy condition met — discount the get-product's variant(s) in cart
      const getVariants = cartProductVariants.get(rule.get_product_id);
      if (!getVariants || getVariants.length === 0) continue;

      for (const variantId of getVariants) {
        discounts.push({
          message: `Buy ${rule.buy_quantity}+, get ${rule.discount_value === 100 ? "free" : `${rule.discount_value}% off`}`,
          targets: [{ productVariant: { id: variantId } }],
          value: { percentage: { value: String(rule.discount_value) } },
        });
      }
    }
  }

  if (discounts.length === 0) return NO_CHANGES;

  return {
    discounts,
    discountApplicationStrategy: "MAXIMUM",
  };
}
