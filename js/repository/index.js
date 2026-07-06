// ============================================================
// Repository Factory
// ============================================================
// نقطة الدخول الوحيدة التي تستخدمها بقية أجزاء التطبيق (services).
// هي التي تقرر أي تنفيذ (Local / Firebase) يُستخدم فعلياً، بناءً على
// js/config.js فقط.

import { APP_CONFIG } from "../config.js";
import { LocalRepository } from "./local-repository.js";
import { FirebaseRepository } from "./firebase-repository.js";

const cache = {};

export function getRepository(collectionName) {
  if (cache[collectionName]) return cache[collectionName];

  let repo;
  if (APP_CONFIG.dataSource === "firebase") {
    repo = new FirebaseRepository(collectionName);
  } else {
    repo = new LocalRepository(collectionName);
  }

  cache[collectionName] = repo;
  return repo;
}
