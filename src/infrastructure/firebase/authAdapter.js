import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
} from 'firebase/auth'
import { auth } from '../../firebase/config'
import { createUserModel } from '../../domain/userModel'

export const authAdapter = {
  register: async (email, password) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await sendEmailVerification(cred.user)
    return createUserModel({
      uid: cred.user.uid,
      email: cred.user.email,
      role: 'student',
      accessType: 'limited',
    })
  },

  login: async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password)
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

  refreshToken: async () => {
    const user = auth.currentUser
    if (user) await user.getIdToken(true)
  },
}