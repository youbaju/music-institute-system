import { getRepository } from "./repository/index.js";

const repos = {
  settings: getRepository("settings"),
  students: getRepository("students"),
  guardians: getRepository("guardians"),
  teachers: getRepository("teachers"),
  classes: getRepository("classes"),
  attendance: getRepository("attendance"),
  invoices: getRepository("invoices"),
  payments: getRepository("payments"),
};

// ---------- الإعدادات ----------
const DEFAULT_SETTINGS = {
  id: "general",
  instituteName: "معهد الأنغام الموسيقي",
  currency: "ر.س",
  workDays: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"],
  workHoursFrom: "16:00",
  workHoursTo: "21:00",
  billingModel: "monthly",
  instruments: [
    { id: "oud", name: "عود", monthlyFee: 350 },
    { id: "piano", name: "بيانو", monthlyFee: 400 },
    { id: "organ", name: "أورغ", monthlyFee: 300 },
    { id: "violin", name: "كمان", monthlyFee: 380 },
    { id: "qanun", name: "قانون", monthlyFee: 420 },
  ],
};

export async function getSettings() {
  const settings = await repos.settings.getSingleton("general");
  if (!settings) {
    await repos.settings.setSingleton("general", DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  }
  return { ...DEFAULT_SETTINGS, ...settings };
}
export async function updateSettings(partial) {
  return repos.settings.setSingleton("general", partial);
}

// ---------- الطلاب ----------
export async function listStudents() {
  const [students, guardians, settings] = await Promise.all([
    repos.students.list(),
    repos.guardians.list(),
    getSettings(),
  ]);
  return students.map((s) => ({
    ...s,
    guardianName: s.guardianName || guardians.find((g) => g.id === s.guardianId)?.name || "—",
    instrumentName: settings.instruments.find((i) => i.id === s.instrumentId)?.name || "—",
  }));
}
export async function addStudent(data) {
  return repos.students.add(data);
}
export async function updateStudent(id, data) {
  return repos.students.update(id, data);
}
export async function removeStudent(id) {
  return repos.students.remove(id);
}

// ---------- المعلمين ----------
export async function listTeachers() {
  const [teachers, settings] = await Promise.all([repos.teachers.list(), getSettings()]);
  return teachers.map((t) => ({
    ...t,
    instrumentName: settings.instruments.find((i) => i.id === t.instrumentId)?.name || "—",
  }));
}
export async function addTeacher(data) {
  return repos.teachers.add(data);
}
export async function removeTeacher(id) {
  return repos.teachers.remove(id);
}

// ---------- الجدولة ----------
export async function listClasses() {
  const [classes, students, teachers] = await Promise.all([
    repos.classes.list(),
    repos.students.list(),
    repos.teachers.list(),
  ]);
  return classes.map((c) => ({
    ...c,
    studentName: students.find((s) => s.id === c.studentId)?.name || "—",
    teacherName: teachers.find((t) => t.id === c.teacherId)?.name || "—",
  }));
}
export async function addClass(data) {
  return repos.classes.add(data);
}
export async function removeClass(id) {
  return repos.classes.remove(id);
}
export async function getScheduleForStudent(studentId) {
  const all = await listClasses();
  return all.filter((c) => c.studentId === studentId);
}

// ---------- الحضور ----------
export async function listAttendanceForClass(classId) {
  const all = await repos.attendance.list();
  return all.filter((a) => a.classId === classId).sort((a, b) => (a.date < b.date ? 1 : -1));
}
export async function listAttendanceForStudent(studentId) {
  const all = await repos.attendance.list();
  return all.filter((a) => a.studentId === studentId).sort((a, b) => (a.date < b.date ? 1 : -1));
}
export async function markAttendance({ classId, studentId, date, status }) {
  const all = await repos.attendance.list();
  const existing = all.find((a) => a.classId === classId && a.date === date && a.studentId === studentId);
  if (existing) {
    return repos.attendance.update(existing.id, { status });
  }
  return repos.attendance.add({ classId, studentId, date, status });
}

// ---------- الفواتير والمدفوعات ----------
export async function listInvoices() {
  const [invoices, students] = await Promise.all([repos.invoices.list(), repos.students.list()]);
  return invoices
    .map((inv) => ({ ...inv, studentName: students.find((s) => s.id === inv.studentId)?.name || "—" }))
    .sort((a, b) => (a.dueDate < b.dueDate ? 1 : -1));
}
export async function listInvoicesForStudent(studentId) {
  const all = await listInvoices();
  return all.filter((i) => i.studentId === studentId);
}
export async function listOverdueInvoices() {
  const all = await listInvoices();
  const today = new Date().toISOString().slice(0, 10);
  return all.filter((i) => i.status === "unpaid" && i.dueDate < today);
}
export async function addInvoice(data) {
  return repos.invoices.add(data);
}
export async function recordPayment({ invoiceId, amount, method, date }) {
  const payment = await repos.payments.add({ invoiceId, amount, method, date });
  await repos.invoices.update(invoiceId, { status: "paid" });
  return payment;
}
export async function listPaymentsForInvoice(invoiceId) {
  const all = await repos.payments.list();
  return all.filter((p) => p.invoiceId === invoiceId);
}

// ---------- إحصائيات لوحة التحكم ----------
export async function getDashboardStats() {
  const [students, invoices, teachers, classes] = await Promise.all([
    repos.students.list(),
    repos.invoices.list(),
    repos.teachers.list(),
    repos.classes.list(),
  ]);
  const activeStudents = students.filter((s) => s.status === "active").length;
  const unpaid = invoices.filter((i) => i.status === "unpaid");
  const unpaidTotal = unpaid.reduce((sum, i) => sum + i.amount, 0);
  return {
    totalStudents: students.length,
    activeStudents,
    totalTeachers: teachers.length,
    totalClasses: classes.length,
    unpaidCount: unpaid.length,
    unpaidTotal,
  };
}
