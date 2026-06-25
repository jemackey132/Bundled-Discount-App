/**
 * Billing helpers for Super Bundle
 *
 * Plan definitions:
 *   Free  — 1 bundle (fixed type only), no volume discounts
 *   Pro   — $9.99/mo, 14-day trial, unlimited bundles + volume discounts
 */

export const PLAN_PRO = "Super Bundle Pro";
export const PLAN_PRO_PRICE = 9.99;

const IS_TEST = process.env.NODE_ENV !== "production";

/**
 * Returns { isPro: boolean, subscriptions: [] } without throwing.
 *
 * Uses billing.require() with an onFailure sentinel to avoid throwing
 * a redirect when the merchant is on the free plan.
 */
export async function checkBillingStatus(billing) {
  try {
    const result = await billing.require({
      plans: [PLAN_PRO],
      isTest: IS_TEST,
      onFailure: async () => "FREE_PLAN",
    });
    return { isPro: true, subscriptions: result.appSubscriptions ?? [] };
  } catch (error) {
    // billing.require() throws whatever onFailure returns
    if (error === "FREE_PLAN") return { isPro: false, subscriptions: [] };
    // Real error (auth failure, network, etc.) — re-throw
    throw error;
  }
}

/**
 * Initiates the Pro subscription flow.
 * Always throws a redirect — call this from an action and let it propagate.
 */
export async function requestProPlan(billing, returnUrl) {
  await billing.request({
    plan: PLAN_PRO,
    isTest: IS_TEST,
    returnUrl,
  });
}
