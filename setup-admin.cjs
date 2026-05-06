const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function setAdmin() {
  const uid = 'LMrxbihIUhYmt995KHOUKYaOD142';
  await admin.auth().setCustomUserClaims(uid, { role: 'admin' });
  console.log('✅ Custom claim "role: admin" asignado correctamente');
  
  const user = await admin.auth().getUser(uid);
  console.log('Claims actuales:', JSON.stringify(user.customClaims));
}

setAdmin().catch(console.error);