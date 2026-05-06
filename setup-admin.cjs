// setup-admin.cjs
// Uso: node setup-admin.cjs <UID>
// Ejemplo: node setup-admin.cjs LMrxbihIUhYmt995KHOUKYaOD142

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

const uid = process.argv[2];

if (!uid) {
  console.error('❌ Debes proporcionar un UID como argumento.');
  console.error('   Uso: node setup-admin.cjs <UID>');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function setAdmin() {
  await admin.auth().setCustomUserClaims(uid, { role: 'admin' });
  console.log(`✅ Custom claim "role: admin" asignado a UID: ${uid}`);
  const user = await admin.auth().getUser(uid);
  console.log('Claims actuales:', JSON.stringify(user.customClaims));
}

setAdmin().catch(console.error);