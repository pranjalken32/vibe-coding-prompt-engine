const express = require('express');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const { logAudit } = require('../utils/auditHelper');

const router = express.Router();

router.use(authMiddleware);

router.get('/', checkPermission('read', 'notifications'), async (req, res) => {
  try {
    const { orgId, id: userId } = req.user;
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const filter = { orgId, recipientId: userId };
    if (unreadOnly === 'true') filter.read = false;

    const total = await Notification.countDocuments(filter);
    const notifications = await Notification.find(filter)
      .populate('triggeredBy', 'name email')
      .populate('taskId', 'title status')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      data: notifications,
      error: null,
      meta: { page: Number(page), limit: Number(limit), total },
    });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
});

router.get('/unread-count', checkPermission('read', 'notifications'), async (req, res) => {
  try {
    const { orgId, id: userId } = req.user;
    const count = await Notification.countDocuments({ orgId, recipientId: userId, read: false });

    res.json({ success: true, data: { count }, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
});

router.put('/:id/read', checkPermission('update', 'notifications'), async (req, res) => {
  try {
    const { orgId, id: userId } = req.user;
    const notification = await Notification.findOne({ _id: req.params.id, orgId, recipientId: userId });

    if (!notification) {
      return res.status(404).json({ success: false, data: null, error: 'Notification not found' });
    }

    notification.read = true;
    notification.readAt = new Date();
    await notification.save();

    await logAudit({
      orgId,
      userId,
      action: 'updated',
      resource: 'notification',
      resourceId: notification._id,
      changes: { read: true },
      ipAddress: req.ip,
    });

    res.json({ success: true, data: notification, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
});

router.put('/mark-all-read', checkPermission('update', 'notifications'), async (req, res) => {
  try {
    const { orgId, id: userId } = req.user;
    const result = await Notification.updateMany(
      { orgId, recipientId: userId, read: false },
      { $set: { read: true, readAt: new Date() } }
    );

    await logAudit({
      orgId,
      userId,
      action: 'updated',
      resource: 'notification',
      resourceId: null,
      changes: { markedAllRead: true, count: result.modifiedCount },
      ipAddress: req.ip,
    });

    res.json({ success: true, data: { modifiedCount: result.modifiedCount }, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
});

router.get('/preferences', checkPermission('read', 'notifications'), async (req, res) => {
  try {
    const { orgId, id: userId } = req.user;
    const user = await User.findOne({ _id: userId, orgId }).select('notificationPrefs');

    if (!user) {
      return res.status(404).json({ success: false, data: null, error: 'User not found' });
    }

    res.json({ success: true, data: user.notificationPrefs, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
});

router.put('/preferences', checkPermission('update', 'notifications'), async (req, res) => {
  try {
    const { orgId, id: userId } = req.user;
    const { email, inApp } = req.body;

    const user = await User.findOne({ _id: userId, orgId });
    if (!user) {
      return res.status(404).json({ success: false, data: null, error: 'User not found' });
    }

    const oldPrefs = { ...user.notificationPrefs.toObject() };

    if (typeof email === 'boolean') user.notificationPrefs.email = email;
    if (typeof inApp === 'boolean') user.notificationPrefs.inApp = inApp;
    await user.save();

    await logAudit({
      orgId,
      userId,
      action: 'updated',
      resource: 'notificationPreferences',
      resourceId: userId,
      changes: { before: oldPrefs, after: user.notificationPrefs },
      ipAddress: req.ip,
    });

    res.json({ success: true, data: user.notificationPrefs, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
});

module.exports = router;
