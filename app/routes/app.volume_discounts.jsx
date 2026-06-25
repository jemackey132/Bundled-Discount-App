// @ts-nocheck
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useNavigate, useFetcher, useSearchParams } from "@remix-run/react";
import { useCallback, useState, useEffect } from "react";
import {
  Page,
  Card,
  Button,
  Text,
  HorizontalStack,
  VerticalStack,
  Badge,
  IndexTable,
  useIndexResourceState,
  EmptyState,
  Thumbnail,
  Icon,
  Modal,
} from "@shopify/polaris";
import { PlusIcon, EditIcon, DeleteIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import { checkBillingStatus } from "../billing.server";
import { getVolumeDiscounts, deleteVolumeDiscount, deleteProductVolumeTiersMetafield, ensureVolumeDiscountRegistered } from "../volume_discount.server";
import welcome from "../../public/bandana-logo.svg";

export const loader = async ({ request }) => {
  // Redirect GET requests — the volume discounts list is now part of the unified Offers page
  await authenticate.admin(request);
  throw redirect("/app/additional");

  const { admin, session, billing } = await authenticate.admin(request);
  const discounts = await getVolumeDiscounts(session.shop);
  const { isPro } = await checkBillingStatus(billing).catch(() => ({ isPro: false }));

  // Register the volume-discount-function as an automatic discount if not yet done.
  // Non-fatal — UI still works even if this fails (e.g. function not yet deployed).
  try {
    await ensureVolumeDiscountRegistered(admin, session.shop);
  } catch (e) {
    console.error("[volume-discount] Registration error:", e);
  }

  return json({ discounts, isPro });
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "delete") {
    const id = formData.get("id");
    const productId = formData.get("product_id");
    await deleteProductVolumeTiersMetafield(admin, productId);
    await deleteVolumeDiscount(id);
    return json({ success: true });
  }

  return json({ error: "Unknown intent" }, { status: 400 });
};

export default function VolumeDiscountsPage() {
  const { discounts, isPro } = useLoaderData();
  const nav = useNavigate();
  const fetcher = useFetcher();
  const [searchParams] = useSearchParams();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const handleCreate = useCallback(() => {
    if (!isPro) {
      setUpgradeOpen(true);
    } else {
      nav("/app/volume_discount_form/new");
    }
  }, [isPro, nav]);

  useEffect(() => {
    if (searchParams.get("saved") === "1") {
      window.shopify?.toast?.show("Volume discount saved!");
      nav("/app/volume_discounts", { replace: true });
    }
  }, [searchParams, nav]);

  const resourceName = { singular: "volume discount", plural: "volume discounts" };
  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(discounts);

  const handleDelete = useCallback((id, productId) => {
    if (!confirm("Delete this volume discount? This will also remove the discount from the product.")) return;
    const fd = new FormData();
    fd.append("intent", "delete");
    fd.append("id", id);
    fd.append("product_id", productId);
    fetcher.submit(fd, { method: "POST" });
  }, [fetcher]);

  const rowMarkup = discounts.map(({ id, title, status, product_title, product_image, tiers }, index) => (
    <IndexTable.Row
      id={String(id)}
      key={id}
      selected={selectedResources.includes(String(id))}
      position={index}
    >
      <IndexTable.Cell>
        <HorizontalStack gap="3" blockAlign="center" wrap={false}>
          <Thumbnail
            source={product_image || welcome}
            alt={product_title}
            size="small"
          />
          <VerticalStack gap="0">
            <Text variant="bodyMd" fontWeight="semibold" as="span">{title}</Text>
            <Text variant="bodySm" color="subdued" as="span">{product_title}</Text>
          </VerticalStack>
        </HorizontalStack>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Badge tone={status ? "success" : "info"}>{status ? "Active" : "Draft"}</Badge>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <VerticalStack gap="1">
          {tiers.map((tier, i) => (
            <Text key={i} variant="bodySm" as="p">
              {tier.min_quantity}+ →{" "}
              {tier.discount_type === "percentage"
                ? `${tier.discount_value}% off`
                : `$${tier.discount_value} off`}
            </Text>
          ))}
        </VerticalStack>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <HorizontalStack gap="2">
          <Button
            plain
            icon={EditIcon}
            onClick={() => nav(`/app/volume_discount_form/${id}`)}
            accessibilityLabel="Edit"
          />
          <Button
            plain
            tone="critical"
            icon={DeleteIcon}
            onClick={() => handleDelete(id, discounts.find(d => d.id === id)?.product_id)}
            accessibilityLabel="Delete"
          />
        </HorizontalStack>
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

  return (
    <Page
      title="Volume Discounts"
      primaryAction={
        <div className="btn-primary-black">
          <Button onClick={handleCreate}>
            Create volume discount
          </Button>
        </div>
      }
      backAction={{ content: "Dashboard", url: "/app/additional" }}
    >
      <Card>
        {discounts.length === 0 ? (
          <EmptyState
            heading="No volume discounts yet"
            image={welcome}
            action={{
              content: "Create volume discount",
              onAction: handleCreate,
            }}
          >
            <p>Reward customers who buy more with automatic quantity-based discounts.</p>
          </EmptyState>
        ) : (
          <IndexTable
            resourceName={resourceName}
            itemCount={discounts.length}
            selectedItemsCount={allResourcesSelected ? "All" : selectedResources.length}
            onSelectionChange={handleSelectionChange}
            headings={[
              { title: "Product" },
              { title: "Status" },
              { title: "Tiers" },
              { title: "Actions" },
            ]}
          >
            {rowMarkup}
          </IndexTable>
        )}
      </Card>
      <Modal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        title="Upgrade to Pro"
        primaryAction={{
          content: "View Pro plan",
          onAction: () => nav("/app/plan"),
        }}
        secondaryActions={[{
          content: "Maybe later",
          onAction: () => setUpgradeOpen(false),
        }]}
      >
        <Modal.Section>
          <VerticalStack gap="3">
            <Text as="p">Volume discounts are a Pro feature. Upgrade to unlock unlimited volume discounts, unlimited bundles, and all future premium features.</Text>
            <Text as="p" color="subdued">Pro is $9.99/mo with a 14-day free trial. No credit card required during the trial.</Text>
          </VerticalStack>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
