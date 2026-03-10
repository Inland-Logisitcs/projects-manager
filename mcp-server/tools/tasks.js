import { z } from 'zod';
import { db } from '../firebase.js';
import { FieldValue } from 'firebase-admin/firestore';

const TASKS_COLLECTION = 'tasks';

export function register(server) {
  server.tool(
    'create_task',
    'Create a new task in the Kanban board',
    {
      title: z.string().describe('Task title'),
      description: z.string().optional().describe('Rich text HTML description'),
      priority: z.enum(['low', 'medium', 'high', 'critical']).optional().describe('Task priority'),
      status: z.string().optional().describe('Column ID (e.g. pending, in-progress, qa, completed)'),
      sprintId: z.string().optional().describe('Sprint ID to assign to (omit for backlog)'),
      projectId: z.string().optional().describe('Project ID'),
      assignedTo: z.string().optional().describe('User ID to assign'),
      storyPoints: z.number().optional().describe('Story points estimate'),
      dependencies: z.array(z.string()).optional().describe('Array of task IDs this task depends on'),
      demoUrl: z.string().optional().describe('Demo URL for QA'),
    },
    async (params) => {
      try {
        const status = params.status || null;
        const movementHistory = [];

        if (status) {
          movementHistory.push({
            type: 'status_change',
            from: null,
            to: status,
            timestamp: new Date(),
          });
        }

        const docRef = await db.collection(TASKS_COLLECTION).add({
          title: params.title,
          description: params.description || '',
          priority: params.priority || 'medium',
          status: status,
          sprintId: params.sprintId || null,
          projectId: params.projectId || null,
          assignedTo: params.assignedTo || null,
          assignee: params.assignedTo || null,
          storyPoints: params.storyPoints || null,
          order: 0,
          archived: false,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          lastStatusChange: status ? FieldValue.serverTimestamp() : null,
          previousStatus: null,
          movementHistory: movementHistory,
          attachments: [],
          comments: [],
          dependencies: params.dependencies || [],
          demoUrl: params.demoUrl || null,
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
    'list_tasks',
    'List tasks with optional filters',
    {
      sprintId: z.string().optional().describe('Filter by sprint ID'),
      status: z.string().optional().describe('Filter by column/status ID'),
      projectId: z.string().optional().describe('Filter by project ID'),
      assignedTo: z.string().optional().describe('Filter by assigned user ID'),
      archived: z.boolean().optional().default(false).describe('Show archived tasks'),
    },
    async (params) => {
      try {
        let ref = db.collection(TASKS_COLLECTION)
          .where('archived', '==', params.archived || false);

        if (params.sprintId) {
          ref = ref.where('sprintId', '==', params.sprintId);
        }
        if (params.status) {
          ref = ref.where('status', '==', params.status);
        }
        if (params.projectId) {
          ref = ref.where('projectId', '==', params.projectId);
        }
        if (params.assignedTo) {
          ref = ref.where('assignedTo', '==', params.assignedTo);
        }

        const snapshot = await ref.get();
        const tasks = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        return {
          content: [{ type: 'text', text: JSON.stringify(tasks, null, 2) }],
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
    'update_task',
    'Update an existing task',
    {
      taskId: z.string().describe('Task ID to update'),
      title: z.string().optional(),
      description: z.string().optional(),
      priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
      status: z.string().optional().describe('Column ID'),
      sprintId: z.string().nullable().optional().describe('Sprint ID (null for backlog)'),
      projectId: z.string().nullable().optional(),
      assignedTo: z.string().nullable().optional().describe('User ID'),
      storyPoints: z.number().nullable().optional(),
      demoUrl: z.string().nullable().optional(),
      dependencies: z.array(z.string()).optional(),
    },
    async (params) => {
      try {
        const { taskId, ...updates } = params;
        const taskRef = db.collection(TASKS_COLLECTION).doc(taskId);
        const taskDoc = await taskRef.get();

        if (!taskDoc.exists) {
          return {
            content: [{ type: 'text', text: JSON.stringify({ success: false, error: 'Task not found' }) }],
            isError: true,
          };
        }

        const currentData = taskDoc.data();
        const updateData = { ...updates, updatedAt: FieldValue.serverTimestamp() };

        // Track status changes in movement history
        if (updates.status && updates.status !== currentData.status) {
          updateData.previousStatus = currentData.status;
          updateData.lastStatusChange = FieldValue.serverTimestamp();
          updateData.movementHistory = FieldValue.arrayUnion({
            type: 'status_change',
            from: currentData.status,
            to: updates.status,
            timestamp: new Date(),
          });
        }

        // Track assignment changes
        if (updates.assignedTo !== undefined && updates.assignedTo !== currentData.assignedTo) {
          updateData.assignee = updates.assignedTo;
          updateData.movementHistory = FieldValue.arrayUnion({
            type: 'assignment_change',
            from: currentData.assignedTo || null,
            to: updates.assignedTo,
            timestamp: new Date(),
          });
        }

        await taskRef.update(updateData);
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
    'archive_task',
    'Archive a task (soft delete)',
    {
      taskId: z.string().describe('Task ID to archive'),
    },
    async (params) => {
      try {
        const taskRef = db.collection(TASKS_COLLECTION).doc(params.taskId);
        await taskRef.update({
          archived: true,
          archivedAt: FieldValue.serverTimestamp(),
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
    'move_task_to_sprint',
    'Move a task to a sprint or back to backlog',
    {
      taskId: z.string().describe('Task ID'),
      sprintId: z.string().nullable().describe('Sprint ID (null to move to backlog)'),
    },
    async (params) => {
      try {
        const taskRef = db.collection(TASKS_COLLECTION).doc(params.taskId);
        const taskDoc = await taskRef.get();

        if (!taskDoc.exists) {
          return {
            content: [{ type: 'text', text: JSON.stringify({ success: false, error: 'Task not found' }) }],
            isError: true,
          };
        }

        const currentTask = taskDoc.data();
        const updateData = {
          sprintId: params.sprintId,
          updatedAt: FieldValue.serverTimestamp(),
        };

        // If moving to backlog, clear status
        if (!params.sprintId && currentTask.status) {
          updateData.status = null;
          updateData.previousStatus = currentTask.status;
          updateData.movementHistory = FieldValue.arrayUnion({
            type: 'status_change',
            from: currentTask.status,
            to: null,
            timestamp: new Date(),
          });
        }
        // If moving to a sprint and task has no status, set pending
        else if (params.sprintId && !currentTask.status) {
          updateData.status = 'pending';
          updateData.previousStatus = null;
          updateData.movementHistory = FieldValue.arrayUnion({
            type: 'status_change',
            from: null,
            to: 'pending',
            timestamp: new Date(),
          });
        }

        await taskRef.update(updateData);
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
