import { getFirestore, collection, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { app } from "./firebase.js";

const db = getFirestore(app);

// إعداد قناة البث المباشر للاستماع للتحديثات اللحظية من لوحة التحكم
const liveChannel = ('BroadcastChannel' in window) ? new BroadcastChannel('elaf_updates_channel') : null;

if (liveChannel) {
  liveChannel.onmessage = (event) => {
    console.log("استلام إشعار تحديث من لوحة التحكم:", event.data);
    // عند استقبال تحديث، يمكن تحديث الواجهة أو إعادة قراءة البيانات المحلية
    handleLiveUpdate(event.data);
  };
}

// الاستماع للتغييرات في LocalStorage بين التبويبات والمناقذ المختلفة
window.addEventListener('storage', (e) => {
  if (e.key && e.key.startsWith('elaf_')) {
    console.log("تحديث في بيانات LocalStorage:", e.key);
    handleLiveUpdate({ type: e.key.replace('elaf_', '') });
  }
});

// دالة لمعالجة التحديثات اللحظية وتنعكس على الصفحة الرئيسية مباشرة
function handleLiveUpdate(updateData) {
  // يمكنك استدعاء الدوال المسؤولة عن تحديث العناصر في الواجهة هنا
  if (typeof window.loadMainPageData === 'function') {
    window.loadMainPageData();
  }
}

// استعلام لجلب المنشورات مرتبة حسب الأحدث
const q = query(collection(db, "posts"));

// الاستماع للتحديثات فورياً من Firestore (Real-time)
onSnapshot(q, (snapshot) => {
  snapshot.docChanges().forEach((change) => {
    if (change.type === "added") {
      const postData = change.doc.data();
      console.log("منشور جديد للزائر:", postData);
      
      // طباعة البيانات على الشاشة
      displayPost(postData);
    }
  });
});

// دالة لعرض المنشور والصورة والتعليق في HTML
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
