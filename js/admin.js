import { requireRole, logout } from "./auth.js";
import * as svc from "./services.js";

requireRole("admin");
document.getElementById("btnLogout").addEventListener("click", logout);

// ===================== أدوات مساعدة عامة =====================
const statusLabels = {
  active: "نشط", suspended: "موقوف", ended: "منتهي",
  paid: "مدفوعة", unpaid: "غير مدفوعة",
  present: "حاضر", absent: "غائب",
};
function badge(status) {
  return `<span class="badge badge-${status}">${statusLabels[status] || status}</span>`;
}
function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function openModal(title, bodyHtml, onSubmit, submitLabel = "حفظ") {
  const root = document.getElementById("modalRoot");
  root.innerHTML = `
    <div class="modal-backdrop" id="modalBackdrop">
      <div class="modal">
        <h3>${title}</h3>
        <form id="modalForm">${bodyHtml}
          <div class="modal-actions">
            <button type="submit" class="btn-primary">${submitLabel}</button>
            <button type="button" class="btn-secondary" id="modalCancel">إلغاء</button>
          </div>
        </form>
      </div>
    </div>`;
  const close = () => (root.innerHTML = "");
  document.getElementById("modalCancel").addEventListener("click", close);
  document.getElementById("modalBackdrop").addEventListener("click", (e) => { if (e.target.id === "modalBackdrop") close(); });
  document.getElementById("modalForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = Object.fromEntries(new FormData(e.target).entries());
    await onSubmit(formData);
    close();
    renderCurrentView();
  });
}

// ===================== التنقل بين الصفحات =====================
const views = ["dashboard", "students", "teachers", "schedule", "attendance", "invoices", "settings"];
const titles = {
  dashboard: "لوحة المعلومات", students: "الطلاب", teachers: "المعلمون",
  schedule: "الجدولة", attendance: "الحضور والغياب", invoices: "الفواتير والمدفوعات", settings: "الإعدادات",
};
let currentView = "dashboard";

document.querySelectorAll(".nav-item[data-view]").forEach((btn) => {
  btn.addEventListener("click", () => {
    currentView = btn.dataset.view;
    document.querySelectorAll(".nav-item[data-view]").forEach((b) => b.classList.toggle("active", b === btn));
    document.querySelectorAll(".view").forEach((v) => v.classList.toggle("active", v.id === `view-${currentView}`));
    document.getElementById("viewTitle").textContent = titles[currentView];
    renderCurrentView();
  });
});

function renderCurrentView() {
  const renderers = {
    dashboard: renderDashboard, students: renderStudents, teachers: renderTeachers,
    schedule: renderSchedule, attendance: renderAttendanceSetup, invoices: renderInvoices, settings: renderSettings,
  };
  renderers[currentView]?.();
}

// ===================== لوحة المعلومات =====================
async function renderDashboard() {
  const stats = await svc.getDashboardStats();
  const settings = await svc.getSettings();
  document.getElementById("statGrid").innerHTML = `
    <div class="stat-card"><div class="label">إجمالي الطلاب</div><div class="value">${stats.totalStudents}</div></div>
    <div class="stat-card"><div class="label">طلاب نشطون</div><div class="value">${stats.activeStudents}</div></div>
    <div class="stat-card"><div class="label">عدد المعلمين</div><div class="value">${stats.totalTeachers}</div></div>
    <div class="stat-card"><div class="label">الحصص الأسبوعية</div><div class="value">${stats.totalClasses}</div></div>
    <div class="stat-card"><div class="label">فواتير غير مدفوعة</div><div class="value">${stats.unpaidCount}</div></div>
    <div class="stat-card"><div class="label">إجمالي المتأخرات</div><div class="value">${stats.unpaidTotal} ${settings.currency}</div></div>
  `;
  const overdue = await svc.listOverdueInvoices();
  document.getElementById("overdueTable").innerHTML = overdue.length ? `
    <table><thead><tr><th>الطالب</th><th>الشهر</th><th>المبلغ</th><th>تاريخ الاستحقاق</th></tr></thead>
    <tbody>${overdue.map(i => `<tr><td>${escapeHtml(i.studentName)}</td><td class="mono">${i.month}</td><td class="mono">${i.amount} ${settings.currency}</td><td class="mono">${i.dueDate}</td></tr>`).join("")}</tbody></table>
  ` : `<div class="empty-state">لا توجد فواتير متأخرة 🎉</div>`;
}

