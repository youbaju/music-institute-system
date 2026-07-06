// ============================================================
// وحدة الدخول (تجريبية)
// ============================================================
// في هذه المرحلة (Prototype) لا يوجد نظام مصادقة حقيقي — فقط اختيار
// دور (إدارة / طالب) لعرض الصلاحيات المناسبة. لاحقاً تُستبدل بسهولة
// بـ Firebase Authentication دون التأثير على بقية الصفحات، لأن كل
// صفحة تعتمد فقط على دالة requireRole() هذه.

const SESSION_KEY = "music_institute_session";

export function login(role, studentId = null) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ role, studentId }));
}

export function logout() {
  sessionStorage.removeItem(SESSION_KEY);
  window.location.href = "index.html";
}

export function getSession() {
  const raw = sessionStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function requireRole(expectedRole) {
  const session = getSession();
  if (!session || session.role !== expectedRole) {
    window.location.href = "index.html";
    return null;
  }
  return session;
}
