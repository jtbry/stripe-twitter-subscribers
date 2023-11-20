// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCEAOW6wlvNGMARvoe7COaVMQ_Wb4frB0c",
  authDomain: "lukiman-twitter-subs.firebaseapp.com",
  projectId: "lukiman-twitter-subs",
  storageBucket: "lukiman-twitter-subs.appspot.com",
  messagingSenderId: "383033535963",
  appId: "1:383033535963:web:eb585945e2b318ec9b4bfe",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
