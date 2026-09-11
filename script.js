import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, onSnapshot, doc, updateDoc, setDoc, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { app } from "./firebase_2.js";

const db = getFirestore(app);

let studentsDB = [];
let teachersDB = [];
let reviewsDB = [];
let activePortalRole = 'student';
let currentLoggedInUser = null;

document.addEventListener('DOMContentLoaded', () => {
  initLiveSync();
  setupReviewForm();
});

function initLiveSync() {
  // 1. مزامنة المعلمين والتأكد من عرضهم في الرئيسية
  onSnapshot(collection(db, "teachers"), (snapshot) => {
    teachersDB = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderMainTeachers();
  });

  // 2. مزامنة الطلاب
  onSnapshot(collection(db, "students"), (snapshot) => {
    studentsDB = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    if (currentLoggedInUser) {
      if (activePortalRole === 'teacher') renderTeacherPortal();
      if (activePortalRole === 'student') renderStudentPortal();
    }
  });

  // 3. مزامنة الآراء (بما فيها آراء الصور المضافة من الادمن)
  onSnapshot(collection(db, "reviews"), (snapshot) => {
    reviewsDB = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    reviewsDB.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    renderMainReviews();
  });

  // 4. مزامنة منصة تتويج الحافظين (three_images)
  onSnapshot(doc(db, "settings", "three_images"), (docSnap) => {
    const sec = document.getElementById('threeImagesSection');
    if (docSnap.exists()) {
      const data = docSnap.data();
      let hasAny = false;

      for (let i = 1; i <= 3; i++) {
        const card = document.getElementById(`cardImg${i}`);
        const imgEl = document.getElementById(`displayImg${i}`);
        const nameEl = document.getElementById(`displayName${i}`);

        if (card && imgEl && nameEl) {
          if (data[`img${i}`] || data[`name${i}`]) {
            hasAny = true;
            card.classList.remove('hidden');
            if (data[`img${i}`]) imgEl.src = data[`img${i}`];
            if (data[`name${i}`]) {
              nameEl.innerText = data[`name${i}`];
              nameEl.classList.remove('hidden');
            } else {
              nameEl.classList.add('hidden');
            }
          } else {
            card.classList.add('hidden');
          }
        }
      }

      if (hasAny && sec) sec.classList.remove('hidden');
      else if (sec) sec.classList.add('hidden');
    } else if (sec) {
      sec.classList.add('hidden');
    }
  });

  // 5. مزامنة الإعدادات العامة (اللوجو، المؤسس، الفيديو)
  onSnapshot(doc(db, "settings", "general"), (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();

      // تحديث اللوجو في الهيدر والفوتر
      if (data.logo) {
        ['logo', 'footerLogo'].forEach(prefix => {
          const imgEl = document.getElementById(`${prefix}Img`);
          const textEl = document.getElementById(`${prefix}Text`);
          if (imgEl && textEl) {
            imgEl.src = data.logo;
            imgEl.classList.remove('hidden');
            textEl.classList.add('hidden');
          }
        });
      }

      // تحديث بيانات المؤسس
      if (data.founderName && document.getElementById('founderName')) document.getElementById('founderName').innerText = data.founderName;
      if (data.founderRole && document.getElementById('founderRole')) document.getElementById('founderRole').innerText = data.founderRole;
      if (data.founderImg && document.getElementById('founderImg')) document.getElementById('founderImg').src = data.founderImg;

      // تحديث الفيديو
      if (data.video && document.getElementById('mainVideoPlayer')) {
        const videoPlayer = document.getElementById('mainVideoPlayer');
        videoPlayer.src = data.video;
      }
    }
  });
}

function renderMainTeachers() {
  const container = document.getElementById('teachers-grid');
  if (!container) return;

  container.innerHTML = '';
  const activeTeachers = teachersDB.filter(t => !t.isBlocked);

  if (activeTeachers.length === 0) {
    container.innerHTML = `<div class="col-span-full text-center text-gray-500 py-6">جاري تحميل الكادر التعليمي...</div>`;
    return;
  }

  activeTeachers.forEach(t => {
    const card = document.createElement('div');
    card.className = "bg-sand rounded-3xl border border-gold/30 p-6 text-center card-hover flex flex-col items-center justify-between";
    card.innerHTML = `
      <div>
        <div class="w-24 h-24 rounded-full border-2 border-gold p-1 mx-auto mb-4 overflow-hidden bg-white shadow-md">
          <img src="${t.img || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400'}" class="w-full h-full object-cover rounded-full" alt="${t.name}">
        </div>
        <h4 class="font-extrabold text-lg text-primary decorated-title">${t.name}</h4>
        <p class="text-xs text-gold-dark font-bold mt-1">${t.role}</p>
      </div>
      <a href="https://wa.me/962780285762" target="_blank" class="mt-6 w-full bg-primary hover:bg-primary-light text-white font-bold py-2.5 rounded-xl text-xs transition">احجز حصتك الآن</a>
    `;
    container.appendChild(card);
  });
}

function renderMainReviews() {
  const container = document.getElementById('reviews-container');
  if (!container) return;

  container.innerHTML = '';

  if (reviewsDB.length === 0) {
    container.innerHTML = `<div class="col-span-full text-center text-gray-500 py-6">لا توجد آراء حالياً. كُن أول من يضيف رأيه!</div>`;
    return;
  }

  reviewsDB.forEach(r => {
    const card = document.createElement('div');
    card.className = "bg-white p-6 rounded-3xl border border-gold/30 shadow-sm flex flex-col justify-between card-hover";

    if (r.isImageReview) {
      // عرض رأي الصورة المرفوع من الادمن
      card.innerHTML = `
        <div class="space-y-3">
          <div class="flex items-center justify-between border-b pb-2">
            <h4 class="font-bold text-sm text-primary flex items-center gap-2"><i class="fas fa-image text-gold"></i> ${r.author || 'رأي صورة'}</h4>
            <span class="text-[10px] text-gray-400">${r.date || ''}</span>
          </div>
          <div class="rounded-2xl overflow-hidden border border-gold/30 shadow-inner">
            <img src="${r.imgUrl}" class="w-full h-auto object-cover max-h-96" alt="${r.author}">
          </div>
        </div>
      `;
    } else {
      // عرض رأي نصي من التقييمات
      const stars = '⭐'.repeat(r.rating || 5);
      card.innerHTML = `
        <div>
          <div class="flex justify-between items-center mb-3">
            <h4 class="font-bold text-sm text-primary">${r.name}</h4>
            <span class="text-xs text-amber-500">${stars}</span>
          </div>
          <p class="text-xs text-gray-600 leading-relaxed font-medium">"${r.text}"</p>
        </div>
        <div class="mt-4 pt-3 border-t border-gray-100 text-[10px] text-gray-400 flex justify-between items-center">
          <span>طالب / ولي أمر</span>
          <span>${r.date || ''}</span>
        </div>
      `;
    }
    container.appendChild(card);
  });
}

function setupReviewForm() {
  const form = document.getElementById('review-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('.btn-submit');
    btn.disabled = true;
    btn.innerText = "جاري النشر...";

    try {
      const name = document.getElementById('reviewer-name').value;
      const rating = Number(document.getElementById('reviewer-rating').value);
      const text = document.getElementById('reviewer-text').value;

      await addDoc(collection(db, "reviews"), {
        name,
        rating,
        text,
        date: new Date().toLocaleDateString('ar-EG'),
        isImageReview: false,
        createdAt: Date.now()
      });

      alert('شكراً لك! تم نشر رأيك بنجاح.');
      form.reset();
    } catch (err) {
      alert('حدث خطأ أثناء حفظ الرأي: ' + err.message);
    } finally {
      btn.disabled = false;
      btn.innerText = "نشر الرأي فوراً";
    }
  });
}

