import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { register as registerTasks } from './tools/tasks.js';
import { register as registerProjects } from './tools/projects.js';
import { register as registerSprints } from './tools/sprints.js';
import { register as registerColumns } from './tools/columns.js';
import { register as registerUsers } from './tools/users.js';

const server = new McpServer({
  name: 'sync-projects',
  version: '1.0.0',
});

// Register all tools
registerTasks(server);
registerProjects(server);
registerSprints(server);
registerColumns(server);
registerUsers(server);

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
