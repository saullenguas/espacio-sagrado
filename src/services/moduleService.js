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
} from "firebase/firestore";

// 🔹 Referencia a las colecciones
const modulesRef = (courseId) => collection(db, "courses", courseId, "modules");
const lessonsRef = (courseId, moduleId) =>
  collection(db, "courses", courseId, "modules", moduleId, "lessons");

// 🔹 Obtener módulos de un curso
export const getModulesByCourse = async (courseId) => {
  const snapshot = await getDocs(modulesRef(courseId));
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

// 🔹 Obtener módulo por ID
export const getModuleById = async (courseId, moduleId) => {
  const ref = doc(db, "courses", courseId, "modules", moduleId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() };
  }
  return null;
};

// 🔹 Crear módulo
export const createModule = async (courseId, data) => {
  return await addDoc(modulesRef(courseId), {
    ...data,
    createdAt: serverTimestamp(),
  });
};

// 🔹 Actualizar módulo (✅ NUEVO)
export const updateModule = async (courseId, moduleId, data) => {
  const ref = doc(db, "courses", courseId, "modules", moduleId);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
};

// 🔹 Eliminar módulo (✅ NUEVO)
export const deleteModule = async (courseId, moduleId) => {
  const ref = doc(db, "courses", courseId, "modules", moduleId);
  await deleteDoc(ref);
};

// 🔹 Obtener lecciones de un módulo
export const getLessonsByModule = async (courseId, moduleId) => {
  const snapshot = await getDocs(lessonsRef(courseId, moduleId));
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

// 🔹 Obtener lección por ID
export const getLessonById = async (courseId, moduleId, lessonId) => {
  const ref = doc(db, "courses", courseId, "modules", moduleId, "lessons", lessonId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() };
  }
  return null;
};

// 🔹 Crear lección
export const createLesson = async (courseId, moduleId, data) => {
  return await addDoc(lessonsRef(courseId, moduleId), {
    ...data,
    createdAt: serverTimestamp(),
  });
};

// 🔹 Actualizar lección (✅ NUEVO)
export const updateLesson = async (courseId, moduleId, lessonId, data) => {
  const ref = doc(db, "courses", courseId, "modules", moduleId, "lessons", lessonId);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
};

// 🔹 Eliminar lección (✅ NUEVO)
export const deleteLesson = async (courseId, moduleId, lessonId) => {
  const ref = doc(db, "courses", courseId, "modules", moduleId, "lessons", lessonId);
  await deleteDoc(ref);
};

// 🔹 Obtener todos los cursos con sus módulos (para el panel admin) (✅ NUEVO)
export const getAllCoursesWithModules = async () => {
  const coursesSnapshot = await getDocs(collection(db, "courses"));
  const courses = [];
  
  for (const courseDoc of coursesSnapshot.docs) {
    const modulesSnapshot = await getDocs(modulesRef(courseDoc.id));
    const modules = modulesSnapshot.docs.map(mod => ({
      id: mod.id,
      ...mod.data(),
    }));
    
    // Para cada módulo, obtener sus lecciones
    for (const module of modules) {
      const lessonsSnapshot = await getDocs(lessonsRef(courseDoc.id, module.id));
      module.lessons = lessonsSnapshot.docs.map(lesson => ({
        id: lesson.id,
        ...lesson.data(),
      }));
    }
    
    courses.push({
      id: courseDoc.id,
      ...courseDoc.data(),
      modules,
    });
  }
  
  return courses;
};