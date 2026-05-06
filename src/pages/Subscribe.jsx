import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getCourses } from '../services/courseService'
import { useSession } from '../hooks/useSession'
import { useToast } from '../hooks/useToast'
import Toast from '../components/Toast'

function Subscribe() {
  const { user, canAccessCourse, loading: sessionLoading } = useSession()
  const [courses, setCourses] = useState([])
  const navigate = useNavigate()
  const { toast, showToast, clearToast } = useToast()

  useEffect(() => {
    getCourses().then(setCourses)
  }, [])

  const handleEnroll = (courseId) => {
    if (!user) {
      showToast('Debes iniciar sesión primero', 'warning')
      navigate('/login')
      return
    }
    navigate(`/checkout?type=course&courseId=${courseId}`)
  }

  const handlePremium = () => {
    if (!user) {
      showToast('Debes iniciar sesión', 'warning')
      navigate('/login')
      return
    }
    navigate('/checkout?type=premium')
  }

  if (sessionLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Toast message={toast.message} type={toast.type} onClose={clearToast} />

      <h1 className="text-3xl font-bold mb-2">Cursos disponibles</h1>
      <p className="text-slate-600 mb-8">
        Elige un curso o suscríbete al plan premium para acceso completo.
      </p>

      {/* CURSOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map(course => {
          // Acceso determinado únicamente por Firestore vía contexto
          const hasAccess = user && canAccessCourse(course.id)

          return (
            <div key={course.id} className="bg-white rounded-2xl shadow-md p-5 border border-slate-100">

              {course.imagen_url ? (
                <img
                  src={course.imagen_url}
                  alt={course.titulo || 'Curso'}
                  className="w-full h-40 object-cover rounded-lg mb-4"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-40 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg mb-4 flex items-center justify-center">
                  <span className="text-4xl">📚</span>
                </div>
              )}

              <h3 className="text-lg font-semibold text-slate-800">
                {course.titulo || course.title || 'Curso en preparación'}
              </h3>

              <p className="text-slate-600 text-sm mt-2 line-clamp-2">
                {course.descripcion || 'Un curso para expandir tu conciencia.'}
              </p>

              <div className="mt-4 space-y-2">
                {hasAccess ? (
                  <Link
                    to={`/course/${course.id}`}
                    className="block w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-center font-medium"
                  >
                    Entrar
                  </Link>
                ) : (
                  <button
                    onClick={() => handleEnroll(course.id)}
                    className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                  >
                    Inscribirme
                  </button>
                )}

                {!user && (
                  <Link
                    to="/login"
                    className="block text-center text-sm text-indigo-600 hover:underline"
                  >
                    Inicia sesión para inscribirte
                  </Link>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* PREMIUM */}
      <div className="mt-12 text-center bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-8 border border-indigo-100">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Plan Premium</h2>
        <p className="text-slate-600 mb-2">Acceso a todos los cursos actuales y futuros.</p>
        <p className="text-slate-500 text-sm mb-6">Elige vigencia semestral o anual al momento del pago.</p>
        <button
          onClick={handlePremium}
          className="bg-purple-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-purple-700 transition"
        >
          Volverse Premium
        </button>
      </div>
    </div>
  )
}

export default Subscribe
