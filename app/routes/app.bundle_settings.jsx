import { useCallback, useState } from "react";
import { json } from "@remix-run/node";
import { useActionData, useLoaderData, useNavigation, useSubmit } from "@remix-run/react";
import {
  Page,
  Card,
  Text,
  VerticalStack,
  Checkbox,
  Banner,
  Divider,
  RadioButton,
  HorizontalStack,
  Button,
  Link,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { getSettings, saveSettings } from "../bundle.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const settings = await getSettings(session.shop);
  return json(settings);
};

export async function action({ request }) {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();

  const data = {
    subscriptions_enabled: formData.get("subscriptions_enabled") === "true",
    track_inventory: formData.get("track_inventory") === "true",
    track_inventory_mode: formData.get("track_inventory_mode") || "disabled",
    button_action: formData.get("button_action") || "cart",
    variant_selector: formData.get("variant_selector") || "color_swatch",
    product_pricing: formData.get("product_pricing") || "final_price",
    discount_application: formData.get("discount_application") || "when_click",
    discount_combination: formData.get("discount_combination") || "when_click",
  };

  await saveSettings(session.shop, data);
  return json({ success: true });
}

export default function BundleSettingsPage() {
  const settings = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const submit = useSubmit();

  const isSaving = navigation.state === "submitting";

  const [subchecked, setSubChecked] = useState(settings.subscriptions_enabled);
  const [trackInventory, setTrackInventory] = useState(settings.track_inventory);
  const [tivalue, setTIValue] = useState(settings.track_inventory_mode);
  const [bavalue, setBAValue] = useState(settings.button_action);
  const [variantselector, setVariantSelector] = useState(settings.variant_selector);
  const [productpricing, setProductPricing] = useState(settings.product_pricing);
  const [dasvalue, setDASValue] = useState(settings.discount_application);
  const [dcvalue, setDCValue] = useState(settings.discount_combination);

  const handleSave = () => {
    const formData = new FormData();
    formData.append("subscriptions_enabled", String(subchecked));
    formData.append("track_inventory", String(trackInventory));
    formData.append("track_inventory_mode", tivalue);
    formData.append("button_action", bavalue);
    formData.append("variant_selector", variantselector);
    formData.append("product_pricing", productpricing);
    formData.append("discount_application", dasvalue);
    formData.append("discount_combination", dcvalue);
    submit(formData, { method: "post" });
  };

  return (
    <Page
      backAction={{ content: "Bundles", url: "/app/additional" }}
      title="Bundle settings"
      primaryAction={
        <Button primary loading={isSaving} onClick={handleSave}>
          Save settings
        </Button>
      }
    >
      {actionData?.success && (
        <div style={{ marginBottom: "16px" }}>
          <Banner status="success" title="Settings saved." onDismiss={() => {}} />
        </div>
      )}
      <div className="bundle-setting-main">
        <VerticalStack gap="5">
          <div className="bundle-setting-card">
            <VerticalStack gap="3">
              <VerticalStack gap="2">
                <Text variant="headingMd" as="h2">Subscription</Text>
                <Text variant="bodyMd" as="p">
                  Install any subscription app and start selling your bundles
                  weekly, monthly, yearly, etc.
                </Text>
              </VerticalStack>
              <Card>
                <VerticalStack gap="4">
                  <Checkbox
                    label="Enable subscriptions"
                    checked={subchecked}
                    onChange={(val) => setSubChecked(val)}
                  />
                  <Banner title="Install subscription app" status="info">
                    <Text variant="bodyMd" as="p">
                      Install any subscription app on your store to access this feature.
                    </Text>
                  </Banner>
                </VerticalStack>
              </Card>
            </VerticalStack>
          </div>
          <Divider />
          <div className="bundle-setting-card">
            <VerticalStack gap="3">
              <VerticalStack gap="2">
                <Text variant="headingMd" as="h2">Track inventory</Text>
                <Text variant="bodyMd" as="p">
                  Track the inventory to specify how your bundles appear when one of the
                  bundled products is sold out.
                </Text>
              </VerticalStack>
              <Card>
                <VerticalStack gap="4">
                  <Checkbox
                    label="Track inventory"
                    checked={trackInventory}
                    onChange={(val) => setTrackInventory(val)}
                  />
                  <div style={{ marginLeft: "20px" }}>
                    <VerticalStack gap="2">
                      <RadioButton
                        label="Don't display the unavailable bundles"
                        checked={tivalue === "disabled"}
                        id="ti_disabled"
                        name="track_inventory_mode"
                        onChange={() => setTIValue("disabled")}
                      />
                      <RadioButton
                        label="Show the sold-out badge for the unavailable bundles"
                        id="ti_optional"
                        name="track_inventory_mode"
                        checked={tivalue === "optional"}
                        onChange={() => setTIValue("optional")}
                      />
                    </VerticalStack>
                  </div>
                </VerticalStack>
              </Card>
            </VerticalStack>
          </div>
          <Divider />
          <div className="bundle-setting-card">
            <VerticalStack gap="3">
              <VerticalStack gap="2">
                <Text variant="headingMd" as="h2">Button action</Text>
                <Text variant="bodyMd" as="p">
                  Manage what page the customer is taken to after clicking the bundle button.
                </Text>
              </VerticalStack>
              <Card>
                <VerticalStack gap="2">
                  <RadioButton
                    label="Cart"
                    checked={bavalue === "cart"}
                    id="ba_cart"
                    name="button_action"
                    onChange={() => setBAValue("cart")}
                  />
                  <RadioButton
                    label="Checkout"
                    id="ba_checkout"
                    name="button_action"
                    checked={bavalue === "checkout"}
                    onChange={() => setBAValue("checkout")}
                  />
                  <RadioButton
                    label="Cart drawer (mini cart) — contact Support to activate."
                    id="ba_cart_drawer"
                    name="button_action"
                    disabled={true}
                    checked={bavalue === "cart_drawer"}
                    onChange={() => setBAValue("cart_drawer")}
                  />
                </VerticalStack>
              </Card>
            </VerticalStack>
          </div>
          <Divider />
          <div className="bundle-setting-card">
            <VerticalStack gap="3">
              <VerticalStack gap="2">
                <Text variant="headingMd" as="h2">Variant selector type</Text>
                <Text variant="bodyMd" as="p">
                  Specify whether customers use a dropdown or color swatch to select variants.
                </Text>
              </VerticalStack>
              <Card>
                <VerticalStack gap="2">
                  <RadioButton
                    label="Dropdown"
                    checked={variantselector === "dropdown"}
                    id="vs_dropdown"
                    name="variant_selector"
                    onChange={() => setVariantSelector("dropdown")}
                  />
                  <RadioButton
                    label="Color swatch"
                    id="vs_color_swatch"
                    name="variant_selector"
                    checked={variantselector === "color_swatch"}
                    onChange={() => setVariantSelector("color_swatch")}
                  />
                </VerticalStack>
              </Card>
            </VerticalStack>
          </div>
          <Divider />
          <div className="bundle-setting-card">
            <VerticalStack gap="3">
              <VerticalStack gap="2">
                <Text variant="headingMd" as="h2">Product pricing</Text>
                <Text variant="bodySm" as="p">
                  Choose whether bundle items display their final price or compare-at price.
                </Text>
              </VerticalStack>
              <Card>
                <VerticalStack gap="2">
                  <RadioButton
                    label="Final price"
                    checked={productpricing === "final_price"}
                    id="pp_final_price"
                    name="product_pricing"
                    onChange={() => setProductPricing("final_price")}
                  />
                  <RadioButton
                    label="Compare at price"
                    id="pp_compare_at_price"
                    name="product_pricing"
                    checked={productpricing === "compare_at_price"}
                    onChange={() => setProductPricing("compare_at_price")}
                  />
                </VerticalStack>
              </Card>
            </VerticalStack>
          </div>
          <Divider />
          <div className="bundle-setting-card">
            <VerticalStack gap="3">
              <VerticalStack gap="2">
                <Text variant="headingMd" as="h2">Discount</Text>
                <Text variant="bodySm" as="p">
                  Manage discount application and combination settings.
                </Text>
              </VerticalStack>
              <Card>
                <VerticalStack gap="4">
                  <Text variant="headingMd" as="h2">Discount application settings</Text>
                  <div style={{ marginLeft: "18px" }}>
                    <VerticalStack gap="2">
                      <RadioButton
                        label="Apply the discount only if the bundle is clicked by the customer"
                        checked={dasvalue === "when_click"}
                        id="das_when_click"
                        name="discount_application"
                        onChange={() => setDASValue("when_click")}
                      />
                      <RadioButton
                        label="Always apply the discount"
                        id="das_always"
                        name="discount_application"
                        disabled
                        checked={dasvalue === "always"}
                        onChange={() => setDASValue("always")}
                      />
                    </VerticalStack>
                  </div>
                  <Banner status="info">
                    <Text variant="bodyMd" as="p">
                      "Always apply" is only available on the Fixed-cost plan.
                    </Text>
                  </Banner>
                </VerticalStack>
              </Card>
            </VerticalStack>
          </div>
          <div style={{ marginTop: "32px", marginBottom: "32px" }}>
            <div className="bundle-setting-card">
              <VerticalStack gap="3">
                <Card>
                  <VerticalStack gap="4">
                    <Text variant="headingMd" as="h2">Discount combination</Text>
                    <div style={{ marginLeft: "18px" }}>
                      <VerticalStack gap="2">
                        <RadioButton
                          label="Allow bundle discounts to combine with other discount codes"
                          checked={dcvalue === "when_click"}
                          id="dc_when_click"
                          name="discount_combination"
                          onChange={() => setDCValue("when_click")}
                        />
                        <RadioButton
                          label="Do not allow bundle discount codes to combine with other codes"
                          id="dc_always"
                          name="discount_combination"
                          checked={dcvalue === "always"}
                          onChange={() => setDCValue("always")}
                        />
                      </VerticalStack>
                    </div>
                  </VerticalStack>
                </Card>
              </VerticalStack>
            </div>
          </div>
          <div style={{ paddingBottom: "32px" }}>
            <Button primary loading={isSaving} onClick={handleSave}>
              Save settings
            </Button>
          </div>
        </VerticalStack>
      </div>
    </Page>
  );
}
