# Espacio Sagrado — Plataforma de Consciencia

Plataforma educativa consciente para cursos de meditación, consciencia y bienestar integral.

## Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Firebase Cloud Functions (Node.js 22)
- **Base de datos**: Firestore
- **Autenticación**: Firebase Auth con Custom Claims
- **Pagos**: Stripe + MercadoPago
- **Email**: Resend
- **Hosting**: Firebase Hosting

## Requisitos

- Node.js 18+
- Firebase CLI: `npm install -g firebase-tools`
- Cuenta Firebase con proyecto activo

## Instalación local

```bash
# Clonar el repositorio
git clone https://github.com/saullenguas/espacio-sagrado.git
cd espacio-sagrado

# Instalar dependencias del frontend
npm install

# Instalar dependencias de functions
cd functions && npm install && cd ..
```

## Variables de entorno

Copia `.env.example` como `.env` y completa los valores:

```bash
cp .env.example .env
```

Variables requeridas:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_PAYMENT_MODE=simulation
VITE_FUNCTIONS_URL=
VITE_DELETE_USER_URL=
EMAIL_TEST_MODE=true
```

## Secrets de Cloud Functions

```bash
firebase functions:secrets:set RESEND_API_KEY
firebase functions:secrets:set STRIPE_SECRET_KEY
firebase functions:secrets:set MERCADOPAGO_ACCESS_TOKEN
firebase functions:secrets:set MERCADOPAGO_WEBHOOK_SECRET
```

## Desarrollo local

```bash
npm run dev
```

## Deploy a producción

```bash
# Build del frontend
npm run build

# Deploy completo
firebase deploy

# Deploy solo frontend
firebase deploy --only hosting

# Deploy solo functions
firebase deploy --only functions

# Deploy solo reglas
firebase deploy --only firestore:rules
```

## Modos de pago

En `.env` controla el modo de pago:

```env
# Simulación — pagos ficticios para desarrollo
VITE_PAYMENT_MODE=simulation

# Producción — pagos reales con Stripe y MercadoPago
VITE_PAYMENT_MODE=production
```

## Roles de usuario

| Rol | Acceso |
|-----|--------|
| `student` | Cursos adquiridos |
| `admin` | Panel completo |

Los roles se asignan via Custom Claims en Firebase Auth — nunca desde el cliente.

## Cloud Functions

| Función | Descripción |
|---------|-------------|
| `assignStudentRole` | Asigna claim al registrarse |
| `setAdminRole` | Asigna rol admin |
| `createCheckoutSession` | Crea sesión de pago |
| `verifyAndGrantAccess` | Verifica pago y da acceso |
| `enrollStudentManually` | Alta manual de alumno |
| `revokeStudentAccess` | Revoca acceso |
| `deleteUserAccount` | Elimina cuenta completa |
| `cleanProcessedPayments` | Limpia pagos antiguos (diario) |
| `revokeExpiredPremium` | Revoca premium vencido (diario) |
| `mercadopagoWebhook` | Webhook de notificaciones MP |

## Estructura del proyecto