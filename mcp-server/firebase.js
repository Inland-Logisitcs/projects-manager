import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

let serviceAccount;
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || resolve(__dirname, 'service-account.json');

try {
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
} catch (error) {
  console.error(`Failed to read service account from ${serviceAccountPath}`);
  process.exit(1);
}

const app = initializeApp({
  credential: cert(serviceAccount),
});

// Use the specific "sync-projects" database (not default)
export const db = getFirestore(app, 'sync-projects');
