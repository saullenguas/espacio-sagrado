import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createCourse, getCourseById, updateCourse } from "../services/courseService";

function CreateCourse() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const editCourseId = searchParams.get("editCourse");
  const isEditing = Boolean(editCourseId);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Cargar datos existentes si estamos editando
  useEffect(() => {
    if (editCourseId) {
      const loadCourse = async () => {
        try {
          const data = await getCourseById(editCourseId);
          if (data) {
            setTitle(data.titulo || "");
            setDescription(data.descripcion || "");
            setImageUrl(data.imagen_url || "");
          }
        } catch (err) {
          console.error("Error cargando curso:", err);
          setError("No se pudo cargar el curso.");
        }
      };
      loadCourse();
    }
  }, [editCourseId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      setError("El nombre del curso es obligatorio");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const courseData = {
        titulo: title.trim(),
        descripcion: description.trim(),
        imagen_url: imageUrl.trim(),
      };

      if (isEditing) {
        await updateCourse(editCourseId, courseData);
      } else {
        await createCourse(courseData);
      }

      navigate("/");
    } catch (error) {
      console.error("Error guardando curso:", error);
      setError("Error al guardar el curso. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-purple-50 p-6">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">
          {isEditing ? "Editar Curso" : "Crear Curso"}
        </h1>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nombre del curso *
            </label>
            <input
              type="text"
              placeholder="Ej: Meditación Guiada"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Descripción
            </label>
            <textarea
              placeholder="Descripción del curso..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>

          {/* 🌟 NUEVO CAMPO: URL de la imagen */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              URL de la imagen del curso
            </label>
            <input
              type="url"
              placeholder="https://ejemplo.com/imagen.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
            {imageUrl && (
              <div className="mt-2 flex items-center gap-3">
                <img
                  src={imageUrl}
                  alt="Vista previa"
                  className="h-16 w-16 object-cover rounded-lg border border-slate-200"
                  onError={() => setImageUrl("")}
                />
                <span className="text-xs text-slate-400">Vista previa</span>
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 font-medium"
            >
              {saving ? "Guardando..." : isEditing ? "Actualizar Curso" : "Guardar Curso"}
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

export default CreateCourse;