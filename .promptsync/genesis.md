# Genesis Prompt G1 — Enterprise Task Management Platform (ETMP)

**Version:** G6 (Dev F — Task Templates & Recurring Tasks)
**Last Updated By:** Dev F (Replit)
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

| Role | Tasks | Users | Audit Logs | Dashboard | Organization | Notifications | Reports |
|------|-------|-------|-----------|-----------|-------------|---------------|---------|
| admin | create, read, update, delete, assign | create, read, update, delete, changeRole | read | read | read, update | read, update | read |
| manager | create, read, update, assign | read | read | read | — | read, update | read |
| member | create, read, update | read | — | read | — | read, update | read |

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
- POST `/api/v1/auth/register` — Register user + create org (bcrypt 12 rounds)
- POST `/api/v1/auth/login` — Login, returns JWT token

### Tasks (backend/routes/tasks.js)
- GET `/api/v1/orgs/:orgId/tasks` — List tasks (paginated, orgId-filtered, supports `?search=query` for title/description search, `?status`, `?priority`, `?assigneeId` filters)
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

### Notifications (backend/routes/notifications.js) — Added by Dev B
- GET `/api/v1/orgs/:orgId/notifications` — List notifications for current user (paginated, supports `?unreadOnly=true`)
- GET `/api/v1/orgs/:orgId/notifications/unread-count` — Get unread notification count
- PUT `/api/v1/orgs/:orgId/notifications/:id/read` — Mark single notification as read (audit logged)
- PUT `/api/v1/orgs/:orgId/notifications/mark-all-read` — Mark all notifications as read (audit logged)
- GET `/api/v1/orgs/:orgId/notifications/preferences` — Get user's notification preferences
- PUT `/api/v1/orgs/:orgId/notifications/preferences` — Update notification preferences (audit logged)

**Notification triggers (in backend/routes/tasks.js):**
- When a task is created with an assignee, a `task_assigned` notification is sent to the assignee
- When a task's assignee is changed, a `task_assigned` notification is sent to the new assignee
- When a task's status changes, a `task_status_changed` notification is sent to the task creator
- Notifications are NOT sent when the triggering user is the same as the recipient (no self-notifications)

### Reports (backend/routes/reports.js) — Added by Dev D
- GET `/api/v1/orgs/:orgId/reports/task-distribution` — Task couReports, AuditLogs, NotificationPreferences
- Header with navigation links (Dashboard, Tasks, Reports, Audit Logs, Preferences) and NotificationBell component
- ProtectedRoute component for auth guards
- AuthContext for state management
- api.js utility with auth headers and base URL

### Frontend Components — Added by Dev B
- **NotificationBell** (`frontend/src/components/NotificationBell.jsx`) — Bell icon in header with unread count badge, dropdown showing recent notifications, mark as read / mark all read. Polls unread count every 30 seconds. Closes on outside click.
- **NotificationPreferences** (`frontend/src/pages/NotificationPreferences.jsx`) — Toggle page for email and in-app notification preferences with toggle switches. Saves immediately on toggle.

### Search and Filtering (Tasks Page) — Added by Dev D
- **Search bar** — Full-text search across task title and description fields (case-insensitive, real-time)
- **Status filter** — Dropdown to filter by Open, In Progress, Review, Done
- **Priority filter** — Dropdown to filter by Low, Medium, High, Critical  
- **Assignee filter** — Dropdown to filter by team member (populated from users list)
- **Clear Filters** — Button to reset all filters at once
- All filters work together and update the task list in real time (debounced by React state)

### Reports Module — Added by Dev D
- **Reports page** (`frontend/src/pages/Reports.jsx`) — Accessible via "Reports" link in navigation (all roles can access)
- **Task Distribution by Status** — Bar chart showing count of tasks in each status (Open, In Progress, Review, Done)
- **Task Distribution by Priority** — Pie chart showing count of tasks by priority level (Low, Medium, High, Critical) with color-coded legend
- **Tasks Completed Over Time** — Line chart showing daily task completion trend over last 30 days
- **Team Workload View** — Table showing each assignee's task breakdown (Total, Open, In Progress, Review, Done)
- Charts are rendered using HTML5 Canvas (no external charting library dependencies)
- api.js utility with auth headers and base URL

### Frontend Components — Added by Dev B
- **NotificationBell** (`frontend/src/components/NotificationBell.jsx`) — Bell icon in header with unread count badge, dropdown showing recent notifications, mark as read / mark all read. Polls unread count every 30 seconds. Closes on outside click.
- **NotificationPreferences** (`frontend/src/pages/NotificationPreferences.jsx`) — Toggle page for email and in-app notification preferences with toggle switches. Saves immediately on toggle.

### Security & Priority UI (Dev C)
- Increased bcrypt hashing rounds to 12 during user registration for stronger password hashing.
- Task cards display priority as capitalized, color-coded badges (Low green, Medium blue, High orange, Critical red).

### Comments & Activity Timeline (Dev E)
- Users can add comments to any task they can view.
- Added a Task Detail page with task info at the top and an Activity timeline below.
- Activity timeline shows chronological events including status changes, assignee changes, and comments, with actor and timestamp.

### Task Templates & Recurring Tasks (Dev F)
- Admins can create, update, and delete reusable task templates with pre-filled fields.
- Any user can create a new task from a template.
- Users can set tasks to recur daily, weekly, or monthly.
- A scheduled job runs daily to create new instances of recurring tasks.
- Added a "Templates" page to manage task templates.

### Data Models
- **Organization:** name, slug, plan, settings
- **User:** orgId, name, email, passwordHash, role, notificationPrefs, lastLoginAt
- **Task:** orgId, title, description, status (open/in_progress/review/done), priority (low/medium/high/critical), assigneeId, createdBy, tags, dueDate, completedAt, isRecurring, recurrence, nextRecurrence
- **AuditLog:** orgId, userId, action, resource, resourceId, changes, ipAddress
- **Notification:** orgId, recipientId, type (task_assigned/task_status_changed), title, message, taskId, triggeredBy, read, readAt — Added by Dev B
- **TaskComment:** orgId, taskId, userId, body, timestamps — Added by Dev E
- **TaskTemplate:** orgId, name, title, description, priority, assigneeId, createdBy, timestamps — Added by Dev F

---

## Prompt History

| Version | Developer | Action | Date |
|---------|-----------|--------|------|
| G1 | Dev A (Devin) | Genesis — created full app | 2026-02-15 |
| G2 | Dev B (Devin) | Added notification system — model, API routes, bell icon with unread count dropdown, notification preferences page | 2026-02-15 |
| G3 | Dev C (GitHub Copilot) | Strengthened password hashing (12 rounds) and added color-coded priority badges with capitalized labels | 2026-02-15 |
| G4 | Dev D (Windsurf) | Added reports module with charts (task distribution, completion over time, team workload) and search/filtering on tasks page (search bar + status/priority/assignee filters) | 2026-02-15 |
| G5 | Dev E (GitHub Copilot) | Added task comments and unified activity timeline; introduced Task Detail page | 2026-02-15 |
| G6 | Dev F (Replit) | Added task templates and recurring tasks | 2026-02-15 |
