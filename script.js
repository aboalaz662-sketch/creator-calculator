import { db, storage } from "./firebase.js";
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const postsRef = collection(db, "posts");
const q = query(postsRef, orderBy("createdAt", "desc"));

// 1. الاستماع للتحديثات اللحظية لعرض الصور والتعليقات
onSnapshot(q, (snapshot) => {
  const gallery = document.getElementById("gallery");
  const commentsList = document.getElementById("commentsList");
  
  if (gallery) gallery.innerHTML = "";
  if (commentsList) commentsList.innerHTML = "";

  snapshot.forEach((doc) => {
    const data = doc.data();

    if (data.imageUrl && gallery) {
      const img = document.createElement("img");
      img.src = data.imageUrl;
      gallery.appendChild(img);
    }

    if (data.text && commentsList) {
      const commentDiv = document.createElement("div");
      commentDiv.className = "comment-item";
      commentDiv.innerHTML = `<strong>${data.name || 'زائر'}:</strong> ${data.text}`;
      commentsList.appendChild(commentDiv);
    }
  });
});

// 2. دالة النشر
const submitBtn = document.getElementById("submitBtn");
if (submitBtn) {
  submitBtn.addEventListener("click", async () => {
    const nameInput = document.getElementById("userName");
    const textInput = document.getElementById("commentText");
    const fileInput = document.getElementById("imageInput");

    const name = nameInput ? nameInput.value.trim() : "";
    const text = textInput ? textInput.value.trim() : "";
    const file = fileInput && fileInput.files ? fileInput.files[0] : null;

    if (!text && !file) {
      alert("يرجى كتابة تعليق أو اختيار صورة أولاً");
      return;
    }

    let imageUrl = "";

    try {
      if (file) {
        const storageRef = ref(storage, `images/${Date.now()}_${file.name}`);
        const uploadResult = await uploadBytes(storageRef, file);
        imageUrl = await getDownloadURL(uploadResult.ref);
      }

      await addDoc(postsRef, {
        name: name || "زائر",
        text: text,
        imageUrl: imageUrl,
        createdAt: serverTimestamp()
      });

      if (textInput) textInput.value = "";
      if (fileInput) fileInput.value = "";
    } catch (error) {
      console.error("خطأ أثناء النشر:", error);
      alert("حدث خطأ، تأكد من إعدادات القواعد (Rules) في Firebase");
    }
  });
}
