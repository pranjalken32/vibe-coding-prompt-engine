const express = require('express');
const Task = require('../models/Task');
const TaskComment = require('../models/TaskComment');
const AuditLog = require('../models/AuditLog');
const { authMiddleware } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const { logAudit } = require('../utils/auditHelper');
const { createNotification } = require('../utils/notificationHelper');

const router = express.Router();

router.use(authMiddleware);

// Enforce that URL orgId matches the authenticated user's orgId
router.use((req, res, next) => {
  if (req.params.orgId && req.user?.orgId && String(req.params.orgId) !== String(req.user.orgId)) {
    return res.status(403).json({ success: false, data: null, error: 'Forbidden' });
  }
  next();
});

function formatUser(userDoc) {
  if (!userDoc) return null;
  return { id: userDoc._id, name: userDoc.name, email: userDoc.email };
}

function toActivityItem({ type, at, actor, message, meta }) {
  return {
    type,
    at,
    actor,
    message,
    meta: meta || null,
  };
}

function safeStatusLabel(status) {
  const labels = {
    open: 'Open',
    in_progress: 'In Progress',
    review: 'Review',
    done: 'Done',
  };
  return labels[status] || status;
}

router.get('/', checkPermission('read', 'tasks'), async (req, res) => {
  try {
    const { orgId } = req.user;
    const { page = 1, limit = 20, status, priority, assigneeId, search } = req.query;
    const filter = { orgId };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assigneeId) filter.assigneeId = assigneeId;
    
    // Add search functionality for title and description
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Task.countDocuments(filter);
    const tasks = await Task.find(filter)
      .populate('assigneeId', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      data: tasks,
      error: null,
      meta: { page: Number(page), limit: Number(limit), total },
    });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
});

