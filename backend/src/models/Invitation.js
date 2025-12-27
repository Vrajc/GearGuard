const mongoose = require('mongoose');

const invitationSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderName: {
    type: String,
    required: true
  },
  receiverEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  receiverUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MaintenanceTeam',
    required: true
  },
  teamName: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['member', 'leader'],
    default: 'member'
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'expired'],
    default: 'pending'
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  message: {
    type: String,
    default: ''
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  },
  respondedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for quick lookups
invitationSchema.index({ receiverEmail: 1, status: 1 });
invitationSchema.index({ token: 1 });
invitationSchema.index({ expiresAt: 1 });

// Check if invitation is expired
invitationSchema.methods.isExpired = function() {
  return this.expiresAt < new Date() && this.status === 'pending';
};

// NOTE: Removed problematic pre-find hook that was preventing invitations from being found

module.exports = mongoose.model('Invitation', invitationSchema);
