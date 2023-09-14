import { useEffect } from "react";
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
  Button,
  HorizontalStack,
  HorizontalGrid,
  Box,
  Divider,
  List,
  Link,
  Icon,
  EmptyState,
} from "@shopify/polaris";

import { authenticate } from "../shopify.server";


export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);

  return json({ shop: session.shop.replace(".myshopify.com", "") });
};

export async function action({ request }) {
  const { admin } = await authenticate.admin(request);

  const color = ["Red", "Orange", "Yellow", "Green"][
    Math.floor(Math.random() * 4)
  ];
  const response = await admin.graphql(
    `#graphql
      mutation populateProduct($input: ProductInput!) {
        productCreate(input: $input) {
          product {
            id
            title
            handle
            status
            variants(first: 10) {
              edges {
                node {
                  id
                  price
                  barcode
                  createdAt
                }
              }
            }
          }
        }
      }`,
    {
      variables: {
        input: {
          title: `${color} Snowboard`,
          variants: [{ price: Math.random() * 100 }],
        },
      },
    }
  );

  const responseJson = await response.json();

  return json({
    product: responseJson.data.productCreate.product,
  });
}

export default function Index() {
  const nav = useNavigation();
  const { shop } = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();

  const isLoading =
    ["loading", "submitting"].includes(nav.state) && nav.formMethod === "POST";

  const productId = actionData?.product?.id.replace(
    "gid://shopify/Product/",
    ""
  );

  useEffect(() => {
    if (productId) {
      shopify.toast.show("Product created");
    }
  }, [productId]);

  const generateProduct = () => submit({}, { replace: true, method: "POST" });

  return (
    <Page>
      <div className="welcome-card">
        <Card>
          <EmptyState
            action={{ content: "Begin" }}
            image={welcome}
          >
          <p className="welcome-heading">Welcome!</p>
          <p className="welcome-subheading">How it works</p>
          <HorizontalGrid gap="8" columns={3}>
            <div className="steps-div">
              <Text variant="headingSm" as="p">Step 1</Text>
              <p className="subtext">preferences</p>
            </div>
            <div className="steps-div">
              <Text variant="headingSm" as="p">Step 2</Text>
              <p className="subtext">Brand info</p>
            </div>
            <div className="steps-div">
              <Text variant="headingSm" as="p">Step 3</Text>
              <p className="subtext">Install App</p>
            </div>
          </HorizontalGrid>
          </EmptyState>
        </Card>
      </div>
    </Page>
  );
}