// ===================== الطلاب =====================
async function renderStudents() {
  const settings = await svc.getSettings();
  const students = await svc.listStudents();
  document.getElementById("studentsTable").innerHTML = students.length ? `
    <table><thead><tr><th>الاسم</th><th>العمر</th><th>ولي الأمر</th><th>الآلة</th><th>الحالة</th><th></th></tr></thead>
    <tbody>${students.map(s => `
      <tr>
        <td>${escapeHtml(s.name)}</td><td class="mono">${s.age}</td><td>${escapeHtml(s.guardianName)}</td>
        <td>${escapeHtml(s.instrumentName)}</td><td>${badge(s.status)}</td>
        <td><button class="btn-secondary btn-sm" data-edit="${s.id}">تعديل</button></td>
      </tr>`).join("")}</tbody></table>
  ` : `<div class="empty-state">لا يوجد طلاب مسجلون بعد</div>`;

  document.querySelectorAll("[data-edit]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const student = students.find((s) => s.id === btn.dataset.edit);
      openStudentModal(settings, student);
    });
  });
}
function openStudentModal(settings, student = null) {
  const instrumentOptions = settings.instruments.map(i => `<option value="${i.id}" ${student?.instrumentId === i.id ? "selected" : ""}>${i.name}</option>`).join("");
  const statusOptions = ["active", "suspended", "ended"].map(s => `<option value="${s}" ${student?.status === s ? "selected" : ""}>${statusLabels[s]}</option>`).join("");
  openModal(student ? "تعديل بيانات طالب" : "إضافة طالب جديد", `
    <div class="field"><label>اسم الطالب</label><input name="name" value="${escapeHtml(student?.name || "")}" required></div>
    <div class="field"><label>العمر</label><input name="age" type="number" min="3" max="80" value="${student?.age || ""}" required></div>
    <div class="field"><label>اسم ولي الأمر</label><input name="guardianName" value="${escapeHtml(student?.guardianName || "")}" required></div>
    <div class="field"><label>رقم التواصل</label><input name="phone" value="${escapeHtml(student?.phone || "")}" required></div>
    <div class="field"><label>الآلة</label><select name="instrumentId">${instrumentOptions}</select></div>
    <div class="field"><label>الحالة</label><select name="status">${statusOptions}</select></div>
  `, async (data) => {
    const payload = {
      name: data.name, age: Number(data.age), phone: data.phone,
      instrumentId: data.instrumentId, status: data.status, guardianName: data.guardianName,
    };
    if (student) {
      await svc.updateStudent(student.id, payload);
    } else {
      await svc.addStudent({ ...payload, guardianId: null, createdAt: new Date().toISOString().slice(0, 10) });
    }
  }, student ? "حفظ التعديلات" : "إضافة الطالب");
}
document.getElementById("btnAddStudent").addEventListener("click", async () => openStudentModal(await svc.getSettings()));

