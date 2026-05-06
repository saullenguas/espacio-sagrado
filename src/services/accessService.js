import { userService } from './userService'

// Inscribir a un usuario en un curso
// Usado internamente — en producción esto lo hace la Cloud Function
export const enrollUserInCourse = async (userId, courseId) => {
  const user = await userService.getUserById(userId)

  const updatedCourses = user?.enrolledCourses
    ? [...new Set([...user.enrolledCourses, courseId])]
    : [courseId]

  await userService.updateUser(userId, { enrolledCourses: updatedCourses })
  return updatedCourses
}
