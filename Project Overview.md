Project Overview
Build a full-stack AI Operations Automation Platform called Agentic AI Automation Platform (Agentflow_AI) that lets operators describe an automation in natural language and turn it into an executable visual workflow. The platform must generate workflow graphs from prompts, render those graphs on a drag-and-drop canvas, execute them through a chain of cooperating AI agents, integrate with real third-party tools (Gmail, Slack, Discord, Google Sheets) over OAuth, queue and retry background jobs, stream live execution events to the browser, and persist a full timeline of every step for auditing.
Tech Stack
Frontend: Next.js (Pages Router), React 19, Tailwind CSS, Zustand, Axios, React Flow (@xyflow/react), Socket.IO client, and lucide-react icons.
Backend: Node.js, Express, MongoDB, Mongoose, JSON Web Tokens, BullMQ on Redis (via ioredis), Socket.IO, helmet, morgan, compression, express-validator, and bcryptjs.
AI Integration: OpenRouter API and Google Generative AI SDK, with LangChain and LangGraph available for agentic orchestration.
Integrations: OAuth and bot integrations covering Gmail, Slack, Discord, and Google Sheets. Sensitive credentials are encrypted at rest with an application-level key.
Authentication, Workflows, and Agentic Orchestration
Authentication
The authentication system must support registration, login, JWT-based session handling, protected routes, an /auth/me profile endpoint, role separation between admin and operator, password hashing with bcrypt at cost factor 12, and persistent login state on the client through Zustand.
Workflow Management
Users must be able to create workflows manually, generate workflows from a natural-language prompt, list and search their workflows, open any workflow on a React Flow canvas, drag nodes from a palette, configure each node through a side panel, save, duplicate, version, and delete workflows, and trigger executions on demand. Every workflow stores its nodes, edges, trigger configuration, tags, and version number.
Agentic Orchestration
For agentic execution, the backend must run each workflow through a fixed chain of agents:
Planner Agent: Decides node ordering and emits a confidence score.
Execution Agent: Runs each node against the correct integration or AI provider.
Validation Agent: Verifies required output fields.
Recovery Agent: Classifies failures (MISSING_FIELDS, API_FAILURE, AUTH_EXPIRED, RATE_LIMIT, TRANSIENT) and decides between retry_with_backoff and escalate.
Monitoring Agent: Emits timeline events.
LangGraph must be importable as the orchestration substrate, and the orchestrator must report langGraph: 'available' | 'not-installed' with each run.
Integrations, Executions, AI Generation, and Real-Time Layer
Third-Party Integrations
The integrations layer must support Gmail (send/read mail), Slack (post messages/subscribe to events), Discord (post bot messages), and Google Sheets (append rows/read ranges). Each provider must support an OAuth start endpoint, an OAuth callback endpoint, and a connected/disconnected status. Access tokens and refresh tokens must be encrypted at rest using CREDENTIAL_ENCRYPTION_KEY. The connection state must be visible from the integrations page, and a missing or expired credential must surface as a clear INTEGRATION_NOT_CONNECTED or AUTH_EXPIRED error in the execution timeline rather than a silent failure.
Execution Engine
The backend must persist every run as an Execution document with one of PENDING, RUNNING, COMPLETED, FAILED, RETRYING, PAUSED, or CANCELLED status, record the workflow snapshot at runtime, capture input, output, error, duration, and retry count, and write one ExecutionLog row per agent event. Users must be able to pause, resume, and cancel a running execution. BullMQ on Redis must handle background scheduling and retry backoff, with an in-memory fallback when Redis is not configured.
AI Workflow Generation
When a user submits a prompt, the system must return a complete workflow with named nodes, positions, edges, and per-node configuration. The generator must prefer OpenRouter when OPENROUTER_API_KEY is set, fall back to Google Gemini when GEMINI_API_KEY is set, and fall back to a deterministic rule-based builder when neither is available. The deterministic builder must still produce a runnable graph for common prompts (send email, invoice routing, Slack/Discord notification, sheet append).
Real-Time Layer
The Socket.IO server must broadcast agent events (planner, execution, validation, recovery, monitoring) for each execution to subscribed clients, and the client must render those events as a live timeline. Notifications generated during execution (success, failure, escalation) must persist and appear in a notifications drawer.
Frontend Pages
The application uses the Next.js Pages Router. The root / page redirects authenticated users to the dashboard and unauthenticated users to login.
/ – Landing page featuring platform introduction, multi-agent orchestration showcase, CTA buttons, and responsive layout with dark theme support.
/login – Form for email/password authentication with JWT handling, Zustand persistence, validation, and error states.
/register – Form for user registration with password validation, session persistence, and error handling.
/dashboard – Operator console with workflow metrics (MetricGrid), active workflow statistics, recent execution summaries, success rate indicators, AI activity feed, and real-time execution panels (AppShell layout).
/workflows/builder – Prompt-to-workflow generation page featuring PromptInputPanel, GraphPreviewPanel, WorkflowCanvas (React Flow), and WorkflowToolbar.
/workflows/[id] – Full workflow editor with node palette on the left, canvas in the center, node configuration panel on the right, plus execution controls and logs.
/executions – List of workflow executions with status badges, execution duration, timeline links, logs, filter/sort options, pagination, and live updates via Socket.IO.
/integrations – Status page for Gmail, Slack, Discord, and Google Sheets integrations with OAuth connection flows, reconnect buttons, and status toggles.
/settings – Profile management, user role details, API key/encryption key health checks, security controls, and theme settings.
Backend Architecture & Database Collections
Backend Architecture
Routes: Handles HTTP routing, request validation via express-validator, and middleware composition (auth, validation, error handler).
Controllers: Request parsing and response shaping only (never talks directly to MongoDB).
Services: Business logic ownership (workflow CRUD, execution lifecycle, token encryption, retry classification, notification creation, AI generation, log aggregation).
Agents Layer: Holds planner, execution, validation, recovery, monitoring, and orchestrator modules.
Integrations Layer: Wraps third-party SDKs behind a common interface defined in baseIntegration.js.
Queues Layer: Wraps BullMQ and Redis.
Config Layer: Centralizes environment variables, MongoDB connection (with in-memory fallback), and Socket.IO setup.
Database Collections
Users: Stores authenticated users (name, email, password with select: false, role: admin | operator, lastLogin).
Workflows: Stores workflows (name, description, owner, status: draft | active | paused | archived, triggerConfig, nodes, edges, version, tags).
Executions: Stores run instances (workflowId, immutable workflow snapshot, status, currentNode, startTime, endTime, duration, inputs, outputs, error, retryCount).
ExecutionLogs: Stores granular timeline events (executionId, workflowId, nodeId, agent: planner | execution | validation | recovery | monitoring, level: info | warning | error | success, message, metadata).
Integrations: Stores third-party connections (owner, provider: gmail | slack | google-sheets | discord | openrouter | gemini, isConnected, scopes, encrypted tokens, expiresAt).
Notifications: Stores alerts (owner, workflowId, executionId, type, title, message, isRead).
AgentMemory: Stores agent context across execution steps (workflowId, executionId, agentId, key, value, confidenceScore).
API Endpoints
Health and Auth
GET /api/health – System heartbeat and status check.
POST /api/auth/register – Register a new user account.
POST /api/auth/login – Authenticate user and issue JWT.
GET /api/auth/me – Fetch current user profile.
Workflows
GET /api/workflows/dashboard – Aggregated workflow and execution stats.
GET /api/workflows – List user workflows with pagination/filtering.
POST /api/workflows – Create a new workflow manually.
POST /api/workflows/generate – Generate workflow graph from prompt via AI.
GET /api/workflows/:id – Fetch single workflow details.
PUT /api/workflows/:id – Update existing workflow structure.
POST /api/workflows/:id/duplicate – Clone an existing workflow.
POST /api/workflows/:id/execute – Trigger an execution run.
DELETE /api/workflows/:id – Delete a workflow.
Executions
GET /api/executions – List all execution runs.
GET /api/executions/:id – Fetch execution run details and snapshot.
GET /api/executions/:id/timeline – Fetch detailed agent timeline logs.
POST /api/executions/:id/pause – Pause an active run.
POST /api/executions/:id/resume – Resume a paused run.
POST /api/executions/:id/cancel – Cancel a running execution.
Integrations & Notifications
GET /api/integrations – List all user integration connections.
GET /api/integrations/status – Provider health and token validity checks.
GET /api/integrations/oauth/:provider/start – Initiate OAuth flow.
GET /api/integrations/oauth/:provider/callback – Handle OAuth callback.
GET /api/integrations/oauth/error – OAuth error response endpoint.
POST /api/integrations – Manual integration credential setup.
GET /api/notifications – List user notifications.
Folder Structure & Development Phases
Frontend Structure
client/
└── src/
    ├── components/
    │   ├── AppShell/
    │   ├── MetricGrid/
    │   ├── NodePalette/
    │   ├── NodeConfigPanel/
    │   ├── WorkflowCanvas/
    │   └── ProtectedRoute/
    ├── pages/
    │   ├── _app.js
    │   ├── index.js
    │   ├── login.js
    │   ├── register.js
    │   ├── dashboard.js
    │   ├── integrations.js
    │   ├── settings.js
    │   ├── executions/
    │   │   ├── index.js
    │   │   └── [id].js
    │   └── workflows/
    │       ├── index.js
    │       ├── builder.js
    │       └── [id].js
    ├── store/
    │   ├── authStore.js
    │   └── workflowStore.js
    └── services/
        ├── api.js
        └── socket.js


