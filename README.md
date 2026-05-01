# Team Task Manager

Full-stack app: **Next.js (React)** + **Express** + **MongoDB**, JWT auth, projects with admins/members, tasks with priorities and statuses, and a per-project dashboard.

## Project layout

```
Ethara/
├── backend/          # Express REST API
│   ├── src/
│   │   ├── models/   # User, Project, Task (Mongoose)
│   │   ├── routes/   # auth, projects, tasks, dashboard
│   │   ├── middleware/
│   │   └── server.js
│   └── package.json
├── frontend/         # Next.js app
│   ├── app/
│   └── package.json
└── README.md
```

## Database (MongoDB) — how things link

- **User** — name, email, password hash.
- **Project** — name, description, `createdBy`, `members[]` with `{ user, role }` where role is `admin` or `member`. Creator is added as admin.
- **Task** — title, description, dueDate, priority (`low` | `medium` | `high`), status (`todo` | `in_progress` | `done`), `project`, `assignedTo`, `createdBy`.

Relationships are normal Mongo refs (`ObjectId` → `User` / `Project`).

## Local setup

1. Install [MongoDB](https://www.mongodb.com/try/download/community) locally or use Atlas and copy the connection string.

2. **Backend**

   ```bash
   cd backend
   cp .env.example .env
   # edit .env — set MONGODB_URI and JWT_SECRET
   npm install
   npm run dev
   ```

   API runs at `http://localhost:5000` (or `PORT` from `.env`).

3. **Frontend** (new terminal)

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

   Open `http://localhost:3000`. In dev, `/api` is rewritten to the Express server (see `frontend/next.config.mjs` and `BACKEND_URL`).

4. **Production build locally (optional)**

   ```bash
   cd frontend && npm run build && npm start
   ```

   Uses Next’s production server (see `frontend/package.json` scripts).

## Environment variables

**Backend** (`.env`)

| Variable        | Example                          | Notes                          |
|----------------|-----------------------------------|--------------------------------|
| `PORT`         | `5000`                            | Optional, defaults 5000        |
| `MONGODB_URI`  | `mongodb://127.0.0.1:27017/ttm`   | Required                       |
| `JWT_SECRET`   | long random string                | Required                       |
| `FRONTEND_URL` | `http://localhost:3000`           | CORS; comma-separate for several |

**Frontend** (Railway / production)

| Variable                 | Example                              | Notes                                      |
|--------------------------|---------------------------------------|--------------------------------------------|
| `BACKEND_URL`            | `http://127.0.0.1:5000`               | Target for Next `/api` rewrite in dev      |
| `NEXT_PUBLIC_API_URL`    | `https://your-api.up.railway.app`     | Only if UI and API are on different hosts |

In local dev, leave `NEXT_PUBLIC_API_URL` unset so the browser calls same-origin `/api` (rewritten to Express).

## Sample API routes

Base URL: `https://<your-api-host>` (local: `http://localhost:5000`).

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/signup` | No | Body: `{ name, email, password }` |
| POST | `/api/auth/login` | No | Body: `{ email, password }` |
| GET | `/api/auth/me` | Bearer JWT | Current user |
| GET | `/api/projects` | Yes | Projects you belong to |
| POST | `/api/projects` | Yes | Create project (you become admin) |
| GET | `/api/projects/:id` | Yes | Project detail + your role |
| PATCH | `/api/projects/:id` | Admin | Update name/description |
| POST | `/api/projects/:id/members` | Admin | Body: `{ email, role? }` add member |
| DELETE | `/api/projects/:id/members/:userId` | Admin | Remove member |
| PATCH | `/api/projects/:id/members/:userId` | Admin | Body: `{ role }` |
| GET | `/api/tasks/project/:projectId` | Yes | List tasks (members: assigned only) |
| POST | `/api/tasks/project/:projectId` | Admin | Create task |
| PATCH | `/api/tasks/:taskId` | Yes | Admin: full fields; member: status/description on own tasks |
| DELETE | `/api/tasks/:taskId` | Admin | Delete task |
| GET | `/api/dashboard/project/:projectId` | Yes | Totals, by status, per user, overdue count |
| GET | `/health` | No | `{ ok: true }` |

Send JWT as: `Authorization: Bearer <token>`.

## Roles (behavior)

- **Admin** — manage members, create/delete tasks, edit any task, see all tasks and full dashboard for the project.
- **Member** — see only tasks **assigned to them**; can update **status** (and description) on those tasks. Dashboard/task counts are scoped to their assignments.

## Deploy on Railway (public app)

Use **two services** (plus Mongo if you do not use Atlas):

1. **MongoDB** — Railway Mongo plugin or [MongoDB Atlas](https://www.mongodb.com/atlas) (free tier). Copy `MONGODB_URI`.

2. **Backend service**
   - Root directory: `backend`
   - Variables: `MONGODB_URI`, `JWT_SECRET`, `FRONTEND_URL` (your frontend Railway URL, e.g. `https://something.up.railway.app`)
   - Start: `npm start` (default from `package.json`)
   - After deploy, copy the public URL (e.g. `https://team-api.up.railway.app`).

3. **Frontend service**
   - Root directory: `frontend`
   - Variables: `BACKEND_URL` = your API URL for rewrites; set `NEXT_PUBLIC_API_URL` only if the public UI host must call the API directly.
   - Build: `npm run build`; start: `npm start` (per `package.json`).
   - Generate domain: **Settings → Networking → Generate domain** so the site is public.

4. **CORS** — Set `FRONTEND_URL` on the backend to exactly the frontend origin (scheme + host, no path). Redeploy backend if you change the frontend URL.

5. **Health check** — optional: path `/health` on the API.

If something fails, check Railway logs for Mongo connection errors or CORS blocks in the browser network tab.

## Tech notes

- Passwords hashed with `bcryptjs`; JWTs via `jsonwebtoken` (7-day expiry).
- Request validation is mostly manual in route handlers.
- No refresh-token flow; logout clears `localStorage` on the client.
