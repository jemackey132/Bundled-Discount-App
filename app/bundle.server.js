import { authenticate } from "./shopify.server";
import shopify from "./shopify.server";
import db from "./db.server";

export async function createProduct(data, graphql) {
  console.log(data);
  const response = await graphql(
    `
      mutation CreateProductBundle($input: ProductInput!) {
        productCreate(input: $input) {
          product {
            id
            title
            handle
            variants(first: 10) {
              edges {
                node {
                  id
                  price
                }
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `,
    {
      variables: {
        input: {
          title: data.title,
          status: "ACTIVE",
          variants: [
            {
              price: data.price,
              compareAtPrice: data.compare_price,
            },
          ],
        },
      },
    }
  );

  const {
    data: {
      productCreate: { product },
    },
  } = await response.json();

  return product;
}

export async function addComponents(data, graphql) {
  const response = await graphql(
    `
      mutation CreateBundleComponents(
        $input: [ProductVariantRelationshipUpdateInput!]!
      ) {
        productVariantRelationshipBulkUpdate(input: $input) {
          parentProductVariants {
            id
            productVariantComponents(first: 10) {
              nodes {
                id
                quantity
                productVariant {
                  id
                }
              }
            }
          }
          userErrors {
            code
            field
            message
          }
        }
      }
    `,
    {
      variables: {
        input: [
          {
            parentProductId:data.parentProductId,
            // parentProductVariantId: data.parentProductVariantId,
            productVariantRelationshipsToCreate: data.productVariant,
            removeAllProductVariantRelationships: true,
            priceInput: {
              calculation: "NONE",
            },
          },
        ],
      },
    }
  );

  const {
    data: {
      productVariantRelationshipBulkUpdate: { parentProductVariants },
    },
  } = await response.json();

  return parentProductVariants;
}

export async function addBundle(data) {
  const createdBundle = await db.bundle.create({
    data: data,
  });
  return createdBundle;
}

export async function getBundles(shop) {
  const bundles = await db.bundle.findMany({
    where: { shop: shop },
  });
  if (bundles.length === 0) return [];
  return bundles;
}

export async function getBundle(shop, id) {
  const bundle = await db.bundle.findFirst({
    where: { shop: shop, id: parseInt(id) },
  });
  if (!bundle) return [];
  return bundle;
}

export async function updateBundle(id, data) {
  const bundle = await db.bundle.update({
    where: { id: parseInt(id) },
    data: data,
  });
  if (!bundle) return [];
  return bundle;
}
