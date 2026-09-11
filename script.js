import { getFirestore, collection, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { app } from "./firebase.js";

const db = getFirestore(app);

// استعلام لجلب المنشورات مرتبة حسب الأحدث
const q = query(collection(db, "posts"));

// الاستماع للتحديثات فورياً (Real-time)
onSnapshot(q, (snapshot) => {
  snapshot.docChanges().forEach((change) => {
    if (change.type === "added") {
      const postData = change.doc.data();
      console.log("منشور جديد للزائر:", postData);
      
      // هنا يتم طباعة البيانات على الشاشة (مثال: إضافة عنصر لقائمة المنشورات)
      displayPost(postData);
    }
  });
});

// دالة بسيطة لعرض المنشور والصورة والتعليق في HTML
function displayPost(data) {
  const container = document.getElementById("posts-container"); // تأكد من وجود عنصر بهذا ID في HTML
  if (!container) return;

  const postHTML = `
    <div class="post-card" style="border: 1px solid #ccc; padding: 15px; margin-bottom: 10px; border-radius: 8px;">
      <h3>${data.title || "منشور جديد"}</h3>
      <p>${data.content || ""}</p>
      ${data.imageUrl ? `<img src="${data.imageUrl}" alt="صورة المنشور" style="max-width: 100%; height: auto;" />` : ""}
    </div>
  `;
  
  container.insertAdjacentHTML("afterbegin", postHTML);
}
