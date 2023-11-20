import { useAuthState } from "react-firebase-hooks/auth";
import "./App.css";
import { auth } from "./services/firebase.config";
import LoginView from "./views/Login";
import SubscriptionView from "./views/Subscription";

function App() {
  const [user, loading, error] = useAuthState(auth);

  if (user) {
    return (
      <>
        <SubscriptionView user={user} />
      </>
    );
  } else {
    return (
      <>
        <LoginView loading={loading} error={error} />
      </>
    );
  }
}

export default App;
