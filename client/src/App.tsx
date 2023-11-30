import { useAuthState } from "react-firebase-hooks/auth";
import "./App.css";
import { auth } from "./services/firebase.config";
import DashboardView from "./views/Dashboard";
import LoginView from "./views/Login";

function App() {
  const [user, loading] = useAuthState(auth);
  if (loading) {
    return <h1>Loading...</h1>;
  }

  if (user) {
    return <DashboardView user={user} />;
  } else {
    return <LoginView />;
  }
}

export default App;
