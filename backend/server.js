require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const dashboardRoutes = require('./routes/dashboard');
const auditLogRoutes = require('./routes/auditLogs');
const userRoutes = require('./routes/users');
const notificationRoutes = require('./routes/notifications');
const reportRoutes = require('./routes/reports');
const taskCommentRoutes = require('./routes/taskComments');
const taskTemplateRoutes = require('./routes/taskTemplates');

const { scheduleRecurringTasks } = require('./utils/recurringTasks');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/orgs/:orgId/tasks', taskRoutes);
app.use('/api/v1/orgs/:orgId/tasks', taskCommentRoutes);
app.use('/api/v1/orgs/:orgId/users', userRoutes);
app.use('/api/v1/orgs/:orgId/audit-logs', auditLogRoutes);
app.use('/api/v1/orgs/:orgId/dashboard', dashboardRoutes);
app.use('/api/v1/orgs/:orgId/notifications', notificationRoutes);
app.use('/api/v1/orgs/:orgId/reports', reportRoutes);
app.use('/api/v1/orgs/:orgId/task-templates', taskTemplateRoutes);

app.get('/api/v1/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok' }, error: null });
});

const PORT = process.env.PORT || 5001;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    // Schedule recurring tasks
    scheduleRecurringTasks();
  })
  .catch(err => console.error(err));

module.exports = app;
