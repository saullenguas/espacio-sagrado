import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { verifyAndGrantAccess } from '../services/paymentService'
import { doc, setDoc, getDoc, arrayUnion } from 'firebase/firestore'
import { db } from '../firebase/config'

const PAYMENT_MODE = import.meta.env.VITE_PAYMENT_MODE || 'simulation'

const grantAccessSimulated = async (userId, metadata) => {
  const { type, courseId, duration = '1y' } = metadata
  const userRef = doc(db, 'users', userId)
  const userSnap = await getDoc(userRef)

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      email: metadata.email || '',
      role: 'student',
      enrolledCourses: [],
      accessType: 'limited',
      premiumExpiry: null,
      createdAt: new Date(),
    })
  }

  if (type === 'course' && courseId) {
    await setDoc(userRef, { enrolledCourses: arrayUnion(courseId) }, { merge: true })
    return { type: 'course', courseId }
  }

  if (type === 'premium') {
    const expiry = new Date()
    if (duration === '6m') expiry.setMonth(expiry.getMonth() + 6)
    else expiry.setFullYear(expiry.getFullYear() + 1)
    await setDoc(userRef, { accessType: 'all', premiumExpiry: expiry }, { merge: true })
    return { type: 'premium', expiresAt: expiry }
  }

  throw new Error('Tipo de compra no reconocido')
}

function PagoExitoso() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, loading, refreshUser } = useAuth()
  const [status, setStatus] = useState('procesando')
  const [message, setMessage] = useState('')
  const [detail, setDetail] = useState(null)

  const processPayment = useCallback(async () => {
    try {
      const simulated = searchParams.get('simulated')
      const sessionId = searchParams.get('session_id') || searchParams.get('payment_id')
      const provider = searchParams.get('provider') || 'stripe'

      let result

      if (simulated === 'true') {
        if (PAYMENT_MODE !== 'simulation') {
          throw new Error('Pago simulado no permitido en modo producción')
        }
        const metadataStr = searchParams.get('metadata')
        if (!metadataStr) throw new Error('Metadata de simulación no encontrada')
        const metadata = JSON.parse(metadataStr)

        if (!metadata.userId || metadata.userId !== user.uid) {
          throw new Error('El pago no corresponde a tu usuario')
        }

        result = await grantAccessSimulated(user.uid, metadata)

      } else if (sessionId) {
        result = await verifyAndGrantAccess(sessionId, provider)
        if (!result.success) throw new Error('El pago no pudo ser verificado')
      } else {
        throw new Error('No se encontraron datos de pago')
      }

      await refreshUser()

      if (result.type === 'course') {
        setMessage('¡Te has inscrito correctamente al curso! 🌿')
        setDetail('Ya puedes acceder a todos los módulos y lecciones.')
      } else if (result.type === 'premium') {
        setMessage('¡Ahora tienes acceso total a todos los cursos! 💎')
        const expiry = result.expiresAt
          ? new Date(result.expiresAt).toLocaleDateString('es-MX', {
              year: 'numeric', month: 'long', day: 'numeric'
            })
          : null
        setDetail(expiry ? `Tu acceso es válido hasta el ${expiry}.` : null)
      } else {
        setMessage('¡Pago procesado con éxito!')
      }

      setStatus('exito')

    } catch (error) {
      console.error('Error procesando pago:', error)
      setStatus('error')
      setMessage('Ocurrió un error al procesar tu pago.')
      setDetail('Por favor contacta al administrador o intenta de nuevo.')
    }
  }, [user, searchParams, refreshUser])

  useEffect(() => {
    if (loading) return
    if (!user) {
      navigate(`/login?redirect=/pago-exitoso?${searchParams.toString()}`, { replace: true })
      return
    }
    processPayment()
  }, [user, loading, navigate, searchParams, processPayment])

  if (status === 'procesando') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-slate-600">Procesando tu pago...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-50 via-white to-purple-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
        {status === 'exito' ? (
          <>
            <div className="text-6xl mb-4">✨</div>
            <h1 className="text-2xl font-bold text-slate-800">¡Gracias por confiar en este espacio!</h1>
            <p className="text-slate-600 mt-3">{message}</p>
            {detail && <p className="text-slate-500 text-sm mt-2">{detail}</p>}
            <Link
              to="/"
              className="mt-6 inline-block bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition"
            >
              Ir a mis cursos
            </Link>
          </>
        ) : (
          <>
            <div className="text-6xl mb-4">😔</div>
            <h1 className="text-2xl font-bold text-slate-800">Algo no salió como esperábamos</h1>
            <p className="text-slate-600 mt-3">{message}</p>
            {detail && <p className="text-slate-500 text-sm mt-2">{detail}</p>}
            <Link
              to="/suscribirse"
              className="mt-6 inline-block bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition"
            >
              Intentar de nuevo
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

export default PagoExitoso