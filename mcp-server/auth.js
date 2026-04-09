import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { db } from './firebase.js';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;

// In-memory store for auth codes (short-lived, 5 min TTL)
const authCodes = new Map();

// Cleanup expired codes every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [code, data] of authCodes) {
    if (now > data.expiresAt) authCodes.delete(code);
  }
}, 10 * 60 * 1000);

export function generateAuthCode(userId, email, role, codeChallenge, codeChallengeMethod, redirectUri) {
  const code = crypto.randomBytes(32).toString('hex');
  authCodes.set(code, {
    userId,
    email,
    role,
    codeChallenge,
    codeChallengeMethod,
    redirectUri,
    expiresAt: Date.now() + 5 * 60 * 1000,
  });
  return code;
}

export function exchangeAuthCode(code, codeVerifier) {
  const data = authCodes.get(code);
  if (!data) throw new Error('Invalid authorization code');

  if (Date.now() > data.expiresAt) {
    authCodes.delete(code);
    throw new Error('Authorization code expired');
  }

  // Verify PKCE if code_challenge was provided
  if (data.codeChallenge && data.codeChallengeMethod === 'S256') {
    const challenge = crypto.createHash('sha256').update(codeVerifier || '').digest('base64url');
    if (challenge !== data.codeChallenge) {
      throw new Error('Invalid code verifier');
    }
  }

  authCodes.delete(code);

  const accessToken = jwt.sign(
    { userId: data.userId, email: data.email, role: data.role },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  return {
    access_token: accessToken,
    token_type: 'bearer',
    expires_in: 30 * 24 * 60 * 60,
  };
}

export function verifyToken(authHeader) {
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header');
  }
  const token = authHeader.slice(7);
  return jwt.verify(token, JWT_SECRET);
}

export async function authenticateWithFirebase(email, password) {
  if (!FIREBASE_API_KEY) {
    throw new Error('FIREBASE_API_KEY environment variable is required');
  }

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );

  const data = await res.json();
  if (data.error) {
    throw new Error(data.error.message);
  }

  // Get user role from Firestore
  const userDoc = await db.collection('users').doc(data.localId).get();
  const role = userDoc.exists ? userDoc.data().role || 'user' : 'user';

  return { userId: data.localId, email: data.email, role };
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function getLoginPage(params) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Sync Projects - Conectar con Claude</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      background: #0a0a0f;
      color: #e0e0e0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    .card {
      background: #16161e;
      border: 1px solid #2a2a3a;
      border-radius: 12px;
      padding: 2.5rem;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }
    .logo-icon {
      width: 32px;
      height: 32px;
      background: #015E7C;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1rem;
      color: #fff;
    }
    h1 { font-size: 1.25rem; color: #fff; font-weight: 600; }
    .subtitle { color: #888; font-size: 0.875rem; margin-bottom: 2rem; }
    .field { margin-bottom: 1.25rem; }
    label { display: block; font-size: 0.8125rem; color: #aaa; margin-bottom: 0.375rem; font-weight: 500; }
    input[type="email"], input[type="password"] {
      width: 100%;
      padding: 0.75rem 1rem;
      background: #1e1e2e;
      border: 1px solid #2a2a3a;
      border-radius: 8px;
      color: #fff;
      font-size: 0.9375rem;
      outline: none;
      transition: border-color 0.2s;
    }
    input:focus { border-color: #015E7C; }
    button[type="submit"] {
      width: 100%;
      padding: 0.75rem;
      background: #015E7C;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-size: 0.9375rem;
      cursor: pointer;
      font-weight: 500;
      transition: background 0.2s;
      margin-top: 0.5rem;
    }
    button[type="submit"]:hover { background: #017a9e; }
    button[type="submit"]:active { background: #014d64; }
    .error {
      background: #2d1b1b;
      border: 1px solid #5c2b2b;
      color: #f87171;
      padding: 0.75rem;
      border-radius: 8px;
      margin-bottom: 1.25rem;
      font-size: 0.8125rem;
    }
    .info {
      color: #666;
      font-size: 0.75rem;
      text-align: center;
      margin-top: 1.5rem;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">
      <div class="logo-icon">S</div>
      <h1>Sync Projects</h1>
    </div>
    <p class="subtitle">Inicia sesion para conectar con Claude</p>
    ${params.error ? `<div class="error">${escapeHtml(params.error)}</div>` : ''}
    <form method="POST" action="/authorize">
      <input type="hidden" name="redirect_uri" value="${escapeHtml(params.redirect_uri)}" />
      <input type="hidden" name="state" value="${escapeHtml(params.state)}" />
      <input type="hidden" name="code_challenge" value="${escapeHtml(params.code_challenge)}" />
      <input type="hidden" name="code_challenge_method" value="${escapeHtml(params.code_challenge_method)}" />
      <div class="field">
        <label for="email">Email</label>
        <input type="email" id="email" name="email" required autocomplete="email" placeholder="tu@email.com" />
      </div>
      <div class="field">
        <label for="password">Password</label>
        <input type="password" id="password" name="password" required autocomplete="current-password" />
      </div>
      <button type="submit">Conectar</button>
    </form>
    <p class="info">Usa las mismas credenciales que en la app</p>
  </div>
</body>
</html>`;
}
