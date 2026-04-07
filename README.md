# Socialmadie v1.0 Workspace

This workspace now includes a small **Socialmadie starter app** plus the cloned reference repositories that will guide the build.

## What is wired now

- `apps/socialmadie-dashboard/` — a lightweight local dashboard app
- `config/integrations.json` — maps the integrated repos to Socialmadie features
- `docker-compose.yml` — starter service wiring for the dashboard and `n8n`
- `integrations/` — local source references for external platforms

## Integrated Repositories

All reference repositories now live under `integrations/`:

- `integrations/n8n` — workflow automation engine source
- `integrations/mixpost` — social publishing platform source
- `integrations/randolly` — campaign/promo reference source
- `integrations/activepieces` — alternative automation platform source

## Current Structure

```text
Socialmadie_v1.0/
├── apps/
│   └── socialmadie-dashboard/
├── config/
│   └── integrations.json
├── integrations/
│   ├── activepieces/
│   ├── mixpost/
│   ├── n8n/
│   └── randolly/
├── docker-compose.yml
├── package.json
└── README.md
```

## Run locally

### Dashboard only

```bash
npm start
```

Open: `http://localhost:3000`

### Dashboard + n8n via Docker

```bash
docker compose up
```

## Note

On Windows, the `activepieces` repository may show two uncheckoutable screenshot files with `:Zone.Identifier` in their names. The rest of the repository is available and usable.
