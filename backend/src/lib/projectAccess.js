const Project = require('../models/Project');

// helper — find project and check membership
async function getProjectForUser(projectId, userId) {
  const project = await Project.findById(projectId).populate('members.user', 'name email');
  if (!project) return { project: null, member: null };
  const member = project.members.find((m) => m.user._id.toString() === userId.toString());
  return { project, member };
}

function isAdmin(member) {
  return member && member.role === 'admin';
}

module.exports = { getProjectForUser, isAdmin };
