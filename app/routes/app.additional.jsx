import { useEffect, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { redirect } from "react-router-dom";
// import { redirect } from "@remix-run/node"; // or cloudflare/deno
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
  Layout,
  Text,
  VerticalStack,
  Card,
  Grid,
  Tabs,
  Frame,
  Button,
  ButtonGroup,
  HorizontalStack,
  HorizontalGrid,
  Box,
  IndexTable,
  TextField,
  useIndexResourceState,
  Icon,
  EmptyState,
  DataTable,
  Avatar,
  Badge,
  Popover,
  Select,
  ActionList,
  Pagination,
  Modal,
  Link,
  Divider,
} from "@shopify/polaris";
import { SearchMinor, SortMinor } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";

export default function AdditionalPage() {
  const cnav = useNavigate();

  const [selected, setSelected] = useState(0);
  const [tselected, setTSelected] = useState(0);

  const [bundlepopup, setBundlePopup] = useState(false);

  const toggleBundlePopup = useCallback(
    () => setBundlePopup((bundlepopup) => !bundlepopup),
    []
  );

  const handleTabChange = useCallback(
    (selectedTabIndex) => setSelected(selectedTabIndex),
    []
  );

  const handleTTabChange = useCallback(
    (selectedTTabIndex) => setTSelected(selectedTTabIndex),
    []
  );

  const [active, setActive] = useState({
    active_one: false,
    active_two: false,
    active_three: false,
  });

  const toggleActive = useCallback((key) => {
    console.log(key);
    setActive((active) => ({
      ...active,
      [key]: !active[key],
    }));
    console.log(active);
  }, []);

  const [activeAnalyticsButtonIndex, setActiveAnalyticsButtonIndex] =
    useState(0);
  const [filterSelected, setFilterSelected] = useState("begin_to_now");

  const handleFilterSelectChange = useCallback(
    (value) => setFilterSelected(value),
    []
  );
  const handleAnalyticsButtonClick = useCallback(
    (index) => {
      if (activeAnalyticsButtonIndex === index) return;
      setActiveAnalyticsButtonIndex(index);
    },
    [activeAnalyticsButtonIndex]
  );

  const analyticsfilteroptions = [
    {
      label: "from beginning to till now",
      value: "begin_to_now",
      prefix: <Icon source={SortMinor} />,
    },
    {
      label: "from beginning to last month",
      value: "begin_to_last_month",
      prefix: <Icon source={SortMinor} />,
    },
  ];

  const analyticstablerows = [
    [
      <div className="avatar-row">
        <Avatar customer name="Farrah" />
        <Avatar customer name="Farrah" />
      </div>,
      "bundle #1",
      <Badge status="success">Active</Badge>,
      "$ 0",
      "0",
      "0",
      "0",
    ],
    [
      <div className="avatar-row">
        <Avatar customer name="Farrah" />
        <Avatar customer name="Farrah" />
      </div>,
      "bundle #2",
      <Badge>Draft</Badge>,
      "$ 0",
      "0",
      "0",
      "0",
    ],
  ];

  const [textFieldValue, setTextFieldValue] = useState("2.00");

  const handleTextFieldChange = useCallback(
    (value) => setTextFieldValue(value),
    []
  );
  const activatorone = (
    <Button onClick={() => toggleActive("active_one")} disclosure>
      Type
    </Button>
  );
  const activatortwo = (
    <Button onClick={() => toggleActive("active_two")} disclosure>
      Enable displays
    </Button>
  );
  const activatorthree = (
    <Button onClick={() => toggleActive("active_three")} disclosure>
      Bundle as a products
    </Button>
  );
  const tabletabs = [
    {
      id: "all-customers-1",
      content: "All",
      accessibilityLabel: "All customers",
      panelID: "all-customers-content-1",
    },
    {
      id: "accepts-marketing-1",
      content: "Active",
      panelID: "accepts-marketing-content-1",
    },
    {
      id: "repeat-customers-1",
      content: "Draft",
      panelID: "repeat-customers-content-1",
    },
  ];
  const orders = [
    {
      id: "1020",
      bundle: (
        <div className="avatar-row">
          <Avatar customer name="Farrah" />
          <Avatar customer name="Farrah" />
        </div>
      ),
      name: "bundle #1",
      status: (
        <div className="custom-badge">
          <Badge status="success">active</Badge>
        </div>
      ),
      type: "Bundle",
      discount: "10% off",
      fulfillmentStatus: (
        <div className="custom-badge">
          <Badge progress="complete">Disabled</Badge>
        </div>
      ),
    },
    {
      id: "1021",
      bundle: (
        <div className="avatar-row">
          <Avatar customer name="Farrah" />
          <Avatar customer name="Farrah" />
        </div>
      ),
      name: "bundle #1",
      status: (
        <div className="custom-badge">
          <Badge status="success">active</Badge>
        </div>
      ),
      type: "Bundle",
      discount: "10% off",
      fulfillmentStatus: (
        <div className="custom-badge">
          <Badge progress="complete">Disabled</Badge>
        </div>
      ),
    },
    {
      id: "1022",
      bundle: (
        <div className="avatar-row">
          <Avatar customer name="Farrah" />
          <Avatar customer name="Farrah" />
        </div>
      ),
      name: "bundle #1",
      status: (
        <div className="custom-badge">
          <Badge status="success">active</Badge>
        </div>
      ),
      type: "Bundle",
      discount: "10% off",
      fulfillmentStatus: (
        <div className="custom-badge">
          <Badge progress="complete">Disabled</Badge>
        </div>
      ),
    },
    {
      id: "1023",
      bundle: (
        <div className="avatar-row">
          <Avatar customer name="Farrah" />
          <Avatar customer name="Farrah" />
        </div>
      ),
      name: "bundle #1",
      status: (
        <div className="custom-badge">
          <Badge status="success">active</Badge>
        </div>
      ),
      type: "Bundle",
      discount: "10% off",
      fulfillmentStatus: (
        <div className="custom-badge">
          <Badge progress="complete">Disabled</Badge>
        </div>
      ),
    },
    {
      id: "1024",
      bundle: (
        <div className="avatar-row">
          <Avatar customer name="Farrah" />
          <Avatar customer name="Farrah" />
        </div>
      ),
      name: "bundle #1",
      status: (
        <div className="custom-badge">
          <Badge status="success">active</Badge>
        </div>
      ),
      type: "Bundle",
      discount: "10% off",
      fulfillmentStatus: (
        <div className="custom-badge">
          <Badge progress="complete">Disabled</Badge>
        </div>
      ),
    },
    {
      id: "1025",
      bundle: (
        <div className="avatar-row">
          <Avatar customer name="Farrah" />
          <Avatar customer name="Farrah" />
        </div>
      ),
      name: "bundle #1",
      status: (
        <div className="custom-badge">
          <Badge status="success">active</Badge>
        </div>
      ),
      type: "Bundle",
      discount: "10% off",
      fulfillmentStatus: (
        <div className="custom-badge">
          <Badge progress="complete">Disabled</Badge>
        </div>
      ),
    },
    {
      id: "1026",
      bundle: (
        <div className="avatar-row">
          <Avatar customer name="Farrah" />
          <Avatar customer name="Farrah" />
        </div>
      ),
      name: "bundle #1",
      status: (
        <div className="custom-badge">
          <Badge status="success">active</Badge>
        </div>
      ),
      type: "Bundle",
      discount: "10% off",
      fulfillmentStatus: (
        <div className="custom-badge">
          <Badge progress="complete">Disabled</Badge>
        </div>
      ),
    },
    {
      id: "1027",
      bundle: (
        <div className="avatar-row">
          <Avatar customer name="Farrah" />
          <Avatar customer name="Farrah" />
        </div>
      ),
      name: "bundle #1",
      status: (
        <div className="custom-badge">
          <Badge status="success">active</Badge>
        </div>
      ),
      type: "Bundle",
      discount: "10% off",
      fulfillmentStatus: (
        <div className="custom-badge">
          <Badge progress="complete">Disabled</Badge>
        </div>
      ),
    },
    {
      id: "1028",
      bundle: (
        <div className="avatar-row">
          <Avatar customer name="Farrah" />
          <Avatar customer name="Farrah" />
        </div>
      ),
      name: "bundle #1",
      status: (
        <div className="custom-badge">
          <Badge status="success">active</Badge>
        </div>
      ),
      type: "Bundle",
      discount: "10% off",
      fulfillmentStatus: (
        <div className="custom-badge">
          <Badge progress="complete">Disabled</Badge>
        </div>
      ),
    },
    {
      id: "1029",
      bundle: (
        <div className="avatar-row">
          <Avatar customer name="Farrah" />
          <Avatar customer name="Farrah" />
        </div>
      ),
      name: "bundle #1",
      status: (
        <div className="custom-badge">
          <Badge status="success">active</Badge>
        </div>
      ),
      type: "Bundle",
      discount: "10% off",
      fulfillmentStatus: (
        <div className="custom-badge">
          <Badge progress="complete">Disabled</Badge>
        </div>
      ),
    },
  ];

  const resourceName = {
    singular: "order",
    plural: "orders",
  };

  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(orders);

  const rowMarkup = orders.map(
    (
      { id, bundle, name, status, type, discount, fulfillmentStatus },
      index
    ) => (
      <IndexTable.Row
        id={id}
        key={id}
        selected={selectedResources.includes(id)}
        position={index}
      >
        <IndexTable.Cell>
          <Text variant="bodyMd" fontWeight="bold" as="span">
            {bundle}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>{name}</IndexTable.Cell>
        <IndexTable.Cell>{status}</IndexTable.Cell>
        <IndexTable.Cell>{type}</IndexTable.Cell>
        <IndexTable.Cell>{discount}</IndexTable.Cell>
        <IndexTable.Cell>{fulfillmentStatus}</IndexTable.Cell>
      </IndexTable.Row>
    )
  );

  const tabs = [
    {
      id: "Home-fitted-2",
      content: "Home",
      accessibilityLabel: "Home",
      panelID: "Home-fitted-content-2",
    },
    {
      id: "Bundle-fitted-2",
      content: "Bundle",
      panelID: "Bundle-fitted-Ccontent-2",
    },
    {
      id: "Customization-fitted-2",
      content: "Customization",
      panelID: "Customization-fitted-Ccontent-2",
    },
    {
      id: "Analytics-fitted-2",
      content: "Analytics",
      panelID: "Analytics-fitted-Ccontent-2",
    },
    {
      id: "Settings-fitted-2",
      content: "Settings",
      panelID: "Settings-fitted-Ccontent-2",
    },
  ];

  const rows = [
    [
      <div className="avatar-row">
        <Avatar customer name="Farrah" />
        <Avatar customer name="Farrah" />
      </div>,
      "bundle #1",
      <Badge status="success">Active</Badge>,
      "10% off",
    ],
    [
      <div className="avatar-row">
        <Avatar customer name="Farrah" />
        <Avatar customer name="Farrah" />
      </div>,
      "bundle #2",
      <Badge>Draft</Badge>,
      "10% off",
    ],
    [
      <div className="avatar-row">
        <Avatar customer name="Farrah" />
        <Avatar customer name="Farrah" />
      </div>,
      "bundle #2",
      <Badge>Draft</Badge>,
      "10% off",
    ],
  ];

  return (
    <Frame>
      <Page>
        <div className="home-card">
          <Card>
            <Tabs
              tabs={tabs}
              selected={selected}
              onSelect={handleTabChange}
              fitted
            >
              <Layout>
                <Layout.Section>
                  {selected == 0 && (
                    <>
                      <Card>
                        <HorizontalStack wrap={false}>
                          <VerticalStack>
                            <Text variant="headingMd" as="h2">
                              Your Ultimate Super Bundle Guide
                            </Text>
                            <p className="callout-description">
                              Want to boost your success? Learn about Fast
                              Bundle and product bundling on Shopify, with
                              answers to common questions. Stay tuned for
                              updates!
                            </p>
                            <div style={{ color: "#008060" }}>
                              <Button monochrome outline>
                                Read now
                              </Button>
                            </div>
                          </VerticalStack>
                          <img src={welcome} width="63" />
                        </HorizontalStack>
                      </Card>
                      <Layout.Section>
                        <HorizontalStack wrap={false} gap="6">
                          <div className="hometab-left-div">
                            <VerticalStack gap="4">
                              <HorizontalStack
                                align={"space-between"}
                                blockAlign="center"
                              >
                                <Text variant="headingMd" as="h2">
                                  Recent Bundle
                                </Text>
                                <Button primary>Create New Bundle</Button>
                              </HorizontalStack>

                              {rows.length > 0 ? (
                                <div className="bundle-table">
                                  <DataTable
                                    columnContentTypes={[
                                      "text",
                                      "text",
                                      "text",
                                      "text",
                                    ]}
                                    headings={[
                                      "Bundle",
                                      "Name",
                                      "Status",
                                      "Discount",
                                    ]}
                                    rows={rows}
                                    footerContent={
                                      <Button plain>Show all bundles</Button>
                                    }
                                    hasZebraStripingOnData
                                  />
                                </div>
                              ) : (
                                <Card>
                                  <EmptyState
                                    heading="No bundles yet!"
                                    action={{ content: "Add transfer" }}
                                    secondaryAction={{
                                      content: "Learn more",
                                      url: "https://help.shopify.com",
                                    }}
                                    image={welcome}
                                  >
                                    <p>
                                      Create the first one to boost your sales
                                    </p>
                                  </EmptyState>
                                </Card>
                              )}
                            </VerticalStack>
                          </div>
                          <div className="hometab-right-div">
                            <Grid
                              columns={{ xs: 1, sm: 2, md: 2, lg: 2, xl: 2 }}
                            >
                              <Grid.Cell>
                                <Card>
                                  <VerticalStack
                                    gap="5"
                                    align="center"
                                    inlineAlign="center"
                                  >
                                    <img src={welcome} width="40" />
                                    <VerticalStack
                                      align="center"
                                      inlineAlign="center"
                                    >
                                      <Text variant="headingSm" as="p">
                                        Bundle view
                                      </Text>
                                      <Text variant="headingSm" as="p">
                                        0
                                      </Text>
                                    </VerticalStack>
                                  </VerticalStack>
                                </Card>
                              </Grid.Cell>
                              <Grid.Cell>
                                <Card>
                                  <VerticalStack
                                    gap="5"
                                    align="center"
                                    inlineAlign="center"
                                  >
                                    <img src={welcome} width="40" />
                                    <VerticalStack
                                      align="center"
                                      inlineAlign="center"
                                    >
                                      <Text variant="headingSm" as="p">
                                        Bundle clicks
                                      </Text>
                                      <Text variant="headingSm" as="p">
                                        0
                                      </Text>
                                    </VerticalStack>
                                  </VerticalStack>
                                </Card>
                              </Grid.Cell>
                              <Grid.Cell>
                                <Card>
                                  <VerticalStack
                                    gap="5"
                                    align="center"
                                    inlineAlign="center"
                                  >
                                    <img src={welcome} width="40" />
                                    <VerticalStack
                                      align="center"
                                      inlineAlign="center"
                                    >
                                      <Text variant="headingSm" as="p">
                                        Sold bundle quantity
                                      </Text>
                                      <Text variant="headingSm" as="p">
                                        0
                                      </Text>
                                    </VerticalStack>
                                  </VerticalStack>
                                </Card>
                              </Grid.Cell>
                              <Grid.Cell>
                                <Card>
                                  <VerticalStack
                                    gap="5"
                                    align="center"
                                    inlineAlign="center"
                                  >
                                    <img src={welcome} width="40" />
                                    <VerticalStack
                                      align="center"
                                      inlineAlign="center"
                                    >
                                      <Text variant="headingSm" as="p">
                                        Total sale value
                                      </Text>
                                      <Text variant="headingSm" as="p">
                                        0
                                      </Text>
                                    </VerticalStack>
                                  </VerticalStack>
                                </Card>
                              </Grid.Cell>
                            </Grid>
                          </div>
                        </HorizontalStack>
                      </Layout.Section>
                    </>
                  )}
                  {selected == 1 && (
                    <div className="bundletab-main">
                      <div className="bundle-tab-main-buttons">
                        <HorizontalStack
                          wrap={false}
                          align="space-between"
                          blockAlign="center"
                        >
                          <Text variant="headingMd" as="h1">
                            Bundles
                          </Text>
                          <Button primary onClick={toggleBundlePopup}>
                            Create new Bundle
                          </Button>
                        </HorizontalStack>
                      </div>
                      <Tabs
                        tabs={tabletabs}
                        selected={tselected}
                        onSelect={handleTTabChange}
                      >
                        {tselected === 0 && (
                          <div className="bundle-table">
                            <div className="filter-div">
                              <HorizontalStack wrap={false} gap="2">
                                <div className="filter-input">
                                  <TextField
                                    label="Filter"
                                    labelHidden
                                    type="text"
                                    onChange={handleTextFieldChange}
                                    prefix={<Icon source={SearchMinor} />}
                                    placeholder="Filter"
                                    autoComplete="off"
                                  />
                                </div>

                                <div>
                                  <HorizontalStack wrap={false} gap="1">
                                    <Popover
                                      active={active.active_one}
                                      activator={activatorone}
                                      autofocusTarget="first-node"
                                      onClose={() => toggleActive("active_one")}
                                    >
                                      <ActionList
                                        actionRole="menuitem"
                                        items={[
                                          {
                                            content: "Import file",
                                            onAction: () => console.log("1"),
                                          },
                                          {
                                            content: "Export file",
                                            onAction: () => console.log("1"),
                                          },
                                        ]}
                                      />
                                    </Popover>
                                    <Popover
                                      active={active.active_two}
                                      activator={activatortwo}
                                      autofocusTarget="first-node"
                                      onClose={() => toggleActive("active_two")}
                                    >
                                      <ActionList
                                        actionRole="menuitem"
                                        items={[
                                          {
                                            content: "Import file",
                                            onAction: () => console.log("1"),
                                          },
                                          {
                                            content: "Export file",
                                            onAction: () => console.log("1"),
                                          },
                                        ]}
                                      />
                                    </Popover>
                                    <Popover
                                      active={active.active_three}
                                      activator={activatorthree}
                                      autofocusTarget="first-node"
                                      onClose={() =>
                                        toggleActive("active_three")
                                      }
                                    >
                                      <ActionList
                                        actionRole="menuitem"
                                        items={[
                                          {
                                            content: "Import file",
                                            onAction: () => console.log("1"),
                                          },
                                          {
                                            content: "Export file",
                                            onAction: () => console.log("1"),
                                          },
                                        ]}
                                      />
                                    </Popover>
                                  </HorizontalStack>
                                </div>
                                <div>
                                  <HorizontalStack wrap={false} gap="2">
                                    <Button disabled>
                                      <HorizontalStack wrap={false}>
                                        <Icon source={SortMinor} />
                                        <Text variant="bodySm" as="p">
                                          Saved
                                        </Text>
                                      </HorizontalStack>{" "}
                                    </Button>
                                    <Button>
                                      {" "}
                                      <HorizontalStack wrap={false}>
                                        <Icon source={SortMinor} />
                                        <Text variant="bodySm" as="p">
                                          Sort
                                        </Text>
                                      </HorizontalStack>
                                    </Button>
                                  </HorizontalStack>
                                </div>
                              </HorizontalStack>
                            </div>
                            <IndexTable
                              resourceName={resourceName}
                              itemCount={orders.length}
                              selectedItemsCount={
                                allResourcesSelected
                                  ? "All"
                                  : selectedResources.length
                              }
                              hasMoreItems={true}
                              onSelectionChange={handleSelectionChange}
                              headings={[
                                { title: "Bundled items" },
                                { title: "Name" },
                                { title: "Status" },
                                { title: "Type" },
                                { title: "Discount" },
                                { title: "Bundle as a product" },
                              ]}
                            >
                              {rowMarkup}
                            </IndexTable>
                            <div className="table-pagination">
                              <Pagination
                                label="Show page 1 of 1"
                                hasPrevious
                                onPrevious={() => {
                                  console.log("Previous");
                                }}
                                hasNext
                                onNext={() => {
                                  console.log("Next");
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </Tabs>
                    </div>
                  )}
                  {selected == 2 && (
                    <>
                      <div style={{ marginBottom: "17px", marginTop: "16px" }}>
                        <Text as="h1" variant="headingLg">
                          Customization
                        </Text>
                      </div>
                      <VerticalStack gap="2">
                        <Text as="h2" variant="headingMd">
                          Design
                        </Text>
                        <div style={{ marginBottom: "16px" }}>
                          <Text as="p" variant="bodyMd">
                            You can customize different design types of bundles
                            in different displays and change the colors,
                            typography and other items in accordance with your
                            shop design.
                          </Text>
                        </div>
                      </VerticalStack>
                      <VerticalStack gap="2">
                        <Card>
                          <Text as="h2" variant="headingMd">
                            Design
                          </Text>
                          <div className="design-card-subtitle">
                            <Text as="p" variant="bodyMd">
                              You can customize different design types of
                              bundles in different displays and change the
                              colors, typography and other items in accordance
                              with your shop design.
                            </Text>
                          </div>
                          <div
                            style={{ display: "flex", justifyContent: "end" }}
                          >
                            <Button primary>Customize</Button>
                          </div>
                        </Card>
                        <Divider />
                        <VerticalStack gap="4">
                          <VerticalStack gap="2">
                            <Text as="h2" variant="headingMd">
                              Bundle priority
                            </Text>
                            <Text as="p" variant="bodyMd">
                              Customize the order of the bundles on the Product
                              Page and Bundles Page according to the bundles
                              priority.
                            </Text>
                          </VerticalStack>
                          <HorizontalGrid columns={2} gap="8">
                            <Card>
                              <Text as="h2" variant="headingMd">
                                Bundles page
                              </Text>
                              <div className="design-card-subtitle">
                                <Text as="p" variant="bodySm">
                                  Customize the priority of the bundles
                                  displayed on the bundles page, and you can
                                  display important bundles at the top of the
                                  screen.
                                </Text>
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "end",
                                  marginTop: "7px",
                                }}
                              >
                                <Button primary>Customize</Button>
                              </div>
                            </Card>
                            <Card>
                              <Text as="h2" variant="headingMd">
                                Products page
                              </Text>
                              <div className="design-card-subtitle">
                                <Text as="p" variant="bodySm">
                                  From the list of products that have bundles,
                                  select the product you want and customize the
                                  priority in which the bundles are displayed on
                                  the page of that product.
                                </Text>
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "end",
                                  marginTop: "7px",
                                }}
                              >
                                <Button primary>Customize</Button>
                              </div>
                            </Card>
                          </HorizontalGrid>
                        </VerticalStack>
                        <Divider />
                      </VerticalStack>
                    </>
                  )}
                  {selected == 3 && (
                    <div className="analytics-tab-main">
                      <VerticalStack gap="4">
                        <Text as="h1" variant="headingLg">
                          Analytics
                        </Text>
                        <ButtonGroup segmented>
                          <Button
                            pressed={activeAnalyticsButtonIndex === 0}
                            onClick={() => handleAnalyticsButtonClick(0)}
                          >
                            Based on bundle
                          </Button>
                          <Button
                            pressed={activeAnalyticsButtonIndex === 1}
                            onClick={() => handleAnalyticsButtonClick(1)}
                          >
                            Based on order
                          </Button>
                        </ButtonGroup>
                      </VerticalStack>
                      <div
                        className="analytics-filter-div"
                        style={{ marginBottom: "33px", marginTop: "8px" }}
                      >
                        <HorizontalStack gap="5" blockAlign="center">
                          <Text variant="bodyMd" as="p">
                            Data range
                          </Text>
                          <div className="analytics-filter-selector">
                            <Select
                              label="Analytics filter"
                              labelHidden
                              options={analyticsfilteroptions}
                              onChange={handleFilterSelectChange}
                              value={filterSelected}
                            />
                          </div>
                        </HorizontalStack>
                      </div>
                      <div
                        className="analytics-cards"
                        style={{ marginBottom: "40px" }}
                      >
                        <HorizontalGrid columns={4} gap="5">
                          <Card>
                            <VerticalStack gap="4" inlineAlign="center">
                              <Text variant="bodyMd" as="p">
                                Sales value on bundles
                              </Text>
                              <Text variant="bodyLg" as="p">
                                $ 0
                              </Text>
                            </VerticalStack>
                          </Card>
                          <Card>
                            <VerticalStack gap="4" inlineAlign="center">
                              <Text variant="bodyMd" as="p">
                                Numbers of sold bundles
                              </Text>
                              <Text variant="bodyLg" as="p">
                                0
                              </Text>
                            </VerticalStack>
                          </Card>
                          <Card>
                            <VerticalStack gap="4" inlineAlign="center">
                              <Text variant="bodyMd" as="p">
                                Bundles view
                              </Text>
                              <Text variant="bodyLg" as="p">
                                0
                              </Text>
                            </VerticalStack>
                          </Card>
                          <Card>
                            <VerticalStack gap="4" inlineAlign="center">
                              <Text variant="bodyMd" as="p">
                                Bundles clicks
                              </Text>
                              <Text variant="bodyLg" as="p">
                                0
                              </Text>
                            </VerticalStack>
                          </Card>
                        </HorizontalGrid>
                      </div>
                      <div className="bundle-table">
                        <DataTable
                          columnContentTypes={[
                            "text",
                            "text",
                            "text",
                            "text",
                            "text",
                            "text",
                            "text",
                          ]}
                          headings={[
                            "Bundle items",
                            "Bundle name",
                            "Status",
                            "Sales value",
                            "Sales number",
                            "Clicks",
                            "Views",
                          ]}
                          rows={analyticstablerows}
                          footerContent={
                            <div className="analytics-table-pagination">
                              <Pagination
                                label="Showing page 1 of 1"
                                hasPrevious
                                onPrevious={() => {
                                  console.log("Previous");
                                }}
                                hasNext
                                onNext={() => {
                                  console.log("Next");
                                }}
                              />
                            </div>
                          }
                          hasZebraStripingOnData
                        />
                      </div>
                    </div>
                  )}
                  {selected == 4 && (
                    <>
                      <div className="settings-tab-title">
                        <Text variant="headingLg" as="h1">
                          Setting
                        </Text>
                      </div>
                      <Grid
                        gap={{
                          xs: "20px",
                          sm: "20px",
                          md: "20px",
                          lg: "20px",
                          xl: "20px",
                        }}
                        columns={{ xs: 1, sm: 2, md: 2, lg: 2, xl: 2 }}
                      >
                        <Grid.Cell>
                          <div className="settingtab-card">
                            <Link
                              onClick={() => cnav("/app/bundle_settings")}
                              removeUnderline={true}
                            >
                              <Card>
                                <HorizontalStack wrap={false} gap="5">
                                  <Avatar
                                    shape="square"
                                    customer
                                    name="Farrah"
                                  />
                                  <VerticalStack>
                                    <Text as="h2" variant="headingMd">
                                      Bundle settings
                                    </Text>
                                    <Text as="p" variant="bodyMd">
                                      Manage settings about bundle inventory,
                                      button, discount and pricing
                                    </Text>
                                  </VerticalStack>
                                </HorizontalStack>
                              </Card>
                            </Link>
                          </div>
                        </Grid.Cell>
                        <Grid.Cell>
                          <div className="settingtab-card">
                            <Link removeUnderline={true}>
                              <Card>
                                <HorizontalStack wrap={false} gap="5">
                                  <Avatar
                                    shape="square"
                                    customer
                                    name="Farrah"
                                  />
                                  <VerticalStack>
                                    <Text as="h2" variant="headingMd">
                                      Translation
                                    </Text>
                                    <Text as="p" variant="bodyMd">
                                      Translate the bundles’ content to your
                                      shop’s language
                                    </Text>
                                  </VerticalStack>
                                </HorizontalStack>
                              </Card>
                            </Link>
                          </div>
                        </Grid.Cell>
                        <Grid.Cell>
                          <div className="settingtab-card">
                            <Link removeUnderline={true}>
                              <Card>
                                <HorizontalStack wrap={false} gap="5">
                                  <Avatar
                                    shape="square"
                                    customer
                                    name="Farrah"
                                  />
                                  <VerticalStack>
                                    <Text as="h2" variant="headingMd">
                                      Featured Request
                                    </Text>
                                    <Text as="p" variant="bodyMd">
                                      Tell us what feature you need
                                    </Text>
                                  </VerticalStack>
                                </HorizontalStack>
                              </Card>
                            </Link>
                          </div>
                        </Grid.Cell>
                        <Grid.Cell>
                          <div className="settingtab-card">
                            <Link removeUnderline={true}>
                              <Card>
                                <HorizontalStack wrap={false} gap="5">
                                  <Avatar
                                    shape="square"
                                    customer
                                    name="Farrah"
                                  />
                                  <VerticalStack>
                                    <Text as="h2" variant="headingMd">
                                      Plan
                                    </Text>
                                    <Text as="p" variant="bodyMd">
                                      Manage and view your fast Bundle plan
                                    </Text>
                                  </VerticalStack>
                                </HorizontalStack>
                              </Card>
                            </Link>
                          </div>
                        </Grid.Cell>
                        <Grid.Cell>
                          <div className="settingtab-card">
                            <Link removeUnderline={true}>
                              <Card>
                                <HorizontalStack wrap={false} gap="5">
                                  <Avatar
                                    shape="square"
                                    customer
                                    name="Farrah"
                                  />
                                  <VerticalStack>
                                    <Text as="h2" variant="headingMd">
                                      Restore pages
                                    </Text>
                                    <Text as="p" variant="bodyMd">
                                      Recreate the Bundles page and the Bundle
                                      builder page if they are mistakenly
                                      removed.
                                    </Text>
                                  </VerticalStack>
                                </HorizontalStack>
                              </Card>
                            </Link>
                          </div>
                        </Grid.Cell>
                        <Grid.Cell>
                          <div className="settingtab-card">
                            <Link removeUnderline={true}>
                              <Card>
                                <HorizontalStack wrap={false} gap="5">
                                  <Avatar
                                    shape="square"
                                    customer
                                    name="Farrah"
                                  />
                                  <VerticalStack>
                                    <Text as="h2" variant="headingMd">
                                      Featured apps
                                    </Text>
                                    <Text as="p" variant="bodyMd">
                                      Grow your business with a handpicked
                                      collection of apps
                                    </Text>
                                  </VerticalStack>
                                </HorizontalStack>
                              </Card>
                            </Link>
                          </div>
                        </Grid.Cell>
                      </Grid>
                    </>
                  )}

                  <div style={{ height: "500px" }}>
                    <Modal
                      large
                      open={bundlepopup}
                      onClose={toggleBundlePopup}
                      title=""
                    >
                      <Modal.Section>
                        <div className="bundle-popup">
                          <Grid>
                            <Grid.Cell
                              columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}
                            >
                              <Link
                                onClick={() => cnav("/app/create_bundle_form")}
                                removeUnderline={true}
                              >
                                <VerticalStack gap="2">
                                  <HorizontalStack
                                    wrap={false}
                                    align="space-between"
                                    gap="2"
                                  >
                                    <>
                                      <img
                                        src={welcome}
                                        alt="iconimage"
                                        width="50px"
                                      />
                                    </>
                                    <VerticalStack inlineAlign="start">
                                      <Text variant="headingSm" as="h2">
                                        Bundle
                                      </Text>
                                      <div className="bundle-popup-button-subtext">
                                        <Text
                                          variant="bodySm"
                                          as="p"
                                          alignment="start"
                                        >
                                          Offer a discount when a customer buys
                                          some fixed products together. (Combo
                                          product option is available)
                                        </Text>
                                      </div>
                                    </VerticalStack>
                                  </HorizontalStack>
                                  <Card
                                    padding={{
                                      xs: "2",
                                      sm: "2",
                                      md: "2",
                                      lg: "2",
                                      xl: "2",
                                    }}
                                  >
                                    <div className="bundle-popup-button-footer-text">
                                      <Text variant="bodySm" as="p">
                                        Example: Buy X + Y to get 20% off.
                                      </Text>
                                    </div>
                                  </Card>
                                </VerticalStack>
                              </Link>
                            </Grid.Cell>
                            <Grid.Cell
                              columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}
                            >
                              <Link removeUnderline={true}>
                                <VerticalStack gap="2">
                                  <HorizontalStack
                                    wrap={false}
                                    align="space-between"
                                    gap="2"
                                  >
                                    <>
                                      <img
                                        src={welcome}
                                        alt="iconimage"
                                        width="50px"
                                      />
                                    </>
                                    <VerticalStack inlineAlign="start">
                                      <Text variant="headingSm" as="h2">
                                        Volume discount
                                      </Text>
                                      <div className="bundle-popup-button-subtext">
                                        <Text
                                          variant="bodySm"
                                          as="p"
                                          alignment="start"
                                        >
                                          Offer a discount when a customer buys
                                          several instances of the same product.
                                        </Text>
                                      </div>
                                    </VerticalStack>
                                  </HorizontalStack>
                                  <Card
                                    padding={{
                                      xs: "2",
                                      sm: "2",
                                      md: "2",
                                      lg: "2",
                                      xl: "2",
                                    }}
                                  >
                                    <div className="bundle-popup-button-footer-text">
                                      <Text variant="bodySm" as="p">
                                        Example: BOGO, Buy 3 items of X to get
                                        20% off.
                                      </Text>
                                    </div>
                                  </Card>
                                </VerticalStack>
                              </Link>
                            </Grid.Cell>
                            <Grid.Cell
                              columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}
                            >
                              <Link removeUnderline={true}>
                                <VerticalStack gap="2">
                                  <HorizontalStack
                                    wrap={false}
                                    align="space-between"
                                    gap="2"
                                  >
                                    <>
                                      <img
                                        src={welcome}
                                        alt="iconimage"
                                        width="50px"
                                      />
                                    </>
                                    <VerticalStack inlineAlign="start">
                                      <Text variant="headingSm" as="h2">
                                        Product mix & match
                                      </Text>
                                      <div className="bundle-popup-button-subtext">
                                        <Text
                                          variant="bodySm"
                                          as="p"
                                          alignment="start"
                                        >
                                          Offer a discount when a customer buys
                                          at least a specific number of items
                                          from a group of products. (Combo
                                          product option is available)
                                        </Text>
                                      </div>
                                    </VerticalStack>
                                  </HorizontalStack>
                                  <Card
                                    padding={{
                                      xs: "2",
                                      sm: "2",
                                      md: "2",
                                      lg: "2",
                                      xl: "2",
                                    }}
                                  >
                                    <div className="bundle-popup-button-footer-text">
                                      <Text variant="bodySm" as="p">
                                        Example: Buy at least 2 items from X, Y,
                                        Z to get 20% off.
                                      </Text>
                                    </div>
                                  </Card>
                                </VerticalStack>
                              </Link>
                            </Grid.Cell>
                            <Grid.Cell
                              columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}
                            >
                              <Link removeUnderline={true}>
                                <VerticalStack gap="2">
                                  <HorizontalStack
                                    wrap={false}
                                    align="space-between"
                                    gap="2"
                                  >
                                    <>
                                      <img
                                        src={welcome}
                                        alt="iconimage"
                                        width="50px"
                                      />
                                    </>
                                    <VerticalStack inlineAlign="start">
                                      <Text variant="headingSm" as="h2">
                                        Collection mix & match
                                      </Text>
                                      <div className="bundle-popup-button-subtext">
                                        <Text
                                          variant="bodySm"
                                          as="p"
                                          alignment="start"
                                        >
                                          Offer a discount when a customer buys
                                          specified numbers of products from
                                          specified collections.
                                        </Text>
                                      </div>
                                    </VerticalStack>
                                  </HorizontalStack>
                                  <Card
                                    padding={{
                                      xs: "2",
                                      sm: "2",
                                      md: "2",
                                      lg: "2",
                                      xl: "2",
                                    }}
                                  >
                                    <div className="bundle-popup-button-footer-text">
                                      <Text variant="bodySm" as="p">
                                        Example: Buy 4 items from collection X
                                        and 2 from collection Y to get $30 off.
                                      </Text>
                                    </div>
                                  </Card>
                                </VerticalStack>
                              </Link>
                            </Grid.Cell>
                            <Grid.Cell
                              columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}
                            >
                              <Link removeUnderline={true}>
                                <VerticalStack gap="2">
                                  <HorizontalStack
                                    wrap={false}
                                    align="space-between"
                                    gap="2"
                                  >
                                    <>
                                      <img
                                        src={welcome}
                                        alt="iconimage"
                                        width="50px"
                                      />
                                    </>
                                    <VerticalStack inlineAlign="start">
                                      <Text variant="headingSm" as="h2">
                                        Buy X get Y
                                      </Text>
                                      <div className="bundle-popup-button-subtext">
                                        <Text
                                          variant="bodySm"
                                          as="p"
                                          alignment="start"
                                        >
                                          Offer free gifts or discounted
                                          product(s) when a customer buys
                                          specific product(s).
                                        </Text>
                                      </div>
                                    </VerticalStack>
                                  </HorizontalStack>
                                  <Card
                                    padding={{
                                      xs: "2",
                                      sm: "2",
                                      md: "2",
                                      lg: "2",
                                      xl: "2",
                                    }}
                                  >
                                    <div className="bundle-popup-button-footer-text">
                                      <Text variant="bodySm" as="p">
                                        Example: Buy X and get Y for free or Buy
                                        X and get Y with 20% off.
                                      </Text>
                                    </div>
                                  </Card>
                                </VerticalStack>
                              </Link>
                            </Grid.Cell>
                            <Grid.Cell
                              columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}
                            >
                              <Link removeUnderline={true}>
                                <VerticalStack gap="2">
                                  <HorizontalStack
                                    wrap={false}
                                    align="space-between"
                                    gap="2"
                                  >
                                    <>
                                      <img
                                        src={welcome}
                                        alt="iconimage"
                                        width="50px"
                                      />
                                    </>
                                    <VerticalStack inlineAlign="start">
                                      <Text variant="headingSm" as="h2">
                                        Frequently bought together
                                      </Text>
                                      <div className="bundle-popup-button-subtext">
                                        <Text
                                          variant="bodySm"
                                          as="p"
                                          alignment="start"
                                        >
                                          Recommend products that are frequently
                                          bought alongside a specific product
                                          like Amazon (with or without a
                                          discount).
                                        </Text>
                                      </div>
                                    </VerticalStack>
                                  </HorizontalStack>
                                  <Card
                                    padding={{
                                      xs: "2",
                                      sm: "2",
                                      md: "2",
                                      lg: "2",
                                      xl: "2",
                                    }}
                                  >
                                    <div className="bundle-popup-button-footer-text">
                                      <Text variant="bodySm" as="p">
                                        Example: Y and Z are frequently bought
                                        together with X.
                                      </Text>
                                    </div>
                                  </Card>
                                </VerticalStack>
                              </Link>
                            </Grid.Cell>
                          </Grid>
                        </div>
                      </Modal.Section>
                    </Modal>
                  </div>
                </Layout.Section>
              </Layout>
            </Tabs>
          </Card>
        </div>
      </Page>
    </Frame>
  );
}

function Code({ children }) {
  return (
    <Box
      as="span"
      padding="025"
      paddingInlineStart="1"
      paddingInlineEnd="1"
      background="bg-subdued"
      borderWidth="1"
      borderColor="border"
      borderRadius="1"
    >
      <code>{children}</code>
    </Box>
  );
}
