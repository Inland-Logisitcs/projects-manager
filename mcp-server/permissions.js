const ROLE_PERMISSIONS = {
  admin: {
    tools: '*',
    restrictedFields: {},
  },
  user: {
    tools: [
      'list_tasks',
      'list_projects',
      'list_sprints',
      'list_columns',
      'list_users',
      'create_task',
      'create_project',
      'update_task',
      'move_task_to_sprint',
    ],
    restrictedFields: {
      update_task: ['storyPoints', 'assignedTo'],
    },
  },
};

export function isToolAllowed(role, toolName) {
  const perms = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.user;
  return perms.tools === '*' || perms.tools.includes(toolName);
}

export function getRestrictedFields(role, toolName) {
  const perms = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.user;
  return perms.restrictedFields[toolName] || [];
}

export function wrapServerWithPermissions(server, role) {
  const originalTool = server.tool.bind(server);

  server.tool = function (name, ...args) {
    if (!isToolAllowed(role, name)) return;

    // Handler is always the last argument
    const handlerIndex = args.length - 1;
    const handler = args[handlerIndex];

    if (typeof handler !== 'function') {
      return originalTool(name, ...args);
    }

    args[handlerIndex] = async (params, extra) => {
      const restricted = getRestrictedFields(role, name);
      for (const field of restricted) {
        if (params[field] !== undefined) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: `No tienes permiso para modificar: ${field}. Solo admins pueden cambiar este campo.`,
                }),
              },
            ],
            isError: true,
          };
        }
      }
      return handler(params, extra);
    };

    return originalTool(name, ...args);
  };
}
