import { User } from "firebase/auth";
import { useEffect, useState } from "react";
import { MySubscription } from "../models/subscription";
import { getCheckoutLink, getMySubscription } from "../services/api";
import { auth } from "../services/firebase.config";

interface DashboardProps {
  user: User;
}

const DashboardView = (props: DashboardProps): JSX.Element => {
  const { user } = props;
  const [subscription, setSubscription] = useState<MySubscription | null>();
  const [subscribeUrl, setSubscribeUrl] = useState<string>();

  useEffect(() => {
    const getDetails = async () => {
      try {
        const sub = await getMySubscription(user);
        setSubscription(sub);
      } catch (ex) {
        const checkout = await getCheckoutLink(user);
        setSubscribeUrl(checkout.url);
      }
    };

    getDetails();
  }, [user]);

  const signOut = () => {
    auth.signOut();
  };

  return (
    <>
      <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
            Subscription Dashboard
          </h2>
        </div>

        <div className="w-1/3 mt-4 self-center">
          {user.photoURL && <img src={user.photoURL} />}
          <p>
            Hello, {user.displayName} ({user.email})
          </p>
        </div>

        <div className="w-1/3 grid gap-y-4 self-center">
          {subscription && (
            <>
              <p>Your subscription is {subscription.subscription.status}.</p>
              {subscription.subscription.cancelAt && (
                <p>
                  It expires on{" "}
                  {new Date(
                    subscription.subscription.cancelAt * 1000
                  ).toLocaleDateString()}
                </p>
              )}
              <a
                href={subscription.portal_url}
                className="w-full flex justify-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Manage Subscription
              </a>
            </>
          )}

          {subscribeUrl && (
            <a
              href={subscribeUrl}
              className="w-full flex justify-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Subscribe Now
            </a>
          )}
          <button
            onClick={signOut}
            className="mt-4 w-full flex justify-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
};

export default DashboardView;
