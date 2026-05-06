import { db } from "../../firebase/config";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { userAdapter } from "../../domain/userModel"; // ✅ RUTA CORRECTA

export const firebaseUserAdapter = {
  // 👤 obtener usuario
  async getUser(uid) {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) return null;

    const raw = {
      uid,
      ...snap.data(),
    };

    // 🧠 normalización dominio
    return userAdapter.toDomain(raw);
  },

  // ➕ crear usuario (recibe dominio, NO firebaseUser)
  async createUser(domainUser) {
    const ref = doc(db, "users", domainUser.uid);

    const data = {
      ...userAdapter.toPersistence(domainUser),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(ref, data);

    return domainUser;
  },

  // 🔄 actualizar usuario
  async updateUser(uid, data) {
    const ref = doc(db, "users", uid);

    await updateDoc(ref, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },
};