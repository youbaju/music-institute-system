// ============================================================
// LocalRepository
// ============================================================
// تنفيذ مبدئي للمستودع يعتمد على localStorage، يُحاكي سلوك Firestore
// (collections + documents) لكن بدون أي اتصال خارجي. يُستخدم في مرحلة
// النموذج الأولي (Prototype) فقط.
//
// كل الدوال هنا "async" رغم أنها لا تحتاج ذلك فعلياً، وذلك لضمان أن
// الواجهة (Interface) مطابقة تماماً لـ FirebaseRepository، بحيث يمكن
// استبدال أحدهما بالآخر دون تعديل أي كود آخر في التطبيق (services/pages).

import { SEED_DATA } from "../demo-data.js";

const STORAGE_PREFIX = "music_institute_";

function loadCollection(name) {
  const key = STORAGE_PREFIX + name;
  const raw = localStorage.getItem(key);
  if (raw) return JSON.parse(raw);

  // أول تشغيل: نزرع البيانات التجريبية
  const seed = SEED_DATA[name];
  const initial = Array.isArray(seed) ? seed : seed ? [seed] : [];
  localStorage.setItem(key, JSON.stringify(initial));
  return initial;
}

function saveCollection(name, items) {
  localStorage.setItem(STORAGE_PREFIX + name, JSON.stringify(items));
}

function generateId(name) {
  return `${name}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

export class LocalRepository {
  constructor(collectionName) {
    this.collectionName = collectionName;
  }

  async list() {
    return loadCollection(this.collectionName);
  }

  async get(id) {
    const items = loadCollection(this.collectionName);
    return items.find((item) => item.id === id) || null;
  }

  async add(data) {
    const items = loadCollection(this.collectionName);
    const id = data.id || generateId(this.collectionName);
    const record = { ...data, id };
    items.push(record);
    saveCollection(this.collectionName, items);
    return record;
  }

  async update(id, partialData) {
    const items = loadCollection(this.collectionName);
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) throw new Error(`لم يتم العثور على سجل بالمعرف: ${id}`);
    items[index] = { ...items[index], ...partialData };
    saveCollection(this.collectionName, items);
    return items[index];
  }

  async remove(id) {
    const items = loadCollection(this.collectionName);
    const filtered = items.filter((item) => item.id !== id);
    saveCollection(this.collectionName, filtered);
    return true;
  }

  // خاص بمستند الإعدادات الوحيد (settings) — دائماً id ثابت "general"
  async getSingleton(id) {
    const items = loadCollection(this.collectionName);
    return items.find((item) => item.id === id) || null;
  }

  async setSingleton(id, data) {
    const items = loadCollection(this.collectionName);
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) {
      items.push({ ...data, id });
    } else {
      items[index] = { ...items[index], ...data, id };
    }
    saveCollection(this.collectionName, items);
    return items.find((item) => item.id === id);
  }

  // أداة مساعدة لإعادة ضبط البيانات التجريبية أثناء العرض التقديمي
  static resetAllDemoData() {
    Object.keys(SEED_DATA).forEach((name) => {
      localStorage.removeItem(STORAGE_PREFIX + name);
    });
  }
}
