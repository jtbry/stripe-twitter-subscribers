import { User } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from "../services/firebase.config";

interface SubscriptionViewProps {
  user: User;
}

interface SubscriptionStatus {
  status: string;
  portalUrl: string;
  cancelAt: number;
}

const SubscriptionView = (props: SubscriptionViewProps): JSX.Element => {
  const { user } = props;
  const [success] = useState(
    new URLSearchParams(window.location.search).get("success")
  );

  const [subscriptionStatus, setSubscriptionStatus] =
    useState<SubscriptionStatus>();

  const signOut = () => {
    auth.signOut();
  };

  useEffect(() => {
    const getSubscriptionStatus = async () => {
      const token = await user.getIdToken();
      const res = await fetch("/api/checkSubscriptionStatus?token=" + token, {
        method: "GET",
      });

      const data = await res.json();
      setSubscriptionStatus(data);
    };

    if (user) {
      getSubscriptionStatus();
    }
  }, [user]);

  if (success) {
    setTimeout(() => {
      window.location.href = "/";
    }, 3000);
  }

  let managementElement = <></>;
  if (subscriptionStatus?.status && subscriptionStatus.status !== "none") {
    managementElement = (
      <>
        <h2>
          Subscription Status: {subscriptionStatus.status}{" "}
          {subscriptionStatus.cancelAt &&
            `expiring on ${new Date(
              subscriptionStatus.cancelAt * 1000
            ).toLocaleDateString()}`}
        </h2>
        <a
          className="w-1/4 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          href={subscriptionStatus.portalUrl}
        >
          Manage Subscription
        </a>
      </>
    );
  } else {
    managementElement = (
      <form action="/api/subscribe" className="py-4">
        {user.email && <input type="hidden" name="email" value={user.email} />}
        <button className="w-1/4 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
          Subscribe
        </button>
      </form>
    );
  }

  return (
    <>
      {success && (
        <div className="bg-green-600 text-white p-4">
          Success! Thanks for subscribing.
        </div>
      )}
      <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <h1 className="text-3xl">Greetings, {user.displayName}</h1>
        <p>Your email is {user.email}</p>
        <p>Your uid is {user.uid}</p>
        <p>Your photo is {user.photoURL}</p>

        <div className="py-4">{managementElement}</div>

        <button
          onClick={signOut}
          className="w-1/4 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          Sign Out
        </button>
      </div>
    </>
  );
};

export default SubscriptionView;
