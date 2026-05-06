import { getFunctions, httpsCallable } from 'firebase/functions'

const functions = getFunctions(undefined, 'us-central1')

// ─────────────────────────────────────────────
// ALTA MANUAL DE ALUMNO
// ─────────────────────────────────────────────

/**
 * Da de alta a un alumno manualmente (sin pago en plataforma).
 * Si el email no tiene cuenta, se crea una y se genera link de acceso.
 *
 * @param {object} params
 * @param {string} params.email
 * @param {'course'|'premium'} params.type
 * @param {string|null} params.courseId   — requerido si type === 'course'
 * @param {'1y'|'6m'} params.duration    — solo para premium
 */
export const enrollStudentManually = async ({ email, type, courseId = null, duration = '1y' }) => {
  const fn = httpsCallable(functions, 'enrollStudentManually')
  const result = await fn({ email, type, courseId, duration })
  return result.data
}

// ─────────────────────────────────────────────
// REVOCAR ACCESO (sin eliminar cuenta)
// ─────────────────────────────────────────────

/**
 * Revoca el acceso de un alumno.
 * - Si se pasa courseId: revoca solo ese curso.
 * - Si no: revoca todo (premium + cursos).
 *
 * @param {string} uid
 * @param {string|null} courseId
 */
export const revokeStudentAccess = async (uid, courseId = null) => {
  const fn = httpsCallable(functions, 'revokeStudentAccess')
  const result = await fn({ uid, courseId })
  return result.data
}

// ─────────────────────────────────────────────
// ELIMINAR CUENTA COMPLETA
// ─────────────────────────────────────────────

/**
 * Elimina la cuenta del alumno de Auth + Firestore.
 * Usar solo cuando se quiere borrar permanentemente.
 * Para "dar de baja" sin eliminar, usar revokeStudentAccess.
 *
 * @param {string} uid
 * @param {string} adminToken  — idToken del admin autenticado
 */
export const deleteStudentAccount = async (uid, adminToken) => {
  const baseUrl = import.meta.env.VITE_FUNCTIONS_URL || 'https://us-central1-YOUR_PROJECT.cloudfunctions.net'

  const res = await fetch(`${baseUrl}/deleteUserAccount`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ uid }),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Error eliminando cuenta')
  }

  return res.json()
}