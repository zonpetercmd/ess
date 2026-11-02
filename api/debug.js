const admin = require('firebase-admin');

function initFirebase() {
  if (admin.apps.length > 0) return;
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
}

module.exports = async (req, res) => {
  try {
    initFirebase();
    const db = admin.database();
    
    // Check users node
    const snap = await db.ref('users').once('value');
    
    res.json({
      connected_db_url: process.env.FIREBASE_DATABASE_URL,
      users_data_found: snap.exists(),
      data: snap.val()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
