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

// استماع للداتا
onSnapshot(query(studentsRef, orderBy("createdAt", "desc")), (snap) => { studentsDB = snap.docs.map(d => ({id: d.id,...d.data()})); syncUI(); }, (err) => console.error("Students Listener Error:", err));
onSnapshot(query(teachersRef, orderBy("createdAt", "asc")), (snap) => { teachersDB = snap.docs.map(d => ({id: d.id,...d.data()})); syncUI(); }, (err) => console.error("Teachers Listener Error:", err));
onSnapshot(query(reviewsRef, orderBy("createdAt", "desc")), (snap) => { reviewsDB = snap.docs.map(d => ({id: d.id,...d.data()})); if(typeof window.renderTestimonials === 'function') window.renderTestimonials(); }, (err) => console.error("Reviews Listener Error:", err));
onSnapshot(doc(db, "settings", "threeImages"), (snap) => { if(snap.exists()) {threeImgsDB = snap.data(); if(typeof window.renderThreeImages === 'function') window.renderThreeImages();} });
onSnapshot(doc(db, "settings", "logo"), (snap) => { if(snap.exists() && typeof window.loadSavedLogo === 'function') window.loadSavedLogo(snap.data().url); });
onSnapshot(doc(db, "settings", "founder"), (snap) => { if(snap.exists() && typeof window.loadSavedFounder === 'function') window.loadSavedFounder(snap.data()); });
onSnapshot(doc(db, "settings", "video"), (snap) => { if(snap.exists() && typeof window.loadSavedVideo === 'function') window.loadSavedVideo(snap.data().url); });
onSnapshot(doc(db, "settings", "paypal"), (snap) => { if(snap.exists() && typeof window.loadSavedPaypal === 'function') window.loadSavedPaypal(snap.data().url); });

