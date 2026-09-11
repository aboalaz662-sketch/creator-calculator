// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";

// Your web app's Firebase configuration
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

// Initialize Analytics conditionally to prevent errors in environments without window/analytics support
let analytics = null;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}

// Export app & analytics for use across all scripts
export { app, analytics };
