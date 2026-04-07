const http = require('http');
const fs = require('fs');
const path = require('path');

const port = Number(process.env.PORT || 3000);
const publicDir = path.join(__dirname, 'public');
const workspaceRoot = path.resolve(__dirname, '../..');
const integrationsRoot = path.join(workspaceRoot, 'integrations');
const configPath = path.join(workspaceRoot, 'config', 'integrations.json');

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function getIntegrations() {
  const config = readJson(configPath, { project: 'Socialmadie v1.0', modules: [] });

  return config.modules.map((item) => {
    const repoPath = path.join(workspaceRoot, item.repo);
    const hasNestedGit = fs.existsSync(path.join(repoPath, '.git'));

    return {
      ...item,
      repoPath,
      available: fs.existsSync(repoPath),
      syncedToRootRepo: !hasNestedGit,
    };
  });
}

function getDashboardData() {
  const integrations = getIntegrations();
  const availableCount = integrations.filter((item) => item.available).length;
  const syncedCount = integrations.filter((item) => item.syncedToRootRepo).length;

  return {
    project: 'Socialmadie v1.0',
    headline: 'One workspace, one repo, multiple platform-inspired features.',
    summary:
      'Socialmadie is now being shaped as a unified social automation and publishing command center, pulling ideas from all imported sources into a single repository.',
    stats: [
      { label: 'Connected sources', value: String(integrations.length) },
      { label: 'Available locally', value: String(availableCount) },
      { label: 'Synced to root repo', value: `${syncedCount}/${integrations.length}` },
      { label: 'Starter features', value: '4' },
    ],
    features: [
      {
        title: 'Automation Hub',
        source: ['n8n', 'activepieces'],
        description: 'Plan automated flows, background jobs, and trigger-based actions for your platform.',
        items: ['content approval flow', 'auto follow-up sequence', 'scheduled posting automation'],
      },
      {
        title: 'Publishing Queue',
        source: ['mixpost'],
        description: 'Manage a unified social content calendar and posting rhythm from one place.',
        items: ['weekly planner', 'channel-based queue', 'draft scheduling'],
      },
      {
        title: 'Campaign Lab',
        source: ['randolly'],
        description: 'Shape campaigns, promos, and engagement ideas into repeatable execution plans.',
        items: ['campaign ideas', 'promo concepts', 'audience activation checklists'],
      },
      {
        title: 'Unified Command Center',
        source: ['n8n', 'mixpost', 'randolly', 'activepieces'],
        description: 'Keep all repo-inspired modules visible inside one Socialmadie workspace and one root repo.',
        items: ['repo sync status', 'workspace health', 'feature roadmap'],
      },
    ],
    integrations,
  };
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload, null, 2));
}

function serveFile(res, filePath, contentType = 'text/html; charset=utf-8') {
  fs.readFile(filePath, (error, content) => {
    if (error) {
      sendJson(res, 404, { error: 'Not found' });
      return;
    }

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
}

const server = http.createServer((req, res) => {
  if (req.url === '/api/health') {
    sendJson(res, 200, {
      status: 'ok',
      app: 'Socialmadie Dashboard',
      workspaceRoot,
    });
    return;
  }

  if (req.url === '/api/integrations') {
    sendJson(res, 200, {
      project: 'Socialmadie v1.0',
      integrations: getIntegrations(),
    });
    return;
  }

  if (req.url === '/api/dashboard-data') {
    sendJson(res, 200, getDashboardData());
    return;
  }

  const target = req.url === '/' ? 'index.html' : req.url.replace(/^\//, '');
  const filePath = path.join(publicDir, target);
  const ext = path.extname(filePath);
  const contentTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
  };

  serveFile(res, filePath, contentTypes[ext] || 'text/plain; charset=utf-8');
});

server.listen(port, () => {
  console.log(`Socialmadie dashboard running at http://localhost:${port}`);
});
