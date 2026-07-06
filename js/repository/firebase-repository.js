import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  initializeFirestore,
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
    // نفعّل Long Polling دائماً لتجاوز حظر بعض الشبكات/برامج الحماية
    // لاتصال Firestore المباشر (WebSocket)، وهذا لا يؤثر على الأداء
    db = initializeFirestore(app, {
      experimentalForceLongPolling: true,
    });
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
