// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDWG6LUvXrx8IDKMQoTUWRVNhRiLhDEIY8",
  authDomain: "elaf-academy.firebaseapp.com",
  projectId: "elaf-academy",
  storageBucket: "elaf-academy.firebasestorage.app",
  messagingSenderId: "577219194497",
  appId: "1:577219194497:web:de693b30933b577799a780",
  measurementId: "G-YY8Y9VDYGQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);