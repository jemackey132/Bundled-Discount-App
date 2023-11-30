import { useEffect, useCallback, useState } from "react";
import {
  json,
  unstable_composeUploadHandlers,
  unstable_createFileUploadHandler,
  unstable_createMemoryUploadHandler,
  unstable_parseMultipartFormData,
} from "@remix-run/node";
// import { json } from "@remix-run/express";
import { cors } from "remix-utils";
import { created } from "remix-utils";
import prisma from "../db.server";
import {
  useActionData,
  useLoaderData,
  useNavigation,
  useLocation,
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
  DropZone,
  LegacyStack,
  Thumbnail,
} from "@shopify/polaris";
import { FinancesMinor, SearchMinor, NoteMinor } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import shopify from "../shopify.server";
import { addProductMedia, getBundle } from "../bundle.server";

import {
  createProduct,
  addBundle,
  addComponents,
  updateBundle,
  removeAllComponents,
  updateComponents,
  updateProduct,
  attachMedia,
  publishProduct,
} from "../bundle.server";

export async function action({ request }) {
  const uploadHandler = unstable_composeUploadHandlers(
    unstable_createFileUploadHandler({
      directory: "./public/uploads",
      file: ({ filename }) => filename,
    }),
    unstable_createMemoryUploadHandler()
  );

  const { admin, session } = await authenticate.admin(request);
  const { shop } = session;

  const formData = await unstable_parseMultipartFormData(
    request,
    uploadHandler
  );

  const file = formData.get("bundle_image");

  console.log("fiel",file)
  // @ts-ignore

  // const data = await request.formData();
  const data = Object.fromEntries(formData);
  // @ts-ignore
  data.bundle_items = JSON.parse(data.bundle_items);
  // @ts-ignore
  data.bundle_discount = data.bundle_discount === "true" ? true : false;
  // @ts-ignore
  data.bundle_status = data.bundle_status === "true" ? true : false;
  // @ts-ignore
  data.bundle_end_status = data.bundle_end_status === "true" ? true : false;
  // @ts-ignore
  data.bundle_time_status = data.bundle_time_status === "true" ? true : false;
  let resUrl = false;
  if (file != "undefined") {
    console.log("File Found")
    // @ts-ignore
    const filePath = `uploads/${file.name}`;
    resUrl = await addProductMedia(
      {
        // @ts-ignore
        path: file.filepath,
        // @ts-ignore
        name: file.name,
        handle: `https://dates-pulse-referred-imported.trycloudflare.com/${filePath}`,
        // @ts-ignore
        type: file.type,
      },
      admin.graphql
    );
    data.bundle_image = filePath;
    console.log("image available");
  } else {
    if (data.bundle_id == 0) {
      console.log("no image available");
      data.bundle_image = "";
    } else {
      console.log("update with no image");
      delete data.bundle_image;
    }
  }

  data.shop = shop;

  console.log(data);

  // console.log('image data: ', data.bundle_image);
  // @ts-ignore
  if (data.bundle_id == 0) {
    delete data.bundle_id;

    let productVariant = [];
    let totalPrice = 0;
    let originalPrice = 0;

    for (let i = 0; i < data.bundle_items.length; i++) {
      productVariant.push({
        id: data.bundle_items[i].vid,
        quantity: 1,
      });
      totalPrice += parseFloat(data.bundle_items[i].price);
      originalPrice += parseFloat(data.bundle_items[i].price);
    }

    // @ts-ignore
    if (data.bundle_discount_value !== 0) {
      if (data.bundle_discount_type == "fixed") {
        // @ts-ignore
        totalPrice = totalPrice - parseFloat(data.bundle_discount_value);
      } else {
        // console.log('percentage discount')
        // console.log(totalPrice)
        // console.log(data.bundle_discount_value)
        // console.log(totalPrice * parseInt(data.bundle_discount_value))
        totalPrice =
          // @ts-ignore
          totalPrice -
          // @ts-ignore
          (totalPrice * parseInt(data.bundle_discount_value)) / 100;
      }
    }
    console.log(totalPrice);
    const createBundle = await createProduct(
      {
        title: data.bundle_title,
        status: data.bundle_status ? "ACTIVE" : "DRAFT",
        price: totalPrice,
        compare_price: originalPrice,
        // media: resUrl,
      },
      admin.graphql
    );

    let productId = createBundle.variants.edges[0].node.id;
    let productPrice = createBundle.variants.edges[0].node.price;
    let productGid = createBundle.id;
    let productHandle = createBundle.handle;

    data.bundle_gid = productGid;
    data.bundle_handle = productHandle;
    // @ts-ignore
    data.bundle_price = originalPrice.toString();
    data.bundle_discount_price = totalPrice.toString();

    if (resUrl) {
      const mediadId = await attachMedia(
        { media: resUrl, id: productGid },
        admin.graphql
      );
      data.bundle_media = mediadId[0].id;
    }

    await publishProduct({ gid: productGid }, admin.graphql);

    await addBundle(data);

    console.log(productId, productPrice);

    const addVariants = await addComponents(
      {
        parentProductVariantId: productId,
        productVariant: productVariant,
        parentProductId: productGid,
      },
      admin.graphql
    );
    console.log(addVariants);

    return created(addVariants);
  } else {
    let id = data.bundle_id;
    delete data.bundle_id;
    // data.bundle_image = "";
    let oldData = await getBundle(session.shop, id);
    console.log("Old data", oldData);
    // await publishProduct({ gid: oldData.bundle_gid }, admin.graphql);
    // return created("Updated....");
    let productVariant = [];
    let totalPrice = 0;
    let originalPrice = 0;

    for (let i = 0; i < data.bundle_items.length; i++) {
      productVariant.push({
        id: data.bundle_items[i].vid,
        quantity: 1,
      });
      totalPrice += parseFloat(data.bundle_items[i].price);
      originalPrice += parseFloat(data.bundle_items[i].price);
    }

    // @ts-ignore
    if (data.bundle_discount_value !== 0) {
      if (data.bundle_discount_type == "fixed") {
        // @ts-ignore
        totalPrice = totalPrice - parseFloat(data.bundle_discount_value);
      } else {
        // console.log('percentage discount')
        // console.log(totalPrice)
        // console.log(data.bundle_discount_value)
        // console.log(totalPrice * parseInt(data.bundle_discount_value))
        totalPrice =
          // @ts-ignore
          totalPrice -
          // @ts-ignore
          (totalPrice * parseInt(data.bundle_discount_value)) / 100;
      }
    }
    console.log(totalPrice);

    // @ts-ignore
    if (oldData.bundle_title != data.bundle_title) {
      console.log("updating the product");
      const updateShopifyProduct = await updateProduct(
        {
          // @ts-ignore
          id: oldData.bundle_gid,
          title: data.bundle_title,
          // media: resUrl,
          status: data.bundle_status ? "ACTIVE" : "DRAFT",
        },
        admin.graphql
      );

      console.log(updateShopifyProduct);
    }

    // @ts-ignore
    let productId = oldData.bundle_gid;
    // @ts-ignore
    let productGid = oldData.bundle_gid;

    const removeVariants = await removeAllComponents(
      { parentProductId: productGid },
      admin.graphql
    );

    const addVariants = await updateComponents(
      {
        productVariant: productVariant,
        parentProductId: productGid,
        price: totalPrice,
      },
      admin.graphql
    );
    console.log(removeVariants);
    data.bundle_price = originalPrice.toString();
    data.bundle_discount_price = totalPrice.toString();
    console.log(resUrl);
    if (resUrl) {
      const mediadId = await attachMedia(
        { media: resUrl, id: productGid },
        admin.graphql
      );
      data.bundle_media = mediadId[0].id;
    }

    await updateBundle(id, data);

    return created("Updated....");
  }
}

