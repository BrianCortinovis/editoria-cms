import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { constructWebhookEvent, isStripeConfigured } from "@/lib/billing/stripe-service";
import type { SubscriptionStatus } from "@/types/database";

// Stripe sends raw body — disable Next.js body parsing is handled via request.text()

export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Billing not configured" },
      { status: 503 },
    );
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    );
  }

  let event;
  try {
    event = constructWebhookEvent(body, signature);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = await createServiceRoleClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as unknown as Record<string, unknown>;
        const meta = (session.metadata || {}) as Record<string, string>;
        const { site_id, tenant_id, user_id, plan_code } = meta;

        if (site_id && session.subscription) {
          await supabase.from("subscriptions").upsert(
            {
              site_id,
              tenant_id: tenant_id || site_id,
              provider: "stripe",
              plan_code: plan_code || "base",
              status: "active" as SubscriptionStatus,
              external_customer_id: session.customer as string,
              external_subscription_id: session.subscription as string,
              metadata: { checkout_session_id: session.id },
            },
            { onConflict: "site_id" },
          );

          await supabase.from("audit_logs").insert({
            tenant_id: tenant_id || null,
            site_id,
            actor_user_id: user_id || null,
            action: "billing.subscription_created",
            resource_type: "subscription",
            resource_id: site_id,
            metadata: { plan_code, provider: "stripe" },
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as unknown as Record<string, unknown>;
        const statusMap: Record<string, SubscriptionStatus> = {
          active: "active",
          past_due: "past_due",
          canceled: "canceled",
          trialing: "trialing",
          paused: "paused",
        };

        const mappedStatus =
          statusMap[subscription.status as string] ||
          (subscription.status as SubscriptionStatus);

        const updatePayload: Record<string, unknown> = {
          status: mappedStatus,
        };

        if (typeof subscription.current_period_end === "number") {
          updatePayload.current_period_ends_at = new Date(
            (subscription.current_period_end as number) * 1000,
          ).toISOString();
        }

        const { error } = await supabase
          .from("subscriptions")
          .update(updatePayload)
          .eq(
            "external_subscription_id",
            subscription.id as string,
          );

        if (error)
          console.error("subscription.updated DB error:", error.message);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as unknown as Record<string, unknown>;
        await supabase
          .from("subscriptions")
          .update({ status: "canceled" as SubscriptionStatus })
          .eq(
            "external_subscription_id",
            subscription.id as string,
          );
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as unknown as Record<string, unknown>;
        if (invoice.subscription) {
          await supabase
            .from("subscriptions")
            .update({ status: "past_due" as SubscriptionStatus })
            .eq(
              "external_subscription_id",
              invoice.subscription as string,
            );
        }
        break;
      }
    }
  } catch (err) {
    console.error(`Webhook handler error (${event.type}):`, err);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