// ===================== المعلمون =====================
async function renderTeachers() {
  const settings = await svc.getSettings();
  const teachers = await svc.listTeachers();
  document.getElementById("teachersTable").innerHTML = teachers.length ? `
    <table><thead><tr><th>الاسم</th><th>التخصص</th><th>رقم التواصل</th><th></th></tr></thead>
    <tbody>${teachers.map(t => `
      <tr><td>${escapeHtml(t.name)}</td><td>${escapeHtml(t.instrumentName)}</td><td class="mono">${escapeHtml(t.phone)}</td>
      <td><button class="btn-danger btn-sm" data-remove="${t.id}">حذف</button></td></tr>`).join("")}</tbody></table>
  ` : `<div class="empty-state">لا يوجد معلمون مسجلون بعد</div>`;

  document.querySelectorAll("[data-remove]").forEach((btn) => {
    btn.addEventListener("click", async () => { await svc.removeTeacher(btn.dataset.remove); renderTeachers(); });
  });
}
document.getElementById("btnAddTeacher").addEventListener("click", async () => {
  const settings = await svc.getSettings();
  const instrumentOptions = settings.instruments.map(i => `<option value="${i.id}">${i.name}</option>`).join("");
  openModal("إضافة معلم جديد", `
    <div class="field"><label>اسم المعلم</label><input name="name" required></div>
    <div class="field"><label>التخصص</label><select name="instrumentId">${instrumentOptions}</select></div>
    <div class="field"><label>رقم التواصل</label><input name="phone" required></div>
  `, async (data) => { await svc.addTeacher(data); }, "إضافة المعلم");
});

// ===================== الجدولة =====================
async function renderSchedule() {
  const settings = await svc.getSettings();
  const classes = await svc.listClasses();
  document.getElementById("scheduleGrid").innerHTML = settings.workDays.map(day => {
    const dayClasses = classes.filter(c => c.dayOfWeek === day).sort((a,b) => a.time.localeCompare(b.time));
    return `<div class="day-col"><h4>${day}</h4>${dayClasses.map(c => `
      <div class="class-chip">
        <span class="time">${c.time} (${c.duration} د)</span>
        ${escapeHtml(c.studentName)} — ${escapeHtml(c.teacherName)}<br>
        <span style="color:var(--ink-dim); font-size:11.5px;">${escapeHtml(c.room || "")}</span>
        <button class="btn-danger btn-sm" style="margin-top:6px; width:100%;" data-remove-class="${c.id}">حذف</button>
      </div>`).join("") || `<div style="color:var(--ink-dim); font-size:12.5px;">لا حصص</div>`}</div>`;
  }).join("");

  document.querySelectorAll("[data-remove-class]").forEach((btn) => {
    btn.addEventListener("click", async () => { await svc.removeClass(btn.dataset.removeClass); renderSchedule(); });
  });
}
document.getElementById("btnAddClass").addEventListener("click", async () => {
  const [settings, students, teachers] = await Promise.all([svc.getSettings(), svc.listStudents(), svc.listTeachers()]);
  openModal("إضافة حصة جديدة", `
    <div class="field"><label>الطالب</label><select name="studentId">${students.map(s => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join("")}</select></div>
    <div class="field"><label>المعلم</label><select name="teacherId">${teachers.map(t => `<option value="${t.id}">${escapeHtml(t.name)}</option>`).join("")}</select></div>
    <div class="field"><label>اليوم</label><select name="dayOfWeek">${settings.workDays.map(d => `<option value="${d}">${d}</option>`).join("")}</select></div>
    <div class="field"><label>الوقت</label><input name="time" type="time" required></div>
    <div class="field"><label>المدة (دقيقة)</label><input name="duration" type="number" value="45" required></div>
    <div class="field"><label>القاعة (اختياري)</label><input name="room"></div>
  `, async (data) => { await svc.addClass({ ...data, duration: Number(data.duration) }); }, "إضافة الحصة");
});

