import { User } from "firebase/auth";
import { CheckoutUrl, MySubscription } from "../models/subscription";

export const getCheckoutLink = async (user: User): Promise<CheckoutUrl> => {
  const resp = await fetch("/api/getCheckoutLink", {
    headers: {
      "X-Auth-Token": await user.getIdToken(),
    },
  });

  const json = await resp.json();
  if (resp.status != 200) {
    console.log(json);
    throw new Error("Failed to get checkout link");
  } else return json;
};

export const getMySubscription = async (
  user: User
): Promise<MySubscription> => {
  const resp = await fetch("/api/getMySubscription", {
    headers: {
      "X-Auth-Token": await user.getIdToken(),
    },
  });

  const json = await resp.json();
  if (resp.status != 200) {
    console.log(json);
    throw new Error("Failed to get checkout link");
  } else return json;
};
