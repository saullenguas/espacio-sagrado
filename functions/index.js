const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https')
const { onDocumentCreated } = require('firebase-functions/v2/firestore')
const { defineSecret } = require('firebase-functions/params')
const admin = require('firebase-admin')
admin.initializeApp()

const db = admin.firestore()
const RESEND_API_KEY = defineSecret('RESEND_API_KEY')

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

// Verificar admin usando el custom claim del token JWT
// — más eficiente que leer Firestore y es la fuente de verdad correcta
const verifyAdmin = async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesión')
  }
  if (request.auth.token.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Solo administradores')
  }
}

const calcPremiumExpiry = (duration) => {
  const date = new Date()
  if (duration === '6m') date.setMonth(date.getMonth() + 6)
  else date.setFullYear(date.getFullYear() + 1)
  return date
}

const sendEmail = async (apiKey, { to, subject, html }) => {
  const { Resend } = require('resend')
  const resend = new Resend(apiKey)
  // Controlado por variable de entorno — false en producción, true en desarrollo
  const TEST_MODE = process.env.EMAIL_TEST_MODE === 'true'
  const recipient = TEST_MODE ? 'tierraevolucion@gmail.com' : to
  try {
    await resend.emails.send({
      from: 'Espacio Sagrado <onboarding@resend.dev>',
      to: recipient,
      subject,
      html,
    })
    console.log('Correo enviado a ' + recipient)
  } catch (e) {
    console.error('Error Resend:', e.message)
  }
}

// ─────────────────────────────────────────────
// 1. AUTO-ASIGNAR CLAIM AL CREAR DOCUMENTO
// ─────────────────────────────────────────────

exports.assignStudentRole = onDocumentCreated(
  { document: 'users/{uid}', secrets: [RESEND_API_KEY] },
  async (event) => {
    const uid = event.params.uid
    const data = event.data && event.data.data()
    if (!data) return

    if (data.role === 'student') {
      try {
        await admin.auth().setCustomUserClaims(uid, { role: 'student' })
        console.log('Claim student asignado a uid: ' + uid)
      } catch (e) {
        console.warn('No se pudo asignar claim a ' + uid + ': ' + e.message)
      }

      if (data.email) {
        await sendEmail(RESEND_API_KEY.value(), {
          to: data.email,
          subject: 'Bienvenido a Espacio Sagrado',
          html: '<div style="font-family:sans-serif;padding:32px"><h1 style="color:#4f46e5">Bienvenido a Espacio Sagrado</h1><p>Gracias por unirte. Explora los cursos a tu propio ritmo.</p><a href="https://espacio-sagrado.web.app" style="background:#4f46e5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px">Entrar al espacio</a></div>',
        })
      }
    }
  }
)

// ─────────────────────────────────────────────
// 2. ASIGNAR ROL ADMIN
// ─────────────────────────────────────────────

exports.setAdminRole = onCall(
  { secrets: [RESEND_API_KEY] },
  async (request) => {
    await verifyAdmin(request)

    const { email } = request.data
    if (!email) throw new HttpsError('invalid-argument', 'El email es requerido')

    let authUser
    let isNewUser = false
    try {
      authUser = await admin.auth().getUserByEmail(email)
    } catch (e) {
      authUser = await admin.auth().createUser({ email })
      isNewUser = true
      await db.doc('users/' + authUser.uid).set({
        email,
        name: '',
        role: 'admin',
        accessType: 'all',
        enrolledCourses: [],
        premiumExpiry: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    }

    await admin.auth().setCustomUserClaims(authUser.uid, { role: 'admin' })
    await db.doc('users/' + authUser.uid).set({ role: 'admin', accessType: 'all' }, { merge: true })

    let passwordLink = null
    try {
      passwordLink = await admin.auth().generatePasswordResetLink(email)
    } catch (e) {
      console.warn('No se pudo generar link para ' + email + ': ' + e.message)
    }

    if (passwordLink) {
      await sendEmail(RESEND_API_KEY.value(), {
        to: email,
        subject: 'Eres administrador de Espacio Sagrado',
        html: '<div style="font-family:sans-serif;padding:32px"><h1 style="color:#7c3aed">Has sido nombrado Guardian</h1><p>Se te ha asignado el rol de administrador en Espacio Sagrado.</p><a href="' + passwordLink + '" style="background:#7c3aed;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px">' + (isNewUser ? 'Crear contraseña y entrar' : 'Acceder al panel') + '</a><p style="color:#94a3b8;font-size:14px;margin-top:32px">Este enlace expira en 24 horas.</p></div>',
      })
    }

    console.log('Rol admin asignado a ' + email)
    // passwordLink NO se devuelve al cliente — ya fue enviado por email
    return { success: true, email, uid: authUser.uid }
  }
)

// ─────────────────────────────────────────────
// 3. PAGOS — CREAR SESIÓN DE CHECKOUT
// ─────────────────────────────────────────────

exports.createCheckoutSession = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Debes iniciar sesión')

  const { provider, type, courseId, currency, duration } = request.data
  const curr = currency || 'mxn'
  const dur = duration || '1y'
  const userId = request.auth.uid
  const email = request.auth.token.email

  if (!['stripe', 'mercadopago'].includes(provider))
    throw new HttpsError('invalid-argument', 'Proveedor no válido')
  if (!['course', 'premium'].includes(type))
    throw new HttpsError('invalid-argument', 'Tipo no válido')
  if (type === 'course' && !courseId)
    throw new HttpsError('invalid-argument', 'courseId requerido')

  const appUrl = process.env.APP_URL || 'https://espacio-sagrado.web.app'

  try {
    if (provider === 'stripe') {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
      const STRIPE_PRICES = {
        course: { usd: 1500, mxn: 30000, eur: 1400 },
        premium: {
          '1y': { usd: 9900, mxn: 199000, eur: 9200 },
          '6m': { usd: 5900, mxn: 119000, eur: 5500 },
        },
      }
      const unitAmount = type === 'premium'
        ? STRIPE_PRICES.premium[dur][curr]
        : STRIPE_PRICES.course[curr]

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        customer_email: email,
        line_items: [{
          price_data: {
            currency: curr,
            unit_amount: unitAmount,
            product_data: { name: 'Espacio Sagrado' },
          },
          quantity: 1,
        }],
        metadata: { userId, type, courseId: courseId || '', duration: dur },
        success_url: appUrl + '/pago-exitoso?session_id={CHECKOUT_SESSION_ID}&provider=stripe',
        cancel_url: appUrl + '/suscribirse',
      })
      return { url: session.url }
    }

    if (provider === 'mercadopago') {
      const { MercadoPagoConfig, Preference } = require('mercadopago')
      const mp = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN })
      const MP_PRICES = {
        course: { mxn: 300, usd: 15, eur: 14 },
        premium: {
          '1y': { mxn: 1990, usd: 99, eur: 92 },
          '6m': { mxn: 1190, usd: 59, eur: 55 },
        },
      }
      const unitPrice = type === 'premium'
        ? MP_PRICES.premium[dur][curr]
        : MP_PRICES.course[curr]

      const preference = new Preference(mp)
      const response = await preference.create({
        body: {
          items: [{
            title: 'Espacio Sagrado',
            unit_price: unitPrice,
            quantity: 1,
            currency_id: curr.toUpperCase(),
          }],
          payer: { email },
          metadata: { userId, type, courseId: courseId || '', duration: dur },
          back_urls: {
            success: appUrl + '/pago-exitoso?provider=mercadopago',
            failure: appUrl + '/suscribirse',
                      },
          notification_url: appUrl + '/api/mercadopago/webhook',
        },
      })

      return { url: response.init_point }
    }

    throw new HttpsError('internal', 'Proveedor no implementado')
  } catch (error) {
    console.error('Error creando sesión de checkout:', error)
    throw new HttpsError('internal', error.message || 'Error al crear la sesión')
  }
})