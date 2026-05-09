import { memo } from 'react'
import { useEffect } from 'react'

function Toast({ message, type = 'info', onClose, duration = 4000 }) {
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [message, onClose, duration])

  if (!message) return null

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-700',
    error: 'bg-red-50 border-red-200 text-red-600',
    info: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    warning: 'bg-amber-50 border-amber-200 text-amber-700',
  }

  const icons = {
    success: '✅',
    error: '❌',
    info: '💡',
    warning: '⚠️',
  }

  return (
    <div className="fixed top-6 right-6 z-50 animate-slide-in">
      <div className={`flex items-center gap-3 px-5 py-3 rounded-xl border shadow-lg ${colors[type] || colors.info}`}>
        <span className="text-lg">{icons[type] || icons.info}</span>
        <p className="text-sm font-medium">{message}</p>
        <button onClick={onClose} className="ml-4 text-current opacity-50 hover:opacity-100 transition">
          ✕
        </button>
      </div>
    </div>
  )
}


export default memo(Toast)
// y agregar al import: import { memo } from 'react'