import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDWQEHdan5-nz3dvbXHN4b2kAkcepvH3ec",
  authDomain: "lights-off-ormeco.firebaseapp.com",
  projectId: "lights-off-ormeco",
  storageBucket: "lights-off-ormeco.firebasestorage.app",
  messagingSenderId: "96715718759",
  appId: "1:96715718759:web:734206118e9e2f55bad4c2"
};

const app = initializeApp(firebaseConfig);

// Ito ang pinakamahalaga: kailangan may export!
export const auth = getAuth(app);
export const db = getFirestore(app);