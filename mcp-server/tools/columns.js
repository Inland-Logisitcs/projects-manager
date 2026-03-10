import { db } from '../firebase.js';

const COLUMNS_COLLECTION = 'columns';

export function register(server) {
  server.tool(
    'list_columns',
    'List all Kanban board columns',
    {},
    async () => {
      try {
        const snapshot = await db.collection(COLUMNS_COLLECTION).orderBy('order', 'asc').get();
        const columns = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        return {
          content: [{ type: 'text', text: JSON.stringify(columns, null, 2) }],
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
