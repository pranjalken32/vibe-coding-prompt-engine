const express = require('express');
const router = express.Router({ mergeParams: true });
const { authMiddleware } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const TaskTemplate = require('../models/TaskTemplate');
const Task = require('../models/Task');
const { logAudit } = require('../utils/auditHelper');

// List all task templates
router.get('/', authMiddleware, checkPermission('read', 'tasks'), async (req, res) => {
  try {
    const templates = await TaskTemplate.find({ orgId: req.params.orgId }).populate('assigneeId', 'name').populate('createdBy', 'name');
    res.json({ success: true, data: templates, error: null });
  } catch (error) {
    res.status(500).json({ success: false, data: null, error: 'Server Error' });
  }
});

// Create a new task template
router.post('/', authMiddleware, checkPermission('create', 'tasks'), async (req, res) => {
  try {
    const { name, title, description, priority, assigneeId } = req.body;
    const { orgId } = req.params;
    const createdBy = req.user.id;

    const newTemplate = new TaskTemplate({
      orgId,
      name,
      title,
      description,
      priority,
      assigneeId,
      createdBy,
    });

    await newTemplate.save();

    await logAudit({
      orgId,
      userId: req.user.id,
      action: 'created',
      resource: 'task_template',
      resourceId: newTemplate._id,
      changes: { name, title },
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, data: newTemplate, error: null });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, data: null, error: 'A template with that name already exists.' });
    }
    res.status(400).json({ success: false, data: null, error: error.message });
  }
});

// Get a single task template
router.get('/:id', authMiddleware, checkPermission('read', 'tasks'), async (req, res) => {
    try {
      const template = await TaskTemplate.findOne({ _id: req.params.id, orgId: req.params.orgId });
      if (!template) {
        return res.status(404).json({ success: false, data: null, error: 'Template not found' });
      }
      res.json({ success: true, data: template, error: null });
    } catch (error) {
      res.status(500).json({ success: false, data: null, error: 'Server Error' });
    }
});

// Update a task template
router.put('/:id', authMiddleware, checkPermission('update', 'tasks'), async (req, res) => {
  try {
    const { name, title, description, priority, assigneeId } = req.body;
    const { orgId, id } = req.params;

    const template = await TaskTemplate.findOne({ _id: id, orgId });
    if (!template) {
      return res.status(404).json({ success: false, data: null, error: 'Template not found' });
    }

    const oldValues = {
        name: template.name,
        title: template.title,
        description: template.description,
        priority: template.priority,
        assigneeId: template.assigneeId
    };

    template.name = name;
    template.title = title;
    template.description = description;
    template.priority = priority;
    template.assigneeId = assigneeId;

    await template.save();

    await logAudit({
      orgId,
      userId: req.user.id,
      action: 'updated',
      resource: 'task_template',
      resourceId: template._id,
      changes: { old: oldValues, new: { name, title, description, priority, assigneeId } },
      ipAddress: req.ip,
    });

    res.json({ success: true, data: template, error: null });
  } catch (error) {
    res.status(400).json({ success: false, data: null, error: error.message });
  }
});

// Delete a task template
router.delete('/:id', authMiddleware, checkPermission('delete', 'tasks'), async (req, res) => {
  try {
    const { orgId, id } = req.params;
    const template = await TaskTemplate.findOneAndDelete({ _id: id, orgId });

    if (!template) {
      return res.status(404).json({ success: false, data: null, error: 'Template not found' });
    }

    await logAudit({
      orgId,
      userId: req.user.id,
      action: 'deleted',
      resource: 'task_template',
      resourceId: id,
      changes: { name: template.name },
      ipAddress: req.ip,
    });

    res.json({ success: true, data: { message: 'Template deleted successfully' }, error: null });
  } catch (error) {
    res.status(500).json({ success: false, data: null, error: 'Server Error' });
  }
});

// Create a task from a template
router.post('/:id/create-task', authMiddleware, checkPermission('create', 'tasks'), async (req, res) => {
    try {
        const { orgId, id } = req.params;
        const template = await TaskTemplate.findOne({ _id: id, orgId });

        if (!template) {
            return res.status(404).json({ success: false, data: null, error: 'Template not found' });
        }

        const { title, description, priority, assigneeId } = template;

        const newTask = new Task({
            orgId,
            title: `${title}`,
            description,
            priority,
            assigneeId,
            createdBy: req.user.id,
            status: 'open',
        });

        await newTask.save();

        await logAudit({
            orgId,
            userId: req.user.id,
            action: 'created',
            resource: 'task',
            resourceId: newTask._id,
            changes: { title: newTask.title, fromTemplate: template.name },
            ipAddress: req.ip,
        });

        res.status(201).json({ success: true, data: newTask, error: null });
    } catch (error) {
        res.status(400).json({ success: false, data: null, error: error.message });
    }
});


module.exports = router;
