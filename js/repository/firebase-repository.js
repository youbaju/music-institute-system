// ============================================================
// FirebaseRepository
// ============================================================
// نفس واجهة LocalRepository تماماً (list, get, add, update, remove,
// getSingleton, setSingleton) لكن متصلة بـ Firestore الحقيقي.
// بمجرد تعبئة APP_CONFIG.firebase وتغيير dataSource إلى "firebase"
// في js/config.js، يتحول كامل التطبيق للعمل عليها دون أي تعديل آخر.

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { APP_CONFIG } from "../config.js";

let app;
let db;

function ensureInit() {
  if (!getApps().length) {
    app = initializeApp(APP_CONFIG.firebase);
  }
  if (!db) {
    db = getFirestore(app);
  }
  return db;
}

export class FirebaseRepository {
  constructor(collectionName) {
    this.collectionName = collectionName;
    this.db = ensureInit();
  }

  async list() {
    const snapshot = await getDocs(collection(this.db, this.collectionName));
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  async get(id) {
    const ref = doc(this.db, this.collectionName, id);
    const snap = await getDoc(ref);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  }

  async add(data) {
    const colRef = collection(this.db, this.collectionName);
    const docRef = await addDoc(colRef, data);
    return { id: docRef.id, ...data };
  }

  async update(id, partialData) {
    const ref = doc(this.db, this.collectionName, id);
    await updateDoc(ref, partialData);
    return this.get(id);
  }

  async remove(id) {
    const ref = doc(this.db, this.collectionName, id);
    await deleteDoc(ref);
    return true;
  }

  async getSingleton(id) {
    return this.get(id);
  }

  async setSingleton(id, data) {
    const ref = doc(this.db, this.collectionName, id);
    await setDoc(ref, data, { merge: true });
    return this.get(id);
  }
}
