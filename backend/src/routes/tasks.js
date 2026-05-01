const express = require('express');
const mongoose = require('mongoose');
const Task = require('../models/Task');
const { requireAuth } = require('../middleware/auth');
const { getProjectForUser, isAdmin } = require('../lib/projectAccess');

const router = express.Router();
router.use(requireAuth);

const PRIORITIES = ['low', 'medium', 'high'];
const STATUSES = ['todo', 'in_progress', 'done'];

// list tasks for project
router.get('/project/:projectId', async (req, res) => {
  try {
    const { project, member } = await getProjectForUser(req.params.projectId, req.user._id);
    if (!project || !member) return res.status(404).json({ error: 'No access' });

    let query = { project: project._id };
    // members only see tasks assigned to them (per requirements)
    if (!isAdmin(member)) {
      query.assignedTo = req.user._id;
    }

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ dueDate: 1 });
    res.json({ tasks, myRole: member.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to list tasks' });
  }
});

// create task — admin only (assign to any project member)
router.post('/project/:projectId', async (req, res) => {
  try {
    const { project, member } = await getProjectForUser(req.params.projectId, req.user._id);
    if (!project || !member) return res.status(404).json({ error: 'No access' });
    if (!isAdmin(member)) return res.status(403).json({ error: 'Only admins can create tasks' });

    const { title, description, dueDate, priority, assignedTo } = req.body;
    if (!title || !String(title).trim()) return res.status(400).json({ error: 'Title required' });
    if (!dueDate) return res.status(400).json({ error: 'Due date required' });
    if (!assignedTo) return res.status(400).json({ error: 'Assignee required' });

    const assigneeInProject = project.members.some((m) => m.user._id.toString() === String(assignedTo));
    if (!assigneeInProject) {
      return res.status(400).json({ error: 'Assignee must be a project member' });
    }

    let p = 'medium';
    if (priority && PRIORITIES.includes(priority)) p = priority;

    const task = await Task.create({
      title: title.trim(),
      description: (description || '').trim(),
      dueDate: new Date(dueDate),
      priority: p,
      status: 'todo',
      project: project._id,
      assignedTo,
      createdBy: req.user._id,
    });
    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');
    res.status(201).json({ task });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create task' });
  }
});

// update task
router.patch('/:taskId', async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId).populate('project');
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const { project, member } = await getProjectForUser(task.project._id, req.user._id);
    if (!project || !member) return res.status(404).json({ error: 'No access' });

    const body = req.body;

    if (isAdmin(member)) {
      // admin can change everything
      if (body.title !== undefined) task.title = String(body.title).trim();
      if (body.description !== undefined) task.description = String(body.description).trim();
      if (body.dueDate !== undefined) task.dueDate = new Date(body.dueDate);
      if (body.priority !== undefined && PRIORITIES.includes(body.priority)) task.priority = body.priority;
      if (body.status !== undefined && STATUSES.includes(body.status)) task.status = body.status;
      if (body.assignedTo !== undefined) {
        const ok = project.members.some((m) => m.user._id.toString() === String(body.assignedTo));
        if (!ok) return res.status(400).json({ error: 'Assignee must be in project' });
        task.assignedTo = body.assignedTo;
      }
    } else {
      // member: only tasks assigned to them, and basically status updates + maybe description? spec says view and update tasks assigned — we allow status + description, not reassignment
      if (task.assignedTo.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'You can only update tasks assigned to you' });
      }
      if (body.status !== undefined) {
        if (!STATUSES.includes(body.status)) {
          return res.status(400).json({ error: 'Bad status' });
        }
        task.status = body.status;
      }
      if (body.description !== undefined) task.description = String(body.description).trim();
      // ignore other fields for members
    }

    await task.save();
    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');
    res.json({ task });
  } catch (err) {
    if (err instanceof mongoose.Error.CastError) {
      return res.status(400).json({ error: 'Bad id' });
    }
    console.error(err);
    res.status(500).json({ error: 'Update failed' });
  }
});

// delete — admin only
router.delete('/:taskId', async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ error: 'Not found' });

    const { member } = await getProjectForUser(task.project, req.user._id);
    if (!member) return res.status(404).json({ error: 'No access' });
    if (!isAdmin(member)) return res.status(403).json({ error: 'Admin only' });

    await Task.deleteOne({ _id: task._id });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Delete failed' });
  }
});

module.exports = router;