// ===================== الحضور =====================
async function renderAttendanceSetup() {
  const classes = await svc.listClasses();
  document.getElementById("attClassSelect").innerHTML = classes.map(c => `<option value="${c.id}">${c.dayOfWeek} ${c.time} — ${escapeHtml(c.studentName)} (${escapeHtml(c.teacherName)})</option>`).join("");
  document.getElementById("attDate").value = new Date().toISOString().slice(0, 10);
  loadAttendanceArea();
}
async function loadAttendanceArea() {
  const classId = document.getElementById("attClassSelect").value;
  const date = document.getElementById("attDate").value;
  const classes = await svc.listClasses();
  const cls = classes.find(c => c.id === classId);
  if (!cls) { document.getElementById("attendanceArea").innerHTML = `<div class="empty-state">لا توجد حصص بعد</div>`; return; }
  const history = await svc.listAttendanceForClass(classId);
  const todayRecord = history.find(a => a.date === date);
  document.getElementById("attendanceArea").innerHTML = `
    <p style="color:var(--ink-dim); font-size:13.5px;">الطالب: <strong style="color:var(--ink);">${escapeHtml(cls.studentName)}</strong></p>
    <div style="display:flex; gap:10px; margin:12px 0 22px;">
      <button class="btn-primary btn-sm" id="markPresent">تسجيل حضور</button>
      <button class="btn-danger btn-sm" id="markAbsent">تسجيل غياب</button>
      ${todayRecord ? `<span style="align-self:center;">الحالة الحالية: ${badge(todayRecord.status)}</span>` : ""}
    </div>
    <div class="rosette-divider"><span style="font-size:12px;">السجل التاريخي</span></div>
    ${history.length ? `<table><thead><tr><th>التاريخ</th><th>الحالة</th></tr></thead>
    <tbody>${history.map(a => `<tr><td class="mono">${a.date}</td><td>${badge(a.status)}</td></tr>`).join("")}</tbody></table>`
    : `<div class="empty-state">لا يوجد سجل حضور بعد</div>`}
  `;
  document.getElementById("markPresent").addEventListener("click", async () => { await svc.markAttendance({ classId, studentId: cls.studentId, date, status: "present" }); loadAttendanceArea(); });
  document.getElementById("markAbsent").addEventListener("click", async () => { await svc.markAttendance({ classId, studentId: cls.studentId, date, status: "absent" }); loadAttendanceArea(); });
}
document.getElementById("btnLoadAttendance").addEventListener("click", loadAttendanceArea);

// ===================== الفواتير =====================
async function renderInvoices() {
  const settings = await svc.getSettings();
  const invoices = await svc.listInvoices();
  document.getElementById("invoicesTable").innerHTML = invoices.length ? `
    <table><thead><tr><th>الطالب</th><th>الشهر</th><th>المبلغ</th><th>الاستحقاق</th><th>الحالة</th><th></th></tr></thead>
    <tbody>${invoices.map(i => `
      <tr>
        <td>${escapeHtml(i.studentName)}</td><td class="mono">${i.month}</td><td class="mono">${i.amount} ${settings.currency}</td>
        <td class="mono">${i.dueDate}</td><td>${badge(i.status)}</td>
        <td>${i.status === "unpaid" ? `<button class="btn-primary btn-sm" data-pay="${i.id}" data-amount="${i.amount}">تسجيل دفعة</button>` : ""}</td>
      </tr>`).join("")}</tbody></table>
  ` : `<div class="empty-state">لا توجد فواتير بعد</div>`;

  document.querySelectorAll("[data-pay]").forEach((btn) => {
    btn.addEventListener("click", () => {
      openModal("تسجيل دفعة", `
        <div class="field"><label>المبلغ</label><input name="amount" type="number" value="${btn.dataset.amount}" required></div>
        <div class="field"><label>طريقة الدفع</label>
          <select name="method"><option value="نقدي">نقدي</option><option value="تحويل بنكي">تحويل بنكي</option><option value="شبكة">شبكة</option></select>
        </div>
        <div class="field"><label>التاريخ</label><input name="date" type="date" value="${new Date().toISOString().slice(0,10)}" required></div>
      `, async (data) => { await svc.recordPayment({ invoiceId: btn.dataset.pay, amount: Number(data.amount), method: data.method, date: data.date }); }, "تأكيد الدفعة");
    });
  });
}
document.getElementById("btnAddInvoice").addEventListener("click", async () => {
  const [settings, students] = await Promise.all([svc.getSettings(), svc.listStudents()]);
  openModal("إصدار فاتورة جديدة", `
    <div class="field"><label>الطالب</label><select name="studentId">${students.map(s => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join("")}</select></div>
    <div class="field"><label>الشهر</label><input name="month" type="month" required></div>
    <div class="field"><label>المبلغ (${settings.currency})</label><input name="amount" type="number" required></div>
    <div class="field"><label>تاريخ الاستحقاق</label><input name="dueDate" type="date" required></div>
  `, async (data) => { await svc.addInvoice({ ...data, amount: Number(data.amount), status: "unpaid" }); }, "إصدار الفاتورة");
});

