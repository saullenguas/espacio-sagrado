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

const modulesRef = (courseId) =>
  collection(db, "courses", courseId, "modules");

const lessonsRef = (courseId, moduleId) =>
  collection(db, "courses", courseId, "modules", moduleId, "lessons");

export const getModulesByCourse = async (courseId) => {
  const snapshot = await getDocs(modulesRef(courseId));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getModuleById = async (courseId, moduleId) => {
  const ref = doc(db, "courses", courseId, "modules", moduleId);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const createModule = async (courseId, data) => {
  return await addDoc(modulesRef(courseId), {
    ...data,
    createdAt: serverTimestamp(),
  });
};

export const updateModule = async (courseId, moduleId, data) => {
  const ref = doc(db, "courses", courseId, "modules", moduleId);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
};

export const deleteModule = async (courseId, moduleId) => {
  const ref = doc(db, "courses", courseId, "modules", moduleId);
  await deleteDoc(ref);
};

export const getLessonsByModule = async (courseId, moduleId) => {
  const snapshot = await getDocs(lessonsRef(courseId, moduleId));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getLessonById = async (courseId, moduleId, lessonId) => {
  const ref = doc(
    db, "courses", courseId, "modules", moduleId, "lessons", lessonId
  );
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const createLesson = async (courseId, moduleId, data) => {
  return await addDoc(lessonsRef(courseId, moduleId), {
    ...data,
    createdAt: serverTimestamp(),
  });
};

export const updateLesson = async (courseId, moduleId, lessonId, data) => {
  const ref = doc(
    db, "courses", courseId, "modules", moduleId, "lessons", lessonId
  );
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
};

export const deleteLesson = async (courseId, moduleId, lessonId) => {
  const ref = doc(
    db, "courses", courseId, "modules", moduleId, "lessons", lessonId
  );
  await deleteDoc(ref);
};

export const getAllCoursesWithModules = async () => {
  const coursesSnapshot = await getDocs(collection(db, "courses"));

  return Promise.all(
    coursesSnapshot.docs.map(async (courseDoc) => {
      const modulesSnapshot = await getDocs(modulesRef(courseDoc.id));

      const modules = await Promise.all(
        modulesSnapshot.docs.map(async (mod) => {
          const lessonsSnapshot = await getDocs(
            lessonsRef(courseDoc.id, mod.id)
          );
          return {
            id: mod.id,
            ...mod.data(),
            lessons: lessonsSnapshot.docs.map((l) => ({
              id: l.id,
              ...l.data(),
            })),
          };
        })
      );

      return {
        id: courseDoc.id,
        ...courseDoc.data(),
        modules,
      };
    })
  );
};