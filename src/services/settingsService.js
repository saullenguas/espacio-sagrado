import { db } from '../firebase/config'
import { doc, getDoc, setDoc } from 'firebase/firestore'

const SETTINGS_ID = 'global'

const defaultSettings = {
  schoolName: 'Luz y Consciencia',
  heroPhrase: 'Un espacio para recordar quién eres',
  logoUrl: ''
}

export const getSettings = async () => {
  try {
    const docRef = doc(db, 'settings', SETTINGS_ID)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return { ...defaultSettings, ...docSnap.data() }
    }
    // Crear con valores por defecto si no existe
    await setDoc(docRef, defaultSettings)
    return defaultSettings
  } catch (error) {
    console.error('Error al obtener settings:', error)
    return defaultSettings
  }
}

export const updateSettings = async (data) => {
  try {
    const docRef = doc(db, 'settings', SETTINGS_ID)
    await setDoc(docRef, data, { merge: true })
    return true
  } catch (error) {
    console.error('Error al actualizar settings:', error)
    throw error
  }
}