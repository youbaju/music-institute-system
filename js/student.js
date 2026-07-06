import { requireRole, logout } from "./auth.js";
import * as svc from "./services.js";

const session = requireRole("student");
document.getElementById("btnLogout").addEventListener("click", logout);

const statusLabels = {
  active: "نشط", suspended: "موقوف", ended: "منتهي",
  paid: "مدفوعة", unpaid: "غير مدفوعة", present: "حاضر", absent: "غائب",
};
function badge(status) { return `<span class="badge badge-${status}">${statusLabels[status] || status}</span>`; }
function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

const views = ["schedule", "attendance", "invoices"];
const titles = { schedule: "جدولي الأسبوعي", attendance: "سجل الحضور", invoices: "الفواتير" };
let currentView = "schedule";

document.querySelectorAll(".nav-item[data-view]").forEach((btn) => {
  btn.addEventListener("click", () => {
    currentView = btn.dataset.view;
    document.querySelectorAll(".nav-item[data-view]").forEach((b) => b.classList.toggle("active", b === btn));
    document.querySelectorAll(".view").forEach((v) => v.classList.toggle("active", v.id === `view-${currentView}`));
    document.getElementById("viewTitle").textContent = titles[currentView];
    render();
  });
});

async function render() {
  const settings = await svc.getSettings();
  document.getElementById("brandName").textContent = settings.instituteName;

  if (currentView === "schedule") {
    const myClasses = await svc.getScheduleForStudent(session.studentId);
    document.getElementById("myScheduleGrid").innerHTML = settings.workDays.map(day => {
      const dayClasses = myClasses.filter(c => c.dayOfWeek === day);
      return `<div class="day-col"><h4>${day}</h4>${dayClasses.map(c => `
        <div class="class-chip"><span class="time">${c.time} (${c.duration} د)</span>مع ${escapeHtml(c.teacherName)}<br>
        <span style="color:var(--ink-dim); font-size:11.5px;">${escapeHtml(c.room || "")}</span></div>`).join("")
        || `<div style="color:var(--ink-dim); font-size:12.5px;">لا حصص</div>`}</div>`;
    }).join("");
  }

  if (currentView === "attendance") {
    const history = await svc.listAttendanceForStudent(session.studentId);
    document.getElementById("myAttendanceTable").innerHTML = history.length ? `
      <table><thead><tr><th>التاريخ</th><th>الحالة</th></tr></thead>
      <tbody>${history.map(a => `<tr><td class="mono">${a.date}</td><td>${badge(a.status)}</td></tr>`).join("")}</tbody></table>
    ` : `<div class="empty-state">لا يوجد سجل حضور بعد</div>`;
  }

  if (currentView === "invoices") {
    const invoices = await svc.listInvoicesForStudent(session.studentId);
    document.getElementById("myInvoicesTable").innerHTML = invoices.length ? `
      <table><thead><tr><th>الشهر</th><th>المبلغ</th><th>الاستحقاق</th><th>الحالة</th></tr></thead>
      <tbody>${invoices.map(i => `<tr><td class="mono">${i.month}</td><td class="mono">${i.amount} ${settings.currency}</td><td class="mono">${i.dueDate}</td><td>${badge(i.status)}</td></tr>`).join("")}</tbody></table>
    ` : `<div class="empty-state">لا توجد فواتير بعد</div>`;
  }
}

render();
