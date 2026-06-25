// @ts-nocheck
import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  Button,
  Badge,
  VerticalStack,
  HorizontalStack,
  HorizontalGrid,
  Box,
  Divider,
  Icon,
  Banner,
} from "@shopify/polaris";
import { CheckIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import { checkBillingStatus, requestProPlan, PLAN_PRO_PRICE } from "../billing.server";

export const loader = async ({ request }) => {
  const { billing } = await authenticate.admin(request);
  const { isPro, subscriptions } = await checkBillingStatus(billing);
  const url = new URL(request.url);
  const reason = url.searchParams.get("reason"); // "upgrade"
  const feature = url.searchParams.get("feature"); // "bundles" | "volume_discounts"
  return json({ isPro, subscriptions, reason, feature });
};

export const action = async ({ request }) => {
  const { billing } = await authenticate.admin(request);
  const returnUrl = `${process.env.SHOPIFY_APP_URL}/app/plan`;
  // billing.request() always throws a redirect — let it propagate
  await requestProPlan(billing, returnUrl);
  return null; // never reached
};

const FREE_FEATURES = [
  "1 active bundle",
  "Fixed bundle type",
  "Basic analytics",
  "Email support",
];

const PRO_FEATURES = [
  "Unlimited bundles",
  "All bundle types (fixed, mix & match, subscription)",
  "Volume / quantity discounts",
  "Priority support",
  "Advanced analytics (coming soon)",
];

function FeatureRow({ text }) {
  return (
    <HorizontalStack gap="2" blockAlign="center" wrap={false}>
      <Box color="text-success">
        <Icon source={CheckIcon} color="success" />
      </Box>
      <Text as="span" variant="bodyMd">
        {text}
      </Text>
    </HorizontalStack>
  );
}

const FEATURE_LABELS = {
  bundles: "You've reached the 1-bundle limit on the Free plan.",
  volume_discounts: "Volume discounts are a Pro feature.",
};

export default function PlanPage() {
  const { isPro, reason, feature } = useLoaderData();
  const submit = useSubmit();
  const nav = useNavigation();
  const isUpgrading = nav.state === "submitting";

  function handleUpgrade() {
    submit({}, { method: "post" });
  }

  const upgradeReason = reason === "upgrade" && feature ? FEATURE_LABELS[feature] : null;

  return (
    <Page
      title="Plan"
      subtitle="Manage your Super Bundle subscription"
      backAction={{ url: "/app" }}
    >
      <Layout>
        {upgradeReason && (
          <Layout.Section>
            <Banner
              title="Upgrade to Pro to continue"
              status="warning"
            >
              <Text as="p">{upgradeReason} Upgrade to Pro to unlock this and all other premium features.</Text>
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <HorizontalGrid columns={{ xs: 1, md: 2 }} gap="4">
            {/* Free plan */}
            <Card>
              <VerticalStack gap="4">
                <HorizontalStack align="space-between" blockAlign="center">
                  <Text as="h2" variant="headingLg">Free</Text>
                  {!isPro && <Badge status="success">Current plan</Badge>}
                </HorizontalStack>

                <HorizontalStack blockAlign="baseline" gap="1">
                  <Text as="span" variant="heading2xl">$0</Text>
                  <Text as="span" variant="bodyMd" color="subdued">/ month</Text>
                </HorizontalStack>

                <Divider />

                <VerticalStack gap="2">
                  {FREE_FEATURES.map((f) => (
                    <FeatureRow key={f} text={f} />
                  ))}
                </VerticalStack>

                {!isPro && (
                  <Button disabled fullWidth>
                    Current plan
                  </Button>
                )}
              </VerticalStack>
            </Card>

            {/* Pro plan */}
            <Card>
              <VerticalStack gap="4">
                <HorizontalStack align="space-between" blockAlign="center">
                  <Text as="h2" variant="headingLg">Pro</Text>
                  {isPro
                    ? <Badge status="success">Current plan</Badge>
                    : <Badge>14-day free trial</Badge>
                  }
                </HorizontalStack>

                <HorizontalStack blockAlign="baseline" gap="1">
                  <Text as="span" variant="heading2xl">${PLAN_PRO_PRICE}</Text>
                  <Text as="span" variant="bodyMd" color="subdued">/ month</Text>
                </HorizontalStack>

                <Divider />

                <VerticalStack gap="2">
                  {PRO_FEATURES.map((f) => (
                    <FeatureRow key={f} text={f} />
                  ))}
                </VerticalStack>

                {isPro ? (
                  <Button disabled fullWidth>
                    Current plan
                  </Button>
                ) : (
                  <Button
                    primary
                    fullWidth
                    loading={isUpgrading}
                    onClick={handleUpgrade}
                  >
                    Start 14-day free trial
                  </Button>
                )}
              </VerticalStack>
            </Card>
          </HorizontalGrid>
        </Layout.Section>

        <Layout.Section>
          <Text as="p" variant="bodySm" color="subdued" alignment="center">
            {isPro
              ? "Your subscription renews monthly. To cancel, contact support."
              : "No credit card charged during the trial. Cancel anytime."}
          </Text>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
