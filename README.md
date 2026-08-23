# Agentflow AI

Agentflow AI is an operator console for turning plain-language automation ideas into observable workflows coordinated by cooperating AI agents.

## Current status

Phase 1 is implemented: the Next.js Pages Router client includes the responsive landing, login, and registration surfaces. The Express API includes a health endpoint and development in-memory registration/login fallback.

The workflow canvas, persistent database models, OAuth providers, agent orchestration, queues, and realtime execution timeline are planned for subsequent phases.

## Run locally

Requirements: Node.js 20 or newer.

```bash
npm install
npm --prefix client install
npm --prefix server install
npm run dev
```

The frontend runs at `http://localhost:3000` and the API runs at `http://localhost:4000`. Copy `server/.env.example` to `server/.env` for local configuration. Do not commit `.env` files.

## Deployment

The repository is arranged for the recommended split deployment:

- **Frontend:** Vercel, root directory `client`, framework preset `Next.js`
- **Backend:** Render, root directory `server`, blueprint included in `render.yaml`
- **Database:** MongoDB Atlas when persistence is enabled

Set `NEXT_PUBLIC_API_URL` in Vercel to the public Render API URL plus `/api`, and set `CLIENT_URL` in Render to the public Vercel URL. Add `JWT_SECRET`, `MONGODB_URI`, `REDIS_URL`, and `CREDENTIAL_ENCRYPTION_KEY` only in the hosting provider's secret environment settings.

## Verify

```bash
npm --prefix client run build
Invoke-RestMethod http://localhost:4000/api/health
```
