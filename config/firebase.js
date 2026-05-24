const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

let db = null;

function initFirebase() {
  if (db) return db;

  try {
    let serviceAccount;

    const keyPath = path.join(__dirname, '..', 'serviceAccountKey.json');
    if (fs.existsSync(keyPath)) {
      serviceAccount = require(keyPath);
    }
    else if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
      const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
      serviceAccount = JSON.parse(decoded);
    }
    else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
      };
    }
    else {
      console.warn('Firebase credentials not found. Server will start but database features will not work.');
      return null;
    }

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL || "https://gen-z-airdrop-default-rtdb.asia-southeast1.firebasedatabase.app"
      });

      db = admin.database();
      console.log('Firebase Realtime Database initialized');
    } else {
      db = null;
    }
    return db;
  } catch (error) {
    console.error('Firebase init error:', error.message);
    console.warn('Server will continue without Firebase. Database features unavailable.');
    db = null;
    return null;
  }
}

function getDB() {
  if (!db) initFirebase();
  return db;
}

module.exports = { initFirebase, getDB, admin };