// ===================== الإعدادات =====================
async function renderSettings() {
  const settings = await svc.getSettings();
  document.getElementById("brandName").textContent = settings.instituteName;
  document.getElementById("settingsForm").innerHTML = `
    <form id="generalSettingsForm">
      <div class="field"><label>اسم المعهد</label><input name="instituteName" value="${escapeHtml(settings.instituteName)}"></div>
      <div class="field"><label>العملة</label><input name="currency" value="${escapeHtml(settings.currency)}"></div>
      <div class="field"><label>أيام العمل (مفصولة بفاصلة)</label><input name="workDays" value="${settings.workDays.join("، ")}"></div>
      <div class="field"><label>نموذج الفوترة</label>
        <select name="billingModel">
          <option value="monthly" ${settings.billingModel === "monthly" ? "selected" : ""}>شهري ثابت</option>
          <option value="perSession" ${settings.billingModel === "perSession" ? "selected" : ""}>حسب عدد الحصص</option>
        </select>
      </div>
      <button type="submit" class="btn-primary">حفظ الإعدادات</button>
    </form>
  `;
  document.getElementById("generalSettingsForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    await svc.updateSettings({ ...data, workDays: data.workDays.split(/[،,]\s*/).filter(Boolean) });
    renderSettings();
  });

  document.getElementById("instrumentsTable").innerHTML = `
    <table><thead><tr><th>الآلة</th><th>الرسوم الشهرية</th><th></th></tr></thead>
    <tbody>${settings.instruments.map((ins, idx) => `
      <tr>
        <td><input data-ins-name="${idx}" value="${escapeHtml(ins.name)}" style="max-width:160px;"></td>
        <td><input data-ins-fee="${idx}" type="number" value="${ins.monthlyFee}" style="max-width:120px;" class="mono"></td>
        <td><button class="btn-danger btn-sm" data-ins-remove="${idx}">حذف</button></td>
      </tr>`).join("")}</tbody></table>
    <button class="btn-secondary btn-sm" id="btnSaveInstruments" style="margin-top:14px;">حفظ تعديلات الآلات</button>
  `;
  document.getElementById("btnSaveInstruments").addEventListener("click", async () => {
    const instruments = settings.instruments.map((ins, idx) => ({
      id: ins.id,
      name: document.querySelector(`[data-ins-name="${idx}"]`).value,
      monthlyFee: Number(document.querySelector(`[data-ins-fee="${idx}"]`).value),
    }));
    await svc.updateSettings({ instruments });
    renderSettings();
  });
  document.querySelectorAll("[data-ins-remove]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const instruments = settings.instruments.filter((_, idx) => idx !== Number(btn.dataset.insRemove));
      await svc.updateSettings({ instruments });
      renderSettings();
    });
  });
}
document.getElementById("btnAddInstrument").addEventListener("click", () => {
  openModal("إضافة آلة موسيقية", `
    <div class="field"><label>اسم الآلة</label><input name="name" required></div>
    <div class="field"><label>الرسوم الشهرية</label><input name="monthlyFee" type="number" required></div>
  `, async (data) => {
    const settings = await svc.getSettings();
    const id = "ins_" + Date.now();
    await svc.updateSettings({ instruments: [...settings.instruments, { id, name: data.name, monthlyFee: Number(data.monthlyFee) }] });
  }, "إضافة");
  currentView = "settings";
});

// تحديث اسم المعهد بالقائمة الجانبية فوراً عند فتح الصفحة (بغض النظر عن التبويب الحالي)
svc.getSettings().then((s) => {
  document.getElementById("brandName").textContent = s.instituteName;
});

// أول تحميل
renderCurrentView();