Backend Structure
server/
└── src/
    ├── config/
    │   ├── env.js
    │   ├── db.js
    │   └── socket.js
    ├── routes/
    │   ├── authRoutes.js
    │   ├── workflowRoutes.js
    │   ├── executionRoutes.js
    │   ├── integrationRoutes.js
    │   └── notificationRoutes.js
    ├── controllers/
    │   ├── authController.js
    │   ├── workflowController.js
    │   ├── executionController.js
    │   └── integrationController.js
    ├── services/
    │   ├── authService.js
    │   ├── workflowService.js
    │   ├── executionService.js
    │   ├── aiService.js
    │   └── integrationService.js
    ├── agents/
    │   ├── orchestrator.js
    │   ├── plannerAgent.js
    │   ├── executionAgent.js
    │   ├── validationAgent.js
    │   ├── recoveryAgent.js
    │   └── monitoringAgent.js
    ├── integrations/
    │   ├── baseIntegration.js
    │   ├── gmailIntegration.js
    │   ├── slackIntegration.js
    │   ├── discordIntegration.js
    │   └── googleSheetsIntegration.js
    ├── models/
    │   ├── User.js
    │   ├── Workflow.js
    │   ├── Execution.js
    │   ├── ExecutionLog.js
    │   ├── Integration.js
    │   └── Notification.js
    └── queues/
        └── executionQueue.js


