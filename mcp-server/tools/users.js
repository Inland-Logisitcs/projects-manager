import { db } from '../firebase.js';

const USERS_COLLECTION = 'users';

export function register(server) {
  server.tool(
    'list_users',
    'List all users',
    {},
    async () => {
      try {
        const snapshot = await db.collection(USERS_COLLECTION).orderBy('email', 'asc').get();
        const users = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        return {
          content: [{ type: 'text', text: JSON.stringify(users, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ success: false, error: error.message }) }],
          isError: true,
        };
      }
    }
  );
}
