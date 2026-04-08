const http = require('http');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const port = Number(process.env.PORT || 3000);
const appRoot = path.resolve(__dirname, '../../');
const publicDir = path.join(__dirname, 'public');
const configPath = path.join(appRoot, 'config', 'integrations.json');
const dataDir = path.join(appRoot, 'data');
const plannerItemsPath = path.join(dataDir, 'planner-items.json');
const automationEventsPath = path.join(dataDir, 'automation-events.json');

const allowedStages = ['ideas', 'production', 'scheduled'];
const stageLabels = {
  ideas: 'Ideas Backlog',
  production: 'In Production',
  scheduled: 'Scheduled',
};

const defaultPlannerItems = [
  {
    id: 'planner-001',
    title: 'Easter reflection carousel',
    platform: 'Instagram',
    owner: 'Mercy',
    stage: 'ideas',
    status: 'Idea',
    due: '2026-04-08T18:00:00',
    notes: 'Scripture-based carousel for evening engagement.',
    source: 'manual',
    createdAt: '2026-04-08T08:00:00.000Z',
    updatedAt: '2026-04-08T08:00:00.000Z',
  },
  {
    id: 'planner-002',
    title: 'Student success story short',
    platform: 'TikTok',
    owner: 'Media',
    stage: 'ideas',
    status: 'Research',
    due: '2026-04-09T12:00:00',
    notes: 'Feature a BYU-Pathway transformation story.',
    source: 'manual',
    createdAt: '2026-04-08T08:05:00.000Z',
    updatedAt: '2026-04-08T08:05:00.000Z',
  },
  {
    id: 'planner-003',
    title: 'Pathway motivation reel',
    platform: 'Reels',
    owner: 'Design',
    stage: 'production',
    status: 'In Production',
    due: '2026-04-10T18:30:00',
    notes: 'Need captions and brand outro.',
    source: 'manual',
    createdAt: '2026-04-08T08:10:00.000Z',
    updatedAt: '2026-04-08T08:10:00.000Z',
  },
  {
    id: 'planner-004',
    title: 'Weekly devotional thread',
    platform: 'X',
    owner: 'Comms',
    stage: 'production',
    status: 'Awaiting Approval',
    due: '2026-04-11T10:00:00',
    notes: 'Need final approval from content lead.',
    source: 'manual',
    createdAt: '2026-04-08T08:15:00.000Z',
    updatedAt: '2026-04-08T08:15:00.000Z',
  },
  {
    id: 'planner-005',
    title: 'Sunday worship reminder',
    platform: 'Facebook',
    owner: 'Team',
    stage: 'scheduled',
    status: 'Scheduled',
    due: '2026-04-12T19:00:00',
    notes: 'Publish before the Sunday livestream.',
    source: 'n8n',
    createdAt: '2026-04-08T08:20:00.000Z',
    updatedAt: '2026-04-08T08:20:00.000Z',
  },
  {
    id: 'planner-006',
    title: 'Volunteer spotlight',
    platform: 'LinkedIn',
    owner: 'Growth',
    stage: 'scheduled',
    status: 'Scheduled',
    due: '2026-04-14T09:00:00',
    notes: 'Highlight team impact and call for volunteers.',
    source: 'manual',
    createdAt: '2026-04-08T08:25:00.000Z',
    updatedAt: '2026-04-08T08:25:00.000Z',
  },
];

const defaultAutomationEvents = [
  {
    id: 'event-001',
    type: 'n8n-webhook',
    summary: 'Sunday worship reminder moved into the scheduled queue.',
    createdAt: '2026-04-08T08:30:00.000Z',
    payload: {
      source: 'n8n',
      itemTitle: 'Sunday worship reminder',
    },
  },
  {
    id: 'event-002',
    type: 'planner-sync',
    summary: 'Mixpost publishing plan synced into Socialmadie starter dashboard.',
    createdAt: '2026-04-08T08:10:00.000Z',
    payload: {
      source: 'mixpost',
    },
  },
];

function ensureJsonFile(filePath, defaultValue) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
  }
}

function ensureDataFiles() {
  fs.mkdirSync(dataDir, { recursive: true });
  ensureJsonFile(plannerItemsPath, defaultPlannerItems);
  ensureJsonFile(automationEventsPath, defaultAutomationEvents);
}

function readJsonFile(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    return fallback;
  }
}

function writeJsonFile(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
  return value;
}

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
    const repoPath = path.resolve(appRoot, item.repo);
    return {
      ...item,
      repoPath,
      webhookPath: item.id === 'n8n' ? '/api/webhooks/n8n/content-approved' : item.webhookPath || null,
      available: fs.existsSync(repoPath),
    };
  });
}

function getPlannerItems() {
  ensureDataFiles();
  return readJsonFile(plannerItemsPath, defaultPlannerItems);
}

