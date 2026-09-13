import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDWG6LUvXrx8IDKMQoTUWRVNhRiLhDEIY8",
  authDomain: "elaf-academy.firebaseapp.com",
  projectId: "elaf-academy",
  storageBucket: "elaf-academy.appspot.com",
  messagingSenderId: "577219194497",
  appId: "1:577219194497:web:de693b30933b577799a780",
  measurementId: "G-YY8Y9VDYGQ"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const storage = getStorage(app);
export { app, analytics, db, storage };
