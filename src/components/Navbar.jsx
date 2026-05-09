import { memo } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase/config'
import { useAuth } from '../hooks/useAuth'
import { useSettings } from '../context/SettingsContext'

function Navbar() {
  const { user } = useAuth()
  const { settings } = useSettings()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    try {
      await signOut(auth)
      navigate('/login', { replace: true })
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const linkClass = (path) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition ${
      isActive(path)
        ? 'bg-indigo-100 text-indigo-700'
        : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
    }`

  return (
    <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-3 flex justify-between items-center">

        <Link
          to="/"
          className="flex items-center gap-2 text-xl font-bold text-indigo-600 hover:text-indigo-700 transition"
        >
          {settings.logoUrl && (
            <img
              src={settings.logoUrl}
              alt={settings.schoolName}
              className="h-8 w-8 object-contain rounded"
              onError={(e) => { e.target.style.display = 'none' }}
            />
          )}
          <span className="hidden sm:inline">{settings.schoolName}</span>
        </Link>

        <div className="flex items-center gap-1">
          <Link to="/" className={linkClass('/')}>Inicio</Link>
          <Link to="/suscribirse" className={linkClass('/suscribirse')}>Cursos</Link>
          {user?.role === 'admin' && (
            <Link to="/admin" className={linkClass('/admin')}>Admin</Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
           <Link
            to="/perfil"
            className="text-sm text-slate-500 hidden md:block hover:text-indigo-600 transition"
>
            {user.email}
          </Link>
              <button
                onClick={handleLogout}
                className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition text-sm font-medium"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm font-medium shadow-sm"
            >
              Iniciar sesión
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}


export default memo(Navbar)
