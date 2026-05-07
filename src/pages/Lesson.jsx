import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useSession } from '../hooks/useSession'
import { useAuth } from '../hooks/useAuth'
import { getModulesByCourse, getLessonsByModule } from '../services/moduleService'
import { getCourseById } from '../services/courseService'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import VideoPlayer from '../components/VideoPlayer'
import DOMPurify from 'dompurify'

function Lesson() {
  const { courseId, lessonId } = useParams()
  const navigate = useNavigate()
  const { user, canAccessCourse, loading: sessionLoading } = useSession()
  const { refreshUser } = useAuth()

  const [lesson, setLesson] = useState(null)
  const [moduleLessons, setModuleLessons] = useState([])
  const [courseModules, setCourseModules] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (sessionLoading) return

    const loadData = async () => {
      try {
        await getCourseById(courseId)
        const modulesData = await getModulesByCourse(courseId)

        const modulesWithLessons = await Promise.all(
          modulesData.map(async (mod) => {
            const lessons = await getLessonsByModule(courseId, mod.id)
            return {
              ...mod,
              lessons: lessons.sort((a, b) => (a.order || 0) - (b.order || 0)),
            }
          })
        )

        setCourseModules(modulesWithLessons)

        let foundLesson = null
        let foundModuleId = null

        for (const mod of modulesWithLessons) {
          const match = mod.lessons.find((l) => l.id === lessonId)
          if (match) {
            foundLesson = match
            foundModuleId = mod.id
            setModuleLessons(mod.lessons)
            break
          }
        }

        setLesson(foundLesson)

        // Guardar progreso del alumno en Firestore
        if (foundLesson && user?.uid) {
          try {
            await updateDoc(doc(db, 'users', user.uid), {
              lastCourseId: courseId,
              lastModuleId: foundModuleId,
              lastLessonId: lessonId,
              lastLessonTitle: foundLesson.titulo || foundLesson.title || '',
            })
          } catch (e) {
            // No bloquear la lección si falla el guardado de progreso
            console.warn('No se pudo guardar el progreso:', e.message)
          }
        }
      } catch (error) {
        console.error('Error cargando lección:', error)
      } finally {
        setLoadingData(false)
      }
    }

    loadData()
  }, [courseId, lessonId, sessionLoading])

  const hasAccess = user && canAccessCourse(courseId)

  if (sessionLoading || loadingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="text-center mt-16 p-6">
        <p className="text-slate-500 text-lg">Lección no encontrada.</p>
        <Link to={`/course/${courseId}`} className="mt-4 inline-block text-indigo-600 hover:underline font-medium">
          ← Volver al curso
        </Link>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-purple-50 p-6">
        <div className="max-w-4xl mx-auto text-center">
          <Link to={`/course/${courseId}`} className="text-indigo-600 hover:underline mb-4 inline-block">
            ← Volver al curso
          </Link>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mt-8">
            <div className="text-6xl mb-4">🔮</div>
            <h1 className="text-2xl font-bold text-slate-800">{lesson.titulo || lesson.title}</h1>
            <p className="text-slate-500 mt-4 italic">
              "Esta lección está esperando que resuene contigo. Cuando sientas el llamado, puedes adquirir este curso o unirte al acceso total."
            </p>
            <div className="flex gap-4 justify-center mt-6 flex-wrap">
              <button
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
                onClick={() => navigate(`/checkout?type=course&courseId=${courseId}`)}
              >
                Adquirir este curso
              </button>
              <button
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
                onClick={() => navigate('/checkout?type=premium')}
              >
                Obtener acceso total
              </button>
            </div>
            {!user && (
              <div className="mt-6 text-sm text-slate-400">
                ¿Ya tienes cuenta?{' '}
                <Link to="/login" className="text-indigo-600 hover:underline">Inicia sesión</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const currentIndex = moduleLessons.findIndex((l) => l.id === lessonId)
  const nextLesson = moduleLessons[currentIndex + 1]
  const prevLesson = moduleLessons[currentIndex - 1]

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-purple-50">
      <div className="flex flex-col md:flex-row">

        {/* Barra lateral — estructura como guía, no como obligación */}
        <aside className="w-full md:w-72 bg-slate-900 text-slate-200 p-6 border-r border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-1">🌿 Tu camino</h3>
          <p className="text-xs text-slate-400 mb-4">
            Sigue tu propio ritmo. Puedes elegir cualquier lección libremente.
          </p>
          {courseModules.map((mod) => (
            <div key={mod.id} className="mb-6">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                {mod.titulo || 'Módulo'}
              </h4>
              {mod.lessons?.map((l) => {
                const isCurrent = l.id === lessonId
                return (
                  <Link
                    key={l.id}
                    to={`/course/${courseId}/lesson/${l.id}`}
                    className={`block px-3 py-2 rounded-lg text-sm transition mb-1 ${
                      isCurrent
                        ? 'bg-indigo-600 text-white font-medium'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <span className="mr-2">{isCurrent ? '🌱' : '○'}</span>
                    {l.titulo || l.title}
                  </Link>
                )
              })}
            </div>
          ))}
        </aside>

        {/* Contenido principal */}
        <main className="flex-1 p-6 max-w-4xl">
          <button
            onClick={() => navigate(-1)}
            className="text-indigo-600 hover:text-indigo-800 transition mb-4 flex items-center gap-1 text-sm"
          >
            ← Volver
          </button>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h1 className="text-2xl font-bold text-slate-800">{lesson.titulo || lesson.title}</h1>

            {/* Navegación entre pasos — libre, el alumno elige */}
            <div className="mt-4 flex gap-2 flex-wrap text-xs text-slate-400">
              {['Intención', 'Contenido', 'Reflexión', 'Integración'].map((label, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={`px-3 py-1 rounded-full border transition ${
                    step === i
                      ? 'bg-indigo-100 text-indigo-700 border-indigo-200 font-medium'
                      : 'border-slate-200 hover:bg-slate-50 hover:text-slate-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* PASO 0 — Intención */}
            {step === 0 && lesson.intention && (
              <div className="mt-6 bg-indigo-50 rounded-xl p-6 border border-indigo-100">
                <h3 className="text-lg font-semibold text-indigo-800">🌿 Intención</h3>
                <p className="text-indigo-700 mt-2 text-lg leading-relaxed">{lesson.intention}</p>
                <button
                  className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
                  onClick={() => setStep(1)}
                >
                  Ir al contenido →
                </button>
              </div>
            )}

            {step === 0 && !lesson.intention && (
              <div className="mt-6 text-center text-slate-400 py-8">
                <p>Esta lección no tiene intención definida.</p>
                <button className="mt-4 text-indigo-600 hover:underline" onClick={() => setStep(1)}>
                  Ir al contenido →
                </button>
              </div>
            )}

            {/* PASO 1 — Contenido */}
            {step === 1 && (
              <div className="mt-6 space-y-6">
                {lesson.videoUrl && (
                  <VideoPlayer url={lesson.videoUrl} title={lesson.titulo || "Video de la lección"} />
                )}
                {lesson.content ? (
                  <div
                    className="prose prose-indigo max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(lesson.content),
                    }}
                  />
                ) : (
                  <p className="text-slate-400 text-center py-8">Esta lección no tiene contenido escrito.</p>
                )}
                <div className="flex gap-3">
                  <button
                    className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition text-sm"
                    onClick={() => setStep(0)}
                  >
                    ← Intención
                  </button>
                  <button
                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
                    onClick={() => setStep(2)}
                  >
                    Ir a la reflexión →
                  </button>
                </div>
              </div>
            )}

            {/* PASO 2 — Reflexión y práctica */}
            {step === 2 && (
              <div className="mt-6 bg-purple-50 rounded-xl p-6 border border-purple-100 space-y-6">
                {lesson.reflection && (
                  <>
                    <h3 className="text-lg font-semibold text-purple-800">🧠 Reflexión</h3>
                    <p className="text-purple-700">{lesson.reflection}</p>
                  </>
                )}
                {lesson.exercise && (
                  <>
                    <h3 className="text-lg font-semibold text-purple-800">🧘 Práctica</h3>
                    <p className="text-purple-700">{lesson.exercise}</p>
                  </>
                )}
                {!lesson.reflection && !lesson.exercise && (
                  <p className="text-purple-400 text-center py-4">Esta lección no tiene reflexión ni práctica definida.</p>
                )}
                <div className="flex gap-3">
                  <button
                    className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition text-sm"
                    onClick={() => setStep(1)}
                  >
                    ← Contenido
                  </button>
                  <button
                    className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
                    onClick={() => setStep(3)}
                  >
                    Cerrar lección →
                  </button>
                </div>
              </div>
            )}

            {/* PASO 3 — Integración */}
            {step === 3 && (
              <div className="mt-6 bg-green-50 rounded-xl p-6 border border-green-100 text-center">
                <h3 className="text-lg font-semibold text-green-800">✨ Integración</h3>
                <p className="text-green-600 mt-2">
                  Has recorrido esta lección. Tu consciencia la integra a su propio ritmo.
                  Puedes repetirla cuantas veces sientas el llamado, o continuar cuando estés listo.
                </p>
                <div className="flex gap-4 justify-center mt-6 flex-wrap">
                  <button
                    className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-300 transition"
                    onClick={() => setStep(0)}
                  >
                    Repetir esta lección
                  </button>
                  {prevLesson && (
                    <button
                      className="bg-slate-100 text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-200 transition"
                      onClick={() => navigate(`/course/${courseId}/lesson/${prevLesson.id}`)}
                    >
                      ← Lección anterior
                    </button>
                  )}
                  {nextLesson ? (
                    <button
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                      onClick={() => navigate(`/course/${courseId}/lesson/${nextLesson.id}`)}
                    >
                      Siguiente lección →
                    </button>
                  ) : (
                    <button
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                      onClick={() => navigate(`/course/${courseId}`)}
                    >
                      Finalizar módulo →
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default Lesson