Development Phases
Phase 1: Project setup (Next.js, Express, MongoDB with in-memory fallback, JWT authentication, Zustand auth store, AppShell layout).
Phase 2: Workflow CRUD, canvas integration with React Flow, node palette, configuration panel, and metadata persistence.
Phase 3: AI prompt-to-workflow generation (OpenRouter primary, Gemini fallback, deterministic rule engine fallback).
Phase 4: Multi-agent orchestration engine (planner, executor, validator, recovery, monitoring) and execution control lifecycle (pause, resume, cancel).
Phase 5: Third-party OAuth integrations (Gmail, Slack, Discord, Google Sheets) with credential encryption.
Phase 6: BullMQ background queues, Socket.IO real-time event streaming, live execution timeline updates, and notification drawer.
UI, Security, Outcome, and Codex Instructions
UI and UX Requirements
The UI must use a clean operator-console aesthetic with Tailwind, be fully responsive, include loading states and skeleton loaders, render the workflow graph with React Flow including animated edges, support drag-from-palette node creation, surface a right-hand configuration panel for any selected node, render live execution events in a timeline with color-coded agent badges (planner / execution / validation / recovery / monitoring), and provide a notifications drawer accessible from the AppShell.
Security Requirements
The application must hash passwords with bcrypt at cost 12, sign and verify JWTs with JWT_SECRET, encrypt OAuth access and refresh tokens at rest with CREDENTIAL_ENCRYPTION_KEY, set HTTP security headers via helmet, apply CORS limited to CLIENT_URL, rate-limit auth endpoints via express-rate-limit, validate every request body with express-validator, never log decrypted tokens, and treat any missing or expired credential as an explicit INTEGRATION_NOT_CONNECTED / AUTH_EXPIRED error rather than a generic 500.
Final Expected Outcome
The completed platform must let an operator describe an automation in plain English, watch it materialize as a graph on the canvas, save it, execute it through the agent chain, see each agent event stream in real time, recover or escalate failures automatically, and receive notifications—all backed by real OAuth integrations and a full audit trail in MongoDB. The final application should feel like a modern operations console—close in spirit to n8n or Zapier, but with an explicit agentic execution layer on top.
Codex & AI Agent Implementation Instructions
The AI coding agent must build the application phase by phase, follow the folder structure strictly, keep controllers thin and push logic into services, keep agents pure (no HTTP knowledge), wrap every integration behind the baseIntegration interface, never call Mongo from a controller, never call an integration from an agent without going through the integration service, treat every secret as process.env, use the in-memory store fallback when Mongo or Redis is unavailable so local dev still works, emit a Socket.IO event for every agent step, write one ExecutionLog per agent event, and report the list of files created or changed at the end of every phase.
Project Deployment Guide — Vibe-Coded Applications
This guide explains how to deploy a project built using AI/vibe-coding tools such as Lovable, Bolt, Cursor, Google Antigravity, CodeX, Replit, or similar platforms.
The recommended deployment architecture is:
Frontend → Vercel
Backend → Render
Database → MongoDB Atlas OR Supabase
Source Code → GitHub

