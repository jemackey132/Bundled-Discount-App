// @ts-nocheck
import { useEffect, useCallback, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { redirect } from "react-router-dom";
// import { redirect } from "@remix-run/node"; // or cloudflare/deno
import { json } from "@remix-run/node";
import { EditMajor } from "@shopify/polaris-icons";
import {
  useActionData,
  useLoaderData,
  useFetcher,
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
import prisma from "../db.server";
import { getBundles } from "../bundle.server";

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);

  const bundles = await getBundles(session.shop);
  // console.log()
  return json(bundles);
};

export default function AdditionalPage() {
  const cnav = useNavigate();
  const fetcher = useFetcher();
  const [viewCount, setViewCount] = useState(0);
  const [clickCount, setClickCount] = useState(0); 
  const [orderCount, setOrderCount] = useState(0); 
  const [saleCount, setSaleCount] = useState(0); 

  const loadData = useRef(false);



  const [selected, setSelected] = useState(0);
  const [tselected, setTSelected] = useState(0);

  const bundleData = useLoaderData();

  const data = fetcher.data || bundleData;

  // const revalidate = () => {
  //   if (document.visibilityState === "visible") {
  //     fetcher.load("/app/additional");
  //   }
  // };

  // useEffect(() => {
  //   document.addEventListener("visibilitychange", revalidate);

  //   return () => document.removeEventListener("visibilitychange", revalidate);
  // }, []);

  console.log('(88)Bundle Data: ', bundleData);

  const [bundlepopup, setBundlePopup] = useState(false);

  const toggleBundlePopup = useCallback(
    () => setBundlePopup((bundlepopup) => !bundlepopup),
    []
  );

  const handleTabChange = useCallback(
    (selectedTabIndex) => {
      loadData.current = false;
      setSelected(selectedTabIndex)
    },
    []
  );

  useEffect(()=>{
    console.log('(108)index state: ', selected);
    if((selected == 0 || selected == 3) && loadData.current == false){
      console.log('condition ture')
      fetcher.load("/app/additional");
      loadData.current = true;
    }
  }, [selected])

  // console.log('fetcher Data: ', fetcher);

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
      label: "from beginning to now",
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
      "100",
      "10",
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

  const [orders, setOrders] = useState([
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
  ]);

  const editBundle = (id) => {
    cnav("/app/create_bundle_form");
    console.log("bundle id:", id);
  };

  useEffect(() => {
    // Map the bundle data to the desired format
    const mappedTableData = data.map((bundle) => ({
      id: bundle.id,
      bundle: (
        <div className="avatar-row">
          {bundle.bundle_items.map((item) => (
            <Avatar
              customer
              key={item.id}
              name={item.name}
              source={item.image}
            />
          ))}
        </div>
      ),
      name: bundle.bundle_name,
      status: (
        <div className="custom-badge">
          <Badge status={bundle.bundle_status ? "success" : "default"}>
            {bundle.bundle_status ? "active" : "inactive"}
          </Badge>
        </div>
      ),
      type: "Bundle",
      discount:
        bundle.bundle_discount_type == "percentage"
          ? `${bundle.bundle_discount_value}% off`
          : `$${bundle.bundle_discount_value} off`,
      
    }));

    

    const mappedRows = data.map((bundle) => [
      // "Bundle items",
        // "Bundle name",
        // "Status",
        // "Sales value",
        // "Sales number",
        // "Clicks",
        // "Views",
      <div className="avatar-row">
        {bundle.bundle_items.map((item) => (
          <Avatar customer key={item.id} name={item.name} source={item.image} />
        ))}
      </div>,
      bundle.bundle_name,
      <div className="custom-badge">
        <Badge status={bundle.bundle_status ? "success" : "default"}>
          {bundle.bundle_status ? "active" : "inactive"}
        </Badge>
      </div>,
      // bundle.bundle_discount_type === "percentage"
      // ? `${bundle.bundle_discount_value}% off`
      // : `$${bundle.bundle_discount_value} `,
      bundle.bundle_sales,
      bundle.bundle_orders,
      bundle.bundle_clicks,
      bundle.bundle_views
    ]);

    const recentMappedRows = data.map((bundle) => [
      <div className="avatar-row">
        {bundle.bundle_items.map((item) => (
          <Avatar customer key={item.id} name={item.name} source={item.image} />
        ))}
      </div>,
      bundle.bundle_name,
      <div className="custom-badge">
        <Badge status={bundle.bundle_status ? "success" : "default"}>
          {bundle.bundle_status ? "active" : "inactive"}
        </Badge>
      </div>,
       bundle.bundle_discount_type === "percentage"
       ? `${bundle.bundle_discount_value}% off`
       : `$${bundle.bundle_discount_value} `,
    ]);

    setRows(mappedRows);
    setRecentRows(recentMappedRows)
    // Set the mapped data in the state
    setOrders(mappedTableData);

    let v = 0;
    let c = 0;
    let o = 0;
    let s = 0;
    data.forEach(e => {
      v+=e.bundle_views;
      c+=e.bundle_clicks;
      o+=e.bundle_orders;
      s+=e.bundle_sales;

    });

    setViewCount(v);
    setClickCount(c);
    setOrderCount(o);
    setSaleCount(s);


  }, [data]);
  //use effect closed
  const resourceName = {
    singular: "bundle",
    plural: "Bundles",
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
        <IndexTable.Cell>
          <Link
            onClick={() => cnav(`/app/create_bundle_form/${id}`)}
            removeUnderline={true}
          >
            <Icon source={EditMajor} color="base" />
          </Link>
        </IndexTable.Cell>
        {/* <IndexTable.Cell>{fulfillmentStatus}</IndexTable.Cell> */}
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
  const [recentRows,setRecentRows] = useState([])
  const [rows, setRows] = useState([
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
  ]);

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
                                <Button primary onClick={toggleBundlePopup}>
                                  Create New Bundle
                                </Button>
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
                                    rows={recentRows}
                                    footerContent={
                                      <Button
                                        onClick={() => handleTabChange(1)}
                                        plain
                                      >
                                        Show all bundles
                                      </Button>
                                    }
                                    hasZebraStripingOnData
                                  />
                                </div>
                              ) : (
                                <Card>
                                  <EmptyState
                                    heading="No bundles yet!"
                                    // action={{ content: "Add transfer" }}
                                    // secondaryAction={{
                                    //   content: "Learn more",
                                    //   url: "https://help.shopify.com",
                                    // }}
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
                                        Bundle views
                                      </Text>
                                      <Text variant="headingSm" as="p">
                                        {viewCount}
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
                                        {clickCount}
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
                                        {orderCount}
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
                                        Total sales
                                      </Text>
                                      <Text variant="headingSm" as="p">
                                        $ {saleCount}
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
                                { title: "Action" },
                                // { title: "Bundle as a product" },
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
                                Total bundle sales
                              </Text>
                              <Text variant="bodyLg" as="p">
                                $ {saleCount}
                              </Text>
                            </VerticalStack>
                          </Card>
                          <Card>
                            <VerticalStack gap="4" inlineAlign="center">
                              <Text variant="bodyMd" as="p">
                                Number of bundles sold
                              </Text>
                              <Text variant="bodyLg" as="p">
                                {orderCount}
                              </Text>
                            </VerticalStack>
                          </Card>
                          <Card>
                            <VerticalStack gap="4" inlineAlign="center">
                              <Text variant="bodyMd" as="p">
                                Bundles view
                              </Text>
                              <Text variant="bodyLg" as="p">
                                {viewCount}
                              </Text>
                            </VerticalStack>
                          </Card>
                          <Card>
                            <VerticalStack gap="4" inlineAlign="center">
                              <Text variant="bodyMd" as="p">
                                Bundles clicks
                              </Text>
                              <Text variant="bodyLg" as="p">
                                {clickCount}
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
                            "Total sales",
                            "Number sold",
                            "Clicks",
                            "Views",
                          ]}
                          rows={rows}
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
                          Settings
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
                                      Feature Request
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
                                      Manage your plan
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
                                onClick={() =>
                                  cnav("/app/create_bundle_form/new")
                                }
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
                                          Offer a discount when customers buy select products together)
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
                                          Offer a discount when customers buy a minimum quantity of a single product.
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
                                          Offer a discount when customers buy minimum quantities of two or more products.
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
