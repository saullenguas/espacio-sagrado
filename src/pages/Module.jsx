import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getModuleById, getLessonsByModule } from '../services/moduleService';
import { useSession } from '../hooks/useSession';

function Module() {
  const { courseId, moduleId } = useParams();
  const navigate = useNavigate();
  const { user, canAccessCourse, loading: sessionLoading } = useSession();

  const [module, setModule] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (sessionLoading) return;

    const loadData = async () => {
      try {
        const modData = await getModuleById(courseId, moduleId);
        setModule(modData);
        if (modData) {
          const lessonsData = await getLessonsByModule(courseId, moduleId);
          setLessons(lessonsData.sort((a, b) => (a.order || 0) - (b.order || 0)));
        }
      } catch (error) {
        console.error('Error cargando módulo:', error);
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [courseId, moduleId, sessionLoading]);

  // Acceso desde Firestore únicamente
  const hasAccess = user && canAccessCourse(courseId);

  if (sessionLoading || loadingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!module) {
    return (
      <div className="text-center mt-16 p-6">
        <p className="text-slate-500 text-lg">Módulo no encontrado.</p>
        <Link to={`/course/${courseId}`} className="mt-4 inline-block text-indigo-600 hover:underline font-medium">
          ← Volver al curso
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">

        <button onClick={() => navigate(-1)} className="text-indigo-600 hover:text-indigo-800 transition mb-4 flex items-center gap-1 text-sm">
          ← Volver
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h1 className="text-2xl font-bold text-slate-800">📦 {module.titulo || 'Módulo'}</h1>
          <p className="text-slate-500 mt-2">Explora libremente. Puedes elegir cualquier lección en cualquier orden.</p>

          {!hasAccess && user && (
            <div className="mt-4 bg-indigo-50 rounded-xl p-4 border border-indigo-100">
              <p className="text-indigo-700 text-sm italic">
                "Esta lección está esperando que resuene contigo. Cuando sientas el llamado, puedes adquirir este curso o unirte al acceso total."
              </p>
              <div className="flex gap-3 mt-3">
                <button className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-indigo-700 transition" onClick={() => navigate(`/checkout?type=course&courseId=${courseId}`)}>
                  Adquirir este curso
                </button>
                <button className="bg-purple-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-purple-700 transition" onClick={() => navigate('/checkout?type=premium')}>
                  Obtener acceso total
                </button>
              </div>
            </div>
          )}

          {!user && (
            <div className="mt-4 bg-indigo-50 rounded-xl p-4 text-center border border-indigo-100">
              <p className="text-indigo-700 text-sm">Inicia sesión o regístrate para acceder a las lecciones.</p>
              <div className="flex gap-3 justify-center mt-3">
                <Link to="/login" className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-indigo-700 transition">Iniciar sesión</Link>
                <Link to="/registro" className="bg-white text-indigo-600 border border-indigo-200 px-4 py-1.5 rounded-lg text-sm hover:bg-indigo-50 transition">Crear cuenta</Link>
              </div>
            </div>
          )}

          {user?.role === 'admin' && (
            <button className="mt-4 bg-slate-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-800 transition" onClick={() => navigate(`/create-lesson/${courseId}/${moduleId}`)}>
              + Crear lección
            </button>
          )}

          <div className="mt-6">
            <h2 className="text-lg font-semibold text-slate-700 mb-4">Lecciones</h2>
            {lessons.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No hay lecciones aún en este módulo.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {lessons.map((lesson) => (
                  <div key={lesson.id} className="bg-white rounded-xl p-4 border border-slate-200 hover:border-indigo-200 transition">
                    <h3 className="text-lg font-medium text-slate-800">
                      {lesson.titulo || lesson.title || `Lección ${lesson.order || ''}`}
                    </h3>
                    {hasAccess ? (
                      <button
                        className="mt-3 bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
                        onClick={() => navigate(`/course/${courseId}/lesson/${lesson.id}`)}
                      >
                        Entrar →
                      </button>
                    ) : (
                      <span className="mt-3 inline-block px-4 py-1.5 rounded-lg text-sm font-medium bg-slate-200 text-slate-400 cursor-default">
                        🔒 Bloqueado
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Module;
