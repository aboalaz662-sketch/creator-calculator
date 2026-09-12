import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { app } from "./firebase.js";

const db = getFirestore(app);
const reviewsRef = collection(db, "reviews");

// دالة حماية لمنع هجمات XSS وتنظيف المدخلات
function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, function (m) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[m];
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const reviewForm = document.querySelector("form") || document.getElementById("review-form");
  const submitBtn = document.querySelector("button[type='submit']") || document.querySelector(".btn-submit");

  const handleReviewSubmission = async (e) => {
    if (e) e.preventDefault();

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

    if (submitBtn) submitBtn.disabled = true;

    try {
      await addDoc(reviewsRef, {
        name: name,
        rating: rating,
        text: text,
        createdAt: serverTimestamp()
      });

      if (nameInput) nameInput.value = "";
      if (textInput) textInput.value = "";
      
      alert("شكراً لك! تم نشر رأيك بنجاح وظهر لجميع الزوار.");
    } catch (error) {
      console.error("خطأ في حفظ الرأي:", error);
      alert("حدث خطأ أثناء نشر الرأي. يرجى التأكد من إعدادات Firestore Rules في لوحة Firebase.");
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  };

  if (reviewForm) {
    reviewForm.addEventListener("submit", handleReviewSubmission);
  } else if (submitBtn) {
    submitBtn.addEventListener("click", handleReviewSubmission);
  }
});

// الاستماع للآراء بالتحديث اللحظي مع الحماية ومعالجة الوقت المحلي أثناء الرفع
const q = query(reviewsRef, orderBy("createdAt", "desc"));

onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
  const container = document.getElementById("reviews-container") || document.querySelector(".reviews-grid") || document.querySelector(".cards-container");
  
  if (!container) {
    return; // تجنب إظهار error في الكنسول إذا كانت الصفحة لا تحتوي على قسم آراء
  }

  container.innerHTML = "";

  if (snapshot.empty) {
    container.innerHTML = "<p style='text-align: center; color: #6b7280;'>لا توجد آراء بعد. كن أول من يشارك رأيه!</p>";
    return;
  }

  snapshot.forEach((doc) => {
    const data = doc.data();

    // معالجة التاريخ بشكل آمن لتجنب مشكلة التأخير اللحظي
    let formattedDate = "الآن";
    if (data.createdAt && typeof data.createdAt.toDate === "function") {
      const dateObj = data.createdAt.toDate();
      formattedDate = `${dateObj.getFullYear()}/${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
    }

    // تنظيف البيانات الحماية من XSS
    const safeName = escapeHTML(data.name || "زائر");
    const safeText = escapeHTML(data.text || "");
    const safeRating = Math.min(Math.max(parseInt(data.rating) || 5, 1), 5);

    const reviewCard = `
      <div class="post-card" style="border: 1px solid #e5e7eb; padding: 20px; border-radius: 12px; margin-bottom: 15px; background-color: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        <div style="color: #f59e0b; margin-bottom: 8px; font-size: 18px;">${"★".repeat(safeRating)}</div>
        <h4 style="font-weight: bold; margin-bottom: 5px; color: #111827;">${safeName}</h4>
        <p style="color: #4b5563; line-height: 1.6; margin-bottom: 10px;">${safeText}</p>
        <small style="color: #9ca3af; font-size: 12px;">${formattedDate}</small>
      </div>
    `;

    container.insertAdjacentHTML("beforeend", reviewCard);
  });
}, (error) => {
  console.error("خطأ في جلب الآراء:", error);
});
