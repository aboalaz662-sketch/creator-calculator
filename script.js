import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { app } from "./firebase.js";

const db = getFirestore(app);
const reviewsRef = collection(db, "reviews");

// 1. ربط زر نشر الرأي والحقول مع Firebase
document.addEventListener("DOMContentLoaded", () => {
  // البحث عن الحقول والزر مباشرة
  const inputs = document.querySelectorAll("input");
  const nameInput = inputs.length > 0 ? inputs[0] : null; // حقل الاسم
  const selectRating = document.querySelector("select");  // حقل التقييم
  const textareaInput = document.querySelector("textarea"); // حقل التعليق
  
  // البحث عن زر النشر بالاسم الموجود في الصورة "نشر الرأي فوراً"
  const buttons = document.querySelectorAll("button, div, a");
  let submitBtn = null;
  buttons.forEach(btn => {
    if (btn.innerText && btn.innerText.includes("نشر الرأي")) {
      submitBtn = btn;
    }
  });

  if (submitBtn) {
    submitBtn.style.cursor = "pointer";
    submitBtn.addEventListener("click", async (e) => {
      e.preventDefault();

      const name = nameInput ? nameInput.value.trim() : "";
      const text = textareaInput ? textareaInput.value.trim() : "";
      let rating = 5;

      if (selectRating && selectRating.value) {
        const match = selectRating.value.match(/\d+/);
        if (match) rating = parseInt(match[0]);
      }

      if (!name || !text) {
        alert("يرجى كتابة الاسم والتعليق أولاً!");
        return;
      }

      try {
        await addDoc(reviewsRef, {
          name: name,
          rating: rating,
          text: text,
          createdAt: serverTimestamp()
        });

        if (nameInput) nameInput.value = "";
        if (textareaInput) textareaInput.value = "";
        alert("تم نشر رأيك بنجاح وظهر للجميع!");
      } catch (err) {
        console.error("خطأ أثناء الحفظ:", err);
        alert("حدث خطأ في الاتصال، يرجى المحاولة لاحقاً.");
      }
    });
  }
});

// 2. الاستماع التلقائي وعرض الآراء فوراً للزائر وفي المتصفح الخفي
const q = query(reviewsRef, orderBy("createdAt", "desc"));

onSnapshot(q, (snapshot) => {
  // البحث عن شبكة البطاقات العلوية
  const allDivs = document.querySelectorAll("div");
  let container = null;

  // البحث عن الحاوية التي تحتوي على الكروت الثلاثة
  allDivs.forEach(div => {
    if (div.children.length >= 2 && div.innerHTML.includes("★")) {
      container = div;
    }
  });

  if (!container) {
    container = document.getElementById("reviews-container") || document.querySelector(".grid");
  }

  if (!container) return;

  container.innerHTML = ""; // مسح العناصر لتحديثها بالبيانات الحية

  snapshot.forEach((doc) => {
    const data = doc.data();
    
    // إعداد التقييم بالنجوم
    const starsCount = data.rating || 5;
    const starsHtml = "★".repeat(starsCount) + "☆".repeat(5 - starsCount);

    const card = document.createElement("div");
    card.style.cssText = "background: #fff; border-radius: 12px; padding: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); text-align: center; margin-bottom: 15px;";
    
    card.innerHTML = `
      <div style="color: #d97706; font-size: 16px; margin-bottom: 8px;">${starsHtml}</div>
      <p style="color: #374151; font-size: 14px; margin-bottom: 10px; word-break: break-word;">${data.text || ""}</p>
      <h5 style="color: #111827; font-weight: bold; font-size: 13px; margin: 0;">${data.name || "زائر"}</h5>
    `;

    container.appendChild(card);
  });
});
