// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAvYK5BOWEww4JQ1P29b3SVtqwBA-ldJIg",
  authDomain: "telemedicine-1dec4.firebaseapp.com",
  projectId: "telemedicine-1dec4",
  storageBucket: "telemedicine-1dec4.firebasestorage.app",
  messagingSenderId: "380643813197",
  appId: "1:380643813197:web:ebd6fff54df09c68353904",
  measurementId: "G-V12PXK1J5Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
