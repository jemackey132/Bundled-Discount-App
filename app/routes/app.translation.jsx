// @ts-nocheck
import { useState, useCallback, useEffect } from "react";
import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation, useActionData } from "@remix-run/react";
import {
  Page,
  Card,
  Text,
  VerticalStack,
  HorizontalStack,
  TextField,
  Button,
  Banner,
  Divider,
  Box,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { getSettings, saveSettings } from "../bundle.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const settings = await getSettings(session.shop);
  return json({ translations: settings.translations });
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();

  const translations = {
    add_to_cart: formData.get("add_to_cart") || "Add to cart",
    bundle_discount: formData.get("bundle_discount") || "Bundle discount",
    save_badge: formData.get("save_badge") || "Save {percent}%",
  };

  await saveSettings(session.shop, { translations });
  return json({ saved: true });
};

const FIELD_DEFS = [
  {
    key: "add_to_cart",
    label: "Add to cart button",
    helpText: "Text shown on the bundle add-to-cart button in the storefront widget.",
    placeholder: "Add to cart",
  },
  {
    key: "bundle_discount",
    label: "Bundle discount label",
    helpText: "Label shown next to the discount amount in the bundle widget.",
    placeholder: "Bundle discount",
  },
  {
    key: "save_badge",
    label: "Save badge text",
    helpText: 'Text shown on the savings badge. Use {percent} as a placeholder for the discount percentage, e.g. "Save {percent}%".',
    placeholder: "Save {percent}%",
  },
];

export default function TranslationPage() {
  const { translations: saved } = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isSaving = navigation.state === "submitting";

  const [values, setValues] = useState({
    add_to_cart: saved.add_to_cart,
    bundle_discount: saved.bundle_discount,
    save_badge: saved.save_badge,
  });

  useEffect(() => {
    if (actionData?.saved) {
      window.shopify?.toast?.show("Translations saved!");
    }
  }, [actionData]);

  const handleChange = useCallback((key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleReset = useCallback((key, placeholder) => {
    setValues((prev) => ({ ...prev, [key]: placeholder }));
  }, []);

  const handleSave = useCallback(() => {
    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => fd.append(k, v));
    submit(fd, { method: "POST" });
  }, [values, submit]);

  return (
    <Page
      title="Translation"
      backAction={{ content: "Settings", url: "/app/additional" }}
      primaryAction={
        <div className="btn-primary-black">
          <Button onClick={handleSave} loading={isSaving}>
            Save translations
          </Button>
        </div>
      }
    >
      <VerticalStack gap="5">
        <Banner tone="info">
          These labels are used in the storefront bundle widget. Leave a field blank or reset it to restore the default text.
        </Banner>

        <Card>
          <VerticalStack gap="0">
            <Box padding="4">
              <Text variant="headingMd" as="h2">Storefront labels</Text>
              <Text variant="bodySm" color="subdued" as="p">
                Override the default English text shown to customers in your store.
              </Text>
            </Box>
            <Divider />
            {FIELD_DEFS.map((def, i) => (
              <div key={def.key}>
                <Box padding="4">
                  <HorizontalStack align="space-between" blockAlign="start" gap="4" wrap={false}>
                    <div style={{ flex: 1 }}>
                      <TextField
                        label={def.label}
                        value={values[def.key]}
                        onChange={(v) => handleChange(def.key, v)}
                        placeholder={def.placeholder}
                        helpText={def.helpText}
                        autoComplete="off"
                      />
                    </div>
                    <div style={{ paddingTop: "24px" }}>
                      <Button
                        plain
                        onClick={() => handleReset(def.key, def.placeholder)}
                        disabled={values[def.key] === def.placeholder}
                      >
                        Reset
                      </Button>
                    </div>
                  </HorizontalStack>
                </Box>
                {i < FIELD_DEFS.length - 1 && <Divider />}
              </div>
            ))}
          </VerticalStack>
        </Card>

        <Card>
          <VerticalStack gap="3">
            <Text variant="headingMd" as="h2">Preview</Text>
            <Text variant="bodySm" color="subdued" as="p">
              Approximate rendering in the bundle widget.
            </Text>
            <Divider />
            <HorizontalStack align="space-between" blockAlign="center">
              <VerticalStack gap="1">
                <Text variant="bodyMd" as="p" fontWeight="semibold">Summer Bundle</Text>
                <Text variant="bodySm" color="subdued" as="p">
                  {values.bundle_discount}: 15% off
                </Text>
              </VerticalStack>
              <div
                style={{
                  background: "#008060",
                  color: "#fff",
                  borderRadius: "4px",
                  padding: "2px 8px",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                {values.save_badge.replace("{percent}", "15")}
              </div>
            </HorizontalStack>
            <div
              style={{
                background: "#000",
                color: "#fff",
                borderRadius: "6px",
                padding: "10px 16px",
                textAlign: "center",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "default",
              }}
            >
              {values.add_to_cart}
            </div>
          </VerticalStack>
        </Card>
      </VerticalStack>
    </Page>
  );
}