async function uploadFile(file, path){ 
  try {
    const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`); 
    const res = await uploadBytes(storageRef, file); 
    return await getDownloadURL(res.ref); 
  } catch (err) {
    console.error("Upload error:", err);
    throw err;
  }
}

function syncUI(){ 
  if(typeof window.updatePendingBadges === 'function') window.updatePendingBadges(); 
  if(typeof window.refreshTeachersMainGrid === 'function') window.refreshTeachersMainGrid(); 
  if(typeof window.renderAdminUnassigned === 'function') window.renderAdminUnassigned(); 
  if(typeof window.renderAdminTeachers === 'function') window.renderAdminTeachers(); 
  if (loggedInTeacher) renderTeacherDashboard(); 
  if (loggedInStudent) renderStudentDashboard(); 
}

window.copyText = (text, btn)=>{ navigator.clipboard.writeText(text); const original = btn.innerHTML; btn.innerHTML = '<i class="fas fa-check"></i> تم النسخ'; setTimeout(()=>{btn.innerHTML = original}, 1500); }

// ===== دوال الطلاب والمعلمين =====
window.handleStudentSelfRegister = async function(e){
  e.preventDefault();
  try {
    const track = document.getElementById('regStudentTrack').value;
    let sessions = 8; if(track.includes('12')) sessions=12; if(track.includes('16')) sessions=16;
    await addDoc(studentsRef, { name: document.getElementById('regStudentName').value.trim(), phone: document.getElementById('regStudentPhone').value.trim(), pass: document.getElementById('regStudentPass').value.trim(), track, status: 'pending', paymentStatus: 'غير مدفوع', paymentsCount: 0, totalSessions: sessions, notes: '', progress: '', sessionTime: '', sessionHistory: '', assignedTeacherId: '', createdAt: serverTimestamp() });
    alert('تم إرسال طلبك بنجاح!'); e.target.reset();
  } catch(err) { alert('حدث خطأ أثناء الإرسال: ' + err.message); }
}

window.approveStudentRequest = async function(id){ await updateDoc(doc(db, "students", id), { status: 'approved' }); }
window.rejectStudentRequest = async function(id){ if (confirm('تأكيد الحذف؟')) await deleteDoc(doc(db, "students", id)); }
window.deleteStudent = async function(id){ if (confirm('تأكيد الحذف؟')) await deleteDoc(doc(db, "students", id)); }
window.assignStudentToTeacher = async function(studentId, teacherId){ await updateDoc(doc(db, "students", studentId), { assignedTeacherId: teacherId }); }
window.updateStudentPaymentStatus = async function(studentId, status){ await updateDoc(doc(db, "students", studentId), { paymentStatus: status }); }
window.updateStudentPaymentsCount = async function(studentId, count){ await updateDoc(doc(db, "students", studentId), { paymentsCount: parseInt(count) || 0 }); }

window.saveTeacherStudentData = async function(studentId){
  try {
    await updateDoc(doc(db, "students", studentId), { 
      notes: document.getElementById(`note-${studentId}`)?.value || '', 
      progress: document.getElementById(`prog-${studentId}`)?.value || '', 
      sessionTime: document.getElementById(`time-${studentId}`)?.value || '', 
      sessionHistory: document.getElementById(`hist-${studentId}`)?.value || '' 
    });
    alert('تم الحفظ بنجاح');
  } catch(err) { alert('خطأ أثناء الحفظ: ' + err.message); }
}

window.handleAddTeacher = async function(e){
  e.preventDefault();
  try {
    const fileInput = document.getElementById('teacherFileInput');
    const file = fileInput?.files ? fileInput.files[0] : null; 
    const url = document.getElementById('teacherUrlInput')?.value || '';
    let img = url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400'; 
    if(file) img = await uploadFile(file, 'teachers');
    await addDoc(teachersRef, { name: document.getElementById('teacherNameInput').value, role: document.getElementById('teacherRoleInput').value, userAuth: document.getElementById('teacherUserAuthInput').value, passAuth: document.getElementById('teacherPassAuthInput').value, img, isBlocked: false, createdAt: serverTimestamp() });
    alert('تمت إضافة المعلم'); e.target.reset();
  } catch(err) { alert('خطأ في إضافة المعلم: ' + err.message); }
}

window.toggleBlockTeacher = async function(id){ const t = teachersDB.find(x=>x.id==id); if(t) await updateDoc(doc(db, "teachers", id), { isBlocked:!t.isBlocked }); }
window.deleteTeacher = async function(id){ if (confirm('تأكيد الحذف؟')) { await deleteDoc(doc(db, "teachers", id)); studentsDB.filter(s => s.assignedTeacherId == id).forEach(s => updateDoc(doc(db, "students", s.id), {assignedTeacherId: ''})); } }

// ===== دوال الادمن والاعدادات =====
window.handlePublicAddReview = async function(e){ 
  e.preventDefault(); 
  try {
    await addDoc(reviewsRef, { author: document.getElementById('publicReviewAuthor').value, text: document.getElementById('publicReviewText').value, rating: parseInt(document.getElementById('publicReviewRating').value), createdAt: serverTimestamp() }); 
    alert('تم نشر رأيك بنجاح'); e.target.reset(); 
  } catch(err) { alert('خطأ بالنشر: ' + err.message); }
}

window.handleUpdateLogo = async function(e){ 
  e.preventDefault(); 
  try {
    const fileInput = document.getElementById('logoFileInput');
    const file = fileInput?.files ? fileInput.files[0] : null; 
    const url = document.getElementById('logoUrlInput')?.value || ''; 
    let src = url; 
    if(file) src = await uploadFile(file, 'logo'); 
    await setDoc(doc(db, "settings", "logo"), {url: src}); 
    alert('تم حفظ اللوجو'); 
  } catch(err) { alert('خطأ بالحفظ: ' + err.message); }
}

window.handleUpdateFounder = async function(e){ 
  e.preventDefault(); 
  try {
    const fileInput = document.getElementById('founderFileInput');
    const file = fileInput?.files ? fileInput.files[0] : null; 
    const url = document.getElementById('founderUrlInput')?.value || ''; 
    let img = url || document.getElementById('founderImg')?.src || ''; 
    if(file) img = await uploadFile(file, 'founder'); 
    await setDoc(doc(db, "settings", "founder"), {name: document.getElementById('founderNameInput').value, role: document.getElementById('founderRoleInput').value, img}); 
    alert('تم حفظ بيانات المؤسس'); 
  } catch(err) { alert('خطأ بالحفظ: ' + err.message); }
}

window.handleChangeVideo = async function(e){ 
  e.preventDefault(); 
  try {
    const fileInput = document.getElementById('videoFileInput');
    const file = fileInput?.files ? fileInput.files[0] : null; 
    const url = document.getElementById('videoUrlInput')?.value || ''; 
    let src = url; 
    if(file) src = await uploadFile(file, 'video'); 
    await setDoc(doc(db, "settings", "video"), {url: src}); 
    alert('تم حفظ الفيديو'); 
  } catch(err) { alert('خطأ بالحفظ: ' + err.message); }
}

window.handleUpdatePaypal = async function(e){ 
  e.preventDefault(); 
  try {
    const fileInput = document.getElementById('paypalFileInput');
    const file = fileInput?.files ? fileInput.files[0] : null; 
    const url = document.getElementById('paypalUrlInput')?.value || ''; 
    let src = url; 
    if(file) src = await uploadFile(file, 'paypal'); 
    await setDoc(doc(db, "settings", "paypal"), {url: src}); 
    alert('تم حفظ صورة بايبال'); 
  } catch(err) { alert('خطأ بالحفظ: ' + err.message); }
}

window.handleSaveThreeImages = async function(e){ 
  e.preventDefault(); 
  try {
    const f1 = document.getElementById('threeImgFile1')?.files[0]; const u1 = document.getElementById('threeImgUrl1')?.value || ''; 
    const f2 = document.getElementById('threeImgFile2')?.files[0]; const u2 = document.getElementById('threeImgUrl2')?.value || ''; 
    const f3 = document.getElementById('threeImgFile3')?.files[0]; const u3 = document.getElementById('threeImgUrl3')?.value || ''; 
    const img1 = f1? await uploadFile(f1, 'three') : u1 || threeImgsDB.img1 || ''; 
    const img2 = f2? await uploadFile(f2, 'three') : u2 || threeImgsDB.img2 || ''; 
    const img3 = f3? await uploadFile(f3, 'three') : u3 || threeImgsDB.img3 || ''; 
    await setDoc(doc(db, "settings", "threeImages"), {name1: document.getElementById('threeImgName1').value, img1, name2: document.getElementById('threeImgName2').value, img2, name3: document.getElementById('threeImgName3').value, img3}); 
    alert('تم حفظ التتويج'); 
  } catch(err) { alert('خطأ بالحفظ: ' + err.message); }
}

// ===== دوال العرض والتنقل =====
window.toggleSidebarNav = function() {
  document.getElementById('sidebarNav')?.classList.toggle('translate-x-full');
  document.getElementById('sidebarNavOverlay')?.classList.toggle('hidden');
}

window.loadSavedLogo = function(url) {
  if (url && document.getElementById('logoImg')) {
    document.getElementById('logoImg').src = url;
    document.getElementById('logoImg').classList.remove('hidden');
    document.getElementById('logoText')?.classList.add('hidden');
  }
}

function renderStudentDashboard() {
  if (!loggedInStudent) return;
  if(document.getElementById('studentName')) document.getElementById('studentName').innerText = loggedInStudent.name || '';
  if(document.getElementById('studentPhone')) document.getElementById('studentPhone').innerText = loggedInStudent.phone || '';
  if(document.getElementById('studentTrack')) document.getElementById('studentTrack').innerText = loggedInStudent.track || '';
  if(document.getElementById('studentStatus')) document.getElementById('studentStatus').innerText = loggedInStudent.status === 'approved' ? 'مفعل' : 'قيد المراجعة';
  if(document.getElementById('studentSessions')) document.getElementById('studentSessions').innerText = loggedInStudent.totalSessions || 0;
  if(document.getElementById('studentPayment')) document.getElementById('studentPayment').innerText = loggedInStudent.paymentStatus || 'غير مدفوع';
}

function renderTeacherDashboard() {
  if (!loggedInTeacher) return;
  const tbody = document.getElementById('teacherStudentsTable');
  if (!tbody) return;
  tbody.innerHTML = '';
  const myStudents = studentsDB.filter(s => s.assignedTeacherId === loggedInTeacher.id);
  myStudents.forEach((s, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="p-2 border">${index + 1}</td>
      <td class="p-2 border font-bold">${s.name || ''}</td>
      <td class="p-2 border">${s.phone || ''}</td>
      <td class="p-2 border text-center font-bold">${s.paymentsCount || 0}</td>
      <td class="p-2 border"><textarea id="note-${s.id}" rows="2" class="w-full border rounded-lg p-1 text-xs outline-none focus:border-gold resize-none bg-white">${s.notes || ''}</textarea></td>
      <td class="p-2 border"><textarea id="prog-${s.id}" rows="2" class="w-full border rounded-lg p-1 text-xs outline-none focus:border-gold resize-none bg-white" placeholder="20 درس من 32">${s.progress || ''}</textarea></td>
      <td class="p-2 border"><input type="text" id="time-${s.id}" value="${s.sessionTime || ''}" placeholder="الأحد 4:00 مساء" class="w-full border rounded-lg p-1 text-xs outline-none focus:border-gold bg-white"></td>
      <td class="p-2 border"><input type="text" id="hist-${s.id}" value="${s.sessionHistory || ''}" placeholder="1: 01/09 ..." class="w-full border rounded-lg p-1 text-xs outline-none focus:border-gold bg-white"></td>
      <td class="p-2 border text-center"><button onclick="saveTeacherStudentData('${s.id}')" class="bg-gold hover:bg-gold-dark text-primary font-black px-3 py-1.5 rounded-lg text-xs transition"><i class="fas fa-save"></i> حفظ التحديث</button></td>
    `;
    tbody.appendChild(tr);
  });
}
