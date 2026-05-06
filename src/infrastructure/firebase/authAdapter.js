import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { auth } from '../../firebase/config'
import { createUserModel } from '../../domain/userModel'

export const authAdapter = {
  register: async (email, password) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    return createUserModel({
      uid: cred.user.uid,
      email: cred.user.email,
      role: 'student',
      accessType: 'limited',
    })
  },

  login: async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    // Forzar recarga del token para obtener los claims más recientes
    await cred.user.getIdToken(true)
    const tokenResult = await cred.user.getIdTokenResult()
    return createUserModel({
      uid: cred.user.uid,
      email: cred.user.email,
      role: tokenResult.claims.role || 'student',
    })
  },

  logout: () => signOut(auth),

  onAuthStateChanged: (callback) => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Leer el token con claims para obtener el rol asignado por Cloud Functions
        const tokenResult = await firebaseUser.getIdTokenResult()
        callback(createUserModel({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          role: tokenResult.claims.role || 'student',
        }))
      } else {
        callback(null)
      }
    })
  },

  getCurrentUser: () => {
    const user = auth.currentUser
    if (!user) return null
    return createUserModel({ uid: user.uid, email: user.email })
  },

  resetPassword: async (email) => {
    return sendPasswordResetEmail(auth, email)
  },

  // Forzar recarga del token — útil después de asignar un nuevo rol
  refreshToken: async () => {
    const user = auth.currentUser
    if (user) await user.getIdToken(true)
  },
}
