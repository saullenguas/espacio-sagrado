import { firebaseUserAdapter } from "../infrastructure/firebase/firebaseUserAdapter";

export const enrollmentService = {
  async enrollUser(user, courseId) {
    // 🔐 validaciones
    if (!user) throw new Error("Debes iniciar sesión");

    if (user.role === "admin") {
      throw new Error("Admin no necesita inscribirse");
    }

    if (user.accessType === "all") {
      throw new Error("Ya tienes acceso total");
    }

    if (user.enrolledCourses?.includes(courseId)) {
      throw new Error("Ya estás inscrito en este curso");
    }

    // 📦 actualizar cursos
    const updatedCourses = [
      ...(user.enrolledCourses || []),
      courseId,
    ];

    // 💾 persistencia (infraestructura)
    await firebaseUserAdapter.updateUser(user.uid, {
      enrolledCourses: updatedCourses,
    });

    // 🧠 devolver usuario actualizado (clave para UI reactiva)
    return {
      ...user,
      enrolledCourses: updatedCourses,
    };
  },
};