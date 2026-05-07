import { createContext, useContext, useEffect, useState } from 'react'
import { getSettings } from '../services/settingsService'

const defaultSettings = {
  schoolName: 'Luz y Consciencia',
  heroPhrase: 'Un espacio para recordar quién eres',
  logoUrl: '',
}

const SettingsContext = createContext(defaultSettings)

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(defaultSettings)

  useEffect(() => {
    getSettings().then(setSettings).catch(() => {})
  }, [])

  // Permite actualizar el contexto desde AdminSettings sin recargar
  const refreshSettings = async () => {
    const data = await getSettings()
    setSettings(data)
  }

  return (
    <SettingsContext.Provider value={{ settings, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => useContext(SettingsContext)