import { useEffect, useCallback, useState } from "react";
import { json } from "@remix-run/node";
import {
  useActionData,
  useLoaderData,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import welcome from "../../public/finances_minor.svg";
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
  const [textFieldValue, setTextFieldValue] = useState("0");

  const [bundlepopover, setBundlePopover] = useState(false);
  const [bundlestatus, setBundleStatus] = useState(false);
  const [products, setProducts] = useState([]);
  const [query,setQuery] = useState('');
  const [bschecked, setBSChecked] = useState(false);
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
    bundle_end_time: "",
  });
  const [discountType, setDiscountType] = useState("percentage");
  // const [discountType, setDiscountType] = useState('percentage');

  // const selected = await shopify.resourcePicker({type: 'product'});

  const [discountselector, setDiscountSelector] = useState("10");

  const handleDiscountSelectChange = useCallback(
    (value) => setDiscountValue(value),
    []
  );

  const handleChange = useCallback(
    (newChecked) => setBSChecked(newChecked),
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

  const handleTextFieldChange = useCallback(
    (value) => setQuery(value),
    []
  );

  const [pselected, setPSelected] = useState("today");

  const handleSelectChange = useCallback((value) => setPSelected(value), []);

  const options = [
    { label: "Product page", value: "today" },
    { label: "Product 1", value: "yesterday" },
    { label: "Product 2", value: "lastWeek" },
  ];

  const discountoptions = [
    { label: "10%", value: "10" },
    { label: "20%", value: "20" },
  ];

  const [discountValue, setDiscountValue] = useState("");

  const bundlestatusactivator = (
    <Button onClick={toggleBundlePopover} disclosure>
      {bundlestatus ? "Active" : "Inactive"}
    </Button>
  );

  async function selectProduct() {
    console.log("clicked");
    const getProducts = await window.shopify.resourcePicker({
      type: "product",
      query:query,
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
        (product) => product.id === newProduct.id
      );

      if (!isDuplicate) {
        const updatedProducts = products.concat(newProduct);
        setProducts(updatedProducts);
      }

      console.log(id);
      // store multiple object in array state
      // setFormState({
      //   ...formState,
      //   productId: id,
      //   productVariantId: variants[0].id,
      //   productTitle: title,
      //   productHandle: handle,
      //   productAlt: images[0]?.altText,
      //   productImage: images[0]?.originalSrc,
      // });
    }
  }

  const removeProduct = (productId) => {
    // Filter out the product with the specified ID
    const updatedProducts = products.filter(
      (product) => product.id !== productId
    );

    // Update the state with the new array of products
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
                      {/* <div
                        style={{ color: "#008060" }}
                        className="bundle-product-header-button"
                      >
                        <Button monochrome outline onClick={window.shopify.Fullscreen.dispatch(Fullscreen.Action.ENTER);}>
                          <HorizontalStack gap="2" align="center">
                            <Icon source={FinancesMinor} />
                            <Text variant="bodyMd" as="p">
                              Enter full screen
                            </Text>
                          </HorizontalStack>
                        </Button>
                      </div> */}
                    </HorizontalStack>
                    {/* <div className="pselector">
                      <Select
                        label="Product selector"
                        labelHidden={true}
                        options={options}
                        onChange={handleSelectChange}
                        value={pselected}
                      />
                    </div> */}
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
                              // url={url}
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
                          />
                          <TextField
                            label="Title"
                            type="text"
                            helpText="Your customers will see this at the top of the bundle displays. You can choose
                                the best phrase or sentence to entice your customers to buy the bundle."
                            autoComplete="off"
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
                                onAction: () => handleBundleStatus("active"),
                              },
                              {
                                content: "Inactive",
                                onAction: () => handleBundleStatus("inactive"),
                              },
                            ]}
                          />
                        </Popover>
                      </div>
                      <Divider />
                    </VerticalStack>
                    {/* <div className="bundle-status-second-section">
                          <VerticalStack inlineAlign="start" gap="2">
                            <Text variant="bodyLg" as="p">
                              Displays
                            </Text>
                            <Text variant="bodyMd" as="p">
                              Here you can choose where to display this bundle.
                            </Text>
                            <Button plain>See all</Button>
                          </VerticalStack>
                        </div>
                        <Divider />
                        <div className="bundle-status-card-checkbox">
                          <Checkbox
                            label="Basic checkbox"
                            checked={bschecked}
                            onChange={handleChange}
                          />
                        </div>
                        <Divider />
                        <div className="bundle-status-card-checkbox">
                          <Checkbox
                            label="Basic checkbox"
                            checked={bschecked}
                            onChange={handleChange}
                          />
                        </div>
                        <Divider />
                        <div className="bundle-status-card-checkbox">
                          <Checkbox
                            label="Basic checkbox"
                            checked={bschecked}
                            onChange={handleChange}
                          />
                        </div> */}
                  </VerticalStack>
                </Card>
              </div>
            </HorizontalGrid>
          </Layout.Section>

          {/* <Layout.Section>
                <Card>
                  <Text variant="headingMd" as="h2">
                    Bundle as a product
                  </Text>
                  <div className="bundle-as-product-checkbox">
                    <Checkbox
                      label="Make a product from this bundle"
                      checked={bschecked}
                      onChange={handleChange}
                    />
                  </div>
                </Card>
              </Layout.Section> */}

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
                        {/* <div className="discount-card-checkbox">
                          <Checkbox
                            label="Hintonburg"
                            checked={bschecked}
                            onChange={handleChange}
                          />
                        </div> */}
                        {/* <div className="discount-card-checkbox">
                          <Checkbox
                            label="Downtown"
                            checked={bschecked}
                            onChange={handleChange}
                          />
                        </div>
                        <div className="discount-card-checkbox">
                          <Checkbox
                            label="Richmond Hall"
                            checked={bschecked}
                            onChange={handleChange}
                          />
                        </div> */}
                        {/* <Select
                          label="Discount value"
                          options={discountoptions}
                          onChange={handleDiscountSelectChange}
                          value={discountselector}
                        /> */}
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
                {/* <Card>
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
                          />
                          <TextField
                            label="Title"
                            type="text"
                            helpText="Your customers will see this at the top of the bundle displays. You can choose
                                the best phrase or sentence to entice your customers to buy the bundle."
                            autoComplete="off"
                          />
                        </VerticalStack>
                      </div>
                    </VerticalStack>
                  </VerticalStack>
                </Card> */}
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
                      />
                      <TextField
                        type="time"
                        label="Start Time"
                        autoComplete="off"
                      />
                    </HorizontalGrid>
                  </div>
                  <Checkbox
                    label="Set end time"
                    checked={bschecked}
                    onChange={handleChange}
                  />
                </Card>
              </div>
            </HorizontalGrid>
          </Layout.Section>

          <Layout.Section>
            {/* <Card>
              <Text variant="headingMd" as="h2">
                Bundle time
              </Text>
              <div className="bundle-time-date">
                <HorizontalGrid columns={2} gap="6">
                  <TextField
                    type="date"
                    label="Start Date"
                    autoComplete="off"
                  />
                  <TextField
                    type="time"
                    label="Start Time"
                    autoComplete="off"
                  />
                </HorizontalGrid>
              </div>
              <Checkbox
                label="Set end time"
                checked={bschecked}
                onChange={handleChange}
              />
            </Card> */}
          </Layout.Section>
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
