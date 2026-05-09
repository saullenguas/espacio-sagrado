import { db } from '../firebase/config'
import { doc, getDoc, setDoc } from 'firebase/firestore'

const SETTINGS_ID = 'global'

const defaultSettings = {
  schoolName: 'Luz y Consciencia',
  heroPhrase: 'Un espacio para recordar quién eres',
  logoUrl: ''
}

let settingsCache = null
let settingsCacheTime = null
const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

export const getSettings = async () => {
  const now = Date.now()
  if (settingsCache && settingsCacheTime && (now - settingsCacheTime) < CACHE_TTL) {
    return settingsCache
  }
  try {
    const docRef = doc(db, 'settings', SETTINGS_ID)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      settingsCache = { ...defaultSettings, ...docSnap.data() }
      settingsCacheTime = now
      return settingsCache
    }
    await setDoc(docRef, defaultSettings)
    settingsCache = defaultSettings
    settingsCacheTime = now
    return defaultSettings
  } catch (error) {
    console.error('Error al obtener settings:', error)
    return settingsCache || defaultSettings
  }
}

export const updateSettings = async (data) => {
  settingsCache = null
  settingsCacheTime = null
  try {
    const docRef = doc(db, 'settings', SETTINGS_ID)
    await setDoc(docRef, data, { merge: true })
    return true
  } catch (error) {
    console.error('Error al actualizar settings:', error)
    throw error
  }
}