1. Finalize Your Application
Before deploying, make sure your application works correctly in your local/development environment.
Check the following:
All pages load correctly
Navigation works
Forms work correctly
Create, Read, Update, Delete (CRUD) operations work
API requests work
Authentication works, if implemented
Database operations work
Error handling is present
No major errors appear in the browser console
Backend APIs return the expected responses
Test:
User registration/login
Form submission
Data creation
Data editing
Data deletion
Data retrieval
Logout
Invalid inputs
Empty states
API failures
Important: If the application does not work locally, deploying it will not automatically fix the problem.

2. Organize Your Project
Your project should ideally have a structure similar to:
project/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── src/
│   ├── package.json
│   ├── .env
│   └── ...
│
└── README.md
The exact structure may be different depending on the technology used.
For example:
Frontend
React
Vite
Next.js
Backend
Node.js
Express.js
FastAPI
Django
Other REST/API backend



3. Push Your Project to GitHub
GitHub should be used as the central repository for your project.
Step 1: Create a GitHub repository
Go to GitHub and create a new repository.
Step 2: Push your project
If Git is already configured:
git init
git add .
git commit -m "Initial project"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
Step 3: Verify the repository
Open your GitHub repository and make sure your project files are visible.
Do NOT upload .env files containing passwords, API keys, database credentials, or secret keys to GitHub.
Add .env to .gitignore:
.env
.env.local
.env.*.local
node_modules/

4. Set Up Your Database
You can use either:
MongoDB Atlas
Supabase
Choose the database that your project was designed to use.


5. Option A — Set Up MongoDB Atlas
If your project uses MongoDB:
Step 1: Create a MongoDB Atlas account
Create an account and create a new project.
Step 2: Create a database
Create a MongoDB cluster/database.
Step 3: Create a database user
Create a database user with the required username and password.
Step 4: Configure network access
Allow your deployed backend to connect to MongoDB Atlas.
For development/testing, you may temporarily allow access from anywhere:
0.0.0.0/0
For production applications, use more restrictive network rules whenever possible.
Step 5: Get the connection string
MongoDB Atlas provides a connection string similar to:
mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/DATABASE_NAME
You will add this as an environment variable in Render.
For example:
MONGODB_URI=your_mongodb_connection_string

6. Option B — Set Up Supabase
If your project uses Supabase:
Step 1: Create a Supabase project
Create a new Supabase project.
Step 2: Create your database tables
Create the tables required by your application.
For example:
users
products
orders
tasks
depending on your project.
Step 3: Configure authentication
If your application uses Supabase Authentication, configure:
Email/password authentication
OAuth providers, if required
Redirect URLs
Site URL
Step 4: Get your Supabase credentials
Your application may require values such as:
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
If your backend uses a Supabase service-role key, keep it server-side only.
Never expose a Supabase service-role key in frontend code.

7. Prepare Backend Environment Variables
Your backend should never hardcode credentials.
Create a local .env file for development.
MongoDB example:
MONGODB_URI=your_mongodb_connection_string
Supabase example:
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
If your application uses authentication or other APIs, you may also have:
JWT_SECRET=your_secret
API_KEY=your_api_key
The exact variables depend on your project.
8. Make Sure the Backend Uses Environment Variables
For example, Node.js/Express:
const mongoose = require("mongoose");

