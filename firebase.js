import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import { getFirestore, collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";
import { getAuth, updatePassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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
const auth = getAuth(app);

// ================= UTILS & UPLOAD FILE ================= //
async function uploadFile(file, folder) {
  const storageRef = ref(storage, folder + '/' + Date.now() + '-' + file.name);
  const snap = await uploadBytes(storageRef, file);
  return await getDownloadURL(snap.ref);
}

function extractYoutubeId(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

window.copyText = function(text, btnElement) {
  navigator.clipboard.writeText(text);
  const originalText = btnElement.innerText;
  btnElement.innerText = "تم النسخ بنجاح!";
  setTimeout(() => { btnElement.innerText = originalText; }, 2000);
};

// ================= SIDEBAR & MODAL TOGGLES ================= //
function toggleSidebarNav() {
  const sidebar = document.getElementById('sidebarNav');
  const overlay = document.getElementById('sidebarNavOverlay');
  sidebar.classList.toggle('translate-x-full');
  overlay.classList.toggle('hidden');
}

function openPaypalModal() { document.getElementById('paypalModal').classList.remove('hidden'); }
function closePaypalModal() { document.getElementById('paypalModal').classList.add('hidden'); }
function openAdminModal() { document.getElementById('adminModal').classList.remove('hidden'); }
function closeAdminModal() { document.getElementById('adminModal').classList.add('hidden'); }
function closePortalModal() { document.getElementById('portalModal').classList.add('hidden'); }

// UI Tabs Switcher
function switchAdminTab(tabName) {
  const tabs = ['requests', 'teacher', 'threeImgs', 'paypal', 'logo', 'founder', 'vid', 'img', 'pass'];
  tabs.forEach(t => {
    const section = document.getElementById(t + 'Section') || document.getElementById(t + 'Form') || document.getElementById(t + 'AdminSection');
    if (section) section.classList.add('hidden');
  });

  const target = document.getElementById(tabName + 'Section') || document.getElementById(tabName + 'Form') || document.getElementById(tabName + 'AdminSection');
  if (target) target.classList.remove('hidden');
}

// ================= FIRESTORE REAL-TIME LISTENERS ================= //
let allReviews = [];
let showAllReviewsFlag = false;

// 1. Reviews Listener
onSnapshot(collection(db, "reviews"), (snapshot) => {
  allReviews = [];
  snapshot.forEach((docSnap) => {
    allReviews.push({ id: docSnap.id, ...docSnap.data() });
  });
  renderTestimonials();
  renderAdminReviews();
});

function renderTestimonials() {
  const grid = document.getElementById('testimonials-grid');
  const showMoreContainer = document.getElementById('show-more-container');
  if (!grid) return;
  grid.innerHTML = '';

  const displayList = showAllReviewsFlag ? allReviews : allReviews.slice(0, 3);
  displayList.forEach(item => {
    grid.innerHTML += `
      <div class="bg-white p-6 rounded-2xl border border-gold/20 shadow-sm space-y-3">
        <div class="flex items-center justify-between">
          <h4 class="font-bold text-sm text-primary">${item.author || 'زائر'}</h4>
          <span class="text-gold text-xs">${'⭐'.repeat(item.rating || 5)}</span>
        </div>
        <p class="text-xs text-gray-600 leading-relaxed">${item.text || ''}</p>
      </div>
    `;
  });

  if (allReviews.length > 3 && !showAllReviewsFlag) {
    showMoreContainer.classList.remove('hidden');
  } else {
    showMoreContainer.classList.add('hidden');
  }
}

function renderAdminReviews() {
  const tbody = document.getElementById('adminReviewsTable');
  if (!tbody) return;
  tbody.innerHTML = '';
  allReviews.forEach((item, index) => {
    tbody.innerHTML += `
      <tr class="border-b">
        <td class="p-2 text-center">${index + 1}</td>
        <td class="p-2">${item.author || ''}</td>
        <td class="p-2 text-gold">${'⭐'.repeat(item.rating || 5)}</td>
        <td class="p-2">${item.text || ''}</td>
        <td class="p-2 text-center">
          <button data-id="${item.id}" class="btn-delete-review bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs">حذف</button>
        </td>
      </tr>
    `;
  });

  document.querySelectorAll('.btn-delete-review').forEach(btn => {
    btn.onclick = async (e) => {
      const id = e.target.getAttribute('data-id');
      await deleteDoc(doc(db, "reviews", id));
    };
  });
}

// 2. Settings (Video / Logo / Founder / Paypal / Three Images) Listener
onSnapshot(doc(db, "settings", "general"), (snapshot) => {
  if (!snapshot.exists()) return;
  const data = snapshot.data();

  // Video Settings
  if (data.youtubeUrl) {
    const yId = extractYoutubeId(data.youtubeUrl);
    if (yId) {
      document.getElementById('mainVideoPlayer').classList.add('hidden');
      const yPlayer = document.getElementById('mainYoutubePlayer');
      yPlayer.src = `https://www.youtube.com/embed/${yId}`;
      yPlayer.classList.remove('hidden');
    }
  } else if (data.videoUrl) {
    document.getElementById('mainYoutubePlayer').classList.add('hidden');
    const vPlayer = document.getElementById('mainVideoPlayer');
    document.getElementById('mainVideoSource').src = data.videoUrl;
    vPlayer.load();
    vPlayer.classList.remove('hidden');
  }

  // Logo & Founder
  if (data.logoUrl) {
    document.getElementById('logoText').classList.add('hidden');
    const logoImg = document.getElementById('logoImg');
    logoImg.src = data.logoUrl;
    logoImg.classList.remove('hidden');
  }

  if (data.founderName) document.getElementById('founderName').innerText = data.founderName;
  if (data.founderRole) document.getElementById('founderRole').innerText = data.founderRole;
  if (data.founderImg) document.getElementById('founderImg').src = data.founderImg;
  if (data.paypalImg) {
    document.getElementById('paypalDisplayImg').src = data.paypalImg;
    document.getElementById('paypalModalImg').src = data.paypalImg;
  }

  // Three Images
  if (data.threeImgs) {
    const sec = document.getElementById('threeImagesSection');
    sec.classList.remove('hidden');
    [1, 2, 3].forEach(i => {
      if (data.threeImgs[`img${i}`]) {
        document.getElementById(`cardImg${i}`).classList.remove('hidden');
        document.getElementById(`displayImg${i}`).src = data.threeImgs[`img${i}`];
      }
      if (data.threeImgs[`name${i}`]) {
        const nameDiv = document.getElementById(`displayName${i}`);
        nameDiv.innerText = data.threeImgs[`name${i}`];
        nameDiv.classList.remove('hidden');
      }
    });
  }
});

// 3. Teachers Real-Time Listener
onSnapshot(collection(db, "teachers"), (snapshot) => {
  const grid = document.getElementById('teachers-grid');
  const tbody = document.getElementById('adminTeachersTable');
  if (grid) grid.innerHTML = '';
  if (tbody) tbody.innerHTML = '';

  let idx = 1;
  snapshot.forEach(docSnap => {
    const t = docSnap.data();
    const id = docSnap.id;

    if (grid) {
      grid.innerHTML += `
        <div class="bg-sand p-6 rounded-3xl border border-gold/30 text-center space-y-4 card-hover">
          <div class="w-24 h-24 rounded-full mx-auto overflow-hidden border-2 border-gold shadow">
            <img src="${t.imageUrl || 'https://via.placeholder.com/150'}" class="w-full h-full object-cover">
          </div>
          <div>
            <h4 class="font-extrabold text-base text-primary">${t.name || ''}</h4>
            <p class="text-xs text-gold-dark font-semibold">${t.role || ''}</p>
          </div>
        </div>
      `;
    }

    if (tbody) {
      tbody.innerHTML += `
        <tr class="border-b">
          <td class="p-2.5 text-center">${idx++}</td>
          <td class="p-2.5">${t.name || ''}</td>
          <td class="p-2.5 font-mono">${t.userAuth || ''}</td>
          <td class="p-2.5">${t.active !== false ? 'مفعل' : 'معطل'}</td>
          <td class="p-2.5 text-center">
            <button data-id="${id}" class="btn-delete-teacher bg-red-500 text-white px-2.5 py-1 rounded text-xs">حذف</button>
          </td>
        </tr>
      `;
    }
  });

  document.querySelectorAll('.btn-delete-teacher').forEach(btn => {
    btn.onclick = async (e) => {
      const id = e.target.getAttribute('data-id');
      await deleteDoc(doc(db, "teachers", id));
    };
  });
});

// ================= BIND EVENT HANDLERS ================= //
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btnToggleSidebar')?.addEventListener('click', toggleSidebarNav);
  document.getElementById('btnCloseSidebar')?.addEventListener('click', toggleSidebarNav);
  document.getElementById('logoClickArea')?.addEventListener('click', openAdminModal);
  document.getElementById('btnCopyIban')?.addEventListener('click', (e) => copyText('JO12UBSI6800000680156843120501', e.currentTarget));
  document.getElementById('btnCopyCliqEtihad')?.addEventListener('click', (e) => copyText('ELAFJO1', e.currentTarget));
  document.getElementById('btnCopyCliqZain')?.addEventListener('click', (e) => copyText('0787407301', e.currentTarget));
  document.getElementById('btnCopyExternalName')?.addEventListener('click', (e) => copyText('ALI OSAMA ALI WAHDAN', e.currentTarget));
  document.getElementById('btnOpenPaypalModal')?.addEventListener('click', openPaypalModal);
  document.getElementById('paypalDisplayImg')?.addEventListener('click', openPaypalModal);
  document.getElementById('btnClosePaypalModal')?.addEventListener('click', closePaypalModal);
  document.getElementById('btnClosePortalModal')?.addEventListener('click', closePortalModal);
  document.getElementById('btnCloseAdminModalLogin')?.addEventListener('click', closeAdminModal);
  document.getElementById('btnCloseAdminModalContent')?.addEventListener('click', closeAdminModal);
  
  document.getElementById('btnOpenAdminPanel')?.addEventListener('click', () => { toggleSidebarNav(); openAdminModal(); });
  document.getElementById('btnShowAllTestimonials')?.addEventListener('click', () => { showAllReviewsFlag = true; renderTestimonials(); });

  // Tab Listeners
  document.getElementById('tabRequestsBtn')?.addEventListener('click', () => switchAdminTab('requests'));
  document.getElementById('tabTeacherBtn')?.addEventListener('click', () => switchAdminTab('teacher'));
  document.getElementById('tabThreeImgsBtn')?.addEventListener('click', () => switchAdminTab('threeImgs'));
  document.getElementById('tabPaypalBtn')?.addEventListener('click', () => switchAdminTab('paypal'));
  document.getElementById('tabLogoBtn')?.addEventListener('click', () => switchAdminTab('logo'));
  document.getElementById('tabFounderBtn')?.addEventListener('click', () => switchAdminTab('founder'));
  document.getElementById('tabVidBtn')?.addEventListener('click', () => switchAdminTab('vid'));
  document.getElementById('tabImgBtn')?.addEventListener('click', () => switchAdminTab('img'));
  document.getElementById('tabPassBtn')?.addEventListener('click', () => switchAdminTab('pass'));

  // Admin Login
  document.getElementById('btnVerifyPassword')?.addEventListener('click', () => {
    const pass = document.getElementById('adminPassword').value;
    if (pass === 'admin123' || pass === '123456') {
      document.getElementById('adminLoginView').classList.add('hidden');
      document.getElementById('adminContentView').classList.remove('hidden');
    } else {
      document.getElementById('passwordError').classList.remove('hidden');
    }
  });

  // Public Add Review Form
  document.getElementById('publicReviewForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const author = document.getElementById('publicReviewAuthor').value;
    const rating = document.getElementById('publicReviewRating').value;
    const text = document.getElementById('publicReviewText').value;

    await addDoc(collection(db, "reviews"), { author, rating: Number(rating), text, createdAt: Date.now() });
    e.target.reset();
    alert('تم إضافة رأيك بنجاح!');
  });

  // Save Youtube / Video Form
  document.getElementById('videoFormElem')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const youtubeUrl = document.getElementById('youtubeUrlInput').value;
    const videoFile = document.getElementById('videoFileInput').files[0];
    const videoUrlDirect = document.getElementById('videoUrlInput').value;

    let finalVideoUrl = videoUrlDirect;
    if (videoFile) {
      finalVideoUrl = await uploadFile(videoFile, 'videos');
    }

    const payload = {};
    if (youtubeUrl) payload.youtubeUrl = youtubeUrl;
    if (finalVideoUrl) payload.videoUrl = finalVideoUrl;

    await setDoc(doc(db, "settings", "general"), payload, { merge: true });
    alert('تم تحديث الفيديو بنجاح!');
  });

  // Save Three Images Form
  document.getElementById('threeImagesFormElem')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const threeImgsData = {};

    for (let i = 1; i <= 3; i++) {
      const name = document.getElementById(`threeImgName${i}`).value;
      const file = document.getElementById(`threeImgFile${i}`).files[0];
      const url = document.getElementById(`threeImgUrl${i}`).value;

      let imgUrl = url;
      if (file) {
        imgUrl = await uploadFile(file, 'hafiz');
      }

      threeImgsData[`name${i}`] = name;
      threeImgsData[`img${i}`] = imgUrl;
    }

    await setDoc(doc(db, "settings", "general"), { threeImgs: threeImgsData }, { merge: true });
    alert('تم حفظ بيانات الحافظين بنجاح!');
  });

  // Save Logo Form
  document.getElementById('logoFormElem')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const file = document.getElementById('logoFileInput').files[0];
    let logoUrl = document.getElementById('logoUrlInput').value;

    if (file) {
      logoUrl = await uploadFile(file, 'logo');
    }

    if (logoUrl) {
      await setDoc(doc(db, "settings", "general"), { logoUrl }, { merge: true });
      alert('تم تحديث الشعار بنجاح!');
    }
  });

  // Save Founder Form
  document.getElementById('founderFormElem')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('founderNameInput').value;
    const role = document.getElementById('founderRoleInput').value;
    const file = document.getElementById('founderFileInput').files[0];
    let imgUrl = document.getElementById('founderUrlInput').value;

    if (file) {
      imgUrl = await uploadFile(file, 'founder');
    }

    const payload = {};
    if (name) payload.founderName = name;
    if (role) payload.founderRole = role;
    if (imgUrl) payload.founderImg = imgUrl;

    await setDoc(doc(db, "settings", "general"), payload, { merge: true });
    alert('تم تحديث بيانات المؤسس بنجاح!');
  });

  // Save Paypal Form
  document.getElementById('paypalForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const file = document.getElementById('paypalFileInput').files[0];
    let paypalImg = document.getElementById('paypalUrlInput').value;

    if (file) {
      paypalImg = await uploadFile(file, 'paypal');
    }

    if (paypalImg) {
      await setDoc(doc(db, "settings", "general"), { paypalImg }, { merge: true });
      alert('تم تحديث صورة بايبال بنجاح!');
    }
  });

  // Add Teacher Form
  document.getElementById('teacherForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('teacherNameInput').value;
    const role = document.getElementById('teacherRoleInput').value;
    const userAuth = document.getElementById('teacherUserAuthInput').value;
    const passAuth = document.getElementById('teacherPassAuthInput').value;
    const file = document.getElementById('teacherFileInput').files[0];
    let imageUrl = document.getElementById('teacherUrlInput').value;

    if (file) {
      imageUrl = await uploadFile(file, 'teachers');
    }

    await addDoc(collection(db, "teachers"), {
      name, role, userAuth, passAuth, imageUrl, active: true, createdAt: Date.now()
    });
    e.target.reset();
    alert('تم إضافة المعلم بنجاح!');
  });

  // Change Admin Password Form
  document.getElementById('changePassForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newPass = document.getElementById('newAdminPass').value;
    const confirmPass = document.getElementById('confirmAdminPass').value;

    if (newPass !== confirmPass) {
      alert('كلمات السر غير متطابقة!');
      return;
    }

    if (auth.currentUser) {
      try {
        await updatePassword(auth.currentUser, newPass);
        alert('تم تحديث كلمة السر بنجاح عبر Firebase Auth');
      } catch (err) {
        alert('حدث خطأ أثناء التحديث: ' + err.message);
      }
    } else {
      await setDoc(doc(db, "settings", "auth"), { adminPassword: newPass }, { merge: true });
      alert('تم تحديث كلمة السر بنجاح في قاعدة البيانات!');
    }
    e.target.reset();
  });
});
