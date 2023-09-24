import { useEffect, useCallback, useState } from "react";
import { json } from "@remix-run/node";
import {
  useActionData,
  useLoaderData,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import { CancelMajor } from "@shopify/polaris-icons";
import {
  Page,
  Select,
  EmptyState,
  Card,
  Text,
  TextField,
  Button,
  Icon,
  Avatar,
  ResourceList,
  ResourceItem,
  Link,
  Layout,
  HorizontalGrid,
  VerticalStack,
  HorizontalStack,
  Popover,
  ActionList,
  Divider,
  Checkbox,
} from "@shopify/polaris";
import { FinancesMinor, SearchMinor } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import shopify from "../shopify.server";

export default function AdditionalPage() {
  const [bundlepopover, setBundlePopover] = useState(false);
  const [bundlestatus, setBundleStatus] = useState(false);
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [formState, setFormState] = useState({
    bundle_id: 0,
    bundle_title: "",
    bundle_name: "",
    bundle_image: "",
    bundle_discount: true,
    bundle_discount_type: "",
    bunde_discount_value: "",
    bundle_status: true,
    bundle_items: [],
    bundle_time_status: false,
    bundle_start_time: "",
    bundle_start_date: "",
    bundle_end_status: false,
    bundle_end_time: "",
    bundle_end_date: "",
    bundle_type: "fixed_bundle",
  });
  const [discountType, setDiscountType] = useState("percentage");

  const handleState = (type, value) => {
    setFormState((prevState) => ({
      ...prevState,
      [type]: value,
    }));
  };

  const handleDiscountSelectChange = useCallback(
    (value) => setDiscountValue(value),
    []
  );

  const handleChangeDiscountType = useCallback(
    (newChecked) => setDiscountType(newChecked),
    []
  );

  const toggleBundlePopover = useCallback(
    () => setBundlePopover((bundlepopover) => !bundlepopover),
    []
  );

  const handleBundleStatus = useCallback(
    (status) => {
      console.log(status);
      setBundleStatus(!bundlestatus);
    },
    [bundlestatus]
  );

  const handleTextFieldChange = useCallback((value) => setQuery(value), []);

  const [discountValue, setDiscountValue] = useState("");

  const bundlestatusactivator = (
    <Button onClick={toggleBundlePopover} disclosure>
      {formState.bundle_status ? "Active" : "Inactive"}
    </Button>
  );

  async function selectProduct() {
    console.log("clicked");
    const getProducts = await window.shopify.resourcePicker({
      type: "product",
      query: query,
      action: "select", // customized action verb, either 'select' or 'add',
    });

    if (getProducts) {
      console.log(getProducts);
      const { images, id, variants, title, handle } = getProducts[0];

      // Create a new product object
      const newProduct = {
        id: id,
        url: handle,
        name: title,
        image: images[0]?.originalSrc,
      };

      // Use the concat method to create a new array with the added product
      const isDuplicate = products.some(
        // @ts-ignore
        (product) => product.id === newProduct.id
      );

      if (!isDuplicate) {
        var updatedProducts = [];
        // @ts-ignore
        updatedProducts = products.concat(newProduct);
        setProducts(updatedProducts);
      }
    }
  }

  const removeProduct = (productId) => {
    var updatedProducts = [];
    // @ts-ignore
    updatedProducts = products.filter((product) => product.id !== productId);
    setProducts(updatedProducts);
  };

  return (
    <Page
      backAction={{ content: "Settings", url: "/app/additional" }}
      title="Create Bundle"
    >
      <div className="create-bundle-form">
        <Layout>
          <Layout.Section>
            <Card>
              <Text variant="headingMd" as="h2">
                Bundled products
              </Text>
              <div className="search-card-subtext">
                <Text variant="bodyMd" as="p">
                  Add products you want to sell together.
                </Text>
              </div>
              <TextField
                label="Weight"
                type="text"
                value={query}
                labelHidden={true}
                prefix={<Icon source={SearchMinor} />}
                onChange={handleTextFieldChange}
                placeholder="search"
                autoComplete="off"
                connectedRight={<Button onClick={selectProduct}>Browse</Button>}
              />
            </Card>
          </Layout.Section>

          <Layout.Section>
            <HorizontalGrid columns={2} gap="8">
              <div className="card-bg">
                <Card>
                  <VerticalStack>
                    <HorizontalStack align="space-between" blockAlign="center">
                      <Text variant="headingMd" as="h2">
                        Bundled products
                      </Text>
                    </HorizontalStack>
                    {products.length == 0 ? (
                      <div className="psection-emptystate">
                        <EmptyState
                          heading=""
                          image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                        >
                          <p>please add a product to see the bundle preview</p>
                        </EmptyState>
                      </div>
                    ) : (
                      <ResourceList
                        resourceName={{
                          singular: "customer",
                          plural: "customers",
                        }}
                        items={products}
                        renderItem={(item) => {
                          const { id, url, name, image } = item;
                          const media = (
                            <Avatar
                              customer
                              size="medium"
                              source={image}
                              name={name}
                            />
                          );

                          return (
                            <ResourceItem
                              id={id}
                              onClick={() => console.log()}
                              verticalAlignment="center"
                              media={media}
                              accessibilityLabel={`View details for ${name}`}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                }}
                              >
                                <Text
                                  variant="bodyMd"
                                  fontWeight="bold"
                                  as="h3"
                                >
                                  {name}
                                </Text>
                                <div className="no-margin">
                                  <Link onClick={() => removeProduct(id)}>
                                    <Icon source={CancelMajor} color="base" />
                                  </Link>
                                </div>
                              </div>
                            </ResourceItem>
                          );
                        }}
                      />
                    )}
                  </VerticalStack>
                </Card>
              </div>
              <div className="card-bg">
                <Card>
                  <VerticalStack>
                    <VerticalStack align="space-between" gap="4">
                      <Text variant="headingMd" as="h2">
                        General
                      </Text>
                      <div className="general-card-fields">
                        <VerticalStack gap="4">
                          <TextField
                            label="Name"
                            type="text"
                            placeholder="Bundle #2"
                            helpText="Your customers won't see this name. This name is used for you to identify this
                                bundle."
                            autoComplete="off"
                            value={formState.bundle_name}
                            onChange={(value) =>
                              handleState("bundle_name", value)
                            }
                          />
                          <TextField
                            label="Title"
                            type="text"
                            helpText="Your customers will see this at the top of the bundle displays. You can choose
                                the best phrase or sentence to entice your customers to buy the bundle."
                            autoComplete="off"
                            value={formState.bundle_title}
                            onChange={(value) =>
                              handleState("bundle_title", value)
                            }
                          />
                        </VerticalStack>
                      </div>
                      <div className="bundle-status-selector">
                        <Text variant="headingMd" as="h3">
                          Status
                        </Text>
                        <Popover
                          active={bundlepopover}
                          activator={bundlestatusactivator}
                          autofocusTarget="first-node"
                          onClose={toggleBundlePopover}
                        >
                          <ActionList
                            actionRole="menuitem"
                            items={[
                              {
                                content: "Active",
                                onAction: () =>
                                  handleState("bundle_status", true),
                              },
                              {
                                content: "Inactive",
                                onAction: () =>
                                  handleState("bundle_status", false),
                              },
                            ]}
                          />
                        </Popover>
                      </div>
                      <Divider />
                    </VerticalStack>
                  </VerticalStack>
                </Card>
              </div>
            </HorizontalGrid>
          </Layout.Section>
          <Layout.Section>
            <HorizontalGrid columns={2} gap="8">
              <div className="card-bg">
                <Card>
                  <VerticalStack>
                    <Text variant="headingMd" as="h2">
                      Discount
                    </Text>
                    <div className="cbf-discount-card">
                      <VerticalStack>
                        <Text variant="bodyMd" as="p">
                          Choose type of discount and discount value for each
                          product.
                        </Text>
                        <div className="discount-card-checkbox">
                          <Checkbox
                            label="Fixed"
                            checked={discountType == "fixed" ? true : false}
                            onChange={() => handleChangeDiscountType("fixed")}
                          />
                        </div>
                        <div className="discount-card-checkbox">
                          <Checkbox
                            label="Percentage"
                            checked={
                              discountType == "percentage" ? true : false
                            }
                            onChange={() =>
                              handleChangeDiscountType("percentage")
                            }
                          />
                        </div>
                        <TextField
                          label="Discount value"
                          type="number"
                          value={discountValue}
                          onChange={handleDiscountSelectChange}
                          prefix={discountType == "fixed" ? "$" : "%"}
                          autoComplete="off"
                        />
                      </VerticalStack>
                    </div>
                  </VerticalStack>
                </Card>
              </div>
              <div className="card-bg">
                <Card>
                  <Text variant="headingMd" as="h2">
                    Bundle time
                  </Text>
                  <div className="bundle-time-date">
                    <HorizontalGrid columns={2} gap="6">
                      <TextField
                        type="date"
                        label="Start Date"
                        autoComplete="off"
                        value={formState.bundle_start_date}
                        onChange={(value) =>
                          handleState("bundle_start_date", value)
                        }
                      />
                      <TextField
                        type="time"
                        label="Start Time"
                        autoComplete="off"
                        value={formState.bundle_start_time}
                        onChange={(value) =>
                          handleState("bundle_start_time", value)
                        }
                      />
                    </HorizontalGrid>
                  </div>
                  <Checkbox
                    label="Set end time"
                    checked={formState.bundle_end_status}
                    onChange={() =>
                      handleState(
                        "bundle_end_status",
                        !formState.bundle_end_status
                      )
                    }
                  />
                  {formState.bundle_end_status && (
                    <div className="bundle-time-date">
                      <HorizontalGrid columns={2} gap="6">
                        <TextField
                          type="date"
                          label="End Date"
                          autoComplete="off"
                          value={formState.bundle_end_date}
                          onChange={(value) =>
                            handleState("bundle_end_date", value)
                          }
                        />
                        <TextField
                          type="time"
                          label="End Time"
                          autoComplete="off"
                          value={formState.bundle_end_time}
                          onChange={(value) =>
                            handleState("bundle_end_time", value)
                          }
                        />
                      </HorizontalGrid>
                    </div>
                  )}
                </Card>
              </div>
            </HorizontalGrid>
          </Layout.Section>

          <Layout.Section></Layout.Section>
          <Layout.Section>
            <HorizontalStack gap="4">
              <div style={{ color: "#bf0711" }}>
                <Button monochrome outline>
                  Delete bundle
                </Button>
              </div>
              <Button primary>Save</Button>
            </HorizontalStack>
          </Layout.Section>
        </Layout>
      </div>
    </Page>
  );
}
