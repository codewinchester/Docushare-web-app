import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "",
  authDomain: "docushare-web-app-31170.firebaseapp.com",
  databaseURL: "https://docushare-web-app-31170-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "docushare-web-app-31170",
  storageBucket: "docushare-web-app-31170.firebasestorage.app",
  messagingSenderId: "858428714318",
  appId: "1:858428714318:web:256b122cb90dd3bedd821f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and get a reference to the service
export const database = getDatabase(app);