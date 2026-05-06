export const accessRules = {
  // 📚 CURSO
  canAccessCourse: (user, courseId) => {
    if (!user) return false;
    if (user.role === "admin") return true;
    if (user.accessType === "all" && accessRules.isPremiumActive(user)) return true;
    return user.enrolledCourses?.includes(courseId);
  },

  // 📖 LECCIÓN (preparado para escalar a módulos después)
  canAccessLesson: (user, courseId) => {
    if (!user) return false;
    if (user.role === "admin") return true;
    if (user.accessType === "all" && accessRules.isPremiumActive(user)) return true;
    return user.enrolledCourses?.includes(courseId);
  },

  // 👑 ADMIN
  isAdmin: (user) => user?.role === "admin",

  // 🌿 PREMIUM ACTIVO
  isPremiumActive: (user) => {
    if (!user?.premiumExpiry) return false;
    const expiry = user.premiumExpiry?.toDate?.() || user.premiumExpiry;
    return expiry > new Date();
  },

  // 🌿 INVITADO
  isGuest: (user) => !user,

  // 🧭 NIVEL DE ACCESO (UI consciente)
  getAccessLevel: (user) => {
    if (!user) return "guest";
    if (user.role === "admin") return "admin";
    if (user.accessType === "all" && accessRules.isPremiumActive(user)) return "full";
    return "limited";
  },
};