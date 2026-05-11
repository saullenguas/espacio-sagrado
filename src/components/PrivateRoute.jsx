import { Navigate } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"

export function PrivateRoute({ children, requiredRole }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && user.role !== requiredRole && requiredRole !== "any") {
    return <Navigate to="/" replace />
  }

 
  return children
}