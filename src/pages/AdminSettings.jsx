import { useEffect, useState } from 'react'
import { getSettings, updateSettings } from '../services/settingsService'
import { useToast } from '../hooks/useToast'
import Toast from '../components/Toast'

function AdminSettings() {
  const [settings, setSettings] = useState({
    schoolName: '',
    heroPhrase: '',
    logoUrl: ''
  })
  const [saving, setSaving] = useState(false)
  const { toast, showToast, clearToast } = useToast()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const data = await getSettings()
      setSettings(data)
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateSettings(settings)
      showToast('✅ Configuración guardada con amor', 'success')
    } catch {
      showToast('Error al guardar', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-purple-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h1 className="text-2xl font-bold text-slate-800">⚙️ Configuración de la Escuela</h1>
          <p className="text-slate-500 mt-2 mb-6">
            Personaliza el nombre, el logo y la frase principal de la plataforma.
          </p>

          <Toast message={toast.message} type={toast.type} onClose={clearToast} />

          <form onSubmit={handleSave} className="space-y-5">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nombre de la escuela
              </label>
              <input
                type="text"
                value={settings.schoolName}
                onChange={(e) =>
                  setSettings({ ...settings, schoolName: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder="Ej: Luz y Consciencia"
              />
            </div>

            {/* Logo URL */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                URL del logo
              </label>
              <input
                type="url"
                value={settings.logoUrl}
                onChange={(e) =>
                  setSettings({ ...settings, logoUrl: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder="https://ejemplo.com/logo.png"
              />
              {settings.logoUrl && (
                <div className="mt-2 flex items-center gap-3">
                  <img
                    src={settings.logoUrl}
                    alt="vista previa"
                    className="h-12 w-12 object-contain rounded-lg border border-slate-200"
                  />
                  <span className="text-xs text-slate-400">Vista previa</span>
                </div>
              )}
            </div>

            {/* Frase hero */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Frase principal (Hero)
              </label>
              <textarea
                value={settings.heroPhrase}
                onChange={(e) =>
                  setSettings({ ...settings, heroPhrase: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder="Un espacio para recordar quién eres"
              />
            </div>

            {/* Botón guardar */}
            <button
              type="submit"
              disabled={saving}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 font-medium"
            >
              {saving ? 'Guardando...' : '💾 Guardar configuración'}
            </button>
          </form>

          <div className="mt-6 text-xs text-slate-400 border-t border-slate-100 pt-4">
            <p>🔮 Los cambios se verán reflejados en toda la plataforma después de guardar.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminSettings