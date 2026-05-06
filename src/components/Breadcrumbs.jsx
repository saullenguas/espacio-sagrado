import { Link, useLocation } from 'react-router-dom'

const routeNames = {
  '/': 'Inicio',
  '/login': 'Iniciar sesión',
  '/registro': 'Registro',
  '/suscribirse': 'Cursos disponibles',
  '/course': 'Curso',
  '/module': 'Módulo',
  '/lesson': 'Lección',
}

function Breadcrumbs() {
  const location = useLocation()
  const pathnames = location.pathname.split('/').filter((x) => x)

  if (pathnames.length === 0) return null // No mostrar en inicio

  return (
    <nav className="text-sm text-slate-500 mb-4">
      <ol className="flex items-center gap-2">
        <li>
          <Link to="/" className="hover:text-indigo-600 transition">
            Inicio
          </Link>
        </li>
        {pathnames.map((value, index) => {
          const path = `/${pathnames.slice(0, index + 1).join('/')}`
          const isLast = index === pathnames.length - 1
          const name = routeNames[path] || value

          return (
            <li key={path} className="flex items-center gap-2">
              <span className="text-slate-300">/</span>
              {isLast ? (
                <span className="text-slate-700 font-medium">{name}</span>
              ) : (
                <Link to={path} className="hover:text-indigo-600 transition">
                  {name}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export default Breadcrumbs