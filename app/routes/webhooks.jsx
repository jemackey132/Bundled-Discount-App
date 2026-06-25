import { authenticate } from "../shopify.server";
import db from "../db.server";
import { checkBundleItem, checkBundle } from "../bundle.server";
import prisma from "../db.server";

// ─── GraphQL: fetch line items with offer-detection metafields ───────────────
async function getOrderLineItemsWithMetafields(orderId, graphql) {
  const res = await graphql(
    `query getOrderOfferData($id: ID!) {
      order(id: $id) {
        currentTotalPriceSet { shopMoney { amount } }
        lineItems(first: 50) {
          nodes {
            quantity
            originalUnitPriceSet { shopMoney { amount } }
            product {
              id
              metafields(identifiers: [
                { namespace: "custom", key: "volume_tiers" }
                { namespace: "custom", key: "bogo_rules" }
              ]) {
                nodes { namespace key value }
              }
            }
          }
        }
      }
    }`,
    { variables: { id: `gid://shopify/Order/${orderId}` } }
  );
  const { data } = await res.json();
  return data?.order ?? null;
}

export const action = async ({ request }) => {
  const { topic, shop, session, payload, admin } = await authenticate.webhook(
    request
  );
  console.log("check payload and admin: ", payload, admin);
  switch (topic) {
    case "APP_UNINSTALLED":
      if (session) {
        await db.session.deleteMany({ where: { shop } });
      }
      break;
    case "APP_SUBSCRIPTIONS_UPDATE": {
      const sub = payload?.app_subscription;
      const status = sub?.status?.toUpperCase();
      console.log(`APP_SUBSCRIPTIONS_UPDATE shop=${shop} status=${status} plan=${sub?.name}`);

      if (status && status !== "ACTIVE") {
        await prisma.appSetting.upsert({
          where: { shop_key: { shop, key: "subscriptionStatus" } },
          update: { value: status },
          create: { shop, key: "subscriptionStatus", value: status },
        });
        console.log(`Stored subscriptionStatus=${status} for ${shop}`);
      } else if (status === "ACTIVE") {
        await prisma.appSetting.upsert({
          where: { shop_key: { shop, key: "subscriptionStatus" } },
          update: { value: "ACTIVE" },
          create: { shop, key: "subscriptionStatus", value: "ACTIVE" },
        }).catch(() => {});
      }
      break;
    }
    case "CUSTOMERS_DATA_REQUEST":
    case "CUSTOMERS_REDACT":
    case "SHOP_REDACT":
      break;

    case "ORDERS_CREATE":
      if (session && admin) {
        console.log("ORDERS_CREATE payload id:", payload.id);
        const orderValue = parseFloat(payload.current_total_price) || 0;

        // ── 1. Fixed Bundle tracking (existing logic) ────────────────────────
        const lineItems = await checkBundleItem(
          { id: payload.id },
          admin.graphql
        );
        const bundleItem = lineItems.find((item) => item.lineItemGroup?.title);
        if (bundleItem) {
          const bundleName = bundleItem.lineItemGroup.title;
          const bundle = await checkBundle(bundleName, shop);
          if (bundle) {
            const newSales = parseFloat(
              (parseFloat(bundle.bundle_sales) + orderValue).toFixed(2)
            );
            await db.bundle.update({
              where: { id: bundle.id },
              data: { bundle_orders: { increment: 1 }, bundle_sales: newSales },
            });
            await db.bundleEvent.create({
              data: {
                bundle_id: bundle.id,
                shop,
                event_type: "order",
                value: orderValue,
                offer_type: "bundle",
                offer_id: bundle.id,
              },
            });
          }
        }

        // ── 2. Volume Discount + BOGO tracking ──────────────────────────────
        try {
          const orderData = await getOrderLineItemsWithMetafields(payload.id, admin.graphql);
          if (orderData) {
            const nodes = orderData.lineItems?.nodes ?? [];

            for (const item of nodes) {
              const productId = item.product?.id;
              if (!productId) continue;
              const metafields = item.product?.metafields?.nodes ?? [];
              const lineValue =
                parseFloat(item.originalUnitPriceSet?.shopMoney?.amount || "0") *
                (item.quantity || 1);

              // Volume Discount: product has custom.volume_tiers metafield
              const hasVolumeTiers = metafields.find(
                (m) => m.namespace === "custom" && m.key === "volume_tiers"
              );
              if (hasVolumeTiers) {
                const discount = await prisma.volumeDiscount.findFirst({
                  where: { shop, product_id: productId, status: true },
                });
                if (discount) {
                  await prisma.bundleEvent.create({
                    data: {
                      bundle_id: 0, // not a bundle
                      shop,
                      event_type: "order",
                      value: lineValue,
                      offer_type: "volume_discount",
                      offer_id: discount.id,
                    },
                  });
                  console.log(`VD order event: discount=${discount.id} value=${lineValue}`);
                }
              }

              // BOGO: buy product has custom.bogo_rules metafield
              const hasBogoRules = metafields.find(
                (m) => m.namespace === "custom" && m.key === "bogo_rules"
              );
              if (hasBogoRules) {
                const bogo = await prisma.buyXGetY.findFirst({
                  where: { shop, buy_product_id: productId, status: true },
                });
                if (bogo) {
                  await prisma.bundleEvent.create({
                    data: {
                      bundle_id: 0,
                      shop,
                      event_type: "order",
                      value: lineValue,
                      offer_type: "bogo",
                      offer_id: bogo.id,
                    },
                  });
                  console.log(`BOGO order event: bogo=${bogo.id} value=${lineValue}`);
                }
              }
            }
          }
        } catch (err) {
          console.error("Error writing VD/BOGO order events:", err);
        }
      }
      break;

    default:
      throw new Response("Unhandled webhook topic", { status: 404 });
  }

  throw new Response();
};
