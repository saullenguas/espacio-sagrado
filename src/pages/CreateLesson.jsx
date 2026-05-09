import RichTextEditor from '../components/RichTextEditor'
import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { createLesson, getLessonById, updateLesson } from "../services/moduleService";

function CreateLesson() {
  const { courseId, moduleId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editLessonId = searchParams.get("editLesson");
  const isEditing = !!editLessonId;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [intention, setIntention] = useState("");
  const [reflection, setReflection] = useState("");
  const [exercise, setExercise] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [order, setOrder] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loadingData, setLoadingData] = useState(!!editLessonId);

  // Cargar datos existentes si es edición
  useEffect(() => {
    if (!editLessonId) return;

    const loadLesson = async () => {
      try {
        const lesson = await getLessonById(courseId, moduleId, editLessonId);
        if (lesson) {
          setTitle(lesson.titulo || lesson.title || "");
          setContent(lesson.content || "");
          setIntention(lesson.intention || "");
          setReflection(lesson.reflection || "");
          setExercise(lesson.exercise || "");
          setVideoUrl(lesson.videoUrl || "");
          setOrder(lesson.order || 0);
        }
      } catch (error) {
        console.error("Error cargando lección:", error);
        setError("Error al cargar la lección.");
      } finally {
        setLoadingData(false);
      }
    };

    loadLesson();
  }, [courseId, moduleId, editLessonId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("El título es necesario");
      return;
    }

    setSaving(true);
    setError("");

    const lessonData = {
      titulo: title,
      content,
      intention,
      reflection,
      exercise,
      videoUrl,
      order,
    };

    try {
      if (isEditing) {
        await updateLesson(courseId, moduleId, editLessonId, lessonData);
      } else {
        await createLesson(courseId, moduleId, lessonData);
      }

      navigate(`/course/${courseId}/module/${moduleId}`);
    } catch (error) {
      console.error("Error guardando lección:", error);
      setError("Error al guardar la lección. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-purple-50 p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">
          {isEditing ? "📖 Editar Lección" : "📖 Crear Lección"}
        </h1>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Título *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              placeholder="Título de la lección"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Orden</label>
            <input
              type="number"
              value={order}
              onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Intención</label>
            <textarea
              value={intention}
              onChange={(e) => setIntention(e.target.value)}
              rows={2}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              placeholder="Intención de la lección"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contenido</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              placeholder="Contenido de la lección (HTML o texto)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">URL del video (opcional)</label>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              placeholder="https://..."
            />
          </div>

          <div>
  
  <RichTextEditor content={content} onChange={setContent} />
</div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ejercicio / Práctica</label>
            <textarea
              value={exercise}
              onChange={(e) => setExercise(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              placeholder="Instrucciones para la práctica"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 font-medium"
            >
              {saving ? "Guardando..." : isEditing ? "Actualizar lección" : "Guardar lección"}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="bg-slate-200 text-slate-700 px-6 py-2 rounded-lg hover:bg-slate-300 transition font-medium"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateLesson;