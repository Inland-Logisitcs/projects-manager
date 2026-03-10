import { z } from 'zod';
import { db } from '../firebase.js';
import { FieldValue } from 'firebase-admin/firestore';

const PROJECTS_COLLECTION = 'projects';

export function register(server) {
  server.tool(
    'create_project',
    'Create a new project',
    {
      name: z.string().describe('Project name'),
      priority: z.number().optional().describe('Priority order (lower = higher priority)'),
      dependencies: z.array(z.string()).optional().describe('Array of project IDs this depends on'),
    },
    async (params) => {
      try {
        const docRef = await db.collection(PROJECTS_COLLECTION).add({
          name: params.name,
          priority: params.priority ?? 0,
          dependencies: params.dependencies || [],
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
    'list_projects',
    'List all projects',
    {},
    async () => {
      try {
        const snapshot = await db.collection(PROJECTS_COLLECTION).orderBy('priority', 'asc').get();
        const projects = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        return {
          content: [{ type: 'text', text: JSON.stringify(projects, null, 2) }],
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
    'update_project',
    'Update an existing project',
    {
      projectId: z.string().describe('Project ID to update'),
      name: z.string().optional(),
      priority: z.number().optional(),
      dependencies: z.array(z.string()).optional(),
    },
    async (params) => {
      try {
        const { projectId, ...updates } = params;
        const projectRef = db.collection(PROJECTS_COLLECTION).doc(projectId);

        await projectRef.update({
          ...updates,
          updatedAt: FieldValue.serverTimestamp(),
        });

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

  server.tool(
    'delete_project',
    'Delete a project',
    {
      projectId: z.string().describe('Project ID to delete'),
    },
    async (params) => {
      try {
        await db.collection(PROJECTS_COLLECTION).doc(params.projectId).delete();
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
