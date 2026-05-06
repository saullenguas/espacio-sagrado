import { Routes, Route, Navigate } from "react-router-dom"
import { lazy, Suspense } from "react"
import { PrivateRoute } from "./components/PrivateRoute"
import { AuthProvider } from "./context/AuthProvider"

const Layout = lazy(() => import("./components/Layout"))
const Login = lazy(() => import("./pages/Login"))
const Register = lazy(() => import("./pages/Register"))
const Dashboard = lazy(() => import("./pages/Dashboard"))
const Course = lazy(() => import("./pages/Course"))
const Module = lazy(() => import("./pages/Module"))
const Lesson = lazy(() => import("./pages/Lesson"))
const CreateCourse = lazy(() => import("./pages/CreateCourse"))
const CreateModule = lazy(() => import("./pages/CreateModule"))
const CreateLesson = lazy(() => import("./pages/CreateLesson"))
const Subscribe = lazy(() => import("./pages/Subscribe"))
const Admin = lazy(() => import("./pages/Admin"))
const AdminSettings = lazy(() => import("./pages/AdminSettings"))
const ResetPassword = lazy(() => import("./pages/ResetPassword"))
const Checkout = lazy(() => import("./pages/Checkout"))
const PagoExitoso = lazy(() => import("./pages/PagoExitoso"))

function App() {
  return (
    <AuthProvider>
      <Suspense
        fallback={
          <div className="flex justify-center items-center h-screen bg-slate-50">
            <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
          </div>
        }
      >
        <Routes>
          <Route element={<Layout />}>
            {/* 🟢 RUTAS PÚBLICAS */}
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Register />} />
            <Route path="/" element={<Dashboard />} />
            <Route path="/course/:id" element={<Course />} />
            <Route path="/suscribirse" element={<Subscribe />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/pago-exitoso" element={<PagoExitoso />} />

            {/* 🔵 RUTAS PROTEGIDAS */}
            <Route
              path="/course/:courseId/module/:moduleId"
              element={
                <PrivateRoute>
                  <Module />
                </PrivateRoute>
              }
            />
            <Route
              path="/course/:courseId/lesson/:lessonId"
              element={
                <PrivateRoute>
                  <Lesson />
                </PrivateRoute>
              }
            />

            {/* 👑 RUTAS DE ADMIN */}
            <Route
              path="/admin"
              element={
                <PrivateRoute requiredRole="admin">
                  <Admin />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <PrivateRoute requiredRole="admin">
                  <AdminSettings />
                </PrivateRoute>
              }
            />
            <Route
              path="/create-course"
              element={
                <PrivateRoute requiredRole="admin">
                  <CreateCourse />
                </PrivateRoute>
              }
            />
            <Route
              path="/create-module/:courseId"
              element={
                <PrivateRoute requiredRole="admin">
                  <CreateModule />
                </PrivateRoute>
              }
            />
            <Route
              path="/create-lesson/:courseId/:moduleId"
              element={
                <PrivateRoute requiredRole="admin">
                  <CreateLesson />
                </PrivateRoute>
              }
            />

            {/* 🔴 CUALQUIER OTRA RUTA */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </AuthProvider>
  )
}

export default App