function savePlannerItems(items) {
  return writeJsonFile(plannerItemsPath, items);
}

function getAutomationEvents() {
  ensureDataFiles();
  return readJsonFile(automationEventsPath, defaultAutomationEvents);
}

function saveAutomationEvents(events) {
  return writeJsonFile(automationEventsPath, events);
}

function addAutomationEvent(type, summary, payload = {}) {
  const events = getAutomationEvents();
  const nextEvent = {
    id: randomUUID(),
    type,
    summary,
    createdAt: new Date().toISOString(),
    payload,
  };

  saveAutomationEvents([nextEvent, ...events].slice(0, 25));
  return nextEvent;
}

function formatDueLabel(value) {
  if (!value) {
    return 'No due date';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat('en', {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function getContentPlanner() {
  const items = getPlannerItems();
  const board = allowedStages.map((stage) => ({
    id: stage,
    title: stageLabels[stage],
    items: items
      .filter((item) => item.stage === stage)
      .sort((a, b) => String(a.due || '').localeCompare(String(b.due || '')))
      .map((item) => ({
        ...item,
        dueLabel: formatDueLabel(item.due),
      })),
  }));

  const calendar = items
    .filter((item) => item.due)
    .sort((a, b) => String(a.due).localeCompare(String(b.due)))
    .slice(0, 6)
    .map((item) => {
      const date = new Date(item.due);
      return {
        id: item.id,
        day: Number.isNaN(date.getTime()) ? 'TBD' : new Intl.DateTimeFormat('en', { weekday: 'short' }).format(date),
        time: Number.isNaN(date.getTime()) ? 'TBD' : new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit' }).format(date),
        title: item.title,
        platform: item.platform,
        status: item.status,
      };
    });

  const pendingApprovals = items.filter((item) => String(item.status).toLowerCase().includes('approval')).length;
  const activeCampaigns = new Set(items.map((item) => item.platform)).size;

  return {
    summary: {
      plannedThisWeek: items.length,
      activeCampaigns,
      pendingApprovals,
      reusableAssets: 18,
    },
    board,
    calendar,
    items,
  };
}

function getAutomationDashboard() {
  const events = getAutomationEvents();

  return {
    stats: {
      healthyFlows: 6,
      attentionNeeded: 1,
      queuedJobs: 14,
      lastSync: events[0] ? formatDueLabel(events[0].createdAt) : 'No recent sync',
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
    recentEvents: events.slice(0, 6),
  };
}

function getDashboardPayload() {
  const integrations = getIntegrations();
  const contentPlanner = getContentPlanner();
  const automation = getAutomationDashboard();

  return {
    project: 'Socialmadie v1.0',
    message: 'Content Planner and Automation Dashboard are now backed by CRUD data and the first n8n webhook.',
    summary: [
      { label: 'Planner items', value: String(contentPlanner.summary.plannedThisWeek), note: 'stored in Socialmadie data' },
      { label: 'Active channels', value: String(contentPlanner.summary.activeCampaigns), note: 'platforms in current cycle' },
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

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';

    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        reject(new Error('Request body too large'));
        req.destroy();
      }
    });

    req.on('end', () => {
      if (!raw) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(new Error('Invalid JSON body'));
      }
    });

    req.on('error', reject);
  });
}

function sanitizePlannerPayload(payload = {}) {
  return {
    title: String(payload.title || '').trim(),
    platform: String(payload.platform || 'General').trim(),
    owner: String(payload.owner || 'Team').trim(),
    stage: allowedStages.includes(payload.stage) ? payload.stage : 'ideas',
    status: String(payload.status || '').trim(),
    due: payload.due ? String(payload.due) : '',
    notes: String(payload.notes || '').trim(),
    source: String(payload.source || 'manual').trim() || 'manual',
  };
}

function getNextStage(stage) {
  if (stage === 'ideas') return 'production';
  if (stage === 'production') return 'scheduled';
  return 'scheduled';
}

async function handlePlannerCreate(req, res) {
  const payload = sanitizePlannerPayload(await readRequestBody(req));
  if (!payload.title) {
    sendJson(res, 400, { error: 'Title is required' });
    return;
  }

  const now = new Date().toISOString();
  const item = {
    id: randomUUID(),
    title: payload.title,
    platform: payload.platform,
    owner: payload.owner,
    stage: payload.stage,
    status: payload.status || stageLabels[payload.stage],
    due: payload.due,
    notes: payload.notes,
    source: payload.source,
    createdAt: now,
    updatedAt: now,
  };

  const items = [item, ...getPlannerItems()];
  savePlannerItems(items);
  const event = addAutomationEvent('planner-create', `Created planner item: ${item.title}`, { itemId: item.id, source: item.source });
  sendJson(res, 201, { item, event });
}

async function handlePlannerUpdate(req, res, itemId) {
  const updates = sanitizePlannerPayload(await readRequestBody(req));
  const items = getPlannerItems();
  const index = items.findIndex((item) => item.id === itemId);

  if (index === -1) {
    sendJson(res, 404, { error: 'Planner item not found' });
    return;
  }

  const current = items[index];
  const nextStage = updates.stage || current.stage;
  const updatedItem = {
    ...current,
    title: updates.title || current.title,
    platform: updates.platform || current.platform,
    owner: updates.owner || current.owner,
    stage: nextStage,
    status: updates.status || current.status || stageLabels[nextStage],
    due: updates.due || current.due,
    notes: updates.notes || current.notes,
    source: updates.source || current.source,
    updatedAt: new Date().toISOString(),
  };

  items[index] = updatedItem;
  savePlannerItems(items);
  const event = addAutomationEvent('planner-update', `Updated planner item: ${updatedItem.title}`, { itemId: updatedItem.id, stage: updatedItem.stage });
  sendJson(res, 200, { item: updatedItem, event });
}

function handlePlannerDelete(res, itemId) {
  const items = getPlannerItems();
  const item = items.find((entry) => entry.id === itemId);

  if (!item) {
    sendJson(res, 404, { error: 'Planner item not found' });
    return;
  }

  const filtered = items.filter((entry) => entry.id !== itemId);
  savePlannerItems(filtered);
  const event = addAutomationEvent('planner-delete', `Deleted planner item: ${item.title}`, { itemId: item.id });
  sendJson(res, 200, { success: true, deletedId: itemId, event });
}

async function handleN8nWebhook(req, res) {
  const payload = sanitizePlannerPayload(await readRequestBody(req));
  if (!payload.title) {
    payload.title = 'n8n approved content';
  }

  const items = getPlannerItems();
  const normalizedTitle = payload.title.toLowerCase();
  const existingIndex = items.findIndex((item) => item.title.toLowerCase() === normalizedTitle);
  const now = new Date().toISOString();
  let action = 'created';
  let item;

  if (existingIndex >= 0) {
    action = 'updated';
    item = {
      ...items[existingIndex],
      ...payload,
      stage: 'scheduled',
      status: payload.status || 'Approved via n8n',
      source: 'n8n',
      updatedAt: now,
    };
    items[existingIndex] = item;
  } else {
    item = {
      id: randomUUID(),
      title: payload.title,
      platform: payload.platform || 'Instagram',
      owner: payload.owner || 'Automation',
      stage: 'scheduled',
      status: payload.status || 'Approved via n8n',
      due: payload.due || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      notes: payload.notes || 'Sent in from n8n webhook.',
      source: 'n8n',
      createdAt: now,
      updatedAt: now,
    };
    items.unshift(item);
  }

  savePlannerItems(items);
  const event = addAutomationEvent('n8n-webhook', `n8n ${action} planner item: ${item.title}`, { itemId: item.id, action });
  sendJson(res, 200, { success: true, action, item, event });
}

ensureDataFiles();

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  try {
    if (req.method === 'GET' && pathname === '/api/health') {
      sendJson(res, 200, { status: 'ok', app: 'Socialmadie Dashboard' });
      return;
    }

    if (req.method === 'GET' && pathname === '/api/integrations') {
      sendJson(res, 200, {
        project: 'Socialmadie v1.0',
        integrations: getIntegrations(),
      });
      return;
    }

    if (req.method === 'GET' && pathname === '/api/planner-items') {
      sendJson(res, 200, { items: getPlannerItems() });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/planner-items') {
      await handlePlannerCreate(req, res);
      return;
    }

    if (pathname.startsWith('/api/planner-items/')) {
      const itemId = pathname.split('/').pop();
      if (req.method === 'PATCH') {
        await handlePlannerUpdate(req, res, itemId);
        return;
      }

      if (req.method === 'DELETE') {
        handlePlannerDelete(res, itemId);
        return;
      }
    }

    if (req.method === 'POST' && pathname === '/api/webhooks/n8n/content-approved') {
      await handleN8nWebhook(req, res);
      return;
    }

    if (req.method === 'GET' && pathname === '/api/content-planner') {
      sendJson(res, 200, getContentPlanner());
      return;
    }

    if (req.method === 'GET' && pathname === '/api/automation-dashboard') {
      sendJson(res, 200, getAutomationDashboard());
      return;
    }

    if (req.method === 'GET' && pathname === '/api/dashboard') {
      sendJson(res, 200, getDashboardPayload());
      return;
    }

    const target = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
    const filePath = path.join(publicDir, target);
    const ext = path.extname(filePath);
    const contentTypes = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
    };

    serveFile(res, filePath, contentTypes[ext] || 'text/plain; charset=utf-8');
  } catch (error) {
    sendJson(res, 500, { error: error.message || 'Unexpected server error' });
  }
});

server.listen(port, () => {
  console.log(`Socialmadie dashboard running at http://localhost:${port}`);
});