mongoose.connect(process.env.MONGODB_URI);
Do not write:
mongoose.connect("mongodb+srv://username:password@...");
Credentials should always come from environment variables.

9. Prepare the Backend for Render
Before deploying the backend, make sure it can run on a production server.
Check package.json
For a Node.js/Express backend, you should have a start script such as:
{
  "scripts": {
    "start": "node server.js"
  }
}
If your entry file is different:
"start": "node index.js"
or:
"start": "node src/server.js"
Use the correct entry point for your project.




10. Important: Backend Port Configuration
Your backend should use the port provided by Render.
For Node.js:
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
Do not permanently hardcode the production port.
Correct:
process.env.PORT || 5000
Incorrect:
app.listen(5000);

11. Deploy the Backend to Render
Step 1: Go to Render
Create a Render account and connect your GitHub account.
Step 2: Create a Web Service
Select:
New → Web Service
Choose your GitHub repository.
Step 3: Configure the service
Typical settings for a Node.js backend:
Environment: Node
Build Command: npm install
Start Command: npm start
If your backend is inside a folder:
Root Directory: backend
Step 4: Select the appropriate plan
For student projects, choose an available plan appropriate for the project requirements.
Step 5: Add Environment Variables
Go to the environment variables section and add your backend variables.
For MongoDB:
MONGODB_URI=your_connection_string
For Supabase:
SUPABASE_URL=your_url
SUPABASE_ANON_KEY=your_key
Add any other required secrets.
Step 6: Deploy
Click Deploy.
Render will:
Clone your GitHub repository
Install dependencies
Build/start your backend
Provide a public backend URL
For example:
https://your-project.onrender.com

12. Test the Deployed Backend
Before deploying the frontend, test the backend.
Open your backend URL in a browser or use Postman/Thunder Client.
For example:
https://your-project.onrender.com
If your API has routes:
GET /api/products
POST /api/products
PUT /api/products/:id
DELETE /api/products/:id
test each required endpoint.
Make sure:
API responds
Database connection works
Data can be fetched
Data can be created
Data can be updated
Data can be deleted
Authentication works, if applicable

13. Configure CORS
Your backend must allow requests from your deployed frontend.
For example, in Express:
const cors = require("cors");

app.use(cors({
  origin: process.env.FRONTEND_URL
}));
Then configure:
FRONTEND_URL=https://your-project.vercel.app
For initial testing, you may temporarily allow all origins:
app.use(cors());
However, production applications should preferably restrict allowed origins.

14. Prepare the Frontend
Now configure the frontend to communicate with the deployed backend.
During development, you may have:
http://localhost:5000
After deployment, this must be changed to your Render backend URL.
For example:
https://your-project.onrender.com
Do not hardcode the URL throughout your application.
Instead, use a frontend environment variable.

15. Configure Frontend Environment Variables
For a Vite application:
VITE_API_URL=https://your-project.onrender.com
For a Next.js application:
NEXT_PUBLIC_API_URL=https://your-project.onrender.com
Then use the appropriate variable in your code.
Vite example:
const API_URL = import.meta.env.VITE_API_URL;
Example request:
fetch(`${API_URL}/api/products`);
Frontend environment variables are not secret. Anything exposed to browser-side code can potentially be viewed by users. Never put private API keys, database passwords, or service-role credentials in frontend variables.

16. Deploy the Frontend to Vercel
Step 1: Go to Vercel
Create a Vercel account and connect GitHub.
Step 2: Import your project
Select:
Add New → Project
Choose your GitHub repository.
If frontend and backend are in the same repository, specify the frontend folder as the Root Directory.
For example:
Root Directory: frontend
Step 3: Configure the framework
Vercel usually detects the framework automatically.
Common configurations:
React + Vite
Build Command:
npm run build

Output Directory:
dist
Next.js
Build Command:
npm run build

Output Directory:
.next
Usually Vercel automatically configures these settings.

17. Add Frontend Environment Variables in Vercel
Go to:
Vercel → Project → Settings → Environment Variables
For Vite:
VITE_API_URL=https://your-project.onrender.com
For Next.js:
NEXT_PUBLIC_API_URL=https://your-project.onrender.com
Add any other frontend configuration variables required by your application.
Then redeploy the project.

