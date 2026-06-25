import prisma from "./db.server";

// ─── AppSetting helpers ────────────────────────────────────────────────────

async function getAppSetting(shop, key) {
  const row = await prisma.appSetting.findUnique({
    where: { shop_key: { shop, key } },
  });
  return row?.value ?? null;
}

async function setAppSetting(shop, key, value) {
  await prisma.appSetting.upsert({
    where: { shop_key: { shop, key } },
    create: { shop, key, value },
    update: { value },
  });
}

// ─── Automatic discount registration ──────────────────────────────────────

/**
 * Ensures one automatic discount backed by the volume-discount-function exists
 * for this shop. Safe to call on every page load — re-creates only if missing.
 */
export async function ensureVolumeDiscountRegistered(admin, shop) {
  const SETTING_KEY = "volume_discount_automatic_gid";

  // 1. Check if we already have one stored
  const storedGid = await getAppSetting(shop, SETTING_KEY);
  if (storedGid) {
    // Verify it still exists in Shopify (merchant may have deleted it)
    const checkRes = await admin.graphql(
      `#graphql
      query CheckDiscount($id: ID!) {
        automaticDiscountNode(id: $id) { id }
      }`,
      { variables: { id: storedGid } }
    );
    const checkData = await checkRes.json();
    if (checkData.data?.automaticDiscountNode?.id) {
      return storedGid; // Already registered and alive
    }
    // Stale — fall through to re-create
  }

  // 2. Find the volume-discount-function by title
  const fnRes = await admin.graphql(`#graphql
    query {
      shopifyFunctions(first: 25) {
        nodes { id title apiType }
      }
    }
  `);
  const fnData = await fnRes.json();
  const fn = fnData.data?.shopifyFunctions?.nodes?.find(
    (f) => f.apiType === "product_discounts"
  );

  if (!fn) {
    console.warn(
      "[volume-discount] Function not found in shopifyFunctions — skipping registration. " +
      "Make sure the dev server is running with the extension deployed."
    );
    return null;
  }

  // 3. Create the automatic discount
  const createRes = await admin.graphql(
    `#graphql
    mutation CreateAutomaticVolumeDiscount($input: DiscountAutomaticAppInput!) {
      discountAutomaticAppCreate(automaticAppDiscount: $input) {
        automaticAppDiscount { discountId }
        userErrors { field message }
      }
    }`,
    {
      variables: {
        input: {
          title: "Super Bundle – Volume Discount",
          functionId: fn.id,
          startsAt: new Date().toISOString(),
          combinesWith: {
            orderDiscounts: true,
            shippingDiscounts: true,
            productDiscounts: false,
          },
        },
      },
    }
  );

  const createData = await createRes.json();
  const errors = createData.data?.discountAutomaticAppCreate?.userErrors;
  if (errors?.length) {
    console.error("[volume-discount] discountAutomaticAppCreate errors:", errors);
    return null;
  }

  const discountId =
    createData.data?.discountAutomaticAppCreate?.automaticAppDiscount?.discountId;

  if (discountId) {
    await setAppSetting(shop, SETTING_KEY, discountId);
    console.log("[volume-discount] Registered automatic discount:", discountId);
  }

  return discountId ?? null;
}

// ─── Volume discount CRUD ──────────────────────────────────────────────────

/** Fetch all volume discounts for a shop */
export async function getVolumeDiscounts(shop) {
  return await prisma.volumeDiscount.findMany({
    where: { shop },
    include: { tiers: { orderBy: { min_quantity: "asc" } } },
    orderBy: { created_at: "desc" },
  });
}

/** Fetch a single volume discount by ID */
export async function getVolumeDiscount(id) {
  return await prisma.volumeDiscount.findUnique({
    where: { id: parseInt(id) },
    include: { tiers: { orderBy: { min_quantity: "asc" } } },
  });
}

/** Create a new volume discount with its tiers */
export async function createVolumeDiscount(shop, data) {
  const { tiers, ...discountData } = data;
  return await prisma.volumeDiscount.create({
    data: {
      ...discountData,
      shop,
      tiers: {
        create: tiers.map(({ min_quantity, discount_type, discount_value, label }) => ({
          min_quantity: parseInt(min_quantity),
          discount_type,
          discount_value: parseFloat(discount_value),
          label: label || null,
        })),
      },
    },
    include: { tiers: { orderBy: { min_quantity: "asc" } } },
  });
}

/** Update an existing volume discount and replace its tiers */
export async function updateVolumeDiscount(id, data) {
  const { tiers, ...discountData } = data;
  const numId = parseInt(id);

  await prisma.volumeTier.deleteMany({ where: { volume_discount_id: numId } });

  return await prisma.volumeDiscount.update({
    where: { id: numId },
    data: {
      ...discountData,
      tiers: {
        create: tiers.map(({ min_quantity, discount_type, discount_value, label }) => ({
          min_quantity: parseInt(min_quantity),
          discount_type,
          discount_value: parseFloat(discount_value),
          label: label || null,
        })),
      },
    },
    include: { tiers: { orderBy: { min_quantity: "asc" } } },
  });
}

/** Delete a volume discount (tiers cascade) */
export async function deleteVolumeDiscount(id) {
  return await prisma.volumeDiscount.delete({
    where: { id: parseInt(id) },
  });
}

/** Toggle active/draft status */
export async function toggleVolumeDiscountStatus(id, status) {
  return await prisma.volumeDiscount.update({
    where: { id: parseInt(id) },
    data: { status },
  });
}

/**
 * Set the volume_tiers metafield on a Shopify product.
 * Called after creating/updating a volume discount so the Function can read it.
 */
export async function setProductVolumeTiersMetafield(admin, productId, tiers) {
  const tiersJson = JSON.stringify(
    tiers.map(({ min_quantity, discount_type, discount_value, label }) => ({
      min_quantity: parseInt(min_quantity),
      discount_type,
      discount_value: parseFloat(discount_value),
      label: label || "",
    }))
  );

  const response = await admin.graphql(
    `#graphql
    mutation SetVolumeTiers($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields { id key value }
        userErrors { field message }
      }
    }`,
    {
      variables: {
        metafields: [
          {
            ownerId: productId,
            namespace: "custom",
            key: "volume_tiers",
            type: "json",
            value: tiersJson,
          },
        ],
      },
    }
  );

  const json = await response.json();
  const errors = json.data?.metafieldsSet?.userErrors;
  if (errors?.length) {
    console.error("Metafield set errors:", errors);
  }
  return json;
}

/**
 * Delete the volume_tiers metafield from a product when a discount is deleted.
 */
export async function deleteProductVolumeTiersMetafield(admin, productId) {
  // First find the metafield ID
  const findResponse = await admin.graphql(
    `#graphql
    query GetMetafield($id: ID!) {
      product(id: $id) {
        metafield(namespace: "custom", key: "volume_tiers") {
          id
        }
      }
    }`,
    { variables: { id: productId } }
  );
  const findJson = await findResponse.json();
  const metafieldId = findJson.data?.product?.metafield?.id;
  if (!metafieldId) return;

  await admin.graphql(
    `#graphql
    mutation DeleteMetafield($id: ID!) {
      metafieldDelete(input: { id: $id }) {
        userErrors { field message }
      }
    }`,
    { variables: { id: metafieldId } }
  );
}
