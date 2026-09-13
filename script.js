import { db, storage } from "./firebase.js";
import { collection, addDoc, onSnapshot, query, orderBy, doc, setDoc, updateDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const studentsRef = collection(db, "students");
const teachersRef = collection(db, "teachers");
const reviewsRef = collection(db, "reviews");
const settingsRef = collection(db, "settings");
const SECRET_PIN = "Elaf0123";

let studentsDB = [], teachersDB = [], reviewsDB = [], threeImgsDB = {};
let loggedInTeacher = null, loggedInStudent = null, isAdminLoggedIn = false;

onSnapshot(query(studentsRef, orderBy("createdAt", "desc")), (snap) => { studentsDB = snap.docs.map(d => ({id: d.id,...d.data()})); syncUI(); });
onSnapshot(query(teachersRef, orderBy("createdAt", "asc")), (snap) => { teachersDB = snap.docs.map(d => ({id: d.id,...d.data()})); syncUI(); });
onSnapshot(query(reviewsRef, orderBy("createdAt", "desc")), (snap) => { reviewsDB = snap.docs.map(d => ({id: d.id,...d.data()})); renderTestimonials(); });
onSnapshot(doc(db, "settings", "threeImages"), (snap) => { if(snap.exists()) {threeImgsDB = snap.data(); renderThreeImages();} });
onSnapshot(doc(db, "settings", "logo"), (snap) => { if(snap.exists()) loadSavedLogo(snap.data().url); });
onSnapshot(doc(db, "settings", "founder"), (snap) => { if(snap.exists()) loadSavedFounder(snap.data()); });
onSnapshot(doc(db, "settings", "video"), (snap) => { if(snap.exists()) loadSavedVideo(snap.data().url); });
onSnapshot(doc(db, "settings", "paypal"), (snap) => { if(snap.exists()) loadSavedPaypal(snap.data().url); });

async function uploadFile(file, path){ const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`); const res = await uploadBytes(storageRef, file); return await getDownloadURL(res.ref); }
function syncUI(){ updatePendingBadges(); refreshTeachersMainGrid(); renderAdminUnassigned(); renderAdminTeachers(); if (loggedInTeacher) renderTeacherDashboard(); if (loggedInStudent) renderStudentDashboard(); }
window.copyText = (text, btn)=>{ navigator.clipboard.writeText(text); const original = btn.innerHTML; btn.innerHTML = '<i class="fas fa-check"></i> تم النسخ'; setTimeout(()=>{btn.innerHTML = original}, 1500); }

window.handleStudentSelfRegister = async function(e){
  e.preventDefault();
  const track = document.getElementById('regStudentTrack').value;
  let sessions = 8; if(track.includes('12')) sessions=12; if(track.includes('16')) sessions=16;
  await addDoc(studentsRef, { name: document.getElementById('regStudentName').value.trim(), phone: document.getElementById('regStudentPhone').value.trim(), pass: document.getElementById('regStudentPass').value.trim(), track, status: 'pending', paymentStatus: 'غير مدفوع', paymentsCount: 0, totalSessions: sessions, notes: '', progress: '', sessionTime: '', sessionHistory: '', assignedTeacherId: '', createdAt: serverTimestamp() });
  alert('تم إرسال طلبك بنجاح!'); e.target.reset();
}
window.approveStudentRequest = async function(id){ await updateDoc(doc(db, "students", id), { status: 'approved' }); }
window.rejectStudentRequest = async function(id){ if (confirm('تأكيد الحذف؟')) await deleteDoc(doc(db, "students", id)); }
window.deleteStudent = async function(id){ if (confirm('تأكيد الحذف؟')) await deleteDoc(doc(db, "students", id)); }
window.assignStudentToTeacher = async function(studentId, teacherId){ await updateDoc(doc(db, "students", studentId), { assignedTeacherId: teacherId }); }
window.updateStudentPaymentStatus = async function(studentId, status){ await updateDoc(doc(db, "students", studentId), { paymentStatus: status }); }
window.updateStudentPaymentsCount = async function(studentId, count){ await updateDoc(doc(db, "students", studentId), { paymentsCount: parseInt(count) || 0 }); }
window.saveTeacherStudentData = async function(studentId){
  await updateDoc(doc(db, "students", studentId), { notes: document.getElementById(`note-${studentId}`).value, progress: document.getElementById(`prog-${studentId}`).value, sessionTime: document.getElementById(`time-${studentId}`).value, sessionHistory: document.getElementById(`hist-${studentId}`).value, });
  alert('تم الحفظ بنجاح');
}
window.handleAddTeacher = async function(e){
  e.preventDefault();
  const file = document.getElementById('teacherFileInput').files[0]; const url = document.getElementById('teacherUrlInput').value;
  let img = url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400'; if(file) img = await uploadFile(file, 'teachers');
  await addDoc(teachersRef, { name: document.getElementById('teacherNameInput').value, role: document.getElementById('teacherRoleInput').value, userAuth: document.getElementById('teacherUserAuthInput').value, passAuth: document.getElementById('teacherPassAuthInput').value, img, isBlocked: false, createdAt: serverTimestamp() });
  alert('تمت إضافة المعلم'); e.target.reset();
}
window.toggleBlockTeacher = async function(id){ const t = teachersDB.find(x=>x.id==id); await updateDoc(doc(db, "teachers", id), { isBlocked:!t.isBlocked }); }
window.deleteTeacher = async function(id){ if (confirm('تأكيد الحذف؟')) { await deleteDoc(doc(db, "teachers", id)); studentsDB.filter(s => s.assignedTeacherId == id).forEach(s => updateDoc(doc(db, "students", s.id), {assignedTeacherId: ''})); } }
window.handlePublicAddReview = async function(e){ e.preventDefault(); await addDoc(reviewsRef, { author: document.getElementById('publicReviewAuthor').value, text: document.getElementById('publicReviewText').value, rating: parseInt(document.getElementById('publicReviewRating').value), createdAt: serverTimestamp() }); alert('تم نشر رأيك بنجاح'); e.target.reset(); }
window.handleUpdateLogo = async function(e){ e.preventDefault(); const file = document.getElementById('logoFileInput').files[0]; const url = document.getElementById('logoUrlInput').value; let src = url; if(file) src = await uploadFile(file, 'logo'); await setDoc(doc(db, "settings", "logo"), {url: src}); alert('تم حفظ اللوجو'); }
window.handleUpdateFounder = async function(e){ e.preventDefault(); const file = document.getElementById('founderFileInput').files[0]; const url = document.getElementById('founderUrlInput').value; let img = url || document.getElementById('founderImg').src; if(file) img = await uploadFile(file, 'founder'); await setDoc(doc(db, "settings", "founder"), {name: document.getElementById('founderNameInput').value, role: document.getElementById('founderRoleInput').value, img}); alert('تم حفظ بيانات المؤس'); }
window.handleChangeVideo = async function(e){ e.preventDefault(); const file = document.getElementById('videoFileInput').files[0]; const url = document.getElementById('videoUrlInput').value; let src = url; if(file) src = await uploadFile(file, 'video'); await setDoc(doc(db, "settings", "video"), {url: src}); alert('تم حفظ الفيديو'); }
window.handleUpdatePaypal = async function(e){ e.preventDefault(); const file = document.getElementById('paypalFileInput').files[0]; const url = document.getElementById('paypalUrlInput').value; let src = url; if(file) src = await uploadFile(file, 'paypal'); await setDoc(doc(db, "settings", "paypal"), {url: src}); alert('تم حفظ صورة بايبال'); }
window.handleSaveThreeImages = async function(e){ e.preventDefault(); const f1 = document.getElementById('threeImgFile1').files[0]; const u1 = document.getElementById('threeImgUrl1').value; const f2 = document.getElementById('threeImgFile2').files[0]; const u2 = document.getElementById('threeImgUrl2').value; const f3 = document.getElementById('threeImgFile3').files[0]; const u3 = document.getElementById('threeImgUrl3').value; const img1 = f1? await uploadFile(f1, 'three') : u1 || threeImgsDB.img1; const img2 = f2? await uploadFile(f2, 'three') : u2 || threeImgsDB.img2; const img3 = f3? await uploadFile(f3, 'three') : u3 || threeImgsDB.img3; await setDoc(doc(db, "settings", "threeImages"), {name1: document.getElementById('threeImgName1').value, img1, name2: document.getElementById('threeImgName2').value, img2, name3: document.getElementById('threeImgName3').value, img3}); alert('تم حفظ التتويج'); }

// الصق باقي دوال العرض من كودك القديم هون: toggleSidebarNav, openAdminModal, verifyPassword, switchAdminTab, renderAdminUnassigned, renderAdminTeachers, renderTestimonials, renderThreeImages, openPortalModal, handleLogin, etc
// دالة عرض بوابة الطالب
function renderStudentDashboard() {
  if (!loggedInStudent) return;
  
  document.getElementById('studentName').innerText = loggedInStudent.name;
  document.getElementById('studentPhone').innerText = loggedInStudent.phone;
  document.getElementById('studentTrack').innerText = loggedInStudent.track;
  document.getElementById('studentStatus').innerText = loggedInStudent.status === 'approved' ? 'مفعل' : 'قيد المراجعة';
  document.getElementById('studentSessions').innerText = loggedInStudent.totalSessions || 0;
  document.getElementById('studentPayment').innerText = loggedInStudent.paymentStatus || 'غير مدفوع';
}

// دالة عرض بوابة المعلم
function renderTeacherDashboard() {
  if (!loggedInTeacher) return;
  const tbody = document.getElementById('teacherStudentsTable');
  if (!tbody) return;
  tbody.innerHTML = '';
  const myStudents = studentsDB.filter(s => s.assignedTeacherId === loggedInTeacher.id);
  // ... باقي الكود تبعهاmyStudents.forEach((s, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="p-2 border">${index + 1}</td>
      <td class="p-2 border font-bold">${s.name}</td>
      <td class="p-2 border">${s.phone}</td>
      <td class="p-2 border text-center font-bold">${s.paymentsCount || 0}</td>
      <td class="p-2 border"><textarea id="note-${s.id}" rows="2" class="w-full border rounded-lg p-1 text-xs outline-none focus:border-gold resize-none bg-white">${s.notes || ''}</textarea></td>
      <td class="p-2 border"><textarea id="prog-${s.id}" rows="2" class="w-full border rounded-lg p-1 text-xs outline-none focus:border-gold resize-none bg-white" placeholder="20 درس من 32">${s.progress || ''}</textarea></td>
      <td class="p-2 border"><input type="text" id="time-${s.id}" value="${s.sessionTime || ''}" placeholder="الأحد 4:00 مساء" class="w-full border rounded-lg p-1 text-xs outline-none focus:border-gold bg-white"></td>
      <td class="p-2 border"><input type="text" id="hist-${s.id}" value="${s.sessionHistory || ''}" placeholder="1: 01/09 ..." class="w-full border rounded-lg p-1 text-xs outline-none focus:border-gold bg-white"></td>
      <td class="p-2 border text-center"><button onclick="saveTeacherStudentData('${s.id}')" class="bg-gold hover:bg-gold-dark text-primary font-black px-3 py-1.5 rounded-lg text-xs transition"><i class="fas fa-save"></i> حفظ التحديث</button></td>
    `;
    tbody.appendChild(tr);
  });
});
}

// دالة حفظ بيانات المعلم للطالب
function saveTeacherStudentData(studentId) {
  // ... اconst student = studentsDB.find(s => s.id === studentId);
  if (student) {
    student.notes = document.getElementById(`note-${studentId}`).value;
    student.progress = document.getElementById(`prog-${studentId}`).value;
    student.sessionTime = document.getElementById(`time-${studentId}`).value;
    student.sessionHistory = document.getElementById(`hist-${studentId}`).value;
    
    localStorage.setItem('elaf_students_db', JSON.stringify(studentsDB));
    notifyDataChanged();
    alert(`تم حفظ وتحديث بيانات الطالب ${student.name} بنجاح! وسيظهر فوراً في شاشته الخاصة`);
  }
}لكود تبعها
}
