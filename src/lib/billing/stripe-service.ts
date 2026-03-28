import Stripe from "stripe";

function getStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not configured");
  return new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
}

/** Returns true when the Stripe integration is fully configured. */
export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export const PLAN_PRICES: Record<
  string,
  { name: string; monthlyPriceId: string | null; yearlyPriceId: string | null }
> = {
  free: { name: "Free", monthlyPriceId: null, yearlyPriceId: null },
  base: {
    name: "Base",
    monthlyPriceId: process.env.STRIPE_PRICE_BASE_MONTHLY || null,
    yearlyPriceId: process.env.STRIPE_PRICE_BASE_YEARLY || null,
  },
  medium: {
    name: "Medium",
    monthlyPriceId: process.env.STRIPE_PRICE_MEDIUM_MONTHLY || null,
    yearlyPriceId: process.env.STRIPE_PRICE_MEDIUM_YEARLY || null,
  },
  enterprise: {
    name: "Enterprise",
    monthlyPriceId: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || null,
    yearlyPriceId: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY || null,
  },
};

export async function createCheckoutSession(opts: {
  siteId: string;
  tenantId: string;
  userId: string;
  userEmail: string;
  planCode: string;
  interval: "month" | "year";
  successUrl: string;
  cancelUrl: string;
}): Promise<string> {
  const stripe = getStripeClient();
  const plan = PLAN_PRICES[opts.planCode];
  if (!plan) throw new Error(`Invalid plan: ${opts.planCode}`);

  const priceId =
    opts.interval === "year" ? plan.yearlyPriceId : plan.monthlyPriceId;
  if (!priceId)
    throw new Error(
      `Price not configured for plan ${opts.planCode} (${opts.interval})`,
    );

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer_email: opts.userEmail,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: {
      site_id: opts.siteId,
      tenant_id: opts.tenantId,
      user_id: opts.userId,
      plan_code: opts.planCode,
    },
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
  });

  return session.url!;
}

export async function createCustomerPortalSession(
  customerId: string,
  returnUrl: string,
): Promise<string> {
  const stripe = getStripeClient();
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return session.url;
}

export async function cancelSubscription(
  subscriptionId: string,
): Promise<void> {
  const stripe = getStripeClient();
  await stripe.subscriptions.cancel(subscriptionId);
}

export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
): Stripe.Event {
  const stripe = getStripeClient();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET not configured");
  return stripe.webhooks.constructEvent(payload, signature, secret);
}
