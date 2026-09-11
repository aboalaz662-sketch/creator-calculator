import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { app } from "./firebase.js";

const db = getFirestore(app);
const reviewsRef = collection(db, "reviews");

// 1. الاستماع لنموذج إضافة الرأي في الصفحة عند الضغط على زر "نشر الرأي فوراً"
document.addEventListener("DOMContentLoaded", () => {
  const reviewForm = document.querySelector("form") || document.getElementById("review-form");
  const submitBtn = document.querySelector("button[type='submit']") || document.querySelector(".btn-submit");

  // معالجة الضغط على الزر أو تقديم النموذج
  const handleReviewSubmission = async (e) => {
    if (e) e.preventDefault();

    // جلب قيم المدخلات من الصفحة
    const nameInput = document.querySelector("input[placeholder*='اسمك']") || document.getElementById("reviewer-name");
    const ratingSelect = document.querySelector("select") || document.getElementById("reviewer-rating");
    const textInput = document.querySelector("textarea") || document.getElementById("reviewer-text");

    const name = nameInput ? nameInput.value.trim() : "";
    const text = textInput ? textInput.value.trim() : "";
    let rating = 5;

    if (ratingSelect) {
      const parsedRating = parseInt(ratingSelect.value);
      if (!isNaN(parsedRating)) rating = parsedRating;
    }

    if (!name || !text) {
      alert("يرجى كتابة الاسم والتعليق قبل النشر!");
      return;
    }

    try {
      // إرسال البيانات إلى Firebase Firestore
      await addDoc(reviewsRef, {
        name: name,
        rating: rating,
        text: text,
        createdAt: serverTimestamp()
      });

      console.log("تم حفظ الرأي بنجاح في Firebase!");

      // تفريغ الخانات بعد النشر
      if (nameInput) nameInput.value = "";
      if (textInput) textInput.value = "";
      
      alert("شكراً لك! تم نشر رأيك بنجاح وظهر لجميع الزوار.");
    } catch (error) {
      console.error("خطأ في حفظ الرأي:", error);
      alert("حدث خطأ أثناء نشر الرأي، يرجى المحاولة لاحقاً.");
    }
  };

  if (reviewForm) {
    reviewForm.addEventListener("submit", handleReviewSubmission);
  } else if (submitBtn) {
    submitBtn.addEventListener("click", handleReviewSubmission);
  }
});

// 2. الاستماع التلقائي اللحظي (Real-time) لعرض الآراء لجميع الزوار وفي المتصفح الخفي
const q = query(reviewsRef, orderBy("createdAt", "desc"));

onSnapshot(q, (snapshot) => {
  // البحث عن الحاوية المسؤولة عن عرض الآراء في الواجهة
  const container = document.getElementById("reviews-container") || document.querySelector(".reviews-grid") || document.querySelector(".cards-container");
  if (!container) return;

  container.innerHTML = ""; // تفريغ القائمة قبل الطباعة لمنع التكرار

  snapshot.forEach((doc) => {
    const data = doc.data();

    // تنسيق التاريخ
    let formattedDate = "مؤخراً";
    if (data.createdAt && data.createdAt.toDate) {
      const dateObj = data.createdAt.toDate();
      formattedDate = `${dateObj.getFullYear()}/${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
    }

    // إنشاء كارت الرأي بحسب تصميم الموقع
    const reviewCard = `
      <div class="post-card" style="border: 1px solid #e5e7eb; padding: 20px; border-radius: 12px; margin-bottom: 15px; background-color: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        <div style="color: #f59e0b; margin-bottom: 8px; font-size: 18px;">${"★".repeat(data.rating || 5)}</div>
        <h4 style="font-weight: bold; margin-bottom: 5px; color: #111827;">${data.name || "زائر"}</h4>
        <p style="color: #4b5563; line-height: 1.6; margin-bottom: 10px;">${data.text || ""}</p>
        <small style="color: #9ca3af; font-size: 12px;">${formattedDate}</small>
      </div>
    `;

    container.insertAdjacentHTML("beforeend", reviewCard);
  });
});
