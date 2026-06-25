// @ts-nocheck
import { useState, useCallback, useEffect } from "react";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useNavigate, useSubmit, useNavigation, useActionData } from "@remix-run/react";
import {
  Page,
  Card,
  Text,
  VerticalStack,
  HorizontalStack,
  HorizontalGrid,
  TextField,
  Button,
  Select,
  Badge,
  Banner,
  Thumbnail,
  Box,
  Divider,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { checkBillingStatus } from "../billing.server";
import {
  getBuyXGetYOffer,
  createBuyXGetYOffer,
  updateBuyXGetYOffer,
  deleteBuyXGetYOffer,
  syncBogoMetafield,
} from "../bogo.server";
import welcome from "../../public/bandana-logo.svg";

export const loader = async ({ request, params }) => {
  const { billing } = await authenticate.admin(request);

  // Pro-only feature
  const { isPro } = await checkBillingStatus(billing).catch(() => ({ isPro: false }));
  if (!isPro) throw redirect("/app/plan?reason=upgrade&feature=bogo");

  if (params.id === "new") return json({ offer: null });
  const offer = await getBuyXGetYOffer(params.id);
  if (!offer) throw new Response("Not found", { status: 404 });
  return json({ offer });
};

export const action = async ({ request, params }) => {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();

  // Handle delete from dashboard
  if (formData.get("intent") === "delete") {
    await deleteBuyXGetYOffer(params.id);
    await syncBogoMetafield(session.shop, admin.graphql);
    return new Response(null, { status: 200 });
  }

  const title = formData.get("title");
  const status = formData.get("status") === "true";
  const buy_product_id = formData.get("buy_product_id");
  const buy_product_title = formData.get("buy_product_title");
  const buy_product_image = formData.get("buy_product_image") || null;
  const buy_quantity = parseInt(formData.get("buy_quantity") || "1");
  const get_product_id = formData.get("get_product_id");
  const get_product_title = formData.get("get_product_title");
  const get_product_image = formData.get("get_product_image") || null;
  const get_quantity = parseInt(formData.get("get_quantity") || "1");
  const discount_value = parseFloat(formData.get("discount_value") || "100");

  if (!buy_product_id || !get_product_id) {
    return json({ error: "Please select both a buy product and a get product." }, { status: 400 });
  }

  const data = {
    title,
    status,
    buy_product_id,
    buy_product_title,
    buy_product_image,
    buy_quantity,
    get_product_id,
    get_product_title,
    get_product_image,
    get_quantity,
    discount_value,
  };

  if (params.id === "new") {
    await createBuyXGetYOffer(session.shop, data);
  } else {
    await updateBuyXGetYOffer(params.id, data);
  }

  // Sync all active BOGO rules to the shop metafield for the Function
  await syncBogoMetafield(session.shop, admin.graphql);

  return json({ saved: true });
};

// ─── Product picker card ──────────────────────────────────────────────────────
function ProductCard({ label, product, onPick, quantity, onQuantityChange }) {
  return (
    <Card>
      <VerticalStack gap="4">
        <Text variant="headingSm" as="h3">{label}</Text>
        {product ? (
          <HorizontalStack gap="4" blockAlign="center">
            <Thumbnail
              source={product.image || welcome}
              alt={product.title}
              size="medium"
            />
            <VerticalStack gap="1">
              <Text variant="bodyMd" fontWeight="semibold" as="p">{product.title}</Text>
              <Text variant="bodySm" color="subdued" as="p">{product.id}</Text>
            </VerticalStack>
            <Button plain onClick={onPick}>Change</Button>
          </HorizontalStack>
        ) : (
          <div className="btn-primary-black">
            <Button onClick={onPick}>Select product</Button>
          </div>
        )}
        <TextField
          label="Quantity"
          type="number"
          min="1"
          value={String(quantity)}
          onChange={onQuantityChange}
          autoComplete="off"
        />
      </VerticalStack>
    </Card>
  );
}

// ─── Page component ───────────────────────────────────────────────────────────
export default function BogoForm() {
  const { offer } = useLoaderData();
  const actionData = useActionData();
  const nav = useNavigate();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const isNew = !offer;

  useEffect(() => {
    if (actionData?.saved) {
      window.shopify.toast.show("Offer saved!");
      setTimeout(() => window.shopify.navigate("/app/additional"), 1200);
    }
  }, [actionData]);

  const [title, setTitle] = useState(offer?.title || "");
  const [status, setStatus] = useState(offer?.status ?? true);

  const [buyProduct, setBuyProduct] = useState(
    offer
      ? { id: offer.buy_product_id, title: offer.buy_product_title, image: offer.buy_product_image }
      : null
  );
  const [buyQuantity, setBuyQuantity] = useState(String(offer?.buy_quantity ?? 1));

  const [getProduct, setGetProduct] = useState(
    offer
      ? { id: offer.get_product_id, title: offer.get_product_title, image: offer.get_product_image }
      : null
  );
  const [getQuantity, setGetQuantity] = useState(String(offer?.get_quantity ?? 1));
  const [discountValue, setDiscountValue] = useState(String(offer?.discount_value ?? 100));

  const [formError, setFormError] = useState(null);

  const pickProduct = useCallback(async (setter, titleSetter) => {
    const picked = await window.shopify.resourcePicker({ type: "product", multiple: false });
    if (picked?.length) {
      const p = picked[0];
      setter({ id: p.id, title: p.title, image: p.images?.[0]?.originalSrc || null });
    }
  }, []);

  const handleSave = useCallback(() => {
    setFormError(null);
    if (!title.trim()) { setFormError("Please enter a title."); return; }
    if (!buyProduct) { setFormError("Please select the Buy product."); return; }
    if (!getProduct) { setFormError("Please select the Get product."); return; }

    const fd = new FormData();
    fd.append("title", title);
    fd.append("status", String(status));
    fd.append("buy_product_id", buyProduct.id);
    fd.append("buy_product_title", buyProduct.title);
    fd.append("buy_product_image", buyProduct.image || "");
    fd.append("buy_quantity", buyQuantity);
    fd.append("get_product_id", getProduct.id);
    fd.append("get_product_title", getProduct.title);
    fd.append("get_product_image", getProduct.image || "");
    fd.append("get_quantity", getQuantity);
    fd.append("discount_value", discountValue);
    submit(fd, { method: "POST" });
  }, [title, status, buyProduct, buyQuantity, getProduct, getQuantity, discountValue, submit]);

  return (
    <Page
      title={isNew ? "Create Buy X Get Y offer" : `Edit: ${offer.title}`}
      backAction={{ content: "Offers", url: "/app/additional" }}
      primaryAction={
        <div className="btn-primary-black">
          <Button onClick={handleSave} loading={isSubmitting}>
            {isNew ? "Save offer" : "Save changes"}
          </Button>
        </div>
      }
      secondaryActions={[
        {
          content: status ? "Set to draft" : "Activate",
          onAction: () => setStatus((s) => !s),
        },
      ]}
    >
      <VerticalStack gap="5">
        {formError && (
          <Banner tone="critical" onDismiss={() => setFormError(null)}>
            {formError}
          </Banner>
        )}

        {/* Title + Status */}
        <Card>
          <VerticalStack gap="4">
            <HorizontalStack align="space-between" blockAlign="center">
              <Text variant="headingMd" as="h2">Details</Text>
              <Badge tone={status ? "success" : "info"}>{status ? "Active" : "Draft"}</Badge>
            </HorizontalStack>
            <TextField
              label="Title"
              value={title}
              onChange={setTitle}
              placeholder="e.g. Buy a shirt, get a hat 50% off"
              autoComplete="off"
            />
          </VerticalStack>
        </Card>

        {/* Buy + Get products */}
        <HorizontalGrid columns={2} gap="4">
          <ProductCard
            label="Buy product (trigger)"
            product={buyProduct}
            onPick={() => pickProduct(setBuyProduct)}
            quantity={buyQuantity}
            onQuantityChange={setBuyQuantity}
          />
          <ProductCard
            label="Get product (reward)"
            product={getProduct}
            onPick={() => pickProduct(setGetProduct)}
            quantity={getQuantity}
            onQuantityChange={setGetQuantity}
          />
        </HorizontalGrid>

        {/* Discount */}
        <Card>
          <VerticalStack gap="4">
            <Text variant="headingMd" as="h2">Discount on "Get" product</Text>
            <TextField
              label="Percentage off (%)"
              type="number"
              min="1"
              max="100"
              suffix="%"
              value={discountValue}
              onChange={setDiscountValue}
              autoComplete="off"
              helpText='Use 100 for "free". The discount applies to the quantity set above.'
            />
          </VerticalStack>
        </Card>

        {/* Preview */}
        {buyProduct && getProduct && (
          <Card>
            <VerticalStack gap="3">
              <Text variant="headingMd" as="h2">Preview</Text>
              <Divider />
              <HorizontalStack align="space-between" blockAlign="center">
                <Text variant="bodyMd" as="p">
                  Buy {buyQuantity}× <strong>{buyProduct.title}</strong>, get {getQuantity}× <strong>{getProduct.title}</strong>
                </Text>
                <Badge tone="success">
                  {discountValue === "100" ? "Free" : `${discountValue}% off`}
                </Badge>
              </HorizontalStack>
            </VerticalStack>
          </Card>
        )}
      </VerticalStack>
    </Page>
  );
}
