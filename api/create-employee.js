// api/create-employee.js (TEMPORARY BYPASS FOR FIRST USER)
const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');

function initFirebase() {
  if (admin.apps.length > 0) return;
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    initFirebase();
    const db = admin.database();

    // ❌ ध्यान दें: टोकन चेक करने वाला कोड फिलहाल हटा दिया गया है ताकि पहला यूज़र बन सके।

    const { name, email, password, designation, basicSalary } = req.body;
    if (!name || !email || !password || !basicSalary) {
      return res.status(400).json({ error: 'All fields required' });
    }

    const existing = await db.ref('employees').orderByChild('email').equalTo(email).once('value');
    if (existing.exists()) return res.status(400).json({ error: 'Email already exists' });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const newRef = db.ref('employees').push();
    const uid = newRef.key;

    await newRef.set({
      uid: uid,
      name, 
      email, 
      designation: designation || 'Staff', 
      basicSalary: Number(basicSalary),
      passwordHash: hash,
      createdAt: Date.now()
    });

    res.json({ success: true, message: 'Employee created successfully' });

  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};
