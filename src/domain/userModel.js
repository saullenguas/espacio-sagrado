// 🧠 CONSTANTES DE DOMINIO
export const USER_ROLES = {
  STUDENT: "student",
  PREMIUM: "premium",
  ADMIN: "admin",
};

export const ACCESS_TYPES = {
  LIMITED: "limited",
  ALL: "all",
  GUEST: "guest",
};

// 🧠 MODELO BASE (DOMINIO PURO)
export const createUserModel = (data = {}) => {
  return {
    uid: data.uid || data.id || null,
    email: data.email || null,
    role: data.role || USER_ROLES.STUDENT,
    accessType: data.accessType || ACCESS_TYPES.LIMITED,
    enrolledCourses: data.enrolledCourses || [],
    premiumExpiry: data.premiumExpiry || null, // ← NUEVO
    lastCourseId: data.lastCourseId || null,
    lastModuleId: data.lastModuleId || null,
    lastLessonId: data.lastLessonId || null,
    phase: data.phase || "guided",
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  };
};

// 🔍 HELPERS PUROS (SIN INFRAESTRUCTURA)
export const isAdmin = (user) => user?.role === USER_ROLES.ADMIN;
export const isPremium = (user) => user?.role === USER_ROLES.PREMIUM;

export const isPremiumActive = (user) => {
  if (!user?.premiumExpiry) return false;
  const expiry = user.premiumExpiry?.toDate?.() || user.premiumExpiry;
  return expiry > new Date();
};

export const hasFullAccess = (user) =>
  isAdmin(user) ||
  (user?.accessType === ACCESS_TYPES.ALL && isPremiumActive(user));

export const isGuest = (user) => !user || user?.accessType === ACCESS_TYPES.GUEST;

export const isEnrolledInCourse = (user, courseId) => {
  if (!user || !courseId) return false;
  if (hasFullAccess(user)) return true;
  return user.enrolledCourses?.includes(courseId) ?? false;
};

export const canAccessCourse = (user, courseId) =>
  isAdmin(user) || isEnrolledInCourse(user, courseId);

// 🔄 ADAPTER (PUENTE DOMINIO ⇄ INFRAESTRUCTURA)
export const userAdapter = {
  toDomain(raw) {
    if (!raw) return null;
    const hasFirestoreData = raw.role !== undefined;
    return {
      uid: raw.uid,
      email: raw.email,
      role: hasFirestoreData ? raw.role : USER_ROLES.STUDENT,
      accessType: hasFirestoreData ? raw.accessType : ACCESS_TYPES.LIMITED,
      enrolledCourses: raw.enrolledCourses || [],
      premiumExpiry: raw.premiumExpiry || null, // ← NUEVO
      lastCourseId: raw.lastCourseId,
      lastModuleId: raw.lastModuleId,
      lastLessonId: raw.lastLessonId,
      phase: raw.phase,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  },
  toPersistence(user) {
    return {
      uid: user.uid,
      email: user.email,
      role: user.role,
      accessType: user.accessType,
      enrolledCourses: user.enrolledCourses,
      premiumExpiry: user.premiumExpiry || null, // ← NUEVO
      lastCourseId: user.lastCourseId,
      lastModuleId: user.lastModuleId,
      lastLessonId: user.lastLessonId,
      phase: user.phase,
      createdAt: user.createdAt || null,
      updatedAt: user.updatedAt || null,
    };
  },
};