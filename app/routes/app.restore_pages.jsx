// @ts-nocheck
import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation, useActionData } from "@remix-run/react";
import { useEffect, useCallback } from "react";
import {
  Page,
  Card,
  Text,
  VerticalStack,
  HorizontalStack,
  Button,
  Badge,
  Banner,
  Box,
  Divider,
  Icon,
} from "@shopify/polaris";
import { RefreshIcon, ExternalIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";

const PAGE_DEFS = [
  {
    key: "bundles",
    title: "Bundles",
    handle: "bundles",
    description: "Lists your active bundle offers. Add the Bundle List theme block to this page to display your offers to customers.",
    bodyHtml:
      "<p>Browse our bundle deals and save when you buy together.</p>",
  },
  {
    key: "builder",
    title: "Bundle Builder",
    handle: "bundle-builder",
    description: "A dedicated page for mix-and-match bundle building (Phase 3 feature). Recreate it now so the URL is reserved.",
    bodyHtml: "<p>Build your own custom bundle and save.</p>",
  },
];

// ─── Loader: check whether each page exists ─────────────────────────────────
export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const res = await admin.graphql(`
    query GetPages {
      pages(first: 50) {
        nodes { id title handle }
      }
    }
  `);
  const { data } = await res.json();
  const existingPages = data?.pages?.nodes ?? [];

  const status = {};
  for (const def of PAGE_DEFS) {
    const found = existingPages.find((p) => p.handle === def.handle);
    status[def.key] = found
      ? { exists: true, id: found.id, title: found.title, handle: found.handle }
      : { exists: false };
  }

  return json({ status });
};

// ─── Action: create one or all pages ────────────────────────────────────────
export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const which = formData.get("which"); // "bundles" | "builder" | "all"

  const toCreate = which === "all"
    ? PAGE_DEFS
    : PAGE_DEFS.filter((d) => d.key === which);

  const errors = [];
  const created = [];

  for (const def of toCreate) {
    const res = await admin.graphql(
      `mutation pageCreate($input: PageInput!) {
        pageCreate(input: $input) {
          page { id title handle }
          userErrors { field message }
        }
      }`,
      { variables: { input: { title: def.title, handle: def.handle, bodyHtml: def.bodyHtml } } }
    );
    const { data } = await res.json();
    const result = data?.pageCreate;
    if (result?.userErrors?.length) {
      errors.push(...result.userErrors.map((e) => `${def.title}: ${e.message}`));
    } else if (result?.page) {
      created.push(result.page.title);
    }
  }

  return json({ created, errors });
};

// ─── Component ───────────────────────────────────────────────────────────────
export default function RestorePages() {
  const { status } = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  useEffect(() => {
    if (actionData?.created?.length) {
      window.shopify?.toast?.show(
        `Page${actionData.created.length > 1 ? "s" : ""} created: ${actionData.created.join(", ")}`
      );
    }
  }, [actionData]);

  const handleRestore = useCallback((which) => {
    const fd = new FormData();
    fd.append("which", which);
    submit(fd, { method: "POST" });
  }, [submit]);

  const allExist = PAGE_DEFS.every((d) => status[d.key]?.exists);
  const anyMissing = PAGE_DEFS.some((d) => !status[d.key]?.exists);

  return (
    <Page
      title="Restore pages"
      backAction={{ content: "Settings", url: "/app/additional" }}
      primaryAction={
        anyMissing
          ? {
              content: "Restore all missing",
              onAction: () => handleRestore("all"),
              loading: isSubmitting,
              disabled: allExist,
            }
          : undefined
      }
    >
      <VerticalStack gap="5">
        {actionData?.errors?.length > 0 && (
          <Banner tone="critical" title="Some pages could not be created">
            <VerticalStack gap="1">
              {actionData.errors.map((e, i) => (
                <Text key={i} as="p">{e}</Text>
              ))}
            </VerticalStack>
          </Banner>
        )}

        {allExist && (
          <Banner tone="success">
            All storefront pages are present.
          </Banner>
        )}

        <Card>
          <VerticalStack gap="0">
            <Box padding="4">
              <Text variant="headingMd" as="h2">Storefront pages</Text>
              <Text variant="bodySm" color="subdued" as="p">
                These pages are created in your Shopify storefront. You can add theme blocks to them to display bundle content to customers.
              </Text>
            </Box>
            <Divider />
            {PAGE_DEFS.map((def, i) => {
              const s = status[def.key];
              return (
                <div key={def.key}>
                  <Box padding="4">
                    <HorizontalStack align="space-between" blockAlign="center" wrap={false}>
                      <HorizontalStack gap="3" blockAlign="center" wrap={false}>
                        <Box background="bg-surface-secondary" borderRadius="2" padding="2">
                          <Icon source={RefreshIcon} />
                        </Box>
                        <VerticalStack gap="1">
                          <HorizontalStack gap="2" blockAlign="center">
                            <Text variant="headingSm" as="h3">{def.title}</Text>
                            <Badge tone={s.exists ? "success" : "attention"}>
                              {s.exists ? "Exists" : "Missing"}
                            </Badge>
                          </HorizontalStack>
                          <Text variant="bodySm" color="subdued" as="p">
                            {s.exists
                              ? `/${s.handle}`
                              : def.description}
                          </Text>
                        </VerticalStack>
                      </HorizontalStack>
                      <HorizontalStack gap="2">
                        {s.exists ? (
                          <Button
                            icon={ExternalIcon}
                            plain
                            onClick={() =>
                              window.open(
                                `https://${window.location.hostname.replace(/admin\.shopify\.com\/store\/[^/]+/, "")}pages/${s.handle}`,
                                "_blank"
                              )
                            }
                          >
                            View page
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleRestore(def.key)}
                            loading={isSubmitting}
                          >
                            Restore
                          </Button>
                        )}
                      </HorizontalStack>
                    </HorizontalStack>
                  </Box>
                  {i < PAGE_DEFS.length - 1 && <Divider />}
                </div>
              );
            })}
          </VerticalStack>
        </Card>

        <Card>
          <VerticalStack gap="3">
            <Text variant="headingMd" as="h2">After restoring</Text>
            <Text variant="bodyMd" as="p">
              Once a page is created, go to your Shopify theme editor, navigate to the page template, and add the <strong>Bundle List</strong> section or block to display your active bundles.
            </Text>
            <Button
              icon={ExternalIcon}
              plain
              onClick={() =>
                window.shopify?.navigate
                  ? window.shopify.navigate("https://admin.shopify.com/themes/current/editor", { target: "new" })
                  : window.open("https://admin.shopify.com", "_blank")
              }
            >
              Open theme editor
            </Button>
          </VerticalStack>
        </Card>
      </VerticalStack>
    </Page>
  );
}
