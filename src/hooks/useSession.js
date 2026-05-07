import { useMemo, useCallback } from "react"
import { useAuth } from "./useAuth"
import {
  canAccessCourse as checkAccess,
  isPremiumActive,
  hasFullAccess,
} from "../domain/userModel"

export function useSession() {
  const { user, loading, refreshUser } = useAuth()

  const safeUser = useMemo(() => {
    if (!user) return null
    return {
      ...user,
      role: user.role || "student",
      accessType: user.accessType || "limited",
      enrolledCourses: user.enrolledCourses || [],
    }
  }, [user])

  const canAccessCourse = useCallback(
    (courseId) => checkAccess(safeUser, courseId),
    [safeUser]
  )

  const isPremium = isPremiumActive(safeUser)
  const isAdmin = safeUser?.role === "admin"
  const hasAll = hasFullAccess(safeUser)

  return {
    user: safeUser,
    loading,
    refreshUser,
    canAccessCourse,
    isPremium,
    isAdmin,
    hasFullAccess: hasAll,
  }
}