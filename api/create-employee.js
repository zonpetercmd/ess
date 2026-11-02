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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    initFirebase();
    const db = admin.database();

    // ✅ SECURITY: Check Token (Only Admin can create)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing token' });
    }
    
    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'secret_key_123';
    
    try {
      const decoded = jwt.verify(token, secret);
      if (decoded.role !== 'Admin') {
        return res.status(403).json({ error: 'Forbidden: Only Admin can create users' });
      }
    } catch (err) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    // ✅ FIX: Yahan empCode receive kiya gaya hai
    const { name, email, password, designation, basicSalary, role, empCode } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password required' });
    }

    // Check if email exists in 'users' node
    const existing = await db.ref('users').orderByChild('email').equalTo(email).once('value');
    if (existing.exists()) return res.status(400).json({ error: 'Email already exists' });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    
    const newRef = db.ref('users').push();
    const uid = newRef.key;

    await newRef.set({
      uid: uid,
      name, 
      email, 
      designation: designation || 'Staff', 
      role: role || 'Employee', // Admin, Manager, Employee
      basicSalary: Number(basicSalary) || 0,
      empCode: empCode || '', // ✅ FIX: empCode database mein save ho raha hai
      passwordHash: hash,
      status: 'approved', // Admin ne banaya hai, toh direct approved
      createdAt: Date.now()
    });

    res.json({ success: true, message: 'User created successfully' });

  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};
