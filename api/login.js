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
    const { email, password } = req.body || {};

    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    // 'users' node se check karein
    const snapshot = await db.ref('users').orderByChild('email').equalTo(email).once('value');
    if (!snapshot.exists()) return res.status(401).json({ error: 'Invalid credentials' });

    let user = null, userId = null;
    snapshot.forEach(child => { 
      user = child.val(); 
      userId = child.key; 
    });

    // Status Check
    if (user.status === 'pending') {
        return res.status(403).json({ error: 'Your account is pending approval.' });
    }

    // Password Check
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) return res.status(401).json({ error: 'Invalid credentials' });

    // JWT Token Generation
    const secret = process.env.JWT_SECRET || 'secret_key_123';
    const token = jwt.sign(
      { uid: userId, email: user.email, role: user.role },
      secret,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token: token,
      user: { 
        uid: userId, 
        email: user.email, 
        name: user.name, 
        role: user.role,
        designation: user.designation
      }
    });

  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};
