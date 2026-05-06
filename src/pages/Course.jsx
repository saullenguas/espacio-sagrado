import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getCourseById } from '../services/courseService'
import { getModulesByCourse } from '../services/moduleService'
import { useSession } from '../hooks/useSession'
import Breadcrumbs from '../components/Breadcrumbs'

function Course() {
  const { id } = useParams()
  const { user, canAccessCourse, loading: sessionLoading } = useSession()
  const [course, setCourse] = useState(null)
  const [modules, setModules] = useState([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (sessionLoading) return

    const loadCourse = async () => {
      try {
        const courseData = await getCourseById(id)
        setCourse(courseData)
        if (courseData) {
          const modulesData = await getModulesByCourse(id)
          setModules(modulesData)
        }
      } catch (error) {
        console.error('Error al cargar el curso:', error)
      } finally {
        setLoadingData(false)
      }
    }

    loadCourse()
  }, [id, sessionLoading])

  if (sessionLoading || loadingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="text-center mt-16 p-6">
        <p className="text-slate-500 text-lg">Este curso no está disponible en este momento.</p>
        <Link to="/" className="mt-4 inline-block text-indigo-600 hover:underline font-medium">← Volver al inicio</Link>
      </div>
    )
  }

  // Acceso desde Firestore únicamente
  const hasAccess = user && canAccessCourse(id)

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Breadcrumbs />
      <button onClick={() => window.history.back()} className="mb-4 text-sm text-indigo-600 hover:text-indigo-800 transition flex items-center gap-1">
        ← Volver
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        {course.imagen_url ? (
          <img src={course.imagen_url} alt={course.titulo || 'Curso'} className="w-full h-48 object-cover rounded-xl mb-6" loading="lazy" />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl mb-6 flex items-center justify-center">
            <span className="text-6xl">📚</span>
          </div>
        )}

        <h1 className="text-3xl font-bold text-slate-800">{course.titulo || course.title || 'Curso en preparación'}</h1>
        <p className="text-slate-600 mt-2 text-lg">{course.descripcion || 'Un curso para expandir tu conciencia.'}</p>

        <div className="mt-6 bg-indigo-50 rounded-xl p-4 text-indigo-700 text-sm">
          🌿 Explora los módulos de este curso. Cuando sientas el llamado, puedes adquirirlo o unirte al acceso total.
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold text-slate-700 mb-4">Módulos del curso</h2>
          {modules.length === 0 ? (
            <p className="text-slate-500 text-center py-8">Este curso está siendo creado. Pronto encontrarás aquí los módulos.</p>
          ) : (
            <div className="space-y-3">
              {modules.map((mod, index) => (
                <div key={mod.id} className="group bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md hover:border-indigo-200 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-sm font-semibold">
                        {index + 1}
                      </span>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
                          {mod.titulo || 'Módulo sin título'}
                        </h3>
                        {mod.descripcion && <p className="text-sm text-slate-500 mt-0.5">{mod.descripcion}</p>}
                      </div>
                    </div>
                    {hasAccess ? (
                      <Link to={`/course/${id}/module/${mod.id}`} className="text-indigo-600 hover:text-indigo-800 font-medium transition flex items-center gap-1">
                        Explorar <span className="text-lg">→</span>
                      </Link>
                    ) : (
                      <span className="text-slate-400 text-sm flex items-center gap-1 cursor-default">🔒 Bloqueado</span>
                    )}
                  </div>

                  {user && !hasAccess && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <p className="text-sm text-slate-500 italic">
                        "Esta lección está esperando que resuene contigo. Cuando sientas el llamado, puedes adquirir este curso o unirte al acceso total."
                      </p>
                      <div className="flex gap-3 mt-3">
                        <Link to={`/checkout?type=course&courseId=${id}`} className="text-sm bg-indigo-600 text-white px-4 py-1.5 rounded-lg hover:bg-indigo-700 transition">
                          Adquirir este curso
                        </Link>
                        <Link to="/checkout?type=premium" className="text-sm bg-purple-600 text-white px-4 py-1.5 rounded-lg hover:bg-purple-700 transition">
                          Obtener acceso total
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {!user && (
          <div className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 text-center border border-indigo-100">
            <p className="text-indigo-700 mb-4 text-lg">¿Este curso resuena contigo?</p>
            <p className="text-slate-500 text-sm mb-4">Inicia sesión o regístrate para continuar.</p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link to={`/registro?type=course&courseId=${id}&redirect=/checkout`} className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition font-medium">
                Adquirir este curso
              </Link>
              <Link to="/registro?type=premium&redirect=/checkout" className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition font-medium">
                Obtener acceso total
              </Link>
            </div>
            <div className="mt-4 text-sm text-slate-400">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-indigo-600 hover:underline">Inicia sesión</Link>
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link to="/" className="text-indigo-600 hover:text-indigo-800 transition font-medium">← Todos los cursos</Link>
        </div>
      </div>
    </div>
  )
}

export default Course