export const loader = async ({ request, params }) => {
  const { admin, session } = await authenticate.admin(request);
  if (params.id !== "new") {
    console.log("request id: ", params.id);
    const bundles = await getBundle(session.shop, params.id);
    // console.log()
    return json(bundles);
  }
  return json(null);
};

export default function AdditionalPage() {
  const actionData = useActionData();
  const location = useLocation();
  const bundle = useLoaderData();
  const [loader, setLoader] = useState(false);
  const [bundlepopover, setBundlePopover] = useState(false);
  const [bundlestatus, setBundleStatus] = useState(false);
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");

  function getCurrentDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // Function to get the current time in "HH:MM" format
  function getCurrentTime() {
    const today = new Date();
    const hours = String(today.getHours()).padStart(2, "0");
    const minutes = String(today.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  const [formState, setFormState] = useState({
    bundle_id: 0,
    bundle_title: "",
    bundle_name: "",
    bundle_image: "",
    bundle_discount: true,
    bundle_discount_type: "percentage",
    bundle_discount_value: "",
    bundle_status: true,
    bundle_items: [],
    bundle_time_status: false,
    bundle_start_time: getCurrentTime(),
    bundle_start_date: getCurrentDate(),
    bundle_end_status: false,
    bundle_end_time: "",
    bundle_end_date: "",
    bundle_type: "fixed_bundle",
  });

  useEffect(() => {
    console.log("Bundle data: ", bundle);
    if (bundle) {
      setFormState({
        ...bundle,
        bundle_id: bundle.id,
        bundle_title: bundle.bundle_title,
        bundle_name: bundle.bundle_name,
        bundle_image: bundle.bundle_image,
        bundle_discount: bundle.bundle_discount,
        bundle_discount_type: bundle.bundle_discount_type,
        bundle_discount_value: bundle.bundle_discount_value,
        bundle_status: bundle.bundle_status,
        bundle_items: bundle.bundle_items,
        bundle_time_status: bundle.bundle_time_status,
        bundle_start_time: bundle.bundle_start_time,
        bundle_start_date: bundle.bundle_start_date,
        bundle_end_status: bundle.bundle_end_status,
        // bundle_end_status: true,
        bundle_end_time: bundle.bundle_end_time,
        bundle_end_date: bundle.bundle_end_date,
      });
      setProducts(bundle.bundle_items);
    }
  }, [bundle]);

  const initialErrorsState = {
    bundle_id: "",
    bundle_title: "",
    bundle_name: "",
    bundle_image: "",
    bundle_discount_type: "",
    bundle_discount_value: "",
    bundle_items: "",
    bundle_start_time: "",
    bundle_start_date: "",
    bundle_end_time: "",
    bundle_end_date: "",
  };

  const fieldLabels = {
    bundle_title: "Bundle Title",
    bundle_name: "Bundle Name",
    bundle_discount_type: "Bundle Discount Type",
    bundle_discount_value: "Bundle Discount Value",
    bundle_items: "Bundle Items",
    bundle_start_time: "Start Time",
    bundle_start_date: "Start Date",
    bundle_end_time: "End Time",
    bundle_end_date: "End Date",
  };

  const [errors, setErrors] = useState(initialErrorsState);

  // console.log(actionData);

  function isFormValid(formState) {
    // Define an array of field names that are considered optional
    const optionalFields = [
      "bundle_image",
      "bundle_end_status",
      "bundle_end_time",
      "bundle_end_date",
    ];

    const errors = {};
    // Iterate through each key in the formState object
    for (const key in formState) {
      // Check if the value is empty and the field is not in the optionalFields array
      if (
        ((typeof formState[key] === "string" && formState[key].trim() === "") ||
          (Array.isArray(formState[key]) && formState[key].length === 0)) &&
        !optionalFields.includes(key)
      ) {
        // return `Field '${key}' is required.`; // Return an error message
        errors[key] = `Field '${key}' is required.`;
      }
    }
    return Object.keys(errors).length === 0 ? null : errors;
    // return null; // If all non-optional fields are non-empty, return null (no error)
  }

  const handleSubmit = async (event) => {
    setLoader(true);
    event.preventDefault(); // Prevent the default form submission behavior
    const validationError = isFormValid(formState);
    if (validationError) {
      // console.error(validationError);
      // @ts-ignore
      setErrors(validationError);
    } else {
      try {
        const formdata = new FormData();
        // @ts-ignore
        formdata.append("bundle_id", formState.bundle_id);
        formdata.append("bundle_title", formState.bundle_title);
        formdata.append("bundle_name", formState.bundle_name);
        // @ts-ignore
        formdata.append("bundle_image", file);
        formdata.append("bundle_type", formState.bundle_type);
        // @ts-ignore
        formdata.append("bundle_discount", formState.bundle_discount);
        formdata.append("bundle_discount_type", formState.bundle_discount_type);
        formdata.append(
          "bundle_discount_value",
          formState.bundle_discount_value
        );
        // @ts-ignore
        formdata.append("bundle_status", formState.bundle_status);
        formdata.append("bundle_items", JSON.stringify(formState.bundle_items));
        // @ts-ignore
        formdata.append("bundle_time_status", formState.bundle_time_status);
        formdata.append("bundle_start_time", formState.bundle_start_time);
        formdata.append("bundle_start_date", formState.bundle_start_date);
        // @ts-ignore
        formdata.append("bundle_end_status", formState.bundle_end_status);
        formdata.append("bundle_end_time", formState.bundle_end_time);
        formdata.append("bundle_end_date", formState.bundle_end_date);

        const response = await fetch(
          `/app/create_bundle_form/${formState.bundle_id}`,
          {
            method: "POST",
            body: formdata,
          }
        );

        if (response.ok) {
          // Handle success (e.g., show a success message, reset the form)
          console.log("Bundle created successfully!");
          if (formState.bundle_id == 0) {
            window.shopify.toast.show("Bundle created successfully!");
          } else {
            window.shopify.toast.show("Bundle updated successfully!");
          }
        } else {
          // Handle errors (e.g., show an error message)
          console.error("Error creating bundle:", response.status);
        }
        setLoader(false);
      } catch (error) {
        setLoader(false);
        console.error("An error occurred:", error);
      }
    }
  };

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
        vid: variants[0].id,
        price: variants[0].price,
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
        handleState("bundle_items", updatedProducts);
      }
    }
  }

  const removeProduct = (productId) => {
    var updatedProducts = [];
    // @ts-ignore
    updatedProducts = products.filter((product) => product.id !== productId);
    setProducts(updatedProducts);
  };

  const [file, setFile] = useState();
  const validImageTypes = ["image/gif", "image/jpeg", "image/png"];

  const handleDropZoneDrop = useCallback(
    (_dropFiles, acceptedFiles, rejectedFiles) => {
      setFile(acceptedFiles[0]);
      handleState("bundle_image", acceptedFiles[0]);
    },
    []
  );

  const fileUpload = !file && <DropZone.FileUpload />;
  const uploadedFile = file && (
    <LegacyStack>
      <Thumbnail
        size="small"
        // @ts-ignore
        alt={file.name}
        source={
          // @ts-ignore
          validImageTypes.includes(file.type)
            ? window.URL.createObjectURL(file)
            : NoteMinor
        }
      />
      <div>
        {
          // @ts-ignore
          file.name
        }{" "}
        <Text variant="bodySm" as="p">
          {
            // @ts-ignore
            file.size
          }{" "}
          bytes
        </Text>
      </div>
    </LegacyStack>
  );

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
                            error={
                              errors["bundle_name"]
                                ? errors["bundle_name"]
                                : false
                            }
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
                          <Text as="h2">Bundle Image</Text>
                          {formState.bundle_id != 0 &&
                            formState.bundle_image && (
                              <Thumbnail
                                source={
                                  window.location.origin +
                                  "/" +
                                  formState.bundle_image
                                }
                                size="large"
                                alt="Black choker necklace"
                              />
                            )}
                          <DropZone
                            allowMultiple={false}
                            onDrop={handleDropZoneDrop}
                          >
                            {uploadedFile}
                            {fileUpload}
                          </DropZone>

                          <Text as="p">
                            Your customers will see this as a product image on
                            the bundle product display.
                          </Text>
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
                            checked={
                              formState.bundle_discount_type == "fixed"
                                ? true
                                : false
                            }
                            onChange={() =>
                              handleState("bundle_discount_type", "fixed")
                            }
                          />
                        </div>
                        <div className="discount-card-checkbox">
                          <Checkbox
                            label="Percentage"
                            checked={
                              formState.bundle_discount_type == "percentage"
                                ? true
                                : false
                            }
                            onChange={() =>
                              handleState("bundle_discount_type", "percentage")
                            }
                          />
                        </div>
                        <TextField
                          label="Discount value"
                          type="number"
                          value={formState.bundle_discount_value}
                          onChange={(value) =>
                            handleState("bundle_discount_value", value)
                          }
                          prefix={
                            formState.bundle_discount_type == "fixed"
                              ? "$"
                              : "%"
                          }
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

          <Layout.Section>
            {Object.keys(errors).map((fieldName) => (
              <div key={fieldName}>{errors[fieldName]}</div>
            ))}
          </Layout.Section>
          <Layout.Section>
            <HorizontalStack gap="4">
              {formState.bundle_id != 0 && (
                <div style={{ color: "#bf0711" }}>
                  <Button monochrome outline>
                    Delete bundle
                  </Button>
                </div>
              )}
              <div className="btn-primary-black">
                <Button loading={loader} onClick={handleSubmit}>
                  {formState.bundle_id != 0 ? "Update bundle" : "Create bundle"}
                </Button>
              </div>
            </HorizontalStack>
          </Layout.Section>
        </Layout>
      </div>
    </Page>
  );
}
