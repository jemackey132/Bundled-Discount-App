// @ts-nocheck
import { useState, useCallback } from "react";
import { json, redirect } from "@remix-run/node";
import { useEffect } from "react";
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
  Divider,
  Badge,
  Banner,
  Thumbnail,
  Icon,
  Box,
  Spinner,
} from "@shopify/polaris";
import { DeleteIcon, PlusIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import { checkBillingStatus } from "../billing.server";
import {
  createVolumeDiscount,
  updateVolumeDiscount,
  getVolumeDiscount,
  setProductVolumeTiersMetafield,
} from "../volume_discount.server";
import welcome from "../../public/bandana-logo.svg";

export const loader = async ({ request, params }) => {
  const { billing } = await authenticate.admin(request);

  // Free plan gate: volume discounts are Pro-only
  if (params.id === "new") {
    const { isPro } = await checkBillingStatus(billing);
    if (!isPro) {
      throw redirect("/app/plan?reason=upgrade&feature=volume_discounts");
    }
  }

  if (params.id === "new") return json({ discount: null });
  const discount = await getVolumeDiscount(params.id);
  if (!discount) throw new Response("Not found", { status: 404 });
  return json({ discount });
};

export const action = async ({ request, params }) => {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();

  const title = formData.get("title");
  const status = formData.get("status") === "true";
  const product_id = formData.get("product_id");
  const product_title = formData.get("product_title");
  const product_image = formData.get("product_image") || null;

  // Tiers arrive as JSON string
  const tiers = JSON.parse(formData.get("tiers") || "[]");

  if (!product_id || tiers.length === 0) {
    return json({ error: "Please select a product and add at least one tier." }, { status: 400 });
  }

  // Validate tiers
  for (const tier of tiers) {
    if (!tier.min_quantity || tier.min_quantity < 1) {
      return json({ error: "All tiers must have a minimum quantity of at least 1." }, { status: 400 });
    }
    if (!tier.discount_value || tier.discount_value <= 0) {
      return json({ error: "All tiers must have a discount value greater than 0." }, { status: 400 });
    }
  }

  const discountData = { title, status, product_id, product_title, product_image };

  let discount;
  if (params.id === "new") {
    discount = await createVolumeDiscount(session.shop, { ...discountData, tiers });
  } else {
    discount = await updateVolumeDiscount(params.id, { ...discountData, tiers });
  }

  // Push tier data as metafield to the product so the Function can read it
  await setProductVolumeTiersMetafield(admin, product_id, discount.tiers);

  return json({ saved: true });
};

// ─── Tier row component ────────────────────────────────────────────────────────
function TierRow({ tier, index, onChange, onDelete, isOnly }) {
  return (
    <Card>
      <VerticalStack gap="4">
        <HorizontalStack align="space-between" blockAlign="center">
          <Text variant="headingSm" as="p">Tier {index + 1}</Text>
          {!isOnly && (
            <Button plain tone="critical" icon={DeleteIcon} onClick={onDelete} accessibilityLabel="Remove tier" />
          )}
        </HorizontalStack>
        <HorizontalGrid columns={3} gap="4">
          <TextField
            label="Min quantity"
            type="number"
            min="1"
            value={String(tier.min_quantity)}
            onChange={(v) => onChange({ ...tier, min_quantity: v })}
            autoComplete="off"
            helpText="Discount triggers when cart has ≥ this quantity"
          />
          <Select
            label="Discount type"
            options={[
              { label: "Percentage (%)", value: "percentage" },
              { label: "Fixed amount ($)", value: "fixed" },
            ]}
            value={tier.discount_type}
            onChange={(v) => onChange({ ...tier, discount_type: v })}
          />
          <TextField
            label={tier.discount_type === "percentage" ? "Discount (%)" : "Discount ($)"}
            type="number"
            min="0.01"
            step="0.01"
            value={String(tier.discount_value)}
            onChange={(v) => onChange({ ...tier, discount_value: v })}
            prefix={tier.discount_type === "fixed" ? "$" : undefined}
            suffix={tier.discount_type === "percentage" ? "%" : undefined}
            autoComplete="off"
          />
        </HorizontalGrid>
        <TextField
          label="Label (optional)"
          value={tier.label || ""}
          onChange={(v) => onChange({ ...tier, label: v })}
          placeholder={`e.g. Buy ${tier.min_quantity}+, save ${tier.discount_value}${tier.discount_type === "percentage" ? "%" : "$"}`}
          autoComplete="off"
          helpText="Shown to customers at checkout"
        />
      </VerticalStack>
    </Card>
  );
}

// ─── Page component ───────────────────────────────────────────────────────────
export default function VolumeDiscountForm() {
  const { discount } = useLoaderData();
  const actionData = useActionData();
  const nav = useNavigate();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  useEffect(() => {
    if (actionData?.saved) {
      window.shopify.toast.show("Discount saved!");
      setTimeout(() => window.shopify.navigate("/app/additional"), 1200);
    }
  }, [actionData]);

  const isNew = !discount;

  const [title, setTitle] = useState(discount?.title || "");
  const [status, setStatus] = useState(discount?.status ?? true);
  const [product, setProduct] = useState(
    discount
      ? { id: discount.product_id, title: discount.product_title, image: discount.product_image }
      : null
  );
  const [tiers, setTiers] = useState(
    discount?.tiers?.length
      ? discount.tiers.map((t) => ({
          min_quantity: t.min_quantity,
          discount_type: t.discount_type,
          discount_value: t.discount_value,
          label: t.label || "",
        }))
      : [{ min_quantity: 2, discount_type: "percentage", discount_value: 10, label: "" }]
  );
  const [formError, setFormError] = useState(null);

  const openProductPicker = useCallback(async () => {
    const picked = await window.shopify.resourcePicker({
      type: "product",
      multiple: false,
    });
    if (picked?.length) {
      const p = picked[0];
      setProduct({
        id: p.id,
        title: p.title,
        image: p.images?.[0]?.originalSrc || null,
      });
      if (!title) setTitle(`Volume discount - ${p.title}`);
    }
  }, [title]);

  const addTier = useCallback(() => {
    const lastMin = tiers[tiers.length - 1]?.min_quantity || 1;
    setTiers((prev) => [
      ...prev,
      { min_quantity: parseInt(lastMin) + 3, discount_type: "percentage", discount_value: 10, label: "" },
    ]);
  }, [tiers]);

  const updateTier = useCallback((index, updated) => {
    setTiers((prev) => prev.map((t, i) => (i === index ? updated : t)));
  }, []);

  const removeTier = useCallback((index) => {
    setTiers((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSave = useCallback(() => {
    setFormError(null);
    if (!title.trim()) { setFormError("Please enter a title."); return; }
    if (!product) { setFormError("Please select a product."); return; }
    if (tiers.length === 0) { setFormError("Add at least one tier."); return; }

    // Sort tiers by min_quantity ascending before saving
    const sortedTiers = [...tiers].sort((a, b) => a.min_quantity - b.min_quantity);

    const fd = new FormData();
    fd.append("title", title);
    fd.append("status", String(status));
    fd.append("product_id", product.id);
    fd.append("product_title", product.title);
    fd.append("product_image", product.image || "");
    fd.append("tiers", JSON.stringify(sortedTiers));
    submit(fd, { method: "POST" });
  }, [title, status, product, tiers, submit]);

  return (
    <Page
      title={isNew ? "Create volume discount" : `Edit: ${discount.title}`}
      backAction={{ content: "Offers", url: "/app/additional" }}
      primaryAction={
        <div className="btn-primary-black">
          <Button onClick={handleSave} loading={isSubmitting}>
            {isNew ? "Save discount" : "Save changes"}
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
              placeholder="e.g. Summer tee quantity breaks"
              autoComplete="off"
            />
          </VerticalStack>
        </Card>

        {/* Product */}
        <Card>
          <VerticalStack gap="4">
            <Text variant="headingMd" as="h2">Product</Text>
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
                <Button plain onClick={openProductPicker}>Change</Button>
              </HorizontalStack>
            ) : (
              <div className="btn-primary-black">
                <Button onClick={openProductPicker}>Select product</Button>
              </div>
            )}
          </VerticalStack>
        </Card>

        {/* Tiers */}
        <Card>
          <VerticalStack gap="4">
            <HorizontalStack align="space-between" blockAlign="center">
              <VerticalStack gap="1">
                <Text variant="headingMd" as="h2">Discount tiers</Text>
                <Text variant="bodySm" color="subdued" as="p">
                  The highest tier the cart quantity qualifies for is applied automatically at checkout.
                </Text>
              </VerticalStack>
              <Button icon={PlusIcon} onClick={addTier}>Add tier</Button>
            </HorizontalStack>
            <Divider />
            <VerticalStack gap="3">
              {tiers.map((tier, index) => (
                <TierRow
                  key={index}
                  tier={tier}
                  index={index}
                  onChange={(updated) => updateTier(index, updated)}
                  onDelete={() => removeTier(index)}
                  isOnly={tiers.length === 1}
                />
              ))}
            </VerticalStack>
          </VerticalStack>
        </Card>

        {/* Preview */}
        <Card>
          <VerticalStack gap="3">
            <Text variant="headingMd" as="h2">Preview</Text>
            <Text variant="bodySm" color="subdued" as="p">
              How the tiers appear to customers
            </Text>
            <Divider />
            {[...tiers]
              .sort((a, b) => a.min_quantity - b.min_quantity)
              .map((tier, i) => (
                <HorizontalStack key={i} align="space-between" blockAlign="center">
                  <Text variant="bodyMd" as="p">
                    Buy {tier.min_quantity}+{" "}
                    {tier.label ? `— ${tier.label}` : ""}
                  </Text>
                  <Badge tone="success">
                    {tier.discount_type === "percentage"
                      ? `${tier.discount_value}% off`
                      : `$${tier.discount_value} off`}
                  </Badge>
                </HorizontalStack>
              ))}
          </VerticalStack>
        </Card>
      </VerticalStack>
    </Page>
  );
}
