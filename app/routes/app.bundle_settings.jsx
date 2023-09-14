import { useEffect, useCallback, useState } from "react";
import { json } from "@remix-run/node";
import {
  useActionData,
  useLoaderData,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import welcome from "../../public/finances_minor.svg";
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
  Link
} from "@shopify/polaris";
import { FinancesMinor, SearchMinor } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";

export default function AdditionalPage() {
    const [subchecked, setSubChecked] = useState(false);
  const handleSubChange = useCallback(
    (newChecked) => setSubChecked(newChecked),
    []
  );

  const [tivalue, setTIValue] = useState("disabled");

  const handleTrackInventoryChange = useCallback(
    (_, newValue) => setTIValue(newValue),
    []
  );

  const [bavalue, setBAValue] = useState("cart");

  const handleBtnActionChange = useCallback(
    (_, newValue) => setBAValue(newValue),
    []
  );

  const [variantselector, setVariantSelector] = useState("color_swatch");

  const handleVariantSelector = useCallback(
    (_, newValue) => setVariantSelector(newValue),
    []
  );

  const [productpricing, setProductPricing] = useState("final_price");

  const handleProductPricing = useCallback(
    (_, newValue) => setProductPricing(newValue),
    []
  );

  const [dasvalue, setDASValue] = useState("when_click");

  const handleDAS = useCallback(
    (_, newValue) => setDASValue(newValue),
    []
  );

    return (
        <Page
      backAction={{ content: "Settings", url: "#" }}
      title="Bundle settings"
    >
      <div className="bundle-setting-main">
        <VerticalStack gap="5">
          <div className="bundle-setting-card">
            <VerticalStack gap="3">
              <VerticalStack gap="2">
                <Text variant="headingMd" as="h2">
                  Subscription
                </Text>
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
                    onChange={handleSubChange}
                  />
                  <Banner title="Install subscription app" status="info">
                    <Text variant="bodySm" as="p">
                      Install any subscription app on your store to access this
                      feature.
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
                <Text variant="headingMd" as="h2">
                  Track inventory
                </Text>
                <Text variant="bodyMd" as="p">
                  Track the inventory to specify how your bundles appear when
                  one of the bundled products is sold out. Don't track the
                  inventory to display the bundle regardless of the availability
                  of the product.
                </Text>
              </VerticalStack>
              <Card>
                <VerticalStack gap="4">
                  <Checkbox
                    label="Track inventory"
                    checked={subchecked}
                    onChange={handleSubChange}
                  />
                  <div style={{ marginLeft: "20px" }}>
                    <VerticalStack gap="2">
                      <RadioButton
                        label="Don't display the unavailable bundles"
                        checked={tivalue === "disabled"}
                        id="disabled"
                        name="accounts"
                        onChange={handleTrackInventoryChange}
                      />
                      <RadioButton
                        label="Show the sold-out badge for the unavailable bundles"
                        id="optional"
                        name="accounts"
                        checked={tivalue === "optional"}
                        onChange={handleTrackInventoryChange}
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
                <Text variant="headingMd" as="h2">
                  Button action
                </Text>
                <Text variant="bodyMd" as="p">
                  Manage what page the customer is taken to after clicking the
                  bundle button.
                </Text>
              </VerticalStack>
              <Card>
                <VerticalStack gap="2">
                  <RadioButton
                    label="Cart"
                    checked={bavalue === "cart"}
                    id="cart"
                    name="btn_action"
                    onChange={handleBtnActionChange}
                  />
                  <RadioButton
                    label="Checkout"
                    id="checkout"
                    name="btn_action"
                    checked={bavalue === "checkout"}
                    onChange={handleBtnActionChange}
                  />
                  <RadioButton
                    label="Cart drawer (mini cart)
                    Please contact Support in order to activate this option."
                    id="cart_drawer"
                    name="btn_action"
                    disabled={true}
                    checked={bavalue === "cart_drawer"}
                    onChange={handleBtnActionChange}
                  />
                </VerticalStack>
              </Card>
            </VerticalStack>
          </div>
          <Divider />
          <div className="bundle-setting-card">
            <VerticalStack gap="3">
              <VerticalStack gap="2">
                <Text variant="headingMd" as="h2">
                  Variant selector type
                </Text>
                <Text variant="bodyMd" as="p">
                  Specify that the customer should use the dropdown or color
                  swatch to select variants in the bundle
                </Text>
              </VerticalStack>
              <Card>
                <VerticalStack gap="2">
                  <RadioButton
                    label="Dropdown"
                    checked={variantselector === "dropdown"}
                    id="dropdown"
                    name="variant_selector"
                    onChange={handleVariantSelector}
                  />
                  <RadioButton
                    label="Color swatch"
                    id="color_swatch"
                    name="variant_selector"
                    checked={variantselector === "color_swatch"}
                    onChange={handleVariantSelector}
                  />
                </VerticalStack>
              </Card>
            </VerticalStack>
          </div>
          <Divider />
          <div className="bundle-setting-card">
            <VerticalStack gap="3">
              <VerticalStack gap="2">
                <Text variant="headingMd" as="h2">
                  Product pricing
                </Text>
                <Text variant="bodySm" as="p">
                  Price of the products in the bundle can be the Final price or
                  their compare at price (if there was).
                </Text>
              </VerticalStack>
              <Card>
                <VerticalStack gap="2">
                  <RadioButton
                    label="Final price"
                    checked={productpricing === "final_price"}
                    id="final_price"
                    name="product_pricing"
                    onChange={handleProductPricing}
                  />
                  <RadioButton
                    label="Compare at price"
                    id="compare_at_price"
                    name="product_pricing"
                    checked={productpricing === "compare_at_price"}
                    onChange={handleProductPricing}
                  />
                </VerticalStack>
              </Card>
            </VerticalStack>
          </div>
          <Divider />
          <div className="bundle-setting-card">
            <VerticalStack gap="3">
              <VerticalStack gap="2">
                <Text variant="headingMd" as="h2">
                  Discount
                </Text>
                <Text variant="bodySm" as="p">
                  Manage discount settings in different sections such as
                  discount application, discount combination, discount display
                  and discount codes.
                </Text>
              </VerticalStack>
              <Card>
                <VerticalStack gap="4">
                  <Text variant="headingMd" as="h2">
                    Discount application settings
                  </Text>
                  <div style={{ marginLeft: "18px" }}>
                    <VerticalStack gap="2">
                      <RadioButton
                        label="Apply the discount only if the bundle is clicked by the customer"
                        checked={dasvalue === "when_click"}
                        id="when_click"
                        name="discount_app_setting"
                        onChange={handleDAS}
                      />
                      <RadioButton
                        label="Always apply the discount"
                        id="always"
                        name="discount_app_setting"
                        disabled
                        checked={dasvalue === "always"}
                        onChange={handleDAS}
                      />
                    </VerticalStack>
                  </div>
                  <Banner
                    status="info"
                  >
                    <Text variant="bodySm" as="p">This option is only available for the Fixed-cost plan.</Text>
                  </Banner>
                </VerticalStack>
              </Card>
            </VerticalStack>
          </div>
          <div style={{ marginTop: "32px", marginBottom:"32px"}}>
          <div className="bundle-setting-card">
            <VerticalStack gap="3">
              <Card>
                <VerticalStack gap="4">
                  <Text variant="headingMd" as="h2">
                  Discount combination
                  </Text>
                  <div style={{ marginLeft: "18px" }}>
                    <VerticalStack gap="2">
                      <RadioButton
                        label="Apply the discount only if the bundle is clicked by the customer"
                        checked={dasvalue === "when_click"}
                        id="when_click"
                        name="discount_combination"
                        onChange={handleDAS}
                      />
                      <RadioButton
                        label="Do not allow bundles' discount codes to be combined with other discount codes"
                        id="always"
                        name="discount_combination"
                        checked={dasvalue === "always"}
                        onChange={handleDAS}
                      />
                    </VerticalStack>
                  </div>
                </VerticalStack>
              </Card>
            </VerticalStack>
          </div>
          </div>
          <div className="bundle-setting-card">
            <VerticalStack gap="3">
              <Card>
                <VerticalStack gap="4">
                  <Text variant="headingMd" as="h2">
                  Discount label
                  </Text>
                  <div style={{ marginLeft: "18px", marginBottom:"15px" }}>
                    <VerticalStack gap="2">
                      <RadioButton
                        label="This label appears on the discounted bundle items in your cart."
                        checked={dasvalue === "when_click"}
                        id="when_click"
                        name="discount_combination"
                        onChange={handleDAS}
                      />
                    </VerticalStack>
                  </div>
                  <HorizontalStack align="space-between">
                  <Text variant="headingSm" as="h3">Label: Bundle</Text>
                  <Link>Edit lable</Link>
                  </HorizontalStack>
                </VerticalStack>
              </Card>
            </VerticalStack>
          </div>
          <Divider />
        </VerticalStack>
      </div>
    </Page>
      );
}
