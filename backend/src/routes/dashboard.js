const express = require('express');
const Task = require('../models/Task');
const { requireAuth } = require('../middleware/auth');
const { getProjectForUser, isAdmin } = require('../lib/projectAccess');

const router = express.Router();
router.use(requireAuth);

// GET /api/dashboard/project/:projectId
router.get('/project/:projectId', async (req, res) => {
  try {
    const { project, member } = await getProjectForUser(req.params.projectId, req.user._id);
    if (!project || !member) return res.status(404).json({ error: 'No access' });

    let match = { project: project._id };
    if (!isAdmin(member)) {
      match.assignedTo = req.user._id;
    }

    const now = new Date();

    const [total, byStatus, byUser, overdue] = await Promise.all([
      Task.countDocuments(match),
      Task.aggregate([
        { $match: match },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Task.aggregate([
        { $match: match },
        { $group: { _id: '$assignedTo', count: { $sum: 1 } } },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
        { $project: { userId: '$_id', name: '$user.name', email: '$user.email', count: 1 } },
      ]),
      Task.countDocuments({
        ...match,
        dueDate: { $lt: now },
        status: { $ne: 'done' },
      }),
    ]);

    // turn byStatus array into object for frontend
    const statusMap = { todo: 0, in_progress: 0, done: 0 };
    byStatus.forEach((row) => {
      if (row._id && statusMap[row._id] !== undefined) statusMap[row._id] = row.count;
    });

    res.json({
      totalTasks: total,
      tasksByStatus: statusMap,
      tasksPerUser: byUser,
      overdueCount: overdue,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Dashboard failed' });
  }
});

module.exports = router;
