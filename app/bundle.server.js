import { authenticate } from "./shopify.server";
import shopify from "./shopify.server";
import db from "./db.server";
import fs from "fs";
import * as read from "node:fs/promises";
import FormData from "form-data";

import { sign } from "crypto";

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
          status: data.status,
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
  // const size = fs.statSync(handle).size;

  // console.log(file)
  // console.log(size)
  // Add the file to the form.
  // @ts-ignore
  // Add the file to the form.
  form.append("file", fs.createReadStream(genpath), {
    filename: name, // Specify the filename here
  });
  // form.append("file", file);

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

  // console.log(await uploadData)

  // // Headers
  // const headers = {
  //   "Content-Type": "multipart/form-data",
  //   "Content-Length": size,
  // };
  // // if (url.includes("amazon")) {
  // //   // Need to include the content length for Amazon uploads. If uploading to googleapis then the content-length header will break it.
  // //   headers["Content-Length"] = 5000; // AWS requires content length to be included in the headers. This may not be automatically passed so you'll need to specify. And ... add 5000 to ensure the upload works. Or else there will be an error saying the data isn't formatted properly.
  // // }

  // const resform = await fetch(url, {
  //   method: "POST",
  //   body: form,
  //   // @ts-ignore
  //   headers: headers,
  // });
  // console.log(resform);
  // console.log(await resform.json())

  // console.log(resourceUrl);
  // const createFileQuery = ``;

  // // Variables
  // const createFileVariables = {
  //   files: {
  //     alt: "alt-tag",
  //     contentType: "IMAGE",
  //     originalSource: resourceUrl, // Pass the resource url we generated above as the original source. Shopify will do the work of parsing that url and adding it to files.
  //   },
  // };

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

  // const attachFileres = await graphql(
  //   `
  //     mutation productCreateMedia(
  //       $media: [CreateMediaInput!]!
  //       $productId: ID!
  //     ) {
  //       productCreateMedia(media: $media, productId: $productId) {
  //         media {
  //           id
  //         }
  //         mediaUserErrors {
  //           code
  //           details
  //           message
  //         }
  //         product {
  //           id
  //         }
  //       }
  //     }
  //   `,
  //   {
  //     variables: {
  //       resourceUrl,
  //       productId,
  //     },
  //   }
  // );

  // const attachFile = await attachFileres.json();
  // const upload = await graphql(createFileQuery, createFileVariables);

  // console.log(await upload.json());
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
    // const responseData = response.data; // Access the response data
    // console.log(responseData); // Handle the response data here
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

export async function updateBundle(id, data) {
  const bundle = await db.bundle.update({
    where: { id: parseInt(id) },
    data: data,
  });
  if (!bundle) return [];
  return bundle;
}
