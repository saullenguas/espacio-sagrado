import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSession } from '../hooks/useSession';
import { getModulesByCourse, getLessonsByModule } from '../services/moduleService';
import { getCourseById } from '../services/courseService';
import VideoPlayer from '../components/VideoPlayer';

function Lesson() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const { user, canAccessCourse, loading: sessionLoading } = useSession();

  const [lesson, setLesson] = useState(null);
  const [moduleLessons, setModuleLessons] = useState([]);
  const [courseModules, setCourseModules] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (sessionLoading) return;

    const loadData = async () => {
      try {
        await getCourseById(courseId);
        const modulesData = await getModulesByCourse(courseId);

        const lessonsPromises = modulesData.map(mod =>
          getLessonsByModule(courseId, mod.id).then(lessons => ({
            ...mod,
            lessons: lessons.sort((a, b) => (a.order || 0) - (b.order || 0))
          }))
        );

        const modulesWithLessons = await Promise.all(lessonsPromises);
        setCourseModules(modulesWithLessons);

        let foundLesson = null;
        for (const mod of modulesWithLessons) {
          const match = mod.lessons.find(l => l.id === lessonId);
          if (match) {
            foundLesson = match;
            setModuleLessons(mod.lessons);
            break;
          }
        }

        setLesson(foundLesson);
      } catch (error) {
        console.error('Error cargando lección:', error);
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [courseId, lessonId, sessionLoading]);

  // Acceso desde Firestore únicamente
  const hasAccess = user && canAccessCourse(courseId);

  if (sessionLoading || loadingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="text-center mt-16 p-6">
        <p className="text-slate-500 text-lg">Lección no encontrada.</p>
        <Link to={`/course/${courseId}`} className="mt-4 inline-block text-indigo-600 hover:underline font-medium">
          ← Volver al curso
        </Link>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-purple-50 p-6">
        <div className="max-w-4xl mx-auto text-center">
          <Link to={`/course/${courseId}`} className="text-indigo-600 hover:underline mb-4 inline-block">← Volver al curso</Link>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mt-8">
            <div className="text-6xl mb-4">🔮</div>
            <h1 className="text-2xl font-bold text-slate-800">{lesson.titulo || lesson.title}</h1>
            <p className="text-slate-500 mt-4 italic">
              "Esta lección está esperando que resuene contigo. Cuando sientas el llamado, puedes adquirir este curso o unirte al acceso total."
            </p>
            <div className="flex gap-4 justify-center mt-6">
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
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-purple-50">
      <div className="flex flex-col md:flex-row">

        <aside className="w-full md:w-72 bg-slate-900 text-slate-200 p-6 border-r border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">🌿 Tu Camino</h3>
          <p className="text-xs text-slate-400 mb-4">Puedes elegir cualquier lección en cualquier orden.</p>
          {courseModules.map((mod) => (
            <div key={mod.id} className="mb-6">
              <h4 className="text-sm font-medium text-slate-300 mb-2">{mod.titulo || 'Módulo'}</h4>
              {mod.lessons?.map((l) => {
                const isCurrent = l.id === lessonId;
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
                );
              })}
            </div>
          ))}
        </aside>

        <main className="flex-1 p-6 max-w-4xl">
          <button
            onClick={() => navigate(-1)}
            className="text-indigo-600 hover:text-indigo-800 transition mb-4 flex items-center gap-1 text-sm"
          >
            ← Volver
          </button>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h1 className="text-2xl font-bold text-slate-800">{lesson.titulo || lesson.title}</h1>

            {step === 0 && (
              <div className="mt-6 bg-indigo-50 rounded-xl p-6 border border-indigo-100">
                <h3 className="text-lg font-semibold text-indigo-800">🌿 Antes de comenzar</h3>
                <p className="text-indigo-700 mt-2 text-lg leading-relaxed">{lesson.intention}</p>
                <button className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition" onClick={() => setStep(1)}>
                  Comenzar →
                </button>
              </div>
            )}

            {step === 1 && (
              <div className="mt-6 space-y-6">
                {lesson.videoUrl && (
                  <VideoPlayer url={lesson.videoUrl} title={lesson.titulo || "Video de la lección"} />
                )}
                <div className="prose prose-indigo max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
                </div>
                <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition" onClick={() => setStep(2)}>
                  Integrar →
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="mt-6 bg-purple-50 rounded-xl p-6 border border-purple-100">
                <h3 className="text-lg font-semibold text-purple-800">🧠 Reflexión</h3>
                <p className="text-purple-700 mt-2">{lesson.reflection}</p>
                <h3 className="text-lg font-semibold text-purple-800 mt-6">🧘 Práctica</h3>
                <p className="text-purple-700 mt-2">{lesson.exercise}</p>
                <button className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition" onClick={() => setStep(3)}>
                  Cerrar →
                </button>
              </div>
            )}

            {step === 3 && (
              <div className="mt-6 bg-green-50 rounded-xl p-6 border border-green-100 text-center">
                <h3 className="text-lg font-semibold text-green-800">✨ Integración</h3>
                <p className="text-green-600 mt-2">Has recorrido esta lección. Puedes repetirla cuando lo sientas o avanzar a la siguiente.</p>
                <div className="flex gap-4 justify-center mt-6">
                  <button className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-300 transition" onClick={() => setStep(0)}>
                    Repetir lección
                  </button>
                  <button
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                    onClick={() => {
                      const idx = moduleLessons.findIndex(l => l.id === lessonId);
                      const next = moduleLessons[idx + 1];
                      if (next) navigate(`/course/${courseId}/lesson/${next.id}`);
                      else navigate(`/course/${courseId}`);
                    }}
                  >
                    {moduleLessons.findIndex(l => l.id === lessonId) < moduleLessons.length - 1
                      ? 'Siguiente lección →'
                      : 'Finalizar módulo →'}
                  </button>
                </div>
              </div>
            )}

            <div className="mt-6 flex gap-2 justify-center text-xs text-slate-400">
              {['Inicio', 'Contenido', 'Reflexión', 'Integración'].map((label, i) => (
                <span key={i} className="flex items-center gap-2">
                  {i > 0 && <span>·</span>}
                  <button onClick={() => setStep(i)} className={`px-3 py-1 rounded ${step === i ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-100'}`}>
                    {label}
                  </button>
                </span>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Lesson;
