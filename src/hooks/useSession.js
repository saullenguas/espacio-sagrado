import { useMemo } from "react";
import { useAuth } from "./useAuth";
import { canAccessCourse as checkAccess, isPremiumActive, hasFullAccess } from "../domain/userModel";

export function useSession() {
  const { user, loading, refreshUser } = useAuth();

  // Datos del usuario normalizados desde Firestore (via AuthProvider)
  // No se mezcla con localStorage ni fuentes externas
  const safeUser = useMemo(() => {
    if (!user) return null;
    return {
      ...user,
      role: user.role || "student",
      accessType: user.accessType || "limited",
      enrolledCourses: user.enrolledCourses || [],
    };
  }, [user]);

  // Acceso a curso — fuente de verdad: Firestore únicamente
  const canAccessCourse = (courseId) => checkAccess(safeUser, courseId);

  const isPremium = isPremiumActive(safeUser);
  const isAdmin = safeUser?.role === "admin";
  const hasAll = hasFullAccess(safeUser);

  return {
    user: safeUser,
    loading,
    refreshUser,
    canAccessCourse,
    isPremium,
    isAdmin,
    hasFullAccess: hasAll,
  };
}
