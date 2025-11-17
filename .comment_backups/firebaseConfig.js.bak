//AIzaSyDQ-RwWt-DAfP3ooM_QC2ZgjnvMlThqaYw
// firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth'; // For authentication
import { getDatabase } from 'firebase/database'; // Import Realtime Database service

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDQ-RwWt-DAfP3ooM_QC2ZgjnvMlThqaYw", // Make sure this is replaced with your actual API Key
  authDomain: "diamondtrack-8.firebaseapp.com",
  projectId: "diamondtrack-8",
  storageBucket: "diamondtrack-8.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // Make sure this is replaced
  appId: "YOUR_WEB_APP_ID", // Make sure this is replaced with your actual Web App ID
  databaseURL: "https://diamondtrack-8-default-rtdb.firebaseio.com" // This is crucial for RTDB
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Get a reference to the Realtime Database service and EXPORT it
export const db = getDatabase(app);

