import { initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

let credential;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  // Service account JSON as env var (Cloud Run / secrets)
  credential = cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT));
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  // Explicit path to service account file
  const sa = JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'));
  credential = cert(sa);
} else {
  try {
    // Local development fallback
    const sa = JSON.parse(readFileSync(resolve(__dirname, 'service-account.json'), 'utf8'));
    credential = cert(sa);
  } catch {
    // Cloud Run Application Default Credentials
    credential = applicationDefault();
  }
}

const app = initializeApp({ credential });

// Use the specific "sync-projects" database (not default)
export const db = getFirestore(app, 'sync-projects');
