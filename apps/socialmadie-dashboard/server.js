const http = require('http');
const fs = require('fs');
const path = require('path');

const port = Number(process.env.PORT || 3000);
const publicDir = path.join(__dirname, 'public');
const configPath = path.resolve(__dirname, '../../config/integrations.json');
const integrationsRoot = path.resolve(__dirname, '../../');

function readIntegrationConfig() {
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (error) {
    return {
      project: 'Socialmadie v1.0',
      description: 'Fallback integration config',
      modules: [],
    };
  }
}

function getIntegrations() {
  const config = readIntegrationConfig();
  return (config.modules || []).map((item) => {
    const repoPath = path.resolve(integrationsRoot, item.repo);
    return {
      ...item,
      repoPath,
      available: fs.existsSync(repoPath),
    };
  });
}

function getContentPlanner() {
  return {
    summary: {
      plannedThisWeek: 12,
      activeCampaigns: 4,
      pendingApprovals: 3,
      reusableAssets: 18,
    },
    board: [
      {
        title: 'Ideas Backlog',
        items: [
          { title: 'Easter reflection carousel', platform: 'Instagram', owner: 'Mercy', due: 'Today' },
          { title: 'Student success story short', platform: 'TikTok', owner: 'Media', due: 'Tomorrow' },
        ],
      },
      {
        title: 'In Production',
        items: [
          { title: 'Pathway motivation reel', platform: 'Reels', owner: 'Design', due: 'Thu' },
          { title: 'Weekly devotional thread', platform: 'X', owner: 'Comms', due: 'Fri' },
        ],
      },
      {
        title: 'Scheduled',
        items: [
          { title: 'Sunday worship reminder', platform: 'Facebook', owner: 'Team', due: 'Sat 7:00 PM' },
          { title: 'Volunteer spotlight', platform: 'LinkedIn', owner: 'Growth', due: 'Mon 9:00 AM' },
        ],
      },
    ],
    calendar: [
      { day: 'Mon', time: '09:00', title: 'Volunteer spotlight', platform: 'LinkedIn', status: 'Scheduled' },
      { day: 'Tue', time: '12:00', title: 'Campus prayer clip', platform: 'Instagram', status: 'Ready' },
      { day: 'Thu', time: '18:30', title: 'Pathway motivation reel', platform: 'TikTok', status: 'In edit' },
      { day: 'Sat', time: '19:00', title: 'Sunday worship reminder', platform: 'Facebook', status: 'Scheduled' },
    ],
  };
}

function getAutomationDashboard() {
  return {
    stats: {
      healthyFlows: 6,
      attentionNeeded: 1,
      queuedJobs: 14,
      lastSync: '2 mins ago',
    },
    workflows: [
      {
        name: 'Daily inspiration collector',
        source: 'n8n',
        trigger: 'Every morning at 7:00 AM',
        outcome: 'Pulls ideas into the content backlog',
        status: 'Healthy',
      },
      {
        name: 'Caption approval follow-up',
        source: 'Activepieces',
        trigger: 'When a draft waits more than 24h',
        outcome: 'Pings editors and updates approval queue',
        status: 'Healthy',
      },
      {
        name: 'Publishing handoff',
        source: 'Mixpost',
        trigger: 'When post is marked approved',
        outcome: 'Sends approved content into scheduling flow',
        status: 'Syncing',
      },
      {
        name: 'Campaign idea enrichment',
        source: 'Randolly',
        trigger: 'When a new campaign starts',
        outcome: 'Adds promo concepts and CTA suggestions',
        status: 'Needs review',
      },
    ],
  };
}

function getDashboardPayload() {
  const integrations = getIntegrations();
  const contentPlanner = getContentPlanner();
  const automation = getAutomationDashboard();

  return {
    project: 'Socialmadie v1.0',
    message: 'Content Planner and Automation Dashboard are now the first live feature foundation.',
    summary: [
      { label: 'Planned posts', value: String(contentPlanner.summary.plannedThisWeek), note: 'ready for this week' },
      { label: 'Active campaigns', value: String(contentPlanner.summary.activeCampaigns), note: 'cross-channel initiatives' },
      { label: 'Live automations', value: String(automation.stats.healthyFlows), note: 'powered by n8n + Activepieces' },
      { label: 'Approvals pending', value: String(contentPlanner.summary.pendingApprovals), note: 'need team action' },
    ],
    contentPlanner,
    automation,
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

  if (req.url === '/api/content-planner') {
    sendJson(res, 200, getContentPlanner());
    return;
  }

  if (req.url === '/api/automation-dashboard') {
    sendJson(res, 200, getAutomationDashboard());
    return;
  }

  if (req.url === '/api/dashboard') {
    sendJson(res, 200, getDashboardPayload());
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