// دالة التسجيل الذاتي للطالب من الصفحة الرئيسية
window.handleStudentSelfRegister = async function(e) {
  e.preventDefault();
  const btn = document.getElementById('btnSelfReg');
  btn.disabled = true;
  btn.innerText = "جاري إرسال الطلب...";

  try {
    const name = document.getElementById('regStudentName').value;
    const phone = document.getElementById('regStudentPhone').value;
    const pass = document.getElementById('regStudentPass').value;
    const track = document.getElementById('regStudentTrack').value;

    await addDoc(collection(db, "students"), {
      name,
      phone,
      pass,
      track,
      status: 'pending',
      teacherId: '',
      paymentStatus: 'لم يدفع',
      paymentsCount: 0,
      notes: '',
      achievement: '',
      classTime: '',
      historyDates: '',
      createdAt: Date.now()
    });

    alert('تم إرسال طلب تسجيلك بنجاح إلى الإدارة! يرجى الانتظار حتى تتم الموافقة عليه وترحيلك لمعلمك.');
    e.target.reset();
  } catch (err) {
    alert('حدث خطأ أثناء التسجيل: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.innerText = "إرسال طلب التسجيل إلى الإدارة";
  }
};

// التعامل مع الدخول واللوحات (بوابة المعلم وبوابة الطالب)
window.openSystemPanel = function(role) {
  activePortalRole = role;
  document.getElementById('portalTitle').innerHTML = role === 'teacher' 
    ? `<i class="fas fa-chalkboard-teacher text-gold"></i> دخول بوابة المعلم` 
    : `<i class="fas fa-user-graduate text-gold"></i> دخول بوابة الطالب`;

  document.getElementById('portalLoginSection').classList.remove('hidden');
  document.getElementById('teacherDashboard').classList.add('hidden');
  document.getElementById('studentDashboard').classList.add('hidden');
  document.getElementById('portalModal').classList.remove('hidden');
  
  if (typeof window.toggleSidebarNav === 'function') {
    window.toggleSidebarNav();
  }
};

window.closePortalModal = function() {
  document.getElementById('portalModal').classList.add('hidden');
};

window.handleLogin = function() {
  const userInput = document.getElementById('portalUserAuth').value.trim();
  const passInput = document.getElementById('portalPassAuth').value.trim();

  if (activePortalRole === 'teacher') {
    const foundTech = teachersDB.find(t => t.userAuth === userInput && t.passAuth === passInput);
    if (foundTech) {
      if (foundTech.isBlocked) {
        alert('هذا الحساب محظور حالياً من قِبل الإدارة.');
        return;
      }
      currentLoggedInUser = foundTech;
      document.getElementById('portalLoginSection').classList.add('hidden');
      document.getElementById('teacherDashboard').classList.remove('hidden');
      renderTeacherPortal();
    } else {
      alert('اسم المستخدم أو كلمة المرور غير صحيحة للمعلم!');
    }
  } else {
    const foundStd = studentsDB.find(s => (s.phone === userInput || s.name === userInput) && s.pass === passInput);
    if (foundStd) {
      if (foundStd.status !== 'approved') {
        alert('حسابك قيد المراجعة والانتظار من الإدارة!');
        return;
      }
      currentLoggedInUser = foundStd;
      document.getElementById('portalLoginSection').classList.add('hidden');
      document.getElementById('studentDashboard').classList.remove('hidden');
      renderStudentPortal();
    } else {
      alert('رقم الهاتف أو كلمة المرور غير صحيحة للطالب!');
    }
  }
};

function renderTeacherPortal() {
  const tbody = document.getElementById('teacherStudentsTable');
  if (!tbody || !currentLoggedInUser) return;

  tbody.innerHTML = '';
  const myStudents = studentsDB.filter(s => s.teacherId === currentLoggedInUser.id && s.status === 'approved');

  if (myStudents.length === 0) {
    tbody.innerHTML = `<tr><td colspan="11" class="text-center p-4 text-gray-500">لا يوجد طلاب موكلون إليك حالياً.</td></tr>`;
    return;
  }

  myStudents.forEach((std, idx) => {
    const tr = document.createElement('tr');
    tr.className = idx % 2 === 0 ? "bg-white" : "bg-sand/40";
    tr.innerHTML = `
      <td class="p-2 border text-center font-bold">${idx + 1}</td>
      <td class="p-2 border font-bold text-primary">${std.name}<br><span class="text-[10px] text-gray-500 font-mono">${std.phone}</span></td>
      <td class="p-2 border text-[11px]">${std.track || '-'}</td>
      <td class="p-2 border text-center font-bold text-gold-dark">8-12</td>
      <td class="p-2 border text-center font-bold ${std.paymentStatus === 'تم الدفع' ? 'text-green-600' : 'text-red-500'}">${std.paymentStatus || 'لم يدفع'}</td>
      <td class="p-2 border text-center font-bold">${std.paymentsCount || 0}</td>
      <td class="p-2 border"><input type="text" id="tNotes_${std.id}" value="${std.notes || ''}" class="w-full border rounded p-1 text-[11px]"></td>
      <td class="p-2 border"><input type="text" id="tAchieve_${std.id}" value="${std.achievement || ''}" class="w-full border rounded p-1 text-[11px]"></td>
      <td class="p-2 border"><input type="text" id="tTime_${std.id}" value="${std.classTime || ''}" class="w-full border rounded p-1 text-[11px]"></td>
      <td class="p-2 border"><input type="text" id="tHistory_${std.id}" value="${std.historyDates || ''}" class="w-full border rounded p-1 text-[11px]" placeholder="مثال: 10/5, 12/5"></td>
      <td class="p-2 border text-center">
        <button onclick="saveTeacherStudentData('${std.id}')" class="bg-gold hover:bg-gold-dark text-primary font-black px-2.5 py-1 rounded text-[10px] shadow-sm">حفظ</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

window.saveTeacherStudentData = async function(id) {
  const notes = document.getElementById(`tNotes_${id}`).value;
  const achievement = document.getElementById(`tAchieve_${id}`).value;
  const classTime = document.getElementById(`tTime_${id}`).value;
  const historyDates = document.getElementById(`tHistory_${id}`).value;

  await updateDoc(doc(db, "students", id), {
    notes, achievement, classTime, historyDates
  });
  alert('تم حفظ بيانات الطالب بنجاح في السيرفر!');
};

function renderStudentPortal() {
  const card = document.getElementById('studentDetailsCard');
  const welcome = document.getElementById('studentWelcome');
  if (!card || !currentLoggedInUser) return;

  const teacher = teachersDB.find(t => t.id === currentLoggedInUser.teacherId);

  welcome.innerText = `أهلاً بك يا طالبنا العزيز: ${currentLoggedInUser.name}`;
  card.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="bg-white p-4 rounded-xl border space-y-2">
        <p class="font-bold text-primary">المعلم الموكل إليك: <span class="text-gold-dark">${teacher ? teacher.name : 'لم يحدد بعد'}</span></p>
        <p><strong>المسار الحالي:</strong> ${currentLoggedInUser.track || '-'}</p>
        <p><strong>حالة الدفع:</strong> <span class="font-bold ${currentLoggedInUser.paymentStatus === 'تم الدفع' ? 'text-green-600' : 'text-red-500'}">${currentLoggedInUser.paymentStatus || 'لم يدفع'}</span></p>
        <p><strong>عدد الدفعات:</strong> ${currentLoggedInUser.paymentsCount || 0}</p>
      </div>
      <div class="bg-white p-4 rounded-xl border space-y-2">
        <p><strong>موعد الحصة:</strong> ${currentLoggedInUser.classTime || 'لم يحدد'}</p>
        <p><strong>إنجازك بالحصة:</strong> ${currentLoggedInUser.achievement || 'لا يوجد تسجيل حتى الآن'}</p>
        <p><strong>ملاحظات المعلم:</strong> ${currentLoggedInUser.notes || 'لا يوجد'}</p>
        <p><strong>سجل الحصص المعطاة:</strong> ${currentLoggedInUser.historyDates || 'لا يوجد'}</p>
      </div>
    </div>
  `;
}
