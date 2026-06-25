// @ts-nocheck
import { useEffect, useCallback, useState, useRef, useMemo } from "react";
import { ClientOnly } from "remix-utils";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { redirect } from "react-router-dom";
// import { redirect } from "@remix-run/node"; // or cloudflare/deno
import { json } from "@remix-run/node";
import {
  EditIcon, DeleteIcon, SearchIcon,
  ViewIcon, CursorIcon, OrderIcon, CashDollarIcon,
  SettingsIcon, LanguageTranslateIcon, QuestionCircleIcon,
  CreditCardIcon, RefreshIcon,
} from "@shopify/polaris-icons";
import {
  useActionData,
  useLoaderData,
  useFetcher,
  useNavigation,
  useSubmit,
  useSearchParams,
} from "@remix-run/react";
import welcome from "../../public/bandana-logo.svg";
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
  Banner,
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
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { getBundles } from "../bundle.server";
import { checkBillingStatus } from "../billing.server";
import { getVolumeDiscounts } from "../volume_discount.server";
import { getBuyXGetYOffers } from "../bogo.server";

export const loader = async ({ request }) => {
  const { admin, session, billing } = await authenticate.admin(request);

  const [bundles, discounts, bogoOffers] = await Promise.all([
    getBundles(session.shop),
    getVolumeDiscounts(session.shop),
    getBuyXGetYOffers(session.shop),
  ]);
  const { isPro } = await checkBillingStatus(billing).catch(() => ({ isPro: false }));

  // Time-series: last 30 days of BundleEvents grouped by date
  const since = new Date();
  since.setDate(since.getDate() - 29);
  since.setHours(0, 0, 0, 0);

  const rawEvents = await prisma.bundleEvent.findMany({
    where: { shop: session.shop, created_at: { gte: since } },
    select: { event_type: true, value: true, created_at: true, offer_type: true },
    orderBy: { created_at: "asc" },
  });

  // Build a map of date → { orders, sales, views, clicks }
  const dateMap = {};
  for (let i = 0; i < 30; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    dateMap[key] = { date: key, orders: 0, sales: 0, views: 0, clicks: 0 };
  }
  // Offer-type breakdown totals
  const offerTypeTotals = { bundle: { orders: 0, sales: 0 }, volume_discount: { orders: 0, sales: 0 }, bogo: { orders: 0, sales: 0 } };
  for (const e of rawEvents) {
    const key = e.created_at.toISOString().slice(0, 10);
    if (!dateMap[key]) continue;
    if (e.event_type === "order") {
      dateMap[key].orders += 1;
      dateMap[key].sales += e.value;
      const ot = e.offer_type || "bundle";
      if (offerTypeTotals[ot]) {
        offerTypeTotals[ot].orders += 1;
        offerTypeTotals[ot].sales += e.value;
      }
    }
    else if (e.event_type === "view") dateMap[key].views += 1;
    else if (e.event_type === "click") dateMap[key].clicks += 1;
  }
  // Round sales in breakdown
  for (const ot of Object.keys(offerTypeTotals)) {
    offerTypeTotals[ot].sales = parseFloat(offerTypeTotals[ot].sales.toFixed(2));
  }
  const timeSeries = Object.values(dateMap).map((d) => ({
    ...d,
    sales: parseFloat(d.sales.toFixed(2)),
    date: d.date.slice(5), // MM-DD for display
  }));

  return json({ bundles, discounts, bogoOffers, timeSeries, offerTypeTotals, shop: session.shop, isPro });
};

