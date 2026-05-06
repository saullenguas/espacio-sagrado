import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useSession } from "../hooks/useSession";
import { getCourses } from "../services/courseService";
import { getSettings } from "../services/settingsService";
import Hero3D from "../components/Hero3D";

function Dashboard() {
  const { user, canAccessCourse, loading: sessionLoading } = useSession();
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [settings, setSettings] = useState({
    schoolName: "Luz y Consciencia",
    heroPhrase: "Un espacio para recordar quién eres",
    logoUrl: ""
  });

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const data = await getCourses();
        setCourses(data || []);
      } catch (error) {
        console.error("Error cargando cursos:", error);
      } finally {
        setLoadingCourses(false);
      }
    };
    loadCourses();
  }, []);

  if (sessionLoading || loadingCourses) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-purple-50">
      <div className="max-w-5xl mx-auto p-6 space-y-8">

        {/* HERO */}
        <section className="text-center py-16 md:py-20">
          {settings.logoUrl ? (
            <Hero3D src={settings.logoUrl} alt={settings.schoolName} />
          ) : (
            <span className="text-6xl md:text-7xl">🕊️</span>
          )}
          <h1 className="hero-title text-center">{settings.schoolName}</h1>
          <p className="text-slate-500 mt-3 text-lg md:text-xl max-w-2xl mx-auto font-light tracking-wide">
            {settings.heroPhrase}
          </p>
          {user && (
            <p className="mt-8 text-indigo-600 text-lg font-semibold">
              Bienvenido de nuevo, {user.email?.split("@")[0] || "alma en camino"} 🌿
            </p>
          )}
        </section>

        {/* HILO DE LUZ — acceso rápido a última lección visitada */}
        {user?.lastLessonId ? (
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🧵</span>
              <div>
                <p className="text-slate-600">
                  La última vez tu consciencia se detuvo en{" "}
                  <span className="font-semibold text-indigo-700">{user.lastLessonId}</span>.
                </p>
                <p className="text-sm text-slate-400 mt-1">Cuando sientas el llamado, la puerta está abierta.</p>
                <Link
                  to={`/course/${user.lastCourseId}/lesson/${user.lastLessonId}`}
                  className="mt-3 inline-block text-indigo-600 hover:text-indigo-800 font-medium transition"
                >
                  Visitar esa lección →
                </Link>
              </div>
            </div>
          </section>
        ) : user ? (
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-center">
            <span className="text-2xl">🌱</span>
            <p className="text-slate-500 mt-2">
              Aún no has comenzado. Explora los cursos y deja que tu intuición te guíe.
            </p>
          </section>
        ) : null}

        {/* CURSOS */}
        <section>
          <h2 className="text-2xl font-semibold text-slate-700 mb-4">Cursos disponibles</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => {
              // Acceso desde Firestore únicamente
              const hasAccess = user && canAccessCourse(course.id)

              return (
                <div key={course.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition group">
                  {course.imagen_url && (
                    <img src={course.imagen_url} alt={course.titulo || 'Curso'} className="w-full h-40 object-cover rounded-lg mb-4" loading="lazy" />
                  )}
                  <h3 className="text-lg font-semibold text-slate-800">{course.titulo || course.title || 'Curso'}</h3>
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">{course.descripcion || "Un curso para expandir tu conciencia."}</p>
                  <div className="mt-4">
                    <Link
                      to={`/course/${course.id}`}
                      className={`inline-block px-4 py-2 rounded-lg text-sm font-medium transition ${
                        hasAccess
                          ? "bg-indigo-600 text-white hover:bg-indigo-700"
                          : "bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100"
                      }`}
                    >
                      {hasAccess ? "Entrar" : "Explorar módulos"}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ACCESO TOTAL */}
        <section className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-8 text-center text-white">
          <div className="text-5xl mb-4">💎</div>
          <h2 className="text-3xl font-bold">Acceso total a toda la escuela</h2>
          <p className="mt-3 text-indigo-100 text-lg max-w-xl mx-auto">
            Desbloquea todos los cursos, presentes y futuros, y camina sin límites en tu viaje de consciencia.
          </p>
          <p className="mt-2 text-indigo-200 text-sm">Renovación semestral o anual. Tú eliges tu ritmo.</p>
          <div className="mt-8">
            {user ? (
              <Link to="/checkout?type=premium" className="inline-block bg-white text-indigo-700 px-8 py-3 rounded-xl font-semibold hover:bg-indigo-50 transition shadow-md">
                Actualizar a premium
              </Link>
            ) : (
              <Link to="/registro?redirect=/checkout?type=premium" className="inline-block bg-white text-indigo-700 px-8 py-3 rounded-xl font-semibold hover:bg-indigo-50 transition shadow-md">
                Unirme al acceso total
              </Link>
            )}
          </div>
        </section>

        {/* PANEL ADMIN */}
        {user?.role === "admin" && (
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-700">👑 Panel del Guardián</h2>
                <p className="text-sm text-slate-500 mt-1">Gestiona cursos, módulos, lecciones y alumnos.</p>
              </div>
              <Link to="/admin" className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition font-medium">
                Ir al panel
              </Link>
            </div>
          </section>
        )}

      </div>
    </div>
  );
}

export default Dashboard;
