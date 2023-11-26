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
    const sub = subscription.docs[0].data();
    const portal = await stripe.billingPortal.sessions.create({
      customer: subscription.docs[0].data().customerId,
      return_url: `${frontendUrl.value()}`,
    });

    response.json({
      ...sub,
      portalUrl: portal.url,
    });
  }
});

/**
 * A webhook handler function for the relevant Stripe events.
 */
export const handleStripeEvents = onRequest(async (req, resp) => {
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

  logger.info(event.id, event.type);
  try {
    switch (event.type) {
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        if (
          !subscription.items.data.find(
            (i) => i.price.id == subscriptionPriceId.value()
          )
        ) {
          // Ignore subscription created/updated events for different products
          break;
        }

        await getFirestore()
          .collection("subscriptions")
          .where("customerId", "==", event.data.object.customer)
          .get()
          .then(async (snapshot) => {
            if (!snapshot.empty) {
              snapshot.docs[0].ref.delete();
            }
          });
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        if (
          !subscription.items.data.find(
            (i) => i.price.id == subscriptionPriceId.value()
          )
        ) {
          // Ignore subscription created/updated events for different products
          logger.info(
            "Ignoring subscription event for different product",
            subscription.items.data,
            subscriptionPriceId.value()
          );
          break;
        }
        const customer = (await stripe.customers.retrieve(
          subscription.customer as string
        )) as Stripe.Customer;

        await updateSubscription(customer.email, subscription);
        logger.info("Subscription Created/Updated", subscription);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;

        // Only update the subscription status if it is a subscription invoice
        if (
          !invoice.lines.data.find(
            (l) => l.price && l.price.id === subscriptionPriceId.value()
          )
        ) {
          break;
        }

        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          );

          if (subscription) {
            await updateSubscription(invoice.customer_email, subscription);
            logger.info(
              "Invoice Paid, updated subscription",
              invoice,
              subscription
            );
          } else {
            logger.warn("Failed to update subscription", invoice);
          }
        }

        break;
      }

      default:
        logger.warn(new Error("Unhandled event"), event.id, event.type);
        break;
    }
  } catch (error) {
    logger.error(error);
    resp.status(500).json({
      error: "Webhook handler failed. View Firebase log for details.",
    });
    return;
  }

  // Return a response to Stripe to acknowledge receipt of the event.
  resp.json({ received: true });
});

const updateSubscription = async (
  customerEmail: string | null,
  subscription: Stripe.Subscription
) => {
  await getFirestore()
    .collection("subscriptions")
    .where("email", "==", customerEmail)
    .get()
    .then(async (snapshot) => {
      if (!snapshot.empty) {
        // Update existing subscribption
        await snapshot.docs[0].ref.update({
          status: subscription.status,
          cancelAt: subscription.cancel_at,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        });
      } else {
        // Create new subscription
        await getFirestore().collection("subscriptions").add({
          customerId: subscription.customer,
          email: customerEmail,
          status: subscription.status,
          cancelAt: subscription.cancel_at,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        });
      }
    });
};
