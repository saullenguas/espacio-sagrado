import { getFunctions, httpsCallable } from 'firebase/functions'

const functions = getFunctions(undefined, 'us-central1')

const PAYMENT_MODE = import.meta.env.VITE_PAYMENT_MODE || 'simulation'

export const PRICES = {
  course: { mxn: 300, usd: 15, eur: 14 },
  premium: {
    '1y': { mxn: 1990, usd: 99, eur: 92 },
    '6m': { mxn: 1190, usd: 59, eur: 55 },
  },
}

export const createCheckoutSession = async ({
  provider,
  type,
  courseId = null,
  currency = 'usd',
  duration = '1y',
  userId,
  email,
}) => {
  if (PAYMENT_MODE === 'simulation') {
    const metadata = JSON.stringify({ type, courseId, currency, duration, provider, userId, email })
    const params = new URLSearchParams({ simulated: 'true', metadata })
    if (courseId) params.set('courseId', courseId)
    return `/pago-exitoso?${params.toString()}`
  }

  const fn = httpsCallable(functions, 'createCheckoutSession')
  const result = await fn({ provider, type, courseId, currency, duration })
  return result.data.url
}

export const verifyAndGrantAccess = async (sessionId, provider) => {
  if (PAYMENT_MODE === 'simulation') {
    return { success: true, simulated: true }
  }
  const fn = httpsCallable(functions, 'verifyAndGrantAccess')
  const result = await fn({ sessionId, provider })
  return result.data
}

export const suggestProvider = (currency) => {
  if (currency === 'mxn') return 'mercadopago'
  return 'stripe'
}
