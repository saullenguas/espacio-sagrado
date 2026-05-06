const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https')
const { onDocumentCreated } = require('firebase-functions/v2/firestore')
const { defineSecret } = require('firebase-functions/params')
const admin = require('firebase-admin')
admin.initializeApp()

const db = admin.firestore()
const RESEND_API_KEY = defineSecret('RESEND_API_KEY')

// HELPERS

const verifyAdmin = async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesion')
  }
  const userDoc = await db.doc(`users/${request.auth.uid}`).get()
  if (!userDoc.exists || userDoc.data().role !== 'admin') {
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
  const TEST_MODE = true
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

// 1. AUTO-ASIGNAR CLAIM AL CREAR DOCUMENTO

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

// 2. ASIGNAR ROL ADMIN

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
        email: email,
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
        html: '<div style="font-family:sans-serif;padding:32px"><h1 style="color:#7c3aed">Has sido nombrado Guardian</h1><p>Se te ha asignado el rol de administrador en Espacio Sagrado.</p><a href="' + passwordLink + '" style="background:#7c3aed;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px">' + (isNewUser ? 'Crear contrasena y entrar' : 'Acceder al panel') + '</a><p style="color:#94a3b8;font-size:14px;margin-top:32px">Este enlace expira en 24 horas.</p></div>',
      })
    }

    console.log('Rol admin asignado a ' + email)
    return { success: true, email: email, uid: authUser.uid, passwordLink: passwordLink }
  }
)

// 3. PAGOS - CREAR SESION DE CHECKOUT

exports.createCheckoutSession = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Debes iniciar sesion')

  const { provider, type, courseId, currency, duration } = request.data
  const curr = currency || 'mxn'
  const dur = duration || '1y'
  const userId = request.auth.uid
  const email = request.auth.token.email

  if (!['stripe', 'mercadopago'].includes(provider)) throw new HttpsError('invalid-argument', 'Proveedor no valido')
  if (!['course', 'premium'].includes(type)) throw new HttpsError('invalid-argument', 'Tipo no valido')
  if (type === 'course' && !courseId) throw new HttpsError('invalid-argument', 'courseId requerido')

  const appUrl = process.env.APP_URL || 'https://espacio-sagrado.web.app'

  if (provider === 'stripe') {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
    const STRIPE_PRICES = {
      course: { usd: 1500, mxn: 30000, eur: 1400 },
      premium: { '1y': { usd: 9900, mxn: 199000, eur: 9200 }, '6m': { usd: 5900, mxn: 119000, eur: 5500 } },
    }
    const unitAmount = type === 'premium' ? STRIPE_PRICES.premium[dur][curr] : STRIPE_PRICES.course[curr]
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: email,
      line_items: [{ price_data: { currency: curr, unit_amount: unitAmount, product_data: { name: 'Espacio Sagrado' } }, quantity: 1 }],
      metadata: { userId: userId, type: type, courseId: courseId || '', duration: dur },
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
      premium: { '1y': { mxn: 1990, usd: 99, eur: 92 }, '6m': { mxn: 1190, usd: 59, eur: 55 } },
    }
    const unitPrice = type === 'premium' ? MP_PRICES.premium[dur][curr] : MP_PRICES.course[curr]
    const preference = new Preference(mp)
    const response = await preference.create({
      body: {
        items: [{ title: 'Espacio Sagrado', unit_price: unitPrice, quantity: 1, currency_id: curr.toUpperCase() }],
        payer: { email: email },
        metadata: { userId: userId, type: type, courseId: courseId || '', duration: dur },
        back_urls: { success: appUrl + '/pago-exitoso?provider=mercadopago', failure: appUrl + '/suscribirse', pending: appUrl + '/suscribirse' },
        auto_return: 'approved',
        external_reference: userId + '_' + type + '_' + (courseId || 'premium') + '_' + Date.now(),
      },
    })
    return { url: response.init_point }
  }
})

// 4. VERIFICAR Y APLICAR ACCESO

exports.verifyAndGrantAccess = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Debes iniciar sesion')

  const { sessionId, provider } = request.data
  const userId = request.auth.uid
  let metadata = {}

  if (provider === 'stripe') {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (session.payment_status !== 'paid') throw new HttpsError('failed-precondition', 'Pago no completado')
    if (session.metadata.userId !== userId) throw new HttpsError('permission-denied', 'Sesion no corresponde')
    metadata = session.metadata
  }

  if (provider === 'mercadopago') {
    const { MercadoPagoConfig, Payment } = require('mercadopago')
    const mp = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN })
    const payment = await new Payment(mp).get({ id: sessionId })
    if (payment.status !== 'approved') throw new HttpsError('failed-precondition', 'Pago no aprobado')
    if (payment.metadata && payment.metadata.userId !== userId) throw new HttpsError('permission-denied', 'Pago no corresponde')
    metadata = payment.metadata
  }

  const type = metadata.type
  const courseId = metadata.courseId
  const duration = metadata.duration || '1y'
  const userRef = db.doc('users/' + userId)

  if (type === 'course' && courseId) {
    await userRef.update({
      enrolledCourses: admin.firestore.FieldValue.arrayUnion(courseId),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })
    return { success: true, type: 'course', courseId: courseId }
  }

  if (type === 'premium') {
    const expiry = calcPremiumExpiry(duration)
    await userRef.update({
      accessType: 'all',
      premiumExpiry: admin.firestore.Timestamp.fromDate(expiry),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })
    return { success: true, type: 'premium', expiresAt: expiry.toISOString() }
  }

  throw new HttpsError('invalid-argument', 'Tipo no reconocido')
})

