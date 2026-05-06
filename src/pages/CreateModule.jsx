import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { createModule, getModuleById, updateModule } from "../services/moduleService";

function CreateModule() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editModuleId = searchParams.get("editModule");
  const isEditing = !!editModuleId;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loadingData, setLoadingData] = useState(!!editModuleId);

  // Cargar datos existentes si es edición
  useEffect(() => {
    if (!editModuleId) return;

    const loadModule = async () => {
      try {
        const mod = await getModuleById(courseId, editModuleId);
        if (mod) {
          setTitle(mod.titulo || "");
          setDescription(mod.descripcion || "");
        }
      } catch (error) {
        console.error("Error cargando módulo:", error);
        setError("Error al cargar el módulo.");
      } finally {
        setLoadingData(false);
      }
    };

    loadModule();
  }, [courseId, editModuleId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      setError("El nombre del módulo es obligatorio");
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (isEditing) {
        await updateModule(courseId, editModuleId, {
          titulo: title,
          descripcion: description,
        });
      } else {
        await createModule(courseId, {
          titulo: title,
          descripcion: description,
        });
      }

      navigate(`/course/${courseId}`);
    } catch (error) {
      console.error("Error guardando módulo:", error);
      setError("Error al guardar el módulo. Intenta de nuevo.");
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
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">
          {isEditing ? "Editar Módulo" : "Crear Módulo"}
        </h1>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nombre del módulo *
            </label>
            <input
              type="text"
              placeholder="Ej: Introducción"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Descripción (opcional)
            </label>
            <textarea
              placeholder="Descripción del módulo..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 font-medium"
            >
              {saving ? "Guardando..." : isEditing ? "Actualizar módulo" : "Guardar módulo"}
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

export default CreateModule;