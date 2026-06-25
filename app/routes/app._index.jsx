import { json } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { useEffect } from "react";
import welcome from "../../public/bandana-logo.svg";
import {
  Page,
  Text,
  VerticalStack,
  Card,
  Button,
  HorizontalStack,
  Box,
} from "@shopify/polaris";

import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const setting = await prisma.appSetting.findUnique({
    where: { shop_key: { shop, key: "hasSeenOnboarding" } },
  });

  // First install — mark as seen
  if (!setting) {
    await prisma.appSetting.upsert({
      where: { shop_key: { shop, key: "hasSeenOnboarding" } },
      update: { value: "true" },
      create: { shop, key: "hasSeenOnboarding", value: "true" },
    });
  }

  return json({ hasSeenOnboarding: setting?.value === "true" });
};

export default function Index() {
  const { hasSeenOnboarding } = useLoaderData();
  const navigate = useNavigate();

  useEffect(() => {
    if (hasSeenOnboarding) {
      navigate("/app/additional");
    }
  }, [hasSeenOnboarding]);

  if (hasSeenOnboarding) return null;

  return (
    <Page>
      <div className="welcome-card">
        <Card>
          <VerticalStack gap="8" inlineAlign="center">
            <img src={welcome} width="80" alt="Super Bundle logo" />
            <VerticalStack gap="3" inlineAlign="center">
              <Text variant="headingXl" as="h1" alignment="center">
                Welcome to Super Bundle
              </Text>
              <Text variant="bodyLg" as="p" alignment="center" color="subdued">
                Create product bundles with automatic discounts — powered by Shopify's native infrastructure for zero lag and full theme compatibility.
              </Text>
            </VerticalStack>
            <HorizontalStack gap="6" wrap={false}>
              <Box padding="4" style={{ textAlign: "center", maxWidth: "180px" }}>
                <VerticalStack gap="1" inlineAlign="center">
                  <Text variant="headingSm" as="p">⚡ Native discounts</Text>
                  <Text variant="bodySm" as="p" color="subdued">Applied at checkout — no scripts, no lag</Text>
                </VerticalStack>
              </Box>
              <Box padding="4" style={{ textAlign: "center", maxWidth: "180px" }}>
                <VerticalStack gap="1" inlineAlign="center">
                  <Text variant="headingSm" as="p">📦 Fixed bundles</Text>
                  <Text variant="bodySm" as="p" color="subdued">Group products and reward customers who buy them together</Text>
                </VerticalStack>
              </Box>
              <Box padding="4" style={{ textAlign: "center", maxWidth: "180px" }}>
                <VerticalStack gap="1" inlineAlign="center">
                  <Text variant="headingSm" as="p">📊 Built-in analytics</Text>
                  <Text variant="bodySm" as="p" color="subdued">Track views, clicks, and revenue per bundle</Text>
                </VerticalStack>
              </Box>
            </HorizontalStack>
            <div className="btn-primary-black">
              <Button size="large" url="/app/additional">
                Get started
              </Button>
            </div>
          </VerticalStack>
        </Card>
      </div>
    </Page>
  );
}
