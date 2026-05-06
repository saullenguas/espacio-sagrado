import { useState } from 'react'
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { createCheckoutSession, PRICES, suggestProvider } from '../services/paymentService'

function Checkout() {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()

  const courseId = location.state?.courseId || searchParams.get('courseId')
  const type = location.state?.type || searchParams.get('type') || 'premium'
  const duration = searchParams.get('duration') || '1y'

  const [selectedProvider, setSelectedProvider] = useState('stripe')
  const [payLoading, setPayLoading] = useState(false)
  const [error, setError] = useState('')

  // ── Moneda según proveedor ────────────────────
  const currency = selectedProvider === 'mercadopago' ? 'mxn' : 'usd'

  // ── Precios correctos (ya en unidades, no centavos) ──
  const priceUSD = type === 'premium' ? PRICES.premium[duration]?.usd : PRICES.course.usd
  const priceMXN = type === 'premium' ? PRICES.premium[duration]?.mxn : PRICES.course.mxn
  const displayPrice = selectedProvider === 'mercadopago'
    ? `$${priceMXN} MXN`
    : `$${priceUSD} USD`

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-50 via-white to-purple-50">
        <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!user) {
    navigate(`/login?redirect=/checkout?${searchParams.toString()}`, { replace: true })
    return null
  }

  const handlePay = async () => {
    setPayLoading(true)
    setError('')
    try {
      const url = await createCheckoutSession({
        provider: selectedProvider,
        type,
        courseId,
        currency,
        duration,
        // En simulación estos van en el metadata para PagoExitoso
        userId: user.uid,
        email: user.email,
      })
      navigate(url)
    } catch (err) {
      setError('Error al iniciar el pago. Intenta de nuevo.')
      console.error(err)
    } finally {
      setPayLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-50 via-white to-purple-50 px-4 py-12">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full">

        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          {type === 'premium' ? 'Acceso Total' : 'Inscripción al curso'}
        </h1>
        <p className="text-slate-500 mb-6">
          {type === 'premium'
            ? `Accede a todos los cursos presentes y futuros — vigencia ${duration === '6m' ? '6 meses' : '1 año'}.`
            : 'Obtén acceso completo a este curso.'}
        </p>

        {/* Precio */}
        <div className="bg-indigo-50 rounded-xl p-4 mb-6">
          <p className="text-sm text-indigo-600 font-medium">Precio</p>
          <p className="text-3xl font-bold text-slate-800">{displayPrice}</p>
          {selectedProvider === 'mercadopago'
            ? <p className="text-sm text-slate-500">≈ ${priceUSD} USD</p>
            : <p className="text-sm text-slate-500">≈ ${priceMXN} MXN</p>
          }
        </div>

        {/* Método de pago */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Elige tu método de pago
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition">
              <input
                type="radio"
                name="provider"
                value="stripe"
                checked={selectedProvider === 'stripe'}
                onChange={() => setSelectedProvider('stripe')}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="font-medium text-slate-800">Tarjeta (Visa, Mastercard, Apple Pay)</span>
                <p className="text-xs text-slate-400">Cobertura global — USD / EUR</p>
              </div>
            </label>
            <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition">
              <input
                type="radio"
                name="provider"
                value="mercadopago"
                checked={selectedProvider === 'mercadopago'}
                onChange={() => setSelectedProvider('mercadopago')}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="font-medium text-slate-800">MercadoPago (OXXO, transferencia, tarjetas locales)</span>
                <p className="text-xs text-slate-400">Ideal para México y LATAM — MXN</p>
              </div>
            </label>
          </div>
        </div>

        {error && (
          <p className="text-red-500 text-sm text-center bg-red-50 py-2 px-4 rounded-lg mb-4">{error}</p>
        )}

        <button
          onClick={handlePay}
          disabled={payLoading}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {payLoading ? 'Procesando...' : `Pagar ${displayPrice}`}
        </button>

        <p className="text-xs text-slate-400 text-center mt-4">
          🔒 Pago seguro. Tus datos están protegidos.
        </p>
      </div>
    </div>
  )
}

export default Checkout
