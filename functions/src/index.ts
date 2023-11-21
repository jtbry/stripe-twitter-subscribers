import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { QuerySnapshot, getFirestore } from "firebase-admin/firestore";
import { defineString } from "firebase-functions/params";
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

export const handleStripeEvents = onRequest(async (request, response) => {
  const signature = request.headers["stripe-signature"] as string;
  const payload = request.body;
  const event = await stripe.webhooks.constructEventAsync(
    payload,
    signature,
    stripeWebhookSecret.value()
  );

  // Handle the event
  switch (event.type) {
    case "customer.subscription.updated": {
      const subscription = event.data.object;
      await getFirestore()
        .collection("subscriptions")
        .where("customerId", "==", subscription.customer)
        .get()
        .then((snapshot: QuerySnapshot) => {
          snapshot.docs.forEach((doc) => {
            doc.ref.update({
              status: subscription.status,
            });
          });
        });
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      await getFirestore()
        .collection("subscriptions")
        .where("customerId", "==", subscription.customer)
        .get()
        .then((snapshot: QuerySnapshot) => {
          snapshot.docs.forEach((doc) => {
            doc.ref.delete();
          });
        });
      break;
    }
    case "customer.created": {
      const customer = event.data.object;
      await getFirestore().collection("subscriptions").add({
        email: customer.email,
        customerId: customer.id,
        status: "incomplete",
      });
      break;
    }
  }

  response.json({ received: true });
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
    response.json({ status, portalUrl: portal.url });
  }
});
