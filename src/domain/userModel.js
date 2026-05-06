// 🧠 CONSTANTES DE DOMINIO
export const USER_ROLES = {
  STUDENT: "student",
  ADMIN: "admin",
  // PREMIUM no existe como rol — el acceso premium se controla
  // con accessType: 'all' + premiumExpiry, no con un rol separado
};

export const ACCESS_TYPES = {
  LIMITED: "limited",
  ALL: "all",
  GUEST: "guest",
};

// 🧠 MODELO BASE
export const createUserModel = (data = {}) => ({
  uid: data.uid || data.id || null,
  email: data.email || null,
  role: data.role || USER_ROLES.STUDENT,
  accessType: data.accessType || ACCESS_TYPES.LIMITED,
  enrolledCourses: data.enrolledCourses || [],
  premiumExpiry: data.premiumExpiry || null,
  lastCourseId: data.lastCourseId || null,
  lastModuleId: data.lastModuleId || null,
  lastLessonId: data.lastLessonId || null,
  phase: data.phase || "guided",
  createdAt: data.createdAt || null,
  updatedAt: data.updatedAt || null,
});

// 🔍 HELPERS PUROS

export const isAdmin = (user) =>
  user?.role === USER_ROLES.ADMIN;

export const isPremiumActive = (user) => {
  if (!user?.premiumExpiry) return false;
  const expiry = user.premiumExpiry?.toDate?.() ?? new Date(user.premiumExpiry);
  return expiry > new Date();
};

// isPremium = tiene accessType all Y su suscripción está vigente
export const isPremium = (user) =>
  user?.accessType === ACCESS_TYPES.ALL && isPremiumActive(user);

export const hasFullAccess = (user) =>
  isAdmin(user) || isPremium(user);

export const isGuest = (user) =>
  !user || user?.accessType === ACCESS_TYPES.GUEST;

export const isEnrolledInCourse = (user, courseId) => {
  if (!user || !courseId) return false;
  if (hasFullAccess(user)) return true;
  return user.enrolledCourses?.includes(courseId) ?? false;
};

export const canAccessCourse = (user, courseId) =>
  isAdmin(user) || isEnrolledInCourse(user, courseId);

// 🔄 ADAPTER
export const userAdapter = {
  toDomain(raw) {
    if (!raw) return null;
    return {
      uid: raw.uid,
      email: raw.email,
      role: raw.role ?? USER_ROLES.STUDENT,
      accessType: raw.accessType ?? ACCESS_TYPES.LIMITED,
      enrolledCourses: raw.enrolledCourses || [],
      premiumExpiry: raw.premiumExpiry || null,
      lastCourseId: raw.lastCourseId || null,
      lastModuleId: raw.lastModuleId || null,
      lastLessonId: raw.lastLessonId || null,
      phase: raw.phase || "guided",
      createdAt: raw.createdAt || null,
      updatedAt: raw.updatedAt || null,
    };
  },
  toPersistence(user) {
    return {
      uid: user.uid,
      email: user.email,
      role: user.role,
      accessType: user.accessType,
      enrolledCourses: user.enrolledCourses,
      premiumExpiry: user.premiumExpiry || null,
      lastCourseId: user.lastCourseId || null,
      lastModuleId: user.lastModuleId || null,
      lastLessonId: user.lastLessonId || null,
      phase: user.phase || null,
      createdAt: user.createdAt || null,
      updatedAt: user.updatedAt || null,
    };
  },
};