// File: firebaseConfig.js


import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';


const firebaseConfig = {
  apiKey: "AIzaSyDQ-RwWt-DAfP3ooM_QC2ZgjnvMlThqaYw",
  authDomain: "diamondtrack-8.firebaseapp.com",
  projectId: "diamondtrack-8",
  storageBucket: "diamondtrack-8.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_WEB_APP_ID",
  databaseURL: "https://diamondtrack-8-default-rtdb.firebaseio.com"
};


const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);


export const db = getDatabase(app);

