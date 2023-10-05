import { authenticate } from "../shopify.server";
import db from "../db.server";
import { checkBundleItem, checkBundle } from "../bundle.server";
import shopify from "../shopify.server";

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
    case "CUSTOMERS_DATA_REQUEST":
    case "CUSTOMERS_REDACT":
    case "SHOP_REDACT":
    case "ORDERS_CREATE":
      if (session) {
        // @ts-ignore
        console.log(payload.id);
        // @ts-ignore
        console.log(admin.graphql.query);
        // var client = new shopify.clients.Graphql({session});
        const getOrder = await checkBundleItem(
          { id: payload.id },
          admin.graphql
        );
        const bundleName = getOrder[0].lineItemGroup.title;
        const getBundle = await checkBundle(bundleName, shop);
        console.log("getBundle: ", getBundle);
        console.log("bundle Name: ", bundleName);

        if (getBundle) {
          let oldSales = getBundle.bundle_sales;
          oldSales += payload.current_total_price;
          await db.bundle.update({
            where: { id: getBundle.id },
            data: { bundle_orders: { increment: 1 }, bundle_sales: oldSales },
          });
        }

        console.log(getBundle);
      }
      break;
    default:
      throw new Response("Unhandled webhook topic", { status: 404 });
  }

  throw new Response();
};
