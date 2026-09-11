import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { app } from "./firebase.js";

const db = getFirestore(app);
const reviewsRef = collection(db, "reviews");

// 1. إرسال التعليق/الرأي إلى Firebase Firestore
async function submitReview(name, rating, text) {
  try {
    await addDoc(reviewsRef, {
      name: name,
      rating: rating,
      text: text,
      createdAt: serverTimestamp()
    });
    console.log("تم حفظ الرأي بنجاح في قاعدة البيانات العامة!");
  } catch (error) {
    console.error("خطأ في حفظ الرأي:", error);
  }
}

// 2. الاستماع التلقائي للتعليقات لعرضها لجميع الزوار فوراً
const q = query(reviewsRef, orderBy("createdAt", "desc"));

onSnapshot(q, (snapshot) => {
  const container = document.getElementById("reviews-container"); // ID الحاوية الخاصة بالآراء
  if (!container) return;
  
  container.innerHTML = ""; // تفريغ الحاوية قبل إعادة الرسم
  
  snapshot.forEach((doc) => {
    const data = doc.data();
    
    // إنشاء كارت الرأي
    const reviewCard = `
      <div class="review-card" style="border: 1px solid #eee; padding: 12px; border-radius: 8px; margin-bottom: 10px;">
        <div class="stars">${"★".repeat(data.rating || 5)}</div>
        <h4>${data.name || "زائر"}</h4>
        <p>${data.text || ""}</p>
      </div>
    `;
    container.insertAdjacentHTML("beforeend", reviewCard);
  });
});