export default function AdditionalPage() {
  const cnav = useNavigate();
  const fetcher = useFetcher();
  const [searchParams] = useSearchParams();

  // Show toast when returning from form with ?saved=1
  useEffect(() => {
    if (searchParams.get("saved") === "1") {
      window.shopify?.toast?.show("Offer saved.");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [viewCount, setViewCount] = useState(0);
  const [clickCount, setClickCount] = useState(0); 
  const [orderCount, setOrderCount] = useState(0); 
  const [saleCount, setSaleCount] = useState(0); 

  const loadData = useRef(false);



  const [selected, setSelected] = useState(0);
  const [tselected, setTSelected] = useState(0);

  const loaderData = useLoaderData();
  const shop = loaderData.shop;
  const bundleData = loaderData.bundles;
  const discountData = loaderData.discounts ?? [];
  const bogoData = loaderData.bogoOffers ?? [];
  const timeSeries = loaderData.timeSeries ?? [];
  const offerTypeTotals = loaderData.offerTypeTotals ?? { bundle: { orders: 0, sales: 0 }, volume_discount: { orders: 0, sales: 0 }, bogo: { orders: 0, sales: 0 } };
  const isPro = loaderData.isPro;

  const data = fetcher.data?.bundles || bundleData;

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
  const [upgradeModal, setUpgradeModal] = useState({ open: false, feature: "", reason: "" });

  const toggleBundlePopup = useCallback(
    () => setBundlePopup((bundlepopup) => !bundlepopup),
    []
  );

  // Gate: show upgrade modal if free plan + already has a bundle; otherwise open normal popup
  const handleCreateBundle = useCallback(() => {
    if (!isPro && data.length >= 1) {
      setUpgradeModal({
        open: true,
        feature: "bundles",
        reason: "The Free plan is limited to 1 bundle. Upgrade to Pro for unlimited bundles.",
      });
    } else {
      toggleBundlePopup();
    }
  }, [isPro, data, toggleBundlePopup]);

  const handleComingSoon = useCallback(() => {
    window.shopify.toast.show("Coming soon — we're building this next!", { duration: 3000 });
  }, []);

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



  const [searchValue, setSearchValue] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [typePopoverOpen, setTypePopoverOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  const typeLabels = { all: "Type", bundle: "Fixed Bundle", discount: "Volume Discount", bogo: "Buy X Get Y" };

  const handleSearchChange = useCallback((value) => {
    setSearchValue(value);
    setCurrentPage(1);
  }, []);

  const handleTypeFilter = useCallback((value) => {
    setTypeFilter(value);
    setTypePopoverOpen(false);
    setCurrentPage(1);
  }, []);
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

  const [orders, setOrders] = useState([]);

  const editBundle = (id) => {
    cnav("/app/create_bundle_form");
    console.log("bundle id:", id);
  };

  useEffect(() => {
    // Map bundles
    const bundleRows = data.map((bundle) => ({
      id: `bundle-${bundle.id}`,
      _rawId: bundle.id,
      _kind: "bundle",
      _status: bundle.bundle_status,
      bundle: (
        <div className="avatar-row">
          {bundle.bundle_items.map((item) => (
            <Avatar customer key={item.id} name={item.name} source={item.image} />
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
      type: <div style={{ width: "max-content" }}><Badge>Fixed Bundle</Badge></div>,
      discount:
        bundle.bundle_discount_type === "percentage"
          ? `${bundle.bundle_discount_value}% off`
          : `$${bundle.bundle_discount_value} off`,
    }));

    // Map volume discounts
    const discountRows = discountData.map((d) => ({
      id: `discount-${d.id}`,
      _rawId: d.id,
      _kind: "discount",
      _status: d.status,
      _productId: d.product_id,
      bundle: d.product_image
        ? <Avatar customer name={d.product_title} source={d.product_image} />
        : <Avatar customer name={d.product_title} />,
      name: d.title,
      status: (
        <div className="custom-badge">
          <Badge status={d.status ? "success" : "default"}>
            {d.status ? "active" : "inactive"}
          </Badge>
        </div>
      ),
      type: <div style={{ width: "max-content" }}><Badge tone="info">Volume Discount</Badge></div>,
      discount: d.tiers?.length
        ? `${d.tiers[0].min_quantity}+ → ${d.tiers[0].discount_type === "percentage" ? `${d.tiers[0].discount_value}%` : `$${d.tiers[0].discount_value}`} off`
        : "—",
    }));

    // Map BOGO offers
    const bogoRows = bogoData.map((b) => ({
      id: `bogo-${b.id}`,
      _rawId: b.id,
      _kind: "bogo",
      _status: b.status,
      bundle: (
        <HorizontalStack gap="1">
          {b.buy_product_image
            ? <Avatar customer name={b.buy_product_title} source={b.buy_product_image} />
            : <Avatar customer name={b.buy_product_title} />}
          <span style={{ alignSelf: "center", fontSize: "12px", color: "#666" }}>→</span>
          {b.get_product_image
            ? <Avatar customer name={b.get_product_title} source={b.get_product_image} />
            : <Avatar customer name={b.get_product_title} />}
        </HorizontalStack>
      ),
      name: b.title,
      status: (
        <div className="custom-badge">
          <Badge status={b.status ? "success" : "default"}>
            {b.status ? "active" : "inactive"}
          </Badge>
        </div>
      ),
      type: <div style={{ width: "max-content" }}><Badge tone="warning">Buy X Get Y</Badge></div>,
      discount: `${b.discount_value === 100 ? "Free" : `${b.discount_value}% off`}`,
    }));

    const mappedTableData = [...bundleRows, ...discountRows, ...bogoRows];

    

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
    singular: "offer",
    plural: "Offers",
  };

  const filteredOrders = useMemo(() => {
    let result = orders;
    // Status tab filter
    if (tselected === 1) result = result.filter((r) => r._status === true);
    if (tselected === 2) result = result.filter((r) => r._status === false);
    // Type filter
    if (typeFilter !== "all") result = result.filter((r) => r._kind === typeFilter);
    // Search filter
    if (searchValue.trim()) {
      const q = searchValue.toLowerCase();
      result = result.filter((r) => r.name.toLowerCase().includes(q));
    }
    return result;
  }, [orders, tselected, typeFilter, searchValue]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const pagedOrders = filteredOrders.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(filteredOrders);

  const handleDeleteOffer = useCallback((row) => {
    if (!confirm(`Delete this offer? This cannot be undone.`)) return;
    if (row._kind === "bundle") {
      // Bundle delete: post to bundle form action with intent=delete
      const body = new URLSearchParams();
      body.append("intent", "delete");
      body.append("bundle_id", String(row._rawId));
      fetch(`/app/create_bundle_form/${row._rawId}`, { method: "POST", body: body.toString(), headers: { "Content-Type": "application/x-www-form-urlencoded" } })
        .then((r) => r.ok && window.shopify?.toast?.show("Offer deleted."))
        .then(() => fetcher.load("/app/additional"));
    } else if (row._kind === "discount") {
      // Volume discount delete: post to volume_discounts action
      const fd = new FormData();
      fd.append("intent", "delete");
      fd.append("id", String(row._rawId));
      fd.append("product_id", row._productId || "");
      fetcher.submit(fd, { method: "POST", action: "/app/volume_discounts" });
      window.shopify?.toast?.show("Offer deleted.");
    } else if (row._kind === "bogo") {
      // BOGO delete: post to bogo form action
      const fd = new FormData();
      fd.append("intent", "delete");
      fetcher.submit(fd, { method: "POST", action: `/app/bogo_form/${row._rawId}` });
      window.shopify?.toast?.show("Offer deleted.");
    }
  }, [fetcher]);

  const rowMarkup = pagedOrders.map((row, index) => {
    const { id, bundle, name, status, type, discount } = row;
    const editUrl = row._kind === "bundle"
      ? `/app/create_bundle_form/${row._rawId}`
      : row._kind === "bogo"
      ? `/app/bogo_form/${row._rawId}`
      : `/app/volume_discount_form/${row._rawId}`;
    return (
      <IndexTable.Row
        id={id}
        key={id}
        selected={selectedResources.includes(id)}
        position={index}
      >
        <IndexTable.Cell>
          <Text variant="bodyMd" fontWeight="bold" as="span">{bundle}</Text>
        </IndexTable.Cell>
        <IndexTable.Cell>{name}</IndexTable.Cell>
        <IndexTable.Cell>{status}</IndexTable.Cell>
        <IndexTable.Cell>{type}</IndexTable.Cell>
        <IndexTable.Cell>{discount}</IndexTable.Cell>
        <IndexTable.Cell>
          <HorizontalStack gap="2">
            <Link onClick={() => cnav(editUrl)} removeUnderline={true}>
              <Icon source={EditIcon} color="base" />
            </Link>
            <Link onClick={() => handleDeleteOffer(row)} removeUnderline={true}>
              <Icon source={DeleteIcon} color="base" />
            </Link>
          </HorizontalStack>
        </IndexTable.Cell>
      </IndexTable.Row>
    );
  });

  const tabs = [
    {
      id: "Home-fitted-2",
      content: "Home",
      accessibilityLabel: "Home",
      panelID: "Home-fitted-content-2",
    },
    {
      id: "Bundle-fitted-2",
      content: "Offers",
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
  const [recentRows, setRecentRows] = useState([]);
  const [rows, setRows] = useState([]);

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
                            <div className="btn-secondary-outlined">
                              <Button outline url="https://help.shopify.com/en/manual/products/bundles" external>
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
                                <div className="btn-primary-black">
                                  <Button onClick={handleCreateBundle}>
                                    Create offer
                                  </Button>
                                </div>
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
                                    heading="No offers yet!"
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
                                    <Icon source={ViewIcon} />
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
                                    <Icon source={CursorIcon} />
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
                                    <Icon source={OrderIcon} />
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
                                    <Icon source={CashDollarIcon} />
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
                            Offers
                          </Text>
                          <div className="btn-primary-black">
                          <Button onClick={handleCreateBundle}>
                            Create offer
                          </Button>
                          </div>
                        </HorizontalStack>
                      </div>
                      <Tabs
                        tabs={tabletabs}
                        selected={tselected}
                        onSelect={(i) => { handleTTabChange(i); setCurrentPage(1); }}
                      >
                        <div className="bundle-table">
                          <div className="filter-div">
                            <HorizontalStack wrap={false} gap="2">
                              <div className="filter-input">
                                <TextField
                                  label="Search"
                                  labelHidden
                                  type="text"
                                  value={searchValue}
                                  onChange={handleSearchChange}
                                  prefix={<Icon source={SearchIcon} />}
                                  placeholder="Search offers"
                                  autoComplete="off"
                                  clearButton
                                  onClearButtonClick={() => handleSearchChange("")}
                                />
                              </div>
                              <Popover
                                active={typePopoverOpen}
                                activator={
                                  <Button onClick={() => setTypePopoverOpen((v) => !v)} disclosure>
                                    {typeLabels[typeFilter]}
                                  </Button>
                                }
                                autofocusTarget="first-node"
                                onClose={() => setTypePopoverOpen(false)}
                              >
                                <ActionList
                                  actionRole="menuitem"
                                  items={[
                                    { content: "All types", onAction: () => handleTypeFilter("all"), active: typeFilter === "all" },
                                    { content: "Fixed Bundle", onAction: () => handleTypeFilter("bundle"), active: typeFilter === "bundle" },
                                    { content: "Volume Discount", onAction: () => handleTypeFilter("discount"), active: typeFilter === "discount" },
                                    { content: "Buy X Get Y", onAction: () => handleTypeFilter("bogo"), active: typeFilter === "bogo" },
                                  ]}
                                />
                              </Popover>
                            </HorizontalStack>
                          </div>
                          <IndexTable
                            resourceName={resourceName}
                            itemCount={filteredOrders.length}
                            selectedItemsCount={allResourcesSelected ? "All" : selectedResources.length}
                            onSelectionChange={handleSelectionChange}
                            headings={[
                              { title: "Product(s)" },
                              { title: "Name" },
                              { title: "Status" },
                              { title: "Type" },
                              { title: "Discount" },
                              { title: "Action" },
                            ]}
                            emptyState={
                              <div style={{ padding: "40px", textAlign: "center" }}>
                                <Text color="subdued" as="p">No offers match your filters.</Text>
                              </div>
                            }
                          >
                            {rowMarkup}
                          </IndexTable>
                          <div className="table-pagination">
                            <Pagination
                              label={`Page ${currentPage} of ${totalPages}`}
                              hasPrevious={currentPage > 1}
                              onPrevious={() => setCurrentPage((p) => Math.max(1, p - 1))}
                              hasNext={currentPage < totalPages}
                              onNext={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            />
                          </div>
                        </div>
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
                          className="btn-primary-black btn-radius-4"
                            style={{ display: "flex", justifyContent: "end" }}
                          >
                            <Button onClick={() => window.open(`https://${shop}/admin/themes/current/editor`, '_blank')}>Customize</Button>
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

                              <div style={{ display: "flex", flexDirection: "column", justifyContent:"space-between", height:"100%" }}>
                                <div>
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
                                </div>
                                  <div
                                  className="btn-primary-black btn-radius-4"
                                    style={{
                                      display: "flex",
                                      justifyContent: "end",
                                      marginTop: "7px",
                                    }}
                                  >
                                    <Button onClick={handleComingSoon}>Customize</Button>
                                  </div>
                              </div>
                            </Card>
                            <Card>
                              <div style={{ display: "flex", flexDirection: "column", justifyContent:"space-between", height:"100%" }}>
                                <div>
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

                                </div>
                                <div
                                  className="btn-primary-black btn-radius-4"
                                  style={{
                                    display: "flex",
                                    justifyContent: "end",
                                    marginTop: "7px",
                                  }}
                                >
                                  <Button primary onClick={handleComingSoon}>Customize</Button>
                                </div>
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
                      <VerticalStack gap="5">
                        <Text as="h1" variant="headingLg">Analytics</Text>

                        {/* ── KPI cards ── */}
                        <HorizontalGrid columns={4} gap="4">
                          <Card>
                            <VerticalStack gap="2" inlineAlign="center">
                              <Text variant="bodySm" color="subdued" as="p">Total sales</Text>
                              <Text variant="headingLg" as="p">${saleCount.toLocaleString()}</Text>
                            </VerticalStack>
                          </Card>
                          <Card>
                            <VerticalStack gap="2" inlineAlign="center">
                              <Text variant="bodySm" color="subdued" as="p">Bundles sold</Text>
                              <Text variant="headingLg" as="p">{orderCount.toLocaleString()}</Text>
                            </VerticalStack>
                          </Card>
                          <Card>
                            <VerticalStack gap="2" inlineAlign="center">
                              <Text variant="bodySm" color="subdued" as="p">Total views</Text>
                              <Text variant="headingLg" as="p">{viewCount.toLocaleString()}</Text>
                            </VerticalStack>
                          </Card>
                          <Card>
                            <VerticalStack gap="2" inlineAlign="center">
                              <Text variant="bodySm" color="subdued" as="p">Total clicks</Text>
                              <Text variant="headingLg" as="p">{clickCount.toLocaleString()}</Text>
                            </VerticalStack>
                          </Card>
                        </HorizontalGrid>

                        {/* ── Sales & Orders over time ── */}
                        <Card>
                          <VerticalStack gap="4">
                            <Text variant="headingMd" as="h2">Sales & orders — last 30 days</Text>
                            <ClientOnly fallback={<div style={{ height: 260 }} />}>
                              {() => timeSeries.some((d) => d.sales > 0 || d.orders > 0) ? (
                                <div style={{ width: "100%", height: 260 }}>
                                  <ResponsiveContainer>
                                    <AreaChart data={timeSeries} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                                      <defs>
                                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor="#008060" stopOpacity={0.15} />
                                          <stop offset="95%" stopColor="#008060" stopOpacity={0} />
                                        </linearGradient>
                                      </defs>
                                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                      <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={4} />
                                      <YAxis yAxisId="sales" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} width={56} />
                                      <YAxis yAxisId="orders" orientation="right" tick={{ fontSize: 11 }} width={36} allowDecimals={false} />
                                      <Tooltip formatter={(value, name) => name === "sales" ? [`$${value}`, "Sales"] : [value, "Orders"]} />
                                      <Legend />
                                      <Area yAxisId="sales" type="monotone" dataKey="sales" stroke="#008060" fill="url(#colorSales)" strokeWidth={2} dot={false} />
                                      <Area yAxisId="orders" type="monotone" dataKey="orders" stroke="#2c6ecb" fill="none" strokeWidth={2} dot={false} strokeDasharray="4 2" />
                                    </AreaChart>
                                  </ResponsiveContainer>
                                </div>
                              ) : (
                                <div style={{ padding: "40px 0", textAlign: "center" }}>
                                  <Text variant="bodySm" color="subdued" as="p">No order data yet — chart will populate as bundles are sold.</Text>
                                </div>
                              )}
                            </ClientOnly>
                          </VerticalStack>
                        </Card>

                        {/* ── Top bundles by revenue ── */}
                        {data.length > 0 && (
                          <Card>
                            <VerticalStack gap="4">
                              <Text variant="headingMd" as="h2">Top fixed bundles by revenue</Text>
                              <ClientOnly fallback={<div style={{ height: Math.max(180, Math.min(data.length, 8) * 40 + 40) }} />}>
                                {() => (
                                  <div style={{ width: "100%", height: Math.max(180, Math.min(data.length, 8) * 40 + 40) }}>
                                    <ResponsiveContainer>
                                      <BarChart
                                        layout="vertical"
                                        data={[...data]
                                          .sort((a, b) => b.bundle_sales - a.bundle_sales)
                                          .slice(0, 8)
                                          .map((b) => ({ name: b.bundle_name, revenue: b.bundle_sales, orders: b.bundle_orders }))}
                                        margin={{ top: 4, right: 24, left: 8, bottom: 0 }}
                                      >
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                                        <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                                        <Tooltip formatter={(v, name) => name === "revenue" ? [`$${v}`, "Revenue"] : [v, "Orders"]} />
                                        <Legend />
                                        <Bar dataKey="revenue" fill="#008060" radius={[0, 4, 4, 0]} />
                                        <Bar dataKey="orders" fill="#2c6ecb" radius={[0, 4, 4, 0]} />
                                      </BarChart>
                                    </ResponsiveContainer>
                                  </div>
                                )}
                              </ClientOnly>
                            </VerticalStack>
                          </Card>
                        )}

                        {/* ── Engagement per bundle ── */}
                        {data.length > 0 && (
                          <Card>
                            <VerticalStack gap="4">
                              <Text variant="headingMd" as="h2">Engagement breakdown</Text>
                              <ClientOnly fallback={<div style={{ height: 260 }} />}>
                                {() => (
                                  <div style={{ width: "100%", height: 260 }}>
                                    <ResponsiveContainer>
                                      <BarChart
                                        data={[...data]
                                          .sort((a, b) => b.bundle_views - a.bundle_views)
                                          .slice(0, 6)
                                          .map((b) => ({
                                            name: b.bundle_name.length > 18 ? b.bundle_name.slice(0, 18) + "…" : b.bundle_name,
                                            Views: b.bundle_views,
                                            Clicks: b.bundle_clicks,
                                            Orders: b.bundle_orders,
                                          }))}
                                        margin={{ top: 4, right: 16, left: 0, bottom: 24 }}
                                      >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" />
                                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="Views" fill="#b5d4f1" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="Clicks" fill="#2c6ecb" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="Orders" fill="#008060" radius={[4, 4, 0, 0]} />
                                      </BarChart>
                                    </ResponsiveContainer>
                                  </div>
                                )}
                              </ClientOnly>
                            </VerticalStack>
                          </Card>
                        )}

                        {/* ── Per-bundle data table ── */}
                        <Card>
                          <VerticalStack gap="3">
                            <Text variant="headingMd" as="h2">Bundle breakdown</Text>
                            <DataTable
                              columnContentTypes={["text","text","numeric","numeric","numeric","numeric"]}
                              headings={["Name","Status","Sales ($)","Orders","Clicks","Views"]}
                              rows={data.map((b) => [
                                b.bundle_name,
                                b.bundle_status ? "Active" : "Draft",
                                `$${b.bundle_sales.toLocaleString()}`,
                                b.bundle_orders,
                                b.bundle_clicks,
                                b.bundle_views,
                              ])}
                              hasZebraStripingOnData
                            />
                          </VerticalStack>
                        </Card>

                        {/* ── Orders by offer type (last 30 days) ── */}
                        <Card>
                          <VerticalStack gap="3">
                            <Text variant="headingMd" as="h2">Orders by offer type — last 30 days</Text>
                            <DataTable
                              columnContentTypes={["text", "numeric", "numeric"]}
                              headings={["Offer type", "Orders", "Revenue"]}
                              rows={[
                                ["Fixed Bundle", offerTypeTotals.bundle.orders, `$${offerTypeTotals.bundle.sales.toLocaleString()}`],
                                ["Volume Discount", offerTypeTotals.volume_discount.orders, `$${offerTypeTotals.volume_discount.sales.toLocaleString()}`],
                                ["Buy X Get Y", offerTypeTotals.bogo.orders, `$${offerTypeTotals.bogo.sales.toLocaleString()}`],
                              ]}
                              hasZebraStripingOnData
                            />
                          </VerticalStack>
                        </Card>
                      </VerticalStack>
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
                                  <Box background="bg-surface-secondary" borderRadius="2" padding="3">
                                    <Icon source={SettingsIcon} />
                                  </Box>
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
                            <Link onClick={() => cnav("/app/translation")} removeUnderline={true}>
                              <Card>
                                <HorizontalStack wrap={false} gap="5">
                                  <Box background="bg-surface-secondary" borderRadius="2" padding="3">
                                    <Icon source={LanguageTranslateIcon} />
                                  </Box>
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
                            <Link onClick={() => window.open("mailto:hello@superbundle.app", "_blank")} removeUnderline={true}>
                              <Card>
                                <HorizontalStack wrap={false} gap="5">
                                  <Box background="bg-surface-secondary" borderRadius="2" padding="3">
                                    <Icon source={QuestionCircleIcon} />
                                  </Box>
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
                            <Link onClick={() => cnav("/app/plan")} removeUnderline={true}>
                              <Card>
                                <HorizontalStack wrap={false} gap="5">
                                  <Box background="bg-surface-secondary" borderRadius="2" padding="3">
                                    <Icon source={CreditCardIcon} />
                                  </Box>
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
                            <Link onClick={() => cnav("/app/restore_pages")} removeUnderline={true}>
                              <Card>
                                <HorizontalStack wrap={false} gap="5">
                                  <Box background="bg-surface-secondary" borderRadius="2" padding="3">
                                    <Icon source={RefreshIcon} />
                                  </Box>
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
                      </Grid>
                    </>
                  )}

                  <div className="bundle-popup-main">
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
                                <VerticalStack gap="5">
                                  <HorizontalStack
                                    wrap={false}
                                    align="space-between"
                                    blockAlign="flex-start"
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
                                      <Text variant="headingMd" as="h2">
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
                                  <Banner tone="info">
                                    <div className="bundle-popup-button-footer-text">
                                      <Text variant="bodySm" as="p">
                                        Example: Buy X + Y to get 20% off.
                                      </Text>
                                    </div>
                                  </Banner>
                                </VerticalStack>
                              </Link>
                            </Grid.Cell>
                            <Grid.Cell
                              columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}
                            >
                              <Link onClick={() => { toggleBundlePopup(); cnav("/app/volume_discount_form/new"); }} removeUnderline={true}>
                                <VerticalStack gap="5">
                                  <HorizontalStack
                                    wrap={false}
                                    align="space-between"
                                    blockAlign="flex-start"
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
                                      <HorizontalStack gap="2" blockAlign="center">
                                        <Text variant="headingMd" as="h2">
                                          Volume discount
                                        </Text>
                                      </HorizontalStack>
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
                                  <Banner tone="info">
                                    <div className="bundle-popup-button-footer-text">
                                      <Text variant="bodySm" as="p">
                                        Example: BOGO, Buy 3 items of X to get
                                        20% off.
                                      </Text>
                                    </div>
                                  </Banner>
                                </VerticalStack>
                              </Link>
                            </Grid.Cell>
                            <Grid.Cell
                              columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}
                            >
                              <Link onClick={() => { toggleBundlePopup(); cnav("/app/bogo_form/new"); }} removeUnderline={true}>
                                <VerticalStack gap="5">
                                  <HorizontalStack
                                    wrap={false}
                                    align="space-between"
                                    blockAlign="flex-start"
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
                                      <Text variant="headingMd" as="h2">
                                        Buy X Get Y
                                      </Text>
                                      <div className="bundle-popup-button-subtext">
                                        <Text
                                          variant="bodySm"
                                          as="p"
                                          alignment="start"
                                        >
                                          Offer a discount on a second product when customers buy a specific product.
                                        </Text>
                                      </div>
                                    </VerticalStack>
                                  </HorizontalStack>
                                  <Banner tone="info">
                                    <div className="bundle-popup-button-footer-text">
                                      <Text variant="bodySm" as="p">
                                        Example: Buy a shirt, get a hat 50% off.
                                      </Text>
                                    </div>
                                  </Banner>
                                </VerticalStack>
                              </Link>
                            </Grid.Cell>
                            <Grid.Cell
                              columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}
                            >
                              <Link onClick={handleComingSoon} removeUnderline={true}>
                                <VerticalStack gap="5">
                                  <HorizontalStack
                                    wrap={false}
                                    align="space-between"
                                    blockAlign="flex-start"
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
                                      <HorizontalStack gap="2" blockAlign="center">
                                        <Text variant="headingMd" as="h2">
                                          Collection mix & match
                                        </Text>
                                        <Badge tone="info">Coming soon</Badge>
                                      </HorizontalStack>
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
                                  <Banner tone="info">
                                    <div className="bundle-popup-button-footer-text">
                                      <Text variant="bodySm" as="p">
                                        Example: Buy 4 items from collection X
                                        and 2 from collection Y to get $30 off.
                                      </Text>
                                    </div>
                                  </Banner>
                                </VerticalStack>
                              </Link>
                            </Grid.Cell>
                            <Grid.Cell
                              columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}
                            >
                              <Link onClick={handleComingSoon} removeUnderline={true}>
                                <VerticalStack gap="5">
                                  <HorizontalStack
                                    wrap={false}
                                    align="space-between"
                                    blockAlign="flex-start"
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
                                      <HorizontalStack gap="2" blockAlign="center">
                                        <Text variant="headingMd" as="h2">
                                          Buy X get Y
                                        </Text>
                                        <Badge tone="info">Coming soon</Badge>
                                      </HorizontalStack>
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
                                  <Banner tone="info">
                                    <div className="bundle-popup-button-footer-text">
                                      <Text variant="bodySm" as="p">
                                        Example: Buy X and get Y for free or Buy
                                        X and get Y with 20% off.
                                      </Text>
                                    </div>
                                  </Banner>
                                </VerticalStack>
                              </Link>
                            </Grid.Cell>
                            <Grid.Cell
                              columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}
                            >
                              <Link onClick={handleComingSoon} removeUnderline={true}>
                                <VerticalStack gap="5">
                                  <HorizontalStack
                                    wrap={false}
                                    align="space-between"
                                    blockAlign="flex-start"
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
                                      <HorizontalStack gap="2" blockAlign="center">
                                        <Text variant="headingMd" as="h2">
                                          Frequently bought together
                                        </Text>
                                        <Badge tone="info">Coming soon</Badge>
                                      </HorizontalStack>
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
                                  <Banner>
                                    <div className="bundle-popup-button-footer-text">
                                      <Text variant="bodySm" as="p">
                                        Example: Y and Z are frequently bought
                                        together with X.
                                      </Text>
                                    </div>
                                  </Banner>
                                </VerticalStack>
                              </Link>
                            </Grid.Cell>
                          </Grid>
                        </div>
                      </Modal.Section>
                    </Modal>

                    {/* Upgrade-to-Pro modal */}
                    <Modal
                      open={upgradeModal.open}
                      onClose={() => setUpgradeModal((m) => ({ ...m, open: false }))}
                      title="Upgrade to Pro"
                      primaryAction={{
                        content: "View Pro plan",
                        onAction: () => cnav("/app/plan"),
                      }}
                      secondaryActions={[{
                        content: "Maybe later",
                        onAction: () => setUpgradeModal((m) => ({ ...m, open: false })),
                      }]}
                    >
                      <Modal.Section>
                        <VerticalStack gap="3">
                          <Text as="p">{upgradeModal.reason}</Text>
                          <Text as="p" color="subdued">Pro is $9.99/mo with a 14-day free trial. No credit card required during the trial.</Text>
                        </VerticalStack>
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
