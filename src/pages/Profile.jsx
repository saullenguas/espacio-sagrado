import { useState } from 'react'
import { useSession } from '../hooks/useSession'
import { useAuth } from '../hooks/useAuth'
import { Link } from 'react-router-dom'

function Profile() {
  const { user, isPremium } = useSession()
  const { resetPassword } = useAuth()
  const [resetSent, setResetSent] = useState(false)
  const [resetError, setResetError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleResetPassword = async () => {
    setLoading(true)
    setResetError('')
    try {
      await resetPassword(user.email)
      setResetSent(true)
    } catch (error) {
      setResetError('No se pudo enviar el correo. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date) => {
    if (!date) return null
    const d = date?.toDate?.() || new Date(date)
    return d.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-purple-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Encabezado */}
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🌿</div>
          <h1 className="text-2xl font-bold text-slate-800">Mi espacio</h1>
          <p className="text-slate-500 mt-2">{user.email}</p>
        </div>

        {/* Acceso y suscripción */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-700 mb-4">✨ Mi acceso</h2>

          {user.accessType === 'all' ? (
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
              <p className="text-purple-700 font-medium">💎 Acceso total activo</p>
              {user.premiumExpiry && (
                <p className="text-purple-500 text-sm mt-1">
                  Válido hasta: {formatDate(user.premiumExpiry)}
                </p>
              )}
              {!isPremium && user.premiumExpiry && (
                <div className="mt-3 bg-amber-50 rounded-lg p-3 border border-amber-100">
                  <p className="text-amber-700 text-sm">⚠️ Tu acceso premium ha vencido.</p>
                  <Link
                    to="/checkout?type=premium"
                    className="inline-block mt-2 text-sm bg-indigo-600 text-white px-4 py-1.5 rounded-lg hover:bg-indigo-700 transition"
                  >
                    Renovar acceso
                  </Link>
                </div>
              )}
            </div>
          ) : user.enrolledCourses?.length > 0 ? (
            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
              <p className="text-indigo-700 font-medium">
                📚 {user.enrolledCourses.length} curso(s) adquirido(s)
              </p>
              <Link
                to="/checkout?type=premium"
                className="inline-block mt-3 text-sm bg-purple-600 text-white px-4 py-1.5 rounded-lg hover:bg-purple-700 transition"
              >
                Actualizar a acceso total
              </Link>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-slate-500">Aún no tienes cursos adquiridos.</p>
              <Link
                to="/suscribirse"
                className="inline-block mt-3 text-sm bg-indigo-600 text-white px-4 py-1.5 rounded-lg hover:bg-indigo-700 transition"
              >
                Explorar cursos
              </Link>
            </div>
          )}
        </section>

        {/* Seguridad */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-700 mb-4">🔐 Seguridad</h2>

          {resetSent ? (
            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
              <p className="text-green-700 text-sm">
                ✅ Te enviamos un correo a <strong>{user.email}</strong> para cambiar tu contraseña.
              </p>
            </div>
          ) : (
            <div>
              <p className="text-slate-500 text-sm mb-4">
                Te enviaremos un correo con un enlace para cambiar tu contraseña.
              </p>
              {resetError && (
                <p className="text-red-500 text-sm mb-3">{resetError}</p>
              )}
              <button
                onClick={handleResetPassword}
                disabled={loading}
                className="bg-slate-100 text-slate-700 px-6 py-2 rounded-lg hover:bg-slate-200 transition font-medium disabled:opacity-50"
              >
                {loading ? 'Enviando...' : 'Cambiar contraseña'}
              </button>
            </div>
          )}
        </section>

        {/* Volver */}
        <div className="text-center pb-8">
          <Link to="/" className="text-indigo-600 hover:text-indigo-800 transition font-medium">
            ← Volver al inicio
          </Link>
        </div>

      </div>
    </div>
  )
}

export default Profile