// 5. ALTA MANUAL DE ALUMNO

exports.enrollStudentManually = onCall(
  { secrets: [RESEND_API_KEY] },
  async (request) => {
    await verifyAdmin(request)

    const { email, type, courseId, duration } = request.data
    const dur = duration || '1y'
    if (!email) throw new HttpsError('invalid-argument', 'Email requerido')
    if (!['course', 'premium'].includes(type)) throw new HttpsError('invalid-argument', 'Tipo invalido')
    if (type === 'course' && !courseId) throw new HttpsError('invalid-argument', 'courseId requerido')

    let authUser
    let isNewUser = false
    try {
      authUser = await admin.auth().getUserByEmail(email)
    } catch (e) {
      authUser = await admin.auth().createUser({ email: email })
      await admin.auth().setCustomUserClaims(authUser.uid, { role: 'student' })
      isNewUser = true
    }

    const userRef = db.doc('users/' + authUser.uid)
    const userSnap = await userRef.get()

    if (!userSnap.exists) {
      const newData = {
        email: email,
        name: '',
        role: 'student',
        accessType: type === 'premium' ? 'all' : 'limited',
        enrolledCourses: type === 'course' && courseId ? [courseId] : [],
        premiumExpiry: type === 'premium' ? admin.firestore.Timestamp.fromDate(calcPremiumExpiry(dur)) : null,
        subscriptionStatus: 'manual',
        enrolledManually: true,
        enrolledByAdmin: request.auth.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }
      await userRef.set(newData)
    } else {
      const update = { updatedAt: admin.firestore.FieldValue.serverTimestamp() }
      if (type === 'course' && courseId) {
        update.enrolledCourses = admin.firestore.FieldValue.arrayUnion(courseId)
      }
      if (type === 'premium') {
        update.accessType = 'all'
        update.premiumExpiry = admin.firestore.Timestamp.fromDate(calcPremiumExpiry(dur))
      }
      await userRef.update(update)
    }

    let passwordLink = null
    try {
      passwordLink = await admin.auth().generatePasswordResetLink(email)
    } catch (e) {
      console.warn('No se pudo generar link: ' + e.message)
    }

    if (passwordLink) {
      await sendEmail(RESEND_API_KEY.value(), {
        to: email,
        subject: 'Tu acceso a Espacio Sagrado esta listo',
        html: '<div style="font-family:sans-serif;padding:32px"><h1 style="color:#4f46e5">Tu espacio te espera</h1><p>Se te ha dado acceso en Espacio Sagrado.</p><a href="' + passwordLink + '" style="background:#4f46e5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px">' + (isNewUser ? 'Crear contrasena y entrar' : 'Entrar al espacio') + '</a><p style="color:#94a3b8;font-size:14px;margin-top:32px">Este enlace expira en 24 horas.</p></div>',
      })
    }

    return { success: true, uid: authUser.uid, email: email, type: type }
  }
)

exports.revokeStudentAccess = onCall(async (request) => {
  console.log('revokeStudentAccess llamado por:', request.auth?.uid)
  
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesion')
  }

  const adminDoc = await db.doc('users/' + request.auth.uid).get()
  console.log('adminDoc existe:', adminDoc.exists, 'rol:', adminDoc.data()?.role)
  
  if (!adminDoc.exists || adminDoc.data().role !== 'admin') {
    throw new HttpsError('permission-denied', 'Solo administradores')
  }

  const { uid, courseId } = request.data
  console.log('uid a revocar:', uid, 'courseId:', courseId)
  
  if (!uid) throw new HttpsError('invalid-argument', 'UID requerido')

  const userRef = db.doc('users/' + uid)
  const userSnap = await userRef.get()
  console.log('userSnap existe:', userSnap.exists)
  
  if (!userSnap.exists) throw new HttpsError('not-found', 'Usuario no encontrado')

  await userRef.update({
    accessType: 'limited',
    premiumExpiry: null,
    enrolledCourses: [],
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  })
  
  console.log('Acceso revocado exitosamente para:', uid)
  return { success: true, uid: uid, revokedAll: true }
})

// 7. ELIMINAR CUENTA COMPLETA

exports.deleteUserAccount = onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') { res.status(204).send(''); return }

  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) { res.status(401).json({ error: 'No autenticado' }); return }
    const decoded = await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1])
    const adminDoc = await db.doc('users/' + decoded.uid).get()
    if (!adminDoc.exists || adminDoc.data().role !== 'admin') { res.status(403).json({ error: 'Solo administradores' }); return }

    const { uid } = req.body
    if (!uid) { res.status(400).json({ error: 'UID requerido' }); return }

    try { await admin.auth().deleteUser(uid) } catch (e) { console.log('Usuario ' + uid + ' no encontrado en Auth') }
    await db.doc('users/' + uid).delete()
    res.json({ success: true, uid: uid })
  } catch (e) {
    console.error('Error en deleteUserAccount:', e)
    res.status(500).json({ error: e.message })
  }
})
