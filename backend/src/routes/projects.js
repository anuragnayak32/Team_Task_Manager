const express = require('express');
const mongoose = require('mongoose');
const Project = require('../models/Project');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const { getProjectForUser, isAdmin } = require('../lib/projectAccess');

const router = express.Router();

router.use(requireAuth);

// list projects current user is in
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find({ 'members.user': req.user._id })
      .populate('createdBy', 'name email')
      .sort({ updatedAt: -1 });
    res.json({ projects });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load projects' });
  }
});

// create project — creator is admin
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Project name required' });
    }
    const project = await Project.create({
      name: name.trim(),
      description: (description || '').trim(),
      createdBy: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }],
    });
    await project.populate('createdBy', 'name email');
    await project.populate('members.user', 'name email');
    res.status(201).json({ project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create project' });
  }
});

// single project (must be member)
router.get('/:projectId', async (req, res) => {
  try {
    const { project, member } = await getProjectForUser(req.params.projectId, req.user._id);
    if (!project || !member) {
      return res.status(404).json({ error: 'Project not found or no access' });
    }
    res.json({ project, myRole: member.role });
  } catch (err) {
    if (err instanceof mongoose.Error.CastError) {
      return res.status(400).json({ error: 'Bad project id' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to load project' });
  }
});

// update project meta — admin only
router.patch('/:projectId', async (req, res) => {
  try {
    const { project, member } = await getProjectForUser(req.params.projectId, req.user._id);
    if (!project || !member) return res.status(404).json({ error: 'Not found' });
    if (!isAdmin(member)) return res.status(403).json({ error: 'Admin only' });

    const { name, description } = req.body;
    if (name !== undefined) project.name = String(name).trim();
    if (description !== undefined) project.description = String(description).trim();
    await project.save();
    await project.populate('members.user', 'name email');
    res.json({ project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Update failed' });
  }
});

// add member — admin only, by email
router.post('/:projectId/members', async (req, res) => {
  try {
    const { project, member } = await getProjectForUser(req.params.projectId, req.user._id);
    if (!project || !member) return res.status(404).json({ error: 'Not found' });
    if (!isAdmin(member)) return res.status(403).json({ error: 'Admin only' });

    const { email, role } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    const u = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!u) return res.status(404).json({ error: 'No user with that email' });

    const already = project.members.some((m) => m.user.toString() === u._id.toString());
    if (already) return res.status(409).json({ error: 'User already in project' });

    const r = role === 'admin' ? 'admin' : 'member';
    project.members.push({ user: u._id, role: r });
    await project.save();
    await project.populate('members.user', 'name email');
    res.status(201).json({ project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not add member' });
  }
});

// remove member — admin only (cant remove last admin logic is loose — at least one admin should stay, we check)
router.delete('/:projectId/members/:userId', async (req, res) => {
  try {
    const { project, member } = await getProjectForUser(req.params.projectId, req.user._id);
    if (!project || !member) return res.status(404).json({ error: 'Not found' });
    if (!isAdmin(member)) return res.status(403).json({ error: 'Admin only' });

    const targetId = req.params.userId;
    const idx = project.members.findIndex((m) => m.user.toString() === targetId);
    if (idx === -1) return res.status(404).json({ error: 'Member not in project' });

    const removing = project.members[idx];
    if (removing.role === 'admin') {
      const adminCount = project.members.filter((m) => m.role === 'admin').length;
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Cant remove the only admin' });
      }
    }

    project.members.splice(idx, 1);
    await project.save();
    await project.populate('members.user', 'name email');
    res.json({ project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not remove member' });
  }
});

// change member role — admin only
router.patch('/:projectId/members/:userId', async (req, res) => {
  try {
    const { project, member } = await getProjectForUser(req.params.projectId, req.user._id);
    if (!project || !member) return res.status(404).json({ error: 'Not found' });
    if (!isAdmin(member)) return res.status(403).json({ error: 'Admin only' });

    const { role } = req.body;
    if (role !== 'admin' && role !== 'member') {
      return res.status(400).json({ error: 'role must be admin or member' });
    }
    const m = project.members.find((x) => x.user.toString() === req.params.userId);
    if (!m) return res.status(404).json({ error: 'Member not found' });

    if (m.role === 'admin' && role === 'member') {
      const admins = project.members.filter((x) => x.role === 'admin');
      if (admins.length === 1) {
        return res.status(400).json({ error: 'Need at least one admin' });
      }
    }
    m.role = role;
    await project.save();
    await project.populate('members.user', 'name email');
    res.json({ project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Role update failed' });
  }
});

module.exports = router;
