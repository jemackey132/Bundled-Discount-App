import { authenticate } from "./shopify.server";
import shopify from "./shopify.server";
import db from "./db.server";
import fs from "fs";
import * as read from "node:fs/promises";
import FormData from "form-data";

import { sign } from "crypto";

export async function createProduct(data, graphql) {
  console.log(data);

  // Step 1: Create product without variants.
  // Shopify 2025-01+ removed `variants` from ProductInput — use productVariantsBulkUpdate instead.
  const createResponse = await graphql(
    `
      mutation CreateProductBundle($input: ProductInput!) {
        productCreate(input: $input) {
          product {
            id
            title
            handle
            variants(first: 1) {
              edges {
                node { id }
              }
            }
          }
          userErrors { field message }
        }
      }
    `,
    {
      variables: {
        input: {
          title: data.title,
          status: data.status,
          tags: ["super-bundle"],
        },
      },
    }
  );

  const createData = await createResponse.json();
  const createErrors = createData.data?.productCreate?.userErrors;
  if (createErrors?.length) {
    console.error("productCreate errors:", createErrors);
    throw new Error(createErrors[0].message);
  }

  const product = createData.data.productCreate.product;
  const defaultVariantId = product.variants.edges[0]?.node?.id;

  // Step 2: Update the default variant's price via productVariantsBulkUpdate.
  let finalPrice = String(data.price ?? 0);
  if (defaultVariantId) {
    const updateResponse = await graphql(
      `
        mutation UpdateBundleVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
          productVariantsBulkUpdate(productId: $productId, variants: $variants) {
            productVariants { id price compareAtPrice }
            userErrors { field message }
          }
        }
      `,
      {
        variables: {
          productId: product.id,
          variants: [
            {
              id: defaultVariantId,
              price: String(data.price ?? 0),
              compareAtPrice: data.compare_price ? String(data.compare_price) : null,
            },
          ],
        },
      }
    );

    const updateData = await updateResponse.json();
    const updateErrors = updateData.data?.productVariantsBulkUpdate?.userErrors;
    if (updateErrors?.length) {
      console.error("productVariantsBulkUpdate errors:", updateErrors);
    }
    const updatedVariant = updateData.data?.productVariantsBulkUpdate?.productVariants?.[0];
    if (updatedVariant) finalPrice = updatedVariant.price;
  }

  // Return same shape the bundle form action expects
  return {
    id: product.id,
    title: product.title,
    handle: product.handle,
    variants: {
      edges: [{ node: { id: defaultVariantId, price: finalPrice } }],
    },
  };
}

export async function updateProduct(data, graphql) {
  console.log(data);
  const response = await graphql(
    `
      mutation productUpdate($input: ProductInput!) {
        productUpdate(input: $input) {
          product {
            title
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
          id: data.id,
          title: data.title,
          status: data.status,
        },
      },
    }
  );

  const res = await response.json();

  return res;
}

export async function addProductMedia(data, graphql) {
  let handle = data.handle;
  let name = data.name;
  let path = data.path;
  let fileSize = data.fileSize;
  let type = data.type;
  console.log(data);
  const response = await graphql(
    `
      mutation generateStagedUploads($handle: String!, $mimeType: String!) {
        stagedUploadsCreate(
          input: [
            {
              filename: $handle
              httpMethod: POST
              mimeType: $mimeType
              resource: IMAGE
            }
          ]
        ) {
          stagedTargets {
            url
            resourceUrl
            parameters {
              name
              value
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
        handle: name,
        mimeType: "image/jpeg",
        resource: "FILE",
      },
    }
  );

  const res = await response.json();

  const target = res.data.stagedUploadsCreate.stagedTargets[0];
  const params = target.parameters; // Parameters contain all the sensitive info we'll need to interact with the aws bucket.
  const url = target.url; // This is the url you'll use to post data to aws or google. It's a generic s3 url that when combined with the params sends your data to the right place.
  const resourceUrl = target.resourceUrl; // This is the specific url that will contain your image data after you've uploaded the file to the aws staged target.
  console.log(res);

  const form = new FormData();

  // Add each of the params we received from Shopify to the form. this will ensure our ajax request has the proper permissions and s3 location data.
  params.forEach(({ name, value }) => {
    form.append(name, value);
  });

  let genpath = __dirname + "/../public/uploads/" + name;

  console.log(genpath);

  const file = await read.readFile(genpath); // This can be named whatever you'd like. You'll end up specifying the name when you upload the file to a staged target.
  const size = fs.statSync(genpath).size;

  console.log(size);
  // @ts-ignore
  // Add the file to the form.
  form.append("file", fs.createReadStream(genpath), {
    filename: name, // Specify the filename here
  });

  console.log(form);
  console.log(url);

  const uploadData = await fetch(url, {
    method: "POST",
    // @ts-ignore
    body: form,
    headers: {
      ...form.getHeaders(),
    },
  });
  console.log(uploadData);

  const upload = await graphql(
    `
      mutation fileCreate($files: [FileCreateInput!]!) {
        fileCreate(files: $files) {
          files {
            alt
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
        files: {
          alt: "alt-tag",
          contentType: "IMAGE",
          originalSource: resourceUrl, // Pass the resource url we generated above as the original source. Shopify will do the work of parsing that url and adding it to files.
        },
      },
    }
  );

  const resFile = await upload.json();

  console.log(resFile);

  return resourceUrl;
}

export async function attachMedia(data, graphql) {
  const mediaData = [
    {
      originalSource: data.media,
      mediaContentType: "IMAGE", // Adjust the media type as needed
    },
    // Add more media objects if needed
  ];
  const productId = data.id;

  // Define the GraphQL mutation
  const mutation = `
    mutation productCreateMedia($media: [CreateMediaInput!]!, $productId: ID!) {
      productCreateMedia(media: $media, productId: $productId) {
        media {
          id
        }
        mediaUserErrors {
          code
          field
          message
        }
        product {
          id
        }
      }
    }
  `;

  try {
    const response = await graphql(mutation, {
      variables: {
        media: mediaData,
        productId,
      },
    });

    const {
      data: {
        productCreateMedia: { media },
      },
    } = await response.json();

    return media;

  } catch (error) {
    console.error("Error:", error);
  }
}

export async function checkBundleItem(apidata, graphql) {
  try {
    const response = await graphql(
      `query getBundleItem($id: ID!) {
        order(id: $id) {
          lineItems(first: 10) {
            nodes {
              lineItemGroup {
                id
                quantity
                title
              }
            }
          }
        }
      }`,
      {
        variables: {
          id: `gid://shopify/Order/${apidata.id}`,
        },
      }
    );

    const { data: { order } } = await response.json();
    return order?.lineItems?.nodes ?? [];
  } catch (error) {
    console.error("Error:", error);
    return [];
  }
}

