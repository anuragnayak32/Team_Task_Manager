const mongoose = require('mongoose');

// member roles inside a project
const MEMBER_ROLES = ['admin', 'member'];

const projectMemberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: MEMBER_ROLES, default: 'member' },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [projectMemberSchema],
  },
  { timestamps: true }
);

projectSchema.index({ 'members.user': 1 });

module.exports = mongoose.model('Project', projectSchema);
module.exports.MEMBER_ROLES = MEMBER_ROLES;
