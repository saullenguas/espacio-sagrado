import { db } from "../firebase/config";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";

// 🔹 Referencia a la colección
const coursesRef = collection(db, "courses");

// 🔹 Obtener todos los cursos (modo clásico)
export const getCourses = async () => {
  const snapshot = await getDocs(coursesRef);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

// 🔹 Obtener curso por ID
export const getCourseById = async (id) => {
  const ref = doc(db, "courses", id);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() };
  }
  return null;
};

// 🔹 Crear curso
export const createCourse = async (data) => {
  return await addDoc(coursesRef, {
    ...data,
    createdAt: serverTimestamp(),
  });
};

// 🔹 Actualizar curso (✅ NUEVO)
export const updateCourse = async (courseId, data) => {
  const ref = doc(db, "courses", courseId);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
};

// 🔹 Eliminar curso (✅ NUEVO)
export const deleteCourse = async (courseId) => {
  const ref = doc(db, "courses", courseId);
  await deleteDoc(ref);
};

// 🔥 🔹 Tiempo real (suscripción a cursos)
export const subscribeToCourses = (callback) => {
  return onSnapshot(coursesRef, (snapshot) => {
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(data);
  });
};