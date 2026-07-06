// ============================================================
// بيانات تجريبية أولية (Seed Data)
// ============================================================
// تُستخدم فقط أول مرة يفتح فيها النظام (لا توجد بيانات محفوظة بعد).
// كل هذه القيم قابلة للتعديل بالكامل من لوحة التحكم بعد ذلك، وهي هنا
// فقط لتقديم عرض احترافي جاهز أمام المعهد دون الحاجة لإدخال بيانات يدوياً.

export const SEED_DATA = {
  // إعدادات المعهد العامة — كل حقل هنا قابل للتعديل من "الإعدادات" في اللوحة
  settings: {
    id: "general",
    instituteName: "معهد الأنغام الموسيقي",
    currency: "ر.س",
    workDays: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"],
    workHoursFrom: "16:00",
    workHoursTo: "21:00",
    billingModel: "monthly", // monthly | perSession
    instruments: [
      { id: "oud", name: "عود", monthlyFee: 350 },
      { id: "piano", name: "بيانو", monthlyFee: 400 },
      { id: "organ", name: "أورغ", monthlyFee: 300 },
      { id: "violin", name: "كمان", monthlyFee: 380 },
      { id: "qanun", name: "قانون", monthlyFee: 420 },
    ],
  },

  guardians: [
    { id: "g1", name: "أبو خالد", phone: "0501112233" },
    { id: "g2", name: "أم سارة", phone: "0502223344" },
    { id: "g3", name: "أبو ريان", phone: "0503334455" },
  ],

  students: [
    { id: "s1", name: "خالد الحربي", age: 12, guardianId: "g1", phone: "0501112233", instrumentId: "oud", status: "active", createdAt: "2026-04-01" },
    { id: "s2", name: "سارة العتيبي", age: 15, guardianId: "g2", phone: "0502223344", instrumentId: "piano", status: "active", createdAt: "2026-03-15" },
    { id: "s3", name: "ريان القحطاني", age: 10, guardianId: "g3", phone: "0503334455", instrumentId: "organ", status: "suspended", createdAt: "2026-02-10" },
    { id: "s4", name: "نورة العتيبي", age: 17, guardianId: "g2", phone: "0502223344", instrumentId: "violin", status: "active", createdAt: "2026-05-01" },
  ],

  teachers: [
    { id: "t1", name: "أ. محمد الزهراني", instrumentId: "oud", phone: "0555001122" },
    { id: "t2", name: "أ. لينا فارس", instrumentId: "piano", phone: "0555003344" },
    { id: "t3", name: "أ. عبدالله الشمري", instrumentId: "organ", phone: "0555005566" },
    { id: "t4", name: "أ. هند المطيري", instrumentId: "violin", phone: "0555007788" },
  ],

  classes: [
    { id: "c1", studentId: "s1", teacherId: "t1", dayOfWeek: "الأحد", time: "16:00", duration: 45, room: "قاعة 1" },
    { id: "c2", studentId: "s2", teacherId: "t2", dayOfWeek: "الاثنين", time: "17:00", duration: 60, room: "قاعة 2" },
    { id: "c3", studentId: "s3", teacherId: "t3", dayOfWeek: "الثلاثاء", time: "16:30", duration: 45, room: "قاعة 1" },
    { id: "c4", studentId: "s4", teacherId: "t4", dayOfWeek: "الأربعاء", time: "18:00", duration: 45, room: "قاعة 3" },
    { id: "c5", studentId: "s1", teacherId: "t1", dayOfWeek: "الخميس", time: "16:00", duration: 45, room: "قاعة 1" },
  ],

  attendance: [
    { id: "a1", classId: "c1", studentId: "s1", date: "2026-06-29", status: "present" },
    { id: "a2", classId: "c1", studentId: "s1", date: "2026-07-02", status: "absent" },
    { id: "a3", classId: "c2", studentId: "s2", date: "2026-06-30", status: "present" },
    { id: "a4", classId: "c4", studentId: "s4", date: "2026-07-01", status: "present" },
  ],

  invoices: [
    { id: "i1", studentId: "s1", amount: 350, month: "2026-07", status: "unpaid", dueDate: "2026-07-05" },
    { id: "i2", studentId: "s2", amount: 400, month: "2026-07", status: "paid", dueDate: "2026-07-05" },
    { id: "i3", studentId: "s4", amount: 380, month: "2026-07", status: "unpaid", dueDate: "2026-07-05" },
    { id: "i4", studentId: "s3", amount: 300, month: "2026-06", status: "unpaid", dueDate: "2026-06-05" },
  ],

  payments: [
    { id: "p1", invoiceId: "i2", amount: 400, method: "تحويل بنكي", date: "2026-07-02" },
  ],
};
