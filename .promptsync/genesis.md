# Genesis Prompt G1 — Enterprise Task Management Platform (ETMP)

**Version:** G1 (Dev A — Genesis)
**Last Updated By:** Dev A (Devin)
**Date:** 2026-02-15

---

## Application Overview

This is an Enterprise Task Management Platform built with Node.js + Express + MongoDB (backend) and React + Vite (frontend). It supports multi-tenancy (multiple organizations), role-based access control (RBAC), full audit trail logging, and API versioning.

---

## Cross-Cutting Concerns (MUST follow for all new code)

### 1. Multi-Tenancy — orgId on EVERY Model and EVERY Query

Every Mongoose model (except auth-related operations) MUST have an `orgId` field:
```javascript
orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true }
```

Every database query MUST filter by `orgId` from the route parameter `req.params.orgId`:
```javascript
// CORRECT:
const items = await Model.find({ orgId: req.params.orgId });
const item = await Model.findOne({ _id: req.params.id, orgId: req.params.orgId });

// WRONG (missing orgId — causes cross-org data leak):
const items = await Model.find({});
const item = await Model.findById(req.params.id);
```

**Why:** Without orgId filtering, Organization A's users can see Organization B's data. This is a security breach.

### 2. RBAC — Role-Based Access Control

Three roles exist: `admin`, `manager`, `member`. The permission matrix is in `backend/utils/permissions.js`:

| Role | Tasks | Users | Audit Logs | Dashboard | Organization |
|------|-------|-------|-----------|-----------|-------------|
| admin | create, read, update, delete, assign | create, read, update, delete, changeRole | read | read | read, update |
| manager | create, read, update, assign | read | read | read | — |
| member | create, read, update | read | — | read | — |

Every protected route MUST use:
1. `authMiddleware` — verifies JWT token, attaches `req.user` (from `backend/middleware/auth.js`)
2. `checkPermission(action, resource)` — checks role has permission (from `backend/middleware/rbac.js`)

```javascript
const { authMiddleware } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');

router.get('/', authMiddleware, checkPermission('read', 'tasks'), async (req, res) => { ... });
router.post('/', authMiddleware, checkPermission('create', 'tasks'), async (req, res) => { ... });
```

When adding a NEW resource, add its permissions to `ROLE_PERMISSIONS` in `backend/utils/permissions.js`.

### 3. Audit Trail — logAudit() on ALL Write Operations

Every create, update, and delete operation MUST call `logAudit()`:

```javascript
const { logAudit } = require('../utils/auditHelper');

// After a successful write operation:
await logAudit({
  orgId: req.params.orgId,
  userId: req.user.id,
  action: 'created',        // 'created', 'updated', 'deleted'
  resource: 'task',          // the resource type
  resourceId: newTask._id,   // the ID of the affected document
  changes: { title, status },// what changed
  ipAddress: req.ip,
});
```

**Why:** Enterprise compliance requires a complete audit trail. Missing entries create compliance gaps.

### 4. API Versioning — All Routes Under /api/v1/

Routes are registered in `backend/server.js` following this pattern:
- Auth routes (no orgId): `/api/v1/auth`
- All other routes (org-scoped): `/api/v1/orgs/:orgId/{resource}`

```javascript
// In server.js:
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/orgs/:orgId/tasks', taskRoutes);
app.use('/api/v1/orgs/:orgId/notifications', notificationRoutes); // example
```

**Every new route file MUST be registered in server.js using this pattern.**

### 5. Response Format — Standard JSON Shape

Every API response MUST follow this format:
```javascript
// Success:
res.json({ success: true, data: result, error: null });
res.json({ success: true, data: items, error: null, meta: { page, limit, total } });

// Error:
res.status(400).json({ success: false, data: null, error: 'Error message' });
res.status(404).json({ success: false, data: null, error: 'Not found' });
```

**Never return raw data:** `res.json(items)` is WRONG. Always wrap in `{ success, data, error }`.

### 6. File Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Models | PascalCase | `Task.js`, `AuditLog.js`, `Notification.js` |
| Routes | kebab-case | `tasks.js`, `audit-logs.js`, `task-templates.js` |
| React Components | PascalCase | `TaskCard.jsx`, `Header.jsx` |
| React Pages | PascalCase | `Dashboard.jsx`, `Tasks.jsx`, `AuditLogs.jsx` |
| Utilities | camelCase | `auditHelper.js`, `permissions.js` |

### 7. Directory Structure

```
backend/
  models/          — Mongoose schemas (PascalCase.js)
  routes/          — Express route handlers (kebab-case.js)
  middleware/      — Express middleware (auth.js, rbac.js)
  utils/           — Helper functions (auditHelper.js, permissions.js)
  server.js        — Express app entry point
  package.json     — Backend dependencies

frontend/
  src/
    components/    — Reusable React components (PascalCase.jsx)
    pages/         — Page-level React components (PascalCase.jsx)
    context/       — React context providers
    utils/         — Frontend utilities (api.js)
  index.html       — Vite HTML entry
  package.json     — Frontend dependencies
  vite.config.js   — Vite configuration
```

**All backend code goes in `backend/`. All frontend code goes in `frontend/src/`. Never create files at the repo root (except measure.js and config files).**

---

## Existing Features (Dev A)

### Authentication (backend/routes/auth.js)
- POST `/api/v1/auth/register` — Register user + create org (bcrypt 10 rounds)
- POST `/api/v1/auth/login` — Login, returns JWT token

### Tasks (backend/routes/tasks.js)
- GET `/api/v1/orgs/:orgId/tasks` — List tasks (paginated, orgId-filtered)
- POST `/api/v1/orgs/:orgId/tasks` — Create task (audit logged)
- PUT `/api/v1/orgs/:orgId/tasks/:id` — Update task (audit logged)
- DELETE `/api/v1/orgs/:orgId/tasks/:id` — Delete task (audit logged)

### Dashboard (backend/routes/dashboard.js)
- GET `/api/v1/orgs/:orgId/dashboard` — Task stats (total, by status, by priority)

### Audit Logs (backend/routes/auditLogs.js)
- GET `/api/v1/orgs/:orgId/audit-logs` — List audit entries (paginated)

### Users (backend/routes/users.js)
- GET `/api/v1/orgs/:orgId/users` — List org users
- PUT `/api/v1/orgs/:orgId/users/:id/role` — Change user role (admin only, audit logged)

### Frontend Pages
- Login, Register, Dashboard, Tasks (with TaskCard + TaskForm), AuditLogs
- Header with navigation links
- ProtectedRoute component for auth guards
- AuthContext for state management
- api.js utility with auth headers and base URL

### Data Models
- **Organization:** name, slug, plan, settings
- **User:** orgId, name, email, passwordHash, role, notificationPrefs, lastLoginAt
- **Task:** orgId, title, description, status (open/in_progress/review/done), priority (low/medium/high/critical), assigneeId, createdBy, tags, dueDate, completedAt
- **AuditLog:** orgId, userId, action, resource, resourceId, changes, ipAddress

---

## Prompt History

| Version | Developer | Action | Date |
|---------|-----------|--------|------|
| G1 | Dev A (Devin) | Genesis — created full app | 2026-02-15 |
