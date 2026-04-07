const http = require('http');
const fs = require('fs');
const path = require('path');

const port = Number(process.env.PORT || 3000);
const publicDir = path.join(__dirname, 'public');
const integrationsRoot = path.resolve(__dirname, '../../integrations');

function getIntegrations() {
  const items = [
    {
      id: 'n8n',
      label: 'n8n',
      role: 'Workflow automation engine',
      repoPath: path.join(integrationsRoot, 'n8n'),
      localUrl: 'http://localhost:5678',
    },
    {
      id: 'mixpost',
      label: 'Mixpost',
      role: 'Social publishing inspiration',
      repoPath: path.join(integrationsRoot, 'mixpost'),
      localUrl: 'reference-only',
    },
    {
      id: 'randolly',
      label: 'Randolly',
      role: 'Campaign and promo reference source',
      repoPath: path.join(integrationsRoot, 'randolly'),
      localUrl: 'reference-only',
    },
    {
      id: 'activepieces',
      label: 'Activepieces',
      role: 'Alternative automation platform',
      repoPath: path.join(integrationsRoot, 'activepieces'),
      localUrl: 'http://localhost:8080',
    },
  ];

  return items.map((item) => ({
    ...item,
    available: fs.existsSync(item.repoPath),
  }));
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
    sendJson(res, 200, { status: 'ok', app: 'Socialmadie Dashboard' });
    return;
  }

  if (req.url === '/api/integrations') {
    sendJson(res, 200, {
      project: 'Socialmadie v1.0',
      integrations: getIntegrations(),
    });
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
