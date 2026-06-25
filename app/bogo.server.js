// @ts-nocheck
import db from "./db.server";

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function getBuyXGetYOffers(shop) {
  return db.buyXGetY.findMany({ where: { shop }, orderBy: { created_at: "desc" } });
}

export async function getBuyXGetYOffer(id) {
  return db.buyXGetY.findUnique({ where: { id: parseInt(id) } });
}

export async function createBuyXGetYOffer(shop, data) {
  return db.buyXGetY.create({ data: { shop, ...data } });
}

export async function updateBuyXGetYOffer(id, data) {
  return db.buyXGetY.update({ where: { id: parseInt(id) }, data });
}

export async function deleteBuyXGetYOffer(id) {
  await db.buyXGetY.delete({ where: { id: parseInt(id) } });
}

// ─── Buy-product metafield sync ───────────────────────────────────────────────
// After any create/update/delete, re-sync the bogo_rules metafield on every
// buy product that has active rules. Rules are grouped by buy_product_id so
// one product can trigger multiple BOGO offers.
//
// Metafield: namespace "custom", key "bogo_rules", type "json"
// Format per product: [{ id, buy_quantity, get_product_id, get_quantity, discount_value }]

export async function syncBogoMetafield(shop, graphql) {
  const offers = await db.buyXGetY.findMany({ where: { shop } });

  // Group active rules by buy_product_id
  const byBuyProduct = new Map();
  for (const o of offers) {
    if (!byBuyProduct.has(o.buy_product_id)) byBuyProduct.set(o.buy_product_id, []);
    if (o.status) {
      byBuyProduct.get(o.buy_product_id).push({
        id: o.id,
        buy_quantity: o.buy_quantity,
        get_product_id: o.get_product_id,
        get_quantity: o.get_quantity,
        discount_value: o.discount_value,
      });
    }
  }

  // Collect all unique buy product IDs (including inactive ones to clear stale metafields)
  const allBuyProductIds = [...new Set(offers.map((o) => o.buy_product_id))];

  // Build metafieldsSet inputs — one per buy product
  const metafields = allBuyProductIds.map((productId) => ({
    ownerId: productId,
    namespace: "custom",
    key: "bogo_rules",
    type: "json",
    value: JSON.stringify(byBuyProduct.get(productId) ?? []),
  }));

  if (metafields.length === 0) return;

  const res = await graphql(
    `mutation SetBogoRules($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields { id ownerId key }
        userErrors { field message }
      }
    }`,
    { variables: { metafields } }
  );
  const resData = await res.json();
  const errors = resData.data?.metafieldsSet?.userErrors;
  if (errors?.length) console.error("syncBogoMetafield errors:", errors);
}
