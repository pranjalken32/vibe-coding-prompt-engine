const express = require('express');
const Task = require('../models/Task');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');

const router = express.Router();

router.use(authMiddleware);

// GET /api/v1/orgs/:orgId/reports/task-distribution
// Returns task counts by status and priority
router.get('/task-distribution', checkPermission('read', 'reports'), async (req, res) => {
  try {
    const { orgId } = req.user;

    const byStatus = await Task.aggregate([
      { $match: { orgId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { status: '$_id', count: 1, _id: 0 } },
    ]);

    const byPriority = await Task.aggregate([
      { $match: { orgId } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $project: { priority: '$_id', count: 1, _id: 0 } },
    ]);

    res.json({
      success: true,
      data: { byStatus, byPriority },
      error: null,
    });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
});

// GET /api/v1/orgs/:orgId/reports/tasks-over-time
// Returns tasks completed per day over the last 30 days
router.get('/tasks-over-time', checkPermission('read', 'reports'), async (req, res) => {
  try {
    const { orgId } = req.user;
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));

    const completedTasks = await Task.aggregate([
      {
        $match: {
          orgId,
          completedAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', count: 1, _id: 0 } },
    ]);

    res.json({
      success: true,
      data: completedTasks,
      error: null,
    });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
});

// GET /api/v1/orgs/:orgId/reports/team-workload
// Returns task counts per user (assignee)
router.get('/team-workload', checkPermission('read', 'reports'), async (req, res) => {
  try {
    const { orgId } = req.user;

    const workload = await Task.aggregate([
      { $match: { orgId, assigneeId: { $ne: null } } },
      {
        $group: {
          _id: '$assigneeId',
          total: { $sum: 1 },
          open: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
          in_progress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
          review: { $sum: { $cond: [{ $eq: ['$status', 'review'] }, 1, 0] } },
          done: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          userName: '$user.name',
          userEmail: '$user.email',
          total: 1,
          open: 1,
          in_progress: 1,
          review: 1,
          done: 1,
        },
      },
      { $sort: { total: -1 } },
    ]);

    res.json({
      success: true,
      data: workload,
      error: null,
    });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
});

module.exports = router;
