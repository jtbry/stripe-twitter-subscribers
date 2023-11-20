import { User } from "firebase/auth";
import { auth } from "../services/firebase.config";

interface SubscriptionViewProps {
  user: User;
}

const SubscriptionView = (props: SubscriptionViewProps): JSX.Element => {
  const { user } = props;

  const signOut = () => {
    auth.signOut();
  };

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <h1 className="text-3xl">Greetings, {user.displayName}</h1>
      <p>Your email is {user.email}</p>
      <p>Your uid is {user.uid}</p>
      <p>Your photo is {user.photoURL}</p>

      <button
        onClick={signOut}
        className="w-1/4 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        Sign Out
      </button>
    </div>
  );
};

export default SubscriptionView;
