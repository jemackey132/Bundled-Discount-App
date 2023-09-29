// @ts-nocheck
import { json, redirect } from "@remix-run/node";
import { cors } from "remix-utils";
import crypto from "crypto";
import { sessionStorage } from "../shopify.server";
import { shopifyApi, LATEST_API_VERSION } from "@shopify/shopify-api";
import db from "../db.server";

const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: LATEST_API_VERSION,
  scopes: process.env.SCOPES?.split(","),
  hostName: process.env.SHOPIFY_APP_URL || "",
});

export const loader = async ({ request }) => {
  const checkproxy = await verifyProxy(request);
  if (checkproxy == 401) {
    return redirect("", 401);
  }
  return cors(request, json({ my: "" }));
};

export async function action({ request }) {
  const checkproxy = await verifyProxy(request);
  if (checkproxy == 401) {
    return redirect("", 401);
  }

  const shop = request.headers.get("x-shop-domain");

  const session = await sessionStorage.findSessionsByShop(shop);

  const proxy = new shopify.clients.Graphql({
    session: session[0],
    apiVersion: LATEST_API_VERSION,
  });

  const body = await request.formData();

  const product_id = body.get("product_id");
  const req_type = body.get("type");

  const response = await proxy.query({
    data: {
      query: `query getProduct($id: ID!) {
            product(id:$id) {
                totalInventory
                hasOnlyDefaultVariant
                variants(first: 1) {
                nodes {
                    requiresComponents
                    productVariantComponents(first: 10) {
                    nodes {
                        quantity
                        id
                        productVariant {
                        id
                        image {
                            url
                        }
                        price
                        title
                        availableForSale
                        displayName
                        product {
                            title
                            featuredImage {
                            url
                            }
                            hasOnlyDefaultVariant
                        }
                        }
                    }
                    }
                }
                }
            }
          }`,
      variables: {
        id: `gid://shopify/Product/${product_id}`,
      },
    },
  });

  const responseJson = response.body;
  if (!req_type) {
    await db.bundle.update({
      where: { bundle_gid: `gid://shopify/Product/${product_id}` },
      data: { bundle_views: { increment: 1 } },
    });
  } else {
    await db.bundle.update({
      where: { bundle_gid: `gid://shopify/Product/${product_id}` },
      data: { bundle_clicks: { increment: 1 } },
    });
  }

  return cors(request, json({ responseJson }));
}

const verifyProxy = async (request) => {
  const url = new URL(request.url);
  const signature = url.searchParams.get("signature");
  url.searchParams.delete("signature");

  const searchParams = new URLSearchParams(url.searchParams);

  var arr = [];

  for (const [key, value] of searchParams.entries()) {
    arr.push([key, value]);
  }

  var sortedAndJoinArray = arr
    .sort()
    .map((value) => {
      return `${value[0]}=${value[1]}`;
    })
    .join("");

  const shopifySecret = process.env.SHOPIFY_API_SECRET;

  const hash = crypto
    .createHmac("sha256", shopifySecret)
    .update(sortedAndJoinArray)
    .digest("hex");

  if (hash !== signature) {
    return 401;
  }
};
