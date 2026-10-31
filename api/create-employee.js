// api/create-employee.js
const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

function initFirebase() {
  if (admin.apps.length > 0) return;
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
}

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    initFirebase();
    const db = admin.database();

    // 1. Verify Admin Token
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing token in request' });
    }
    
    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'secret_key_123';
    
    try {
      // Verify if the token is valid and not expired
      const decoded = jwt.verify(token, secret);
      console.log("Token verified for user:", decoded.email);
    } catch (err) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    }

    // 2. Get Data
    const { name, email, password, designation, basicSalary } = req.body;
    
    if (!name || !email || !password || !basicSalary) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // 3. Check if Email Exists
    const existing = await db.ref('employees').orderByChild('email').equalTo(email).once('value');
    if (existing.exists()) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // 4. Hash Password & Save to Firebase
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
    console.error('Create Employee Server Error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};