// Unified activity timeline for a task: status changes, assignment changes, and comments
router.get('/:id/activity', checkPermission('read', 'tasks'), async (req, res) => {
  try {
    const { orgId } = req.user;
    const taskId = req.params.id;

    const task = await Task.findOne({ _id: taskId, orgId });
    if (!task) {
      return res.status(404).json({ success: false, data: null, error: 'Task not found' });
    }

    const [auditLogs, comments] = await Promise.all([
      AuditLog.find({ orgId, resource: 'task', resourceId: taskId })
        .populate('userId', 'name email')
        .sort({ timestamp: 1 }),
      TaskComment.find({ orgId, taskId })
        .populate('userId', 'name email')
        .sort({ createdAt: 1 }),
    ]);

    const items = [];

    for (const log of auditLogs) {
      const actor = formatUser(log.userId);
      const at = log.timestamp;

      if (log.action === 'create') {
        items.push(toActivityItem({
          type: 'task_created',
          at,
          actor,
          message: 'Created the task',
          meta: { auditLogId: log._id },
        }));
        continue;
      }

      if (log.action === 'delete') {
        items.push(toActivityItem({
          type: 'task_deleted',
          at,
          actor,
          message: 'Deleted the task',
          meta: { auditLogId: log._id },
        }));
        continue;
      }

      if (log.action === 'update' && log.changes && log.changes.before && log.changes.after) {
        const before = log.changes.before;
        const after = log.changes.after;

        let addedForLog = false;

        const statusAfter = after.status;
        if (statusAfter && statusAfter !== before.status) {
          items.push(toActivityItem({
            type: 'status_changed',
            at,
            actor,
            message: `Changed status from "${safeStatusLabel(before.status)}" to "${safeStatusLabel(statusAfter)}"`,
            meta: { before: before.status, after: statusAfter, auditLogId: log._id },
          }));
          addedForLog = true;
        }

        const assigneeAfter = after.assigneeId;
        if (assigneeAfter && String(assigneeAfter) !== String(before.assigneeId || '')) {
          items.push(toActivityItem({
            type: 'assignee_changed',
            at,
            actor,
            message: 'Changed the assignee',
            meta: { before: before.assigneeId || null, after: assigneeAfter, auditLogId: log._id },
          }));
          addedForLog = true;
        }

        // Fallback if no specific activity was detected for this update
        if (!addedForLog) {
          items.push(toActivityItem({
            type: 'task_updated',
            at,
            actor,
            message: 'Updated the task',
            meta: { auditLogId: log._id },
          }));
        }
      } else {
        items.push(toActivityItem({
          type: 'task_activity',
          at,
          actor,
          message: `${log.action} ${log.resource}`,
          meta: { auditLogId: log._id },
        }));
      }
    }

    for (const c of comments) {
      items.push(toActivityItem({
        type: 'comment_added',
        at: c.createdAt,
        actor: formatUser(c.userId),
        message: c.body,
        meta: { commentId: c._id },
      }));
    }

    items.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

    res.json({ success: true, data: items, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
});

router.get('/:id/comments', checkPermission('read', 'tasks'), async (req, res) => {
  try {
    const { orgId } = req.user;
    const taskId = req.params.id;

    const task = await Task.findOne({ _id: taskId, orgId });
    if (!task) {
      return res.status(404).json({ success: false, data: null, error: 'Task not found' });
    }

    const comments = await TaskComment.find({ orgId, taskId })
      .populate('userId', 'name email')
      .sort({ createdAt: 1 });

    res.json({ success: true, data: comments, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
});

router.post('/:id/comments', checkPermission('read', 'tasks'), async (req, res) => {
  try {
    const { orgId, id: userId } = req.user;
    const taskId = req.params.id;
    const { body } = req.body;

    if (!body || !String(body).trim()) {
      return res.status(400).json({ success: false, data: null, error: 'Comment body is required' });
    }

    const task = await Task.findOne({ _id: taskId, orgId });
    if (!task) {
      return res.status(404).json({ success: false, data: null, error: 'Task not found' });
    }

    const comment = await TaskComment.create({
      orgId,
      taskId,
      userId,
      body: String(body).trim(),
    });

    await logAudit({
      orgId,
      userId,
      action: 'create',
      resource: 'task_comment',
      resourceId: comment._id,
      changes: { taskId, body: comment.body },
      ipAddress: req.ip,
    });

    const populated = await TaskComment.findOne({ _id: comment._id, orgId })
      .populate('userId', 'name email');

    res.status(201).json({ success: true, data: populated, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
});

router.get('/:id', checkPermission('read', 'tasks'), async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, orgId: req.user.orgId })
      .populate('assigneeId', 'name email')
      .populate('createdBy', 'name email');

    if (!task) {
      return res.status(404).json({ success: false, data: null, error: 'Task not found' });
    }

    res.json({ success: true, data: task, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
});

router.post('/', checkPermission('create', 'tasks'), async (req, res) => {
  try {
    const { orgId, id: userId } = req.user;
    const { title, description, status, priority, assigneeId, tags, dueDate, isRecurring, recurrence } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, data: null, error: 'Title is required' });
    }

    const taskData = {
      orgId,
      title,
      description,
      status,
      priority,
      assigneeId,
      createdBy: userId,
      tags,
      dueDate,
      isRecurring,
      recurrence,
    };

    if (isRecurring && recurrence) {
        const nextDate = new Date();
        nextDate.setHours(0, 0, 0, 0);
        if (recurrence === 'daily') {
            nextDate.setDate(nextDate.getDate() + 1);
        } else if (recurrence === 'weekly') {
            nextDate.setDate(nextDate.getDate() + 7);
        } else if (recurrence === 'monthly') {
            nextDate.setMonth(nextDate.getMonth() + 1);
        }
        taskData.nextRecurrence = nextDate;
    }

    const task = await Task.create(taskData);

    await logAudit({
      orgId,
      userId,
      action: 'created',
      resource: 'task',
      resourceId: task._id,
      changes: { title, status, priority, isRecurring, recurrence },
      ipAddress: req.ip,
    });

    if (assigneeId && String(assigneeId) !== String(userId)) {
      await createNotification({
        orgId,
        recipientId: assigneeId,
        type: 'task_assigned',
        title: 'New Task Assigned',
        message: `You have been assigned to task "${title}"`,
        taskId: task._id,
        triggeredBy: userId,
      });
    }

    res.status(201).json({ success: true, data: task, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
});

router.put('/:id', checkPermission('update', 'tasks'), async (req, res) => {
  try {
    const { orgId, id: userId } = req.user;
    const taskId = req.params.id;
    const { title, description, status, priority, assigneeId, tags, dueDate, isRecurring, recurrence } = req.body;

    const task = await Task.findOne({ _id: taskId, orgId });

    if (!task) {
      return res.status(404).json({ success: false, data: null, error: 'Task not found' });
    }

    const beforeChanges = {
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assigneeId: task.assigneeId,
      tags: task.tags,
      dueDate: task.dueDate,
      isRecurring: task.isRecurring,
      recurrence: task.recurrence,
    };
    const oldAssigneeId = task.assigneeId;

    task.title = title;
    task.description = description;
    task.status = status;
    task.priority = priority;
    task.assigneeId = assigneeId;
    task.tags = tags;
    task.dueDate = dueDate;
    task.isRecurring = isRecurring;
    task.recurrence = recurrence;

    if (isRecurring && recurrence && (!task.nextRecurrence || beforeChanges.recurrence !== recurrence)) {
        const nextDate = new Date();
        nextDate.setHours(0, 0, 0, 0);
        if (recurrence === 'daily') {
            nextDate.setDate(nextDate.getDate() + 1);
        } else if (recurrence === 'weekly') {
            nextDate.setDate(nextDate.getDate() + 7);
        } else if (recurrence === 'monthly') {
            nextDate.setMonth(nextDate.getMonth() + 1);
        }
        task.nextRecurrence = nextDate;
    } else if (!isRecurring) {
        task.nextRecurrence = null;
    }


    if (status === 'done' && !task.completedAt) {
      task.completedAt = new Date();
    }

    Object.assign(task, updates);
    await task.save();

    const afterChanges = {
      title,
      description,
      status,
      priority,
      assigneeId,
      tags,
      dueDate,
      isRecurring,
      recurrence,
    };

    await logAudit({
      orgId,
      userId,
      action: 'update',
      resource: 'task',
      resourceId: taskId,
      changes: { before: beforeChanges, after: afterChanges },
      ipAddress: req.ip,
    });

    if (updates.assigneeId && String(updates.assigneeId) !== String(oldValues.assigneeId)) {
      await createNotification({
        orgId,
        recipientId: updates.assigneeId,
        type: 'task_assigned',
        title: 'New Task Assigned',
        message: `You have been assigned to task "${task.title}"`,
        taskId: task._id,
        triggeredBy: userId,
      });
    }

    if (updates.status && updates.status !== oldValues.status && task.createdBy) {
      await createNotification({
        orgId,
        recipientId: task.createdBy,
        type: 'task_status_changed',
        title: 'Task Status Updated',
        message: `Task "${task.title}" status changed from "${oldValues.status}" to "${updates.status}"`,
        taskId: task._id,
        triggeredBy: userId,
      });
    }

    res.json({ success: true, data: task, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
});

router.delete('/:id', checkPermission('delete', 'tasks'), async (req, res) => {
  try {
    const { orgId, id: userId } = req.user;
    const task = await Task.findOne({ _id: req.params.id, orgId });

    if (!task) {
      return res.status(404).json({ success: false, data: null, error: 'Task not found' });
    }

    await Task.deleteOne({ _id: task._id });

    await logAudit({
      orgId,
      userId,
      action: 'delete',
      resource: 'task',
      resourceId: task._id,
      changes: { title: task.title },
      ipAddress: req.ip,
    });

    res.json({ success: true, data: { message: 'Task deleted' }, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
});

module.exports = router;
