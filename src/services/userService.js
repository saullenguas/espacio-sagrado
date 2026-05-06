// ============================================
// 🧠 CAPA DE NEGOCIO (APPLICATION)
// conecta dominio + reglas + infraestructura
// ============================================

import { firebaseUserAdapter } from "../infrastructure/firebase/firebaseUserAdapter";
import { userAdapter } from "../domain/userModel";
import { accessRules } from "../domain/accessRules";
import { getFunctions, httpsCallable } from "firebase/functions";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../firebase/config";

export const userService = {
  // 👤 obtener usuario completo
  async getUserById(uid) {
    return await firebaseUserAdapter.getUser(uid);
  },

  // ➕ crear usuario
  async createUser(firebaseUser) {
    const domainUser = userAdapter.toDomain({
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      role: "student",
      accessType: "limited",
      enrolledCourses: [],
      lastCourseId: null,
      lastModuleId: null,
      lastLessonId: null,
      phase: "guided",
    });
    await firebaseUserAdapter.createUser(domainUser);
    return domainUser;
  },

  // 🔄 actualizar usuario
  async updateUser(uid, data) {
    return await firebaseUserAdapter.updateUser(uid, data);
  },

  // 💎 ACTIVAR PREMIUM
  async activatePremium(uid, months = 6) {
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + months);
    return await firebaseUserAdapter.updateUser(uid, {
      accessType: "all",
      premiumExpiry: expiry,
    });
  },

  // 👑 Hacer administrador desde el panel
  async makeAdmin(email) {
    const functions = getFunctions(undefined, 'us-central1');
    const setAdminRole = httpsCallable(functions, "setAdminRole");
    const result = await setAdminRole({ email });
    return result.data;
  },

  // 🗑️ Eliminar usuario desde el panel (usa fetch directo para evitar CORS)
  async deleteUser(uid) {
    const token = await auth.currentUser.getIdToken();

    const response = await fetch(
      'https://us-central1-espacio-sagrado.cloudfunctions.net/deleteUserAccount',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ uid }),
      }
    );

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Error al eliminar');
    return data;
  },

  // 🔐 ACCESO
  canAccessCourse(user, courseId) {
    return accessRules.canAccessCourse(user, courseId);
  },

  canAccessLesson(user, courseId, lessonId) {
    return accessRules.canAccessLesson(user, courseId, lessonId);
  },

  // 👑 ROLES
  isAdmin(user) {
    return accessRules.isAdmin(user);
  },

  isPremium(user) {
    return accessRules.isPremiumActive(user);
  },

  // 🌿 UX / UI
  getAccessLevel(user) {
    return accessRules.getAccessLevel(user);
  },

  // ============================================
  // 🔐 AUTENTICACIÓN
  // ============================================

  async login(email, password) {
    await signInWithEmailAndPassword(auth, email, password);
  },

  async register(email, password) {
    await createUserWithEmailAndPassword(auth, email, password);
  },

  async logout() {
    await signOut(auth);
  },

  onAuthChanged(callback) {
    return onAuthStateChanged(auth, callback);
  },
};