18. Deploy the Frontend
Click Deploy.
Vercel will:
Pull your code from GitHub
Install dependencies
Build your application
Deploy the frontend
Give you a public URL
For example:
https://your-project.vercel.app

19. Connect Frontend → Backend
Your final architecture should look like:
                 USER
                   │
                   ▼
          ┌─────────────────┐
          │     VERCEL      │
          │    Frontend     │
          │ React / Next.js │
          └────────┬────────┘
                   │
                   │ API Requests
                   ▼
          ┌─────────────────┐
          │     RENDER      │
          │     Backend     │
          │ Node / Express  │
          └────────┬────────┘
                   │
                   │ Database Queries
                   ▼
        ┌───────────────────────┐
        │       DATABASE        │
        │                       │
        │ MongoDB Atlas OR      │
        │ Supabase              │
        └───────────────────────┘

20. Configure Production URLs
Once Vercel gives you the final frontend URL, update your backend configuration.
For example:
FRONTEND_URL=https://your-project.vercel.app
Then make sure your CORS configuration allows this URL.
If using authentication, also add the production URL to your authentication provider.

21. Configure Authentication
If authentication is implemented, production URLs must be configured correctly.
Check:
Frontend
https://your-project.vercel.app
Backend
https://your-project.onrender.com
Authentication provider
Add the Vercel URL as an allowed/redirect URL where required.
For Supabase Authentication, configure the production site URL and redirect URLs in the Supabase dashboard.
For other authentication providers, follow their production redirect URL configuration.

22. Perform Complete Production Testing
Do not submit the project immediately after deployment.
Test the complete application from the deployed Vercel URL.
Test:
Home page
Navigation
Login
Signup
Logout
Create operation
Read operation
Update operation
Delete operation
Database connection
API requests
Form validation
Error handling
Mobile responsiveness
Browser console
Authentication redirects

23. Check Browser Console
Open:
Browser → Developer Tools → Console
Look for errors such as:
CORS error
404 Not Found
500 Internal Server Error
Failed to fetch
Unauthorized
Environment variable undefined
These errors should be fixed before submission.

24. Check Render Logs
If the frontend shows an API error, check the Render logs.
Look for:
Database connection failed
Environment variable missing
Port already in use
Module not found
Authentication error
500 Internal Server Error
Render logs are especially useful for debugging backend problems.

25. Check Database Connectivity
Verify that your deployed backend can actually communicate with the database.
MongoDB Atlas
Check:
Database user exists
Password is correct
Connection string is correct
Network access is configured
Database name is correct
Supabase
Check:
Project is active
URL is correct
Required keys are correct
Tables exist
Row Level Security policies are configured correctly
Authentication settings are correct

26. Enable Continuous Deployment
Once GitHub, Render, and Vercel are connected, future deployments become much easier.
Typical workflow:
Make changes locally
        ↓
Test application
        ↓
git add .
        ↓
git commit
        ↓
git push
        ↓
GitHub
       ↙ ↘
  Vercel   Render
    ↓         ↓
Frontend   Backend
Every time you push changes to the configured GitHub branch, Vercel and Render can automatically redeploy the updated application.

Never include actual passwords, API keys, database credentials, JWT secrets, or other private credentials in the README.

Final Deployment Architecture
The expected deployment setup is:
Component
Platform
Source Code
GitHub
Frontend
Vercel
Backend/API
Render
Database
MongoDB Atlas / Supabase
Authentication
Supabase / Application Backend / Other provider
Frontend → Backend
REST API / HTTP
Backend → Database
Database connection
Deployment




GitHub → Vercel + Render

Recommended workflow
             ┌─────────────┐
             │   GitHub    │
             └──────┬──────┘
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
    ┌───────────┐       ┌───────────┐
    │  Vercel   │       │   Render  │
    │ Frontend  │─────> │  Backend  │
    └───────────┘  API  └─────┬─────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ MongoDB Atlas / │
                    │    Supabase     │
                    └─────────────────┘
The key rule: keep the frontend, backend, and database credentials/configuration separate. The frontend communicates with the backend through an API, the backend communicates with the database, and secrets remain in the hosting platform’s environment variables rather than inside the source code.

