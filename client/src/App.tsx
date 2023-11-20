import { TwitterAuthProvider, signInWithPopup } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import "./App.css";
import { auth } from "./services/firebase.config";

function App() {
  const [user] = useAuthState(auth);

  const signInWithTwitter = async () => {
    try {
      await signInWithPopup(auth, new TwitterAuthProvider());
    } catch (error) {
      console.error(error);
    }
  };

  const signOut = () => {
    auth.signOut();
  };

  return (
    <div>
      {user ? (
        <>
          <p>Welcome, {user.displayName}!</p>
          <p>{JSON.stringify(user)}</p>
          <button onClick={signOut}>Sign out</button>
        </>
      ) : (
        <button onClick={signInWithTwitter}>Sign in with Twitter</button>
      )}
    </div>
  );
}

export default App;
