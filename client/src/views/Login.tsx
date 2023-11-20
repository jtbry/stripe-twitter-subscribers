import { TwitterAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../services/firebase.config";

interface LoginViewProps {
  loading: boolean;
  error: Error | undefined;
}

const LoginView = (props: LoginViewProps): JSX.Element => {
  const { loading, error } = props;

  const signInWithTwitter = async () => {
    try {
      await signInWithPopup(auth, new TwitterAuthProvider());
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      {error && <h1>Error: {error.message}</h1>}
      <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
            Subscription Management
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <div>
            <button
              onClick={signInWithTwitter}
              disabled={loading}
              className="flex w-full justify-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              {loading ? "Loading..." : "Sign in with Twitter"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginView;