export async function getChannels(graphql) {
  const query = `{
    publications(first: 10) {
      nodes {
        id
        name
      }
    }
  }
  `;

  try {
    const response = await graphql(query);

    const {
      data: { publications },
    } = await response.json();
    console.log(publications);
    return publications;
  } catch (error) {
    console.error("Error:", error);
  }
}

export async function publishProduct(data, graphql) {
  const channels = await getChannels(graphql);

  console.log(channels);

  const channel = channels.nodes.find((obj) => obj.name === "Online Store");

  const mutation = `
  mutation publishablePublish($id: ID!, $input: [PublicationInput!]!) {
    publishablePublish(id: $id, input: $input) {
      publishable {
        availablePublicationCount
        publicationCount
      }
      shop {
        publicationCount
      }
      userErrors {
        field
        message
      }
    }
  }  
  `;

  try {
    const response = await graphql(mutation, {
      variables: {
        id: data.gid,
        input: {
          publicationId: channel.id,
        },
      },
    });

    const {
      data: { publishablePublishToCurrentChannel },
    } = await response.json();
    console.log(publishablePublishToCurrentChannel);
    return publishablePublishToCurrentChannel;
  } catch (error) {
    console.error("Error:", error);
  }
}

export async function updateComponents(data, graphql) {
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
            parentProductId: data.parentProductId,
            // parentProductVariantId: data.parentProductVariantId,
            productVariantRelationshipsToCreate: data.productVariant,
            // removeAllProductVariantRelationships: true,
            priceInput: {
              calculation: "FIXED",
              price: data.price,
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

export async function removeAllComponents(data, graphql) {
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
            parentProductId: data.parentProductId,
            // parentProductVariantId: data.parentProductVariantId,
            // productVariantRelationshipsToCreate: data.productVariant,
            removeAllProductVariantRelationships: true,
            // priceInput: {
            //   calculation: "NONE",
            // },
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
            parentProductId: data.parentProductId,
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

export async function checkBundle(title, shop) {
  const bundle = await db.bundle.findFirst({
    where: { shop: shop, bundle_title: title },
  });
  if (!bundle) return null;
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

const DEFAULT_TRANSLATIONS = {
  add_to_cart: "Add to cart",
  bundle_discount: "Bundle discount",
  save_badge: "Save {percent}%",
};

export function parseTranslations(raw) {
  try {
    const parsed = JSON.parse(raw || "{}");
    return { ...DEFAULT_TRANSLATIONS, ...parsed };
  } catch {
    return { ...DEFAULT_TRANSLATIONS };
  }
}

export async function getSettings(shop) {
  const settings = await db.bundleSettings.findUnique({ where: { shop } });
  if (!settings) {
    // Return defaults — row will be created on first save
    return {
      subscriptions_enabled: false,
      track_inventory: false,
      track_inventory_mode: "disabled",
      button_action: "cart",
      variant_selector: "color_swatch",
      product_pricing: "final_price",
      discount_application: "when_click",
      discount_combination: "when_click",
      translations: DEFAULT_TRANSLATIONS,
    };
  }
  return {
    ...settings,
    translations: parseTranslations(settings.translations),
  };
}

export async function saveSettings(shop, data) {
  const { translations, ...rest } = data;
  const payload = {
    ...rest,
    ...(translations !== undefined
      ? { translations: JSON.stringify(translations) }
      : {}),
  };
  return db.bundleSettings.upsert({
    where: { shop },
    update: payload,
    create: { shop, ...payload },
  });
}

export async function deleteBundle(id) {
  await db.bundle.delete({ where: { id: parseInt(id) } });
}

export async function archiveProduct(gid, graphql) {
  const response = await graphql(
    `mutation productUpdate($input: ProductInput!) {
      productUpdate(input: $input) {
        product { id status }
        userErrors { field message }
      }
    }`,
    { variables: { input: { id: gid, status: "ARCHIVED" } } }
  );
  return response.json();
}

