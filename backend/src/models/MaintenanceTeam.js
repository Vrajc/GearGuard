const mongoose = require('mongoose');

const maintenanceTeamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
    },
    members: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    description: {
      type: String,
      trim: true,
    },
    company: {
      type: String,
      default: 'GearGuard Inc.',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('MaintenanceTeam', maintenanceTeamSchema);
