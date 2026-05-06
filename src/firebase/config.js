import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDABhi7fEBu8pvYJeSGpjtUhWHXLSSkWf4",
  authDomain: "espacio-sagrado.firebaseapp.com",
  projectId: "espacio-sagrado",
  storageBucket: "espacio-sagrado.firebasestorage.app",
  messagingSenderId: "757202618552",
  appId: "1:757202618552:web:18f4e245acf5b9545d4c4d"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);