import express from 'express';
import crypto from 'crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { register as registerTasks } from './tools/tasks.js';
import { register as registerProjects } from './tools/projects.js';
import { register as registerSprints } from './tools/sprints.js';
import { register as registerColumns } from './tools/columns.js';
import { register as registerUsers } from './tools/users.js';
import {
  verifyToken,
  authenticateWithFirebase,
  generateAuthCode,
  exchangeAuthCode,
  getLoginPage,
} from './auth.js';
import { wrapServerWithPermissions } from './permissions.js';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 8080;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// --- Session management ---
const sessions = new Map();

function createServerForUser(userRole) {
  const server = new McpServer({ name: 'sync-projects', version: '2.0.0' });
  wrapServerWithPermissions(server, userRole);
  registerTasks(server);
  registerProjects(server);
  registerSprints(server);
  registerColumns(server);
  registerUsers(server);
  return server;
}

// Cleanup stale sessions every 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (now - session.createdAt > 60 * 60 * 1000) {
      session.transport.close?.();
      sessions.delete(id);
    }
  }
}, 30 * 60 * 1000);

// --- OAuth 2.0 Protected Resource Metadata (RFC 9728) ---
app.get('/.well-known/oauth-protected-resource', (req, res) => {
  res.json({
    resource: `${BASE_URL}/mcp`,
    authorization_servers: [BASE_URL],
    bearer_methods_supported: ['header'],
  });
});

app.get('/.well-known/oauth-protected-resource/mcp', (req, res) => {
  res.json({
    resource: `${BASE_URL}/mcp`,
    authorization_servers: [BASE_URL],
    bearer_methods_supported: ['header'],
  });
});

// --- OAuth 2.0 Authorization Server Metadata ---
app.get('/.well-known/oauth-authorization-server', (req, res) => {
  res.json({
    issuer: BASE_URL,
    authorization_endpoint: `${BASE_URL}/authorize`,
    token_endpoint: `${BASE_URL}/token`,
    registration_endpoint: `${BASE_URL}/register`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['none'],
  });
});

// --- OAuth Dynamic Client Registration ---
app.post('/register', (req, res) => {
  const { client_name, redirect_uris } = req.body;
  const clientId = crypto.randomUUID();
  res.status(201).json({
    client_id: clientId,
    client_name: client_name || 'Claude',
    redirect_uris: redirect_uris || [],
    grant_types: ['authorization_code'],
    response_types: ['code'],
    token_endpoint_auth_method: 'none',
  });
});

// --- OAuth Authorization: show login page ---
app.get('/authorize', (req, res) => {
  res.send(
    getLoginPage({
      redirect_uri: req.query.redirect_uri || '',
      state: req.query.state || '',
      code_challenge: req.query.code_challenge || '',
      code_challenge_method: req.query.code_challenge_method || '',
    })
  );
});

// --- OAuth Authorization: handle login ---
app.post('/authorize', async (req, res) => {
  const { email, password, redirect_uri, state, code_challenge, code_challenge_method } = req.body;

  try {
    const user = await authenticateWithFirebase(email, password);
    const code = generateAuthCode(
      user.userId,
      user.email,
      user.role,
      code_challenge,
      code_challenge_method,
      redirect_uri
    );

    const url = new URL(redirect_uri);
    url.searchParams.set('code', code);
    if (state) url.searchParams.set('state', state);
    res.redirect(url.toString());
  } catch (error) {
    res.send(
      getLoginPage({
        redirect_uri: redirect_uri || '',
        state: state || '',
        code_challenge: code_challenge || '',
        code_challenge_method: code_challenge_method || '',
        error: 'Credenciales incorrectas. Verifica tu email y password.',
      })
    );
  }
});

// --- OAuth Token Exchange ---
app.post('/token', (req, res) => {
  try {
    const { code, code_verifier, grant_type } = req.body;

    if (grant_type !== 'authorization_code') {
      return res.status(400).json({ error: 'unsupported_grant_type' });
    }

    const tokenResponse = exchangeAuthCode(code, code_verifier);
    res.json(tokenResponse);
  } catch (error) {
    res.status(400).json({
      error: 'invalid_grant',
      error_description: error.message,
    });
  }
});

// --- Auth middleware for MCP routes ---
function authMiddleware(req, res, next) {
  try {
    req.user = verifyToken(req.headers.authorization);
    next();
  } catch (error) {
    res.status(401).json({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Unauthorized: ' + error.message },
      id: null,
    });
  }
}

// --- MCP Protocol Endpoint ---
app.post('/mcp', authMiddleware, async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];

  if (sessionId && sessions.has(sessionId)) {
    // Reuse existing session
    const session = sessions.get(sessionId);
    await session.transport.handleRequest(req, res, req.body);
    return;
  }

  // Client sent a stale session ID (instance restarted / session expired)
  // Return 404 so the client knows to reinitialize
  if (sessionId) {
    res.status(404).json({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Session expired. Please reinitialize.' },
      id: null,
    });
    return;
  }

  // New session (no session ID — this is an initialize request)
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => crypto.randomUUID(),
    onsessioninitialized: (newSessionId) => {
      sessions.set(newSessionId, {
        transport,
        user: req.user,
        createdAt: Date.now(),
      });
    },
  });

  transport.onclose = () => {
    if (transport.sessionId) {
      sessions.delete(transport.sessionId);
    }
  };

  const server = createServerForUser(req.user.role);
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

app.get('/mcp', authMiddleware, async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  if (!sessionId || !sessions.has(sessionId)) {
    // 404 tells the client the session is gone and it should reinitialize
    return res.status(404).json({ error: 'Session not found' });
  }
  const session = sessions.get(sessionId);
  await session.transport.handleRequest(req, res);
});

app.delete('/mcp', authMiddleware, async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  if (sessionId && sessions.has(sessionId)) {
    const session = sessions.get(sessionId);
    await session.transport.close?.();
    sessions.delete(sessionId);
  }
  res.status(200).end();
});

// --- Health check ---
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '2.0.0' });
});

// --- Start server ---
app.listen(PORT, () => {
  console.log(`Sync Projects MCP server running on ${BASE_URL}`);
  console.log(`OAuth: ${BASE_URL}/.well-known/oauth-authorization-server`);
  console.log(`MCP:   ${BASE_URL}/mcp`);
});
