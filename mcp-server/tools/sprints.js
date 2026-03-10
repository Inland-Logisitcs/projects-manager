import { z } from 'zod';
import { db } from '../firebase.js';
import { FieldValue } from 'firebase-admin/firestore';

const SPRINTS_COLLECTION = 'sprints';

export function register(server) {
  server.tool(
    'create_sprint',
    'Create a new sprint',
    {
      name: z.string().describe('Sprint name'),
      goal: z.string().optional().describe('Sprint goal'),
      startDate: z.string().optional().describe('Start date (ISO string)'),
      endDate: z.string().optional().describe('End date (ISO string)'),
      projectId: z.string().optional().describe('Project ID'),
    },
    async (params) => {
      try {
        const docRef = await db.collection(SPRINTS_COLLECTION).add({
          name: params.name,
          goal: params.goal || '',
          startDate: params.startDate || null,
          endDate: params.endDate || null,
          status: 'planned',
          projectId: params.projectId || null,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });

        return {
          content: [{ type: 'text', text: JSON.stringify({ success: true, id: docRef.id }) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ success: false, error: error.message }) }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'list_sprints',
    'List sprints with optional status filter',
    {
      status: z.enum(['planned', 'active', 'completed']).optional().describe('Filter by sprint status'),
    },
    async (params) => {
      try {
        let ref = db.collection(SPRINTS_COLLECTION);

        if (params.status) {
          ref = ref.where('status', '==', params.status);
        }

        const snapshot = await ref.orderBy('createdAt', 'desc').get();
        const sprints = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        return {
          content: [{ type: 'text', text: JSON.stringify(sprints, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ success: false, error: error.message }) }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'update_sprint',
    'Update an existing sprint',
    {
      sprintId: z.string().describe('Sprint ID to update'),
      name: z.string().optional(),
      goal: z.string().optional(),
      startDate: z.string().nullable().optional(),
      endDate: z.string().nullable().optional(),
      status: z.enum(['planned', 'active', 'completed']).optional(),
      projectId: z.string().nullable().optional(),
    },
    async (params) => {
      try {
        const { sprintId, ...updates } = params;
        const sprintRef = db.collection(SPRINTS_COLLECTION).doc(sprintId);

        const updateData = {
          ...updates,
          updatedAt: FieldValue.serverTimestamp(),
        };

        // If completing, add completedAt
        if (updates.status === 'completed') {
          updateData.completedAt = FieldValue.serverTimestamp();
        }

        await sprintRef.update(updateData);
        return {
          content: [{ type: 'text', text: JSON.stringify({ success: true }) }],
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
