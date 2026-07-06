// ============================================================
// Repository Factory
// ============================================================
// نقطة الدخول الوحيدة التي تستخدمها بقية أجزاء التطبيق (services).
// هي التي تقرر أي تنفيذ (Local / Firebase) يُستخدم فعلياً، بناءً على
// js/config.js فقط. أي كود آخر في التطبيق لا يعرف ولا يهتم من أين
// تأتي البيانات — هذا هو جوهر Repository Pattern المطلوب في الوثيقة.

import { APP_CONFIG } from "../config.js";
import { LocalRepository } from "./local-repository.js";

const cache = {};

export function getRepository(collectionName) {
  if (cache[collectionName]) return cache[collectionName];

  let repo;
  if (APP_CONFIG.dataSource === "firebase") {
    // يُحمَّل ديناميكياً حتى لا يفشل التطبيق إن لم يكن Firebase مُعداً بعد
    throw new Error(
      "وضع Firebase غير مُفعّل بعد في هذا العرض التجريبي. " +
      "لتفعيله: عبّئ js/config.js ثم استورد FirebaseRepository بدلاً من هذا الفرع."
    );
  } else {
    repo = new LocalRepository(collectionName);
  }

  cache[collectionName] = repo;
  return repo;
}
