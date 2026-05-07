import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { db } from '../firebase/config'
import { collection, getDocs } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { useAuth } from '../hooks/useAuth'
import { getAllCoursesWithModules, deleteModule, deleteLesson } from '../services/moduleService'
import { deleteCourse } from '../services/courseService'
import { enrollStudentManually, revokeStudentAccess, deleteStudentAccount } from '../services/adminService'
import { getFunctions, httpsCallable } from 'firebase/functions'

const PAYMENT_MODE = import.meta.env.VITE_PAYMENT_MODE || 'simulation'

function Admin() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const functions = getFunctions(undefined, 'us-central1')

  const [users, setUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [courses, setCourses] = useState([])
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleteError, setDeleteError] = useState(null)

  const [enrollForm, setEnrollForm] = useState({ email: '', type: 'course', courseId: '', duration: '1y' })
  const [enrolling, setEnrolling] = useState(false)
  const [enrollMessage, setEnrollMessage] = useState(null)

  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [addingAdmin, setAddingAdmin] = useState(false)
  const [adminMessage, setAdminMessage] = useState(null)

  const [messageSubject, setMessageSubject] = useState('')
  const [messageBody, setMessageBody] = useState('')
  const [messageTarget, setMessageTarget] = useState('all')

  const [showUsers, setShowUsers] = useState(false)
  const [showEnroll, setShowEnroll] = useState(false)
  const [actionLoading, setActionLoading] = useState(null)

  const loadUsers = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'users'))
      const data = snapshot.docs.map(d => ({
        uid: d.id,
        email: d.data().email || 'Sin email',
        role: d.data().role || 'student',
        accessType: d.data().accessType || 'limited',
        enrolledCourses: d.data().enrolledCourses || [],
        premiumExpiry: d.data().premiumExpiry?.toDate?.()?.toLocaleDateString('es-MX') || null,
        enrolledManually: d.data().enrolledManually || false,
        createdAt: d.data().createdAt?.toDate?.()?.toLocaleDateString('es-MX') || 'Desconocido',
      }))
      setUsers(data)
    } catch (error) {
      console.error('Error cargando usuarios:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  useEffect(() => { loadUsers() }, [])

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getAllCoursesWithModules()
        setCourses(data)
      } catch (error) {
        console.error('Error cargando cursos:', error)
      } finally {
        setLoadingCourses(false)
      }
    }
    load()
  }, [])

  const handleDelete = async (type, id, courseId, moduleId) => {
    if (deleteConfirm !== id) { setDeleteConfirm(id); return }
    setDeleteError(null)
    try {
      if (type === 'course') {
        await deleteCourse(id)
        setCourses(prev => prev.filter(c => c.id !== id))
      } else if (type === 'module') {
        await deleteModule(courseId, id)
        setCourses(await getAllCoursesWithModules())
      } else if (type === 'lesson') {
        await deleteLesson(courseId, moduleId, id)
        setCourses(await getAllCoursesWithModules())
      }
      setDeleteConfirm(null)
    } catch (error) {
      console.error('Error eliminando:', error)
      setDeleteError('No se pudo eliminar. Intenta de nuevo.')
      setDeleteConfirm(null)
    }
  }

  const handleEnrollManually = async (e) => {
    e.preventDefault()
    setEnrolling(true)
    setEnrollMessage(null)
    try {
      const result = await enrollStudentManually({
        email: enrollForm.email,
        type: enrollForm.type,
        courseId: enrollForm.type === 'course' ? enrollForm.courseId : null,
        duration: enrollForm.duration,
      })
      setEnrollMessage({ type: 'success', text: `✅ ${result.email} dado de alta correctamente.` })
      setEnrollForm({ email: '', type: 'course', courseId: '', duration: '1y' })
      await loadUsers()
    } catch (error) {
      console.error('Error en alta manual:', error)
      setEnrollMessage({ type: 'error', text: error.message || 'Error al dar de alta.' })
    } finally {
      setEnrolling(false)
    }
  }

  const handleRevokeAccess = async (uid, email) => {
    if (!window.confirm(`¿Revocar el acceso de ${email}?\n\nSu cuenta permanece activa pero sin acceso a cursos.`)) return
    setActionLoading(uid + '_revoke')
    try {
      await revokeStudentAccess(uid)
      await new Promise(r => setTimeout(r, 1000))
      await loadUsers()
    } catch (error) {
      console.error('Error revocando acceso:', error)
      alert('Error al revocar el acceso.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteUser = async (uid, email) => {
    if (!window.confirm(`⚠️ ¿Eliminar la cuenta de ${email} permanentemente?\n\nSe borrará de Auth y Firestore. Esta acción no se puede deshacer.`)) return
    setActionLoading(uid + '_delete')
    try {
      const auth = getAuth()
      const token = await auth.currentUser.getIdToken()
      await deleteStudentAccount(uid, token)
      setUsers(prev => prev.filter(u => u.uid !== uid))
    } catch (error) {
      console.error('Error eliminando usuario:', error)
      alert('Error al eliminar la cuenta: ' + error.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleAddAdmin = async (e) => {
    e.preventDefault()
    setAddingAdmin(true)
    setAdminMessage(null)
    try {
      const fn = httpsCallable(functions, 'setAdminRole')
      await fn({ email: newAdminEmail })
      setAdminMessage({ type: 'success', text: `✅ ${newAdminEmail} ahora es administrador.` })
      setNewAdminEmail('')
      await loadUsers()
    } catch (error) {
      console.error('Error agregando admin:', error)
      setAdminMessage({ type: 'error', text: error.message || 'Error al agregar administrador.' })
    } finally {
      setAddingAdmin(false)
    }
  }

  const getAccessBadge = (u) => {
    if (u.accessType === 'all' && u.premiumExpiry) {
      return <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Premium hasta {u.premiumExpiry}</span>
    }
    if (u.accessType === 'all') {
      return <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Acceso total</span>
    }
    if (u.enrolledCourses.length > 0) {
      return <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">{u.enrolledCourses.length} curso(s)</span>
    }
    return <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full">Sin acceso</span>
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-purple-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Encabezado */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-800">Panel del Guardián</h1>
          <p className="text-slate-500 mt-2">Bienvenido, {user?.email}. Aquí puedes cuidar este espacio.</p>
          {PAYMENT_MODE === 'simulation' && (
            <div className="mt-4 inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-medium border border-amber-200">
              <span>⚠️</span>
              <span>Modo simulación de pagos activo</span>
            </div>
          )}
        </div>

        {/* Crear contenido */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-xl font-semibold text-slate-700 mb-4">🌱 Crear nuevo contenido</h2>
          <div className="grid gap-4 md:grid-cols-4">
            <Link to="/create-course" className="block p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 hover:shadow-md transition text-center">
              <span className="text-3xl">📚</span>
              <h3 className="font-semibold text-slate-800 mt-2">Nuevo Curso</h3>
              <p className="text-sm text-slate-500">Crear un curso completo</p>
            </Link>
            <Link to="/admin" className="block p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 hover:shadow-md transition text-center">
              <span className="text-3xl">📦</span>
              <h3 className="font-semibold text-slate-800 mt-2">Nuevo Módulo</h3>
              <p className="text-sm text-slate-500">Desde la sección inferior</p>
            </Link>
            <Link to="/admin" className="block p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 hover:shadow-md transition text-center">
              <span className="text-3xl">📝</span>
              <h3 className="font-semibold text-slate-800 mt-2">Nueva Lección</h3>
              <p className="text-sm text-slate-500">Desde la sección inferior</p>
            </Link>
            <Link to="/admin/settings" className="block p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 hover:shadow-md transition text-center">
              <span className="text-3xl">⚙️</span>
              <h3 className="font-semibold text-slate-800 mt-2">Configuración</h3>
              <p className="text-sm text-slate-500">Nombre, logo y frase</p>
            </Link>
          </div>
        </section>

        {/* Alta manual */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <button onClick={() => setShowEnroll(!showEnroll)} className="flex items-center justify-between w-full text-left">
            <h2 className="text-xl font-semibold text-slate-700">🌟 Alta manual de alumno</h2>
            <span className="text-slate-400 text-lg">{showEnroll ? '▲' : '▼'}</span>
          </button>

          {showEnroll && (
            <div className="mt-6">
              <p className="text-sm text-slate-500 mb-5">
                Da de alta a un alumno que se inscribió de manera personal, sin pasar por la plataforma de pagos.
                Si el email no tiene cuenta, se creará automáticamente.
              </p>
              <form onSubmit={handleEnrollManually} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email del alumno</label>
                    <input
                      type="email"
                      required
                      value={enrollForm.email}
                      onChange={e => setEnrollForm({ ...enrollForm, email: e.target.value })}
                      placeholder="alumno@ejemplo.com"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de acceso</label>
                    <select
                      value={enrollForm.type}
                      onChange={e => setEnrollForm({ ...enrollForm, type: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="course">Curso individual</option>
                      <option value="premium">Premium (todos los cursos)</option>
                    </select>
                  </div>
                </div>

                {enrollForm.type === 'course' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Curso</label>
                    <select
                      required
                      value={enrollForm.courseId}
                      onChange={e => setEnrollForm({ ...enrollForm, courseId: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="">Selecciona un curso</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.titulo || c.id}</option>
                      ))}
                    </select>
                  </div>
                )}

                {enrollForm.type === 'premium' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Vigencia</label>
                    <select
                      value={enrollForm.duration}
                      onChange={e => setEnrollForm({ ...enrollForm, duration: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="1y">1 año</option>
                      <option value="6m">6 meses</option>
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={enrolling}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 font-medium"
                >
                  {enrolling ? 'Procesando...' : 'Dar de alta'}
                </button>
              </form>

              {enrollMessage && (
                <div className={`mt-4 p-3 rounded-lg text-sm ${enrollMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                  {enrollMessage.text}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Alumnos registrados */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <button onClick={() => setShowUsers(!showUsers)} className="flex items-center justify-between w-full text-left">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-slate-700">🧑‍🤝‍🧑 Alumnos registrados</h2>
              <span className="text-sm bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                {users.filter(u => u.role !== 'admin').length}
              </span>
            </div>
            <span className="text-slate-400 text-lg">{showUsers ? '▲' : '▼'}</span>
          </button>

          {showUsers && (
            <div className="mt-4">
              {loadingUsers ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
                </div>
              ) : users.filter(u => u.role !== 'admin').length === 0 ? (
                <p className="text-slate-400 text-center py-8">No hay alumnos registrados aún.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="py-3 px-3 font-medium">Correo</th>
                        <th className="py-3 px-3 font-medium">Acceso</th>
                        <th className="py-3 px-3 font-medium">Registro</th>
                        <th className="py-3 px-3 font-medium">Origen</th>
                        <th className="py-3 px-3 font-medium">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.filter(u => u.role !== 'admin').map(u => (
                        <tr key={u.uid} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-3 text-slate-800">{u.email}</td>
                          <td className="py-3 px-3">{getAccessBadge(u)}</td>
                          <td className="py-3 px-3 text-slate-400 text-xs">{u.createdAt}</td>
                          <td className="py-3 px-3">
                            {u.enrolledManually
                              ? <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Manual</span>
                              : <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Plataforma</span>
                            }
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleRevokeAccess(u.uid, u.email)}
                                disabled={actionLoading === u.uid + '_revoke'}
                                className="text-xs bg-amber-100 text-amber-700 hover:bg-amber-200 px-3 py-1 rounded-lg transition disabled:opacity-50"
                              >
                                {actionLoading === u.uid + '_revoke' ? '...' : 'Revocar acceso'}
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u.uid, u.email)}
                                disabled={actionLoading === u.uid + '_delete'}
                                className="text-xs bg-red-100 text-red-600 hover:bg-red-200 px-3 py-1 rounded-lg transition disabled:opacity-50"
                              >
                                {actionLoading === u.uid + '_delete' ? '...' : 'Eliminar cuenta'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Gestionar contenido */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-xl font-semibold text-slate-700 mb-4">📋 Gestionar contenido</h2>

          {deleteError && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm">
              {deleteError}
            </div>
          )}

          {loadingCourses ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
            </div>
          ) : courses.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No hay cursos creados aún.</p>
          ) : (
            <div className="space-y-4">
              {courses.map(course => (
                <div key={course.id} className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between bg-slate-50 p-4">
                    <div>
                      <h3 className="font-semibold text-slate-800">{course.titulo || 'Sin título'}</h3>
                      <p className="text-sm text-slate-500">{course.descripcion || 'Sin descripción'}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => navigate(`/create-module/${course.id}`)} className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg hover:bg-indigo-200 transition">+ Módulo</button>
                      <button onClick={() => navigate(`/create-course?editCourse=${course.id}`)} className="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded-lg hover:bg-orange-300 transition">✏️</button>
                      <button
                        onClick={() => handleDelete('course', course.id)}
                        className={`text-xs px-3 py-1 rounded-lg transition ${deleteConfirm === course.id ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                      >
                        {deleteConfirm === course.id ? '¿Eliminar?' : '🗑️'}
                      </button>
                    </div>
                  </div>

                  {course.modules?.length > 0 && (
                    <div className="pl-8 pr-4 pb-4 space-y-2">
                      {course.modules.map(mod => (
                        <div key={mod.id} className="border border-slate-100 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-slate-700">{mod.titulo || 'Sin título'}</h4>
                              <p className="text-xs text-slate-400">{mod.descripcion || ''}</p>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => navigate(`/create-lesson/${course.id}/${mod.id}`)} className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg hover:bg-indigo-200 transition">+ Lección</button>
                              <button onClick={() => navigate(`/create-module/${course.id}?editModule=${mod.id}`)} className="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded-lg hover:bg-orange-300 transition">✏️</button>
                              <button
                                onClick={() => handleDelete('module', mod.id, course.id)}
                                className={`text-xs px-3 py-1 rounded-lg transition ${deleteConfirm === mod.id ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                              >
                                {deleteConfirm === mod.id ? '¿Eliminar?' : '🗑️'}
                              </button>
                            </div>
                          </div>

                          {mod.lessons?.length > 0 && (
                            <div className="pl-6 mt-2 space-y-1">
                              {mod.lessons.map(lesson => (
                                <div key={lesson.id} className="flex items-center justify-between text-sm py-1">
                                  <span className="text-slate-600">{lesson.titulo || 'Sin título'}</span>
                                  <div className="flex gap-1">
                                    <button onClick={() => navigate(`/create-lesson/${course.id}/${mod.id}?editLesson=${lesson.id}`)} className="text-xs bg-orange-200 text-orange-800 px-2 py-0.5 rounded-lg hover:bg-orange-300 transition">✏️</button>
                                    <button
                                      onClick={() => handleDelete('lesson', lesson.id, course.id, mod.id)}
                                      className={`text-xs px-2 py-0.5 rounded-lg transition ${deleteConfirm === lesson.id ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                                    >
                                      {deleteConfirm === lesson.id ? '¿Eliminar?' : '🗑️'}
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          {(!mod.lessons || mod.lessons.length === 0) && (
                            <p className="text-xs text-slate-400 pl-6 mt-1">Sin lecciones aún</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {(!course.modules || course.modules.length === 0) && (
                    <p className="text-xs text-slate-400 pl-8 pb-4">Sin módulos aún</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Administradores */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-xl font-semibold text-slate-700 mb-4">👑 Administradores</h2>
          <form onSubmit={handleAddAdmin} className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Email del nuevo administrador</label>
              <input
                type="email"
                value={newAdminEmail}
                onChange={e => setNewAdminEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={addingAdmin}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition disabled:opacity-50 font-medium"
            >
              {addingAdmin ? 'Agregando...' : 'Hacer administrador'}
            </button>
          </form>

          {adminMessage && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${adminMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
              {adminMessage.text}
            </div>
          )}

          <div className="mt-6">
            <h3 className="text-sm font-medium text-slate-600 mb-2">Administradores actuales</h3>
            <div className="space-y-2">
              {users.filter(u => u.role === 'admin').map(a => (
                <div key={a.uid} className="flex items-center justify-between bg-purple-50 rounded-lg p-3">
                  <span className="text-sm text-slate-700">{a.email}</span>
                  <span className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded-full">Admin</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mensajes a la comunidad */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-xl font-semibold text-slate-700 mb-4">📢 Compartir con la comunidad</h2>
          <p className="text-sm text-slate-500 mb-4">
            Prepara invitaciones para lanzamientos, actividades gratuitas o mensajes para la comunidad.
            <span className="block mt-1 text-amber-600">🌟 El envío automático estará disponible próximamente.</span>
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Destinatarios</label>
              <select
                value={messageTarget}
                onChange={e => setMessageTarget(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="all">Todos los registrados</option>
                <option value="active">Alumnos con acceso vigente</option>
                <option value="premium">Alumnos premium</option>
                <option value="course">Alumnos de un curso específico</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Asunto</label>
              <input
                type="text"
                value={messageSubject}
                onChange={e => setMessageSubject(e.target.value)}
                placeholder="Ej: Nueva actividad gratuita..."
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mensaje</label>
              <textarea
                value={messageBody}
                onChange={e => setMessageBody(e.target.value)}
                rows={5}
                placeholder="Escribe aquí el mensaje..."
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div className="flex items-center gap-4 pt-2">
              <button disabled className="bg-slate-300 text-slate-500 px-6 py-2 rounded-lg cursor-not-allowed font-medium">
                Enviar invitación consciente
              </button>
              <span className="text-xs text-slate-400">El envío se activará cuando integremos el servicio de correo.</span>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}

export default Admin