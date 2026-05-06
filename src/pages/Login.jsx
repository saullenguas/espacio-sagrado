import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Por favor, completa todos los campos.')
      return
    }

    try {
      await login(email, password)
      navigate('/')
    } catch (error) {
      console.error('Error al iniciar sesión:', error)
      if (error.code === 'auth/user-not-found') {
        setError('No encontramos una cuenta con ese correo.')
      } else if (error.code === 'auth/wrong-password') {
        setError('Contraseña incorrecta.')
      } else if (error.code === 'auth/invalid-email') {
        setError('El formato del correo no es válido.')
      } else if (error.code === 'auth/invalid-credential') {
        setError('Credenciales inválidas. Verifica tu correo y contraseña.')
      } else {
        setError('Ocurrió un error al iniciar sesión. Inténtalo de nuevo.')
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-indigo-100 px-4">
      <div className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-semibold text-indigo-900 mb-2 text-center">
          Luz y Consciencia
        </h1>
        <p className="text-indigo-500 text-center mb-8">Escuela de conciencia</p>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition bg-gray-50/50"
              placeholder="tu@correo.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition bg-gray-50/50"
              placeholder="••••••••"
              required
            />
          </div>

          {/* Recordar sesión + Olvidé contraseña */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-400"
              />
              Recordar sesión
            </label>
            <Link
              to="/reset-password"
              className="text-indigo-600 hover:text-indigo-800 hover:underline transition"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          {/* Mensaje de error */}
          {error && (
            <p className="text-red-500 text-sm text-center bg-red-50 py-2 px-4 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            Iniciar sesión
          </button>
        </form>

        {/* Enlace a registro */}
        <p className="text-center text-sm text-gray-500 mt-6">
          ¿No tienes cuenta?{' '}
          <Link
            to="/registro"
            className="text-indigo-700 font-medium hover:underline"
          >
            Regístrate aquí
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login