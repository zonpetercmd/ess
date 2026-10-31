// ============================================
// api/login.js — Staff Login Endpoint
// ============================================
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
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // 1. Employee Check (From 'employees' node, not 'users')
    const snapshot = await db.ref('employees').orderByChild('email').equalTo(email).once('value');
    if (!snapshot.exists()) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    let emp = null, empId = null;
    snapshot.forEach(child => { 
      emp = child.val(); 
      empId = child.key; 
    });

    // 2. Password Check
    let isPasswordValid = false;
    if (emp.passwordHash) {
      isPasswordValid = await bcrypt.compare(password, emp.passwordHash);
    } else if (emp.password) {
      // Fallback for plain text passwords (if any old data exists)
      isPasswordValid = (password === emp.password);
      if (isPasswordValid) {
          const salt = await bcrypt.genSalt(10);
          const newHash = await bcrypt.hash(password, salt);
          await db.ref('employees/' + empId).update({ passwordHash: newHash, password: null });
      }
    }

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 3. JWT Token Generation
    const secret = process.env.JWT_SECRET || 'secret_key_123';
    const token = jwt.sign(
      { uid: empId, email: emp.email, role: 'Employee' },
      secret,
      { expiresIn: '7d' }
    );

    // 4. Send Response
    res.json({
      success: true,
      token: token,
      user: { 
        uid: empId, 
        email: emp.email, 
        name: emp.name, 
        designation: emp.designation 
      }
    });

  } catch (error) {
    console.error('Login Server Error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};
