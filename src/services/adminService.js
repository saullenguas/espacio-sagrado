import { getFunctions, httpsCallable } from 'firebase/functions'

const functions = getFunctions(undefined, 'us-central1')

export const enrollStudentManually = async ({ email, type, courseId = null, duration = '1y' }) => {
  const fn = httpsCallable(functions, 'enrollStudentManually')
  const result = await fn({ email, type, courseId, duration })
  return result.data
}

export const revokeStudentAccess = async (uid, courseId = null) => {
  const fn = httpsCallable(functions, 'revokeStudentAccess')
  const result = await fn({ uid, courseId })
  return result.data
}

export const deleteStudentAccount = async (uid, adminToken) => {
  const baseUrl = import.meta.env.VITE_DELETE_USER_URL

  if (!baseUrl) {
    throw new Error('VITE_DELETE_USER_URL no está configurada en el archivo .env')
  }

  const res = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ uid }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error desconocido' }))
    throw new Error(err.error || 'Error eliminando cuenta')
  }

  return res.json()
}