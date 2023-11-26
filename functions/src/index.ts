import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { QuerySnapshot, getFirestore } from "firebase-admin/firestore";
import { defineString } from "firebase-functions/params";
import { logger } from "firebase-functions/v1";
import { onRequest } from "firebase-functions/v2/https";
import Stripe from "stripe";

initializeApp();

const subscriptionPriceId = defineString("SUBSCRIPTION_PRICE_ID");
const frontendUrl = defineString("FRONTEND_URL");
// Long term: this should be a secret but to avoid billing for now it is a string
// https://firebase.google.com/docs/functions/config-env?gen=2nd#secret_parameters
const stripeApiKey = defineString("STRIPE_API_KEY");
const stripeWebhookSecret = defineString("STRIPE_WEBHOOK_SECRET");

const stripe = new Stripe(stripeApiKey.value());

export const subscribe = onRequest(async (request, response) => {
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: subscriptionPriceId.value(),
        quantity: 1,
      },
    ],
    success_url: `${frontendUrl.value()}?success=true`,
    cancel_url: `${frontendUrl.value()}`,
    customer_email: request.query.email as string,
  });

  response.redirect(session.url ?? frontendUrl.value());
});

export const checkSubscriptionStatus = onRequest(async (request, response) => {
  if (!request.query.token) {
    response.status(400).json({ status: "none" });
    return;
  }

  const user = await getAuth().verifyIdToken(request.query.token as string);
  const subscription: QuerySnapshot = await getFirestore()
    .collection("subscriptions")
    .where("email", "==", user.email)
    .get();

  if (subscription.empty) {
    response.json({ status: "none" });
  } else {
    const status = subscription.docs[0].data().status;
    const portal = await stripe.billingPortal.sessions.create({
      customer: subscription.docs[0].data().customerId,
      return_url: `${frontendUrl.value()}`,
    });
    const cancelAt = subscription.docs[0].data().cancelAt;
    response.json({ status, portalUrl: portal.url, cancelAt: cancelAt });
  }
});

/**
 * A webhook handler function for the relevant Stripe events.
 */
export const handleStripeEvents = onRequest(async (req, resp) => {
  const relevantEvents = new Set([
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
    "invoice.paid",
    "invoice.payment_succeeded",
    "invoice.payment_failed",
    "invoice.upcoming",
    "invoice.marked_uncollectible",
    "invoice.payment_action_required",
  ]);
  let event: Stripe.Event;

  // Instead of getting the `Stripe.Event`
  // object directly from `req.body`,
  // use the Stripe webhooks API to make sure
  // this webhook call came from a trusted source
  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      req.headers["stripe-signature"] || "",
      stripeWebhookSecret.value()
    );
  } catch (error) {
    logger.error(error);
    resp.status(401).send("Webhook Error: Invalid Secret");
    return;
  }

  if (relevantEvents.has(event.type)) {
    logger.info(event.id, event.type);
    try {
      switch (event.type) {
        case "customer.subscription.created":
        case "customer.subscription.updated":
        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          await getFirestore()
            .collection("subscriptions")
            .where("customerId", "==", subscription.customer)
            .get()
            .then(async (snapshot) => {
              if (!snapshot.empty) {
                await snapshot.docs[0].ref.update({
                  status: subscription.status,
                  cancelAt: subscription.cancel_at,
                });
              } else {
                const customer = await stripe.customers.retrieve(
                  subscription.customer as string
                );
                const c = customer as Stripe.Customer;

                await getFirestore().collection("subscriptions").add({
                  customerId: subscription.customer,
                  email: c.email,
                  status: subscription.status,
                  cancelAt: subscription.cancel_at,
                });
              }
            });
          break;
        }

        case "invoice.paid":
        case "invoice.payment_succeeded":
        case "invoice.payment_failed":
        case "invoice.upcoming":
        case "invoice.marked_uncollectible":
        case "invoice.payment_action_required": {
          const invoice = event.data.object as Stripe.Invoice;
          let subscription: Stripe.Subscription | undefined;
          if (invoice.subscription) {
            subscription = await stripe.subscriptions.retrieve(
              invoice.subscription as string
            );
          }
          const statusMap = {
            paid: "active",
            open: "incomplete",
            draft: "incomplete",
            none: "incomplete",
            void: "canceled",
            uncollectible: "past_due",
          };

          await getFirestore()
            .collection("subscriptions")
            .where("customerId", "==", invoice.customer)
            .get()
            .then(async (snapshot) => {
              if (!snapshot.empty) {
                await snapshot.docs[0].ref.update({
                  status: statusMap[invoice.status ?? "none"],
                  cancelAt: subscription?.cancel_at,
                });
              } else {
                await getFirestore()
                  .collection("subscriptions")
                  .add({
                    customerId: invoice.customer,
                    email: invoice.customer_email,
                    status: statusMap[invoice.status ?? "none"],
                    cancelAt: subscription?.cancel_at,
                  });
              }
            });
          break;
        }
        default:
          logger.warn(
            new Error("Unhandled relevant event!"),
            event.id,
            event.type
          );
      }

      logger.info(event.id, event.type);
    } catch (error) {
      logger.info(error, event.id, event.type);
      resp.json({
        error: "Webhook handler failed. View function logs in Firebase.",
      });
      return;
    }
  }

  // Return a response to Stripe to acknowledge receipt of the event.
  resp.json({ received: true });
});
