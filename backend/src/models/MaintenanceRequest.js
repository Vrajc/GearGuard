const mongoose = require('mongoose');

const maintenanceRequestSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    requestType: {
      type: String,
      enum: ['Corrective', 'Preventive'],
      required: true,
    },
    equipment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Equipment',
    },
    workCenter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkCenter',
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EquipmentCategory',
    },
    maintenanceTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MaintenanceTeam',
    },
    technician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    priority: {
      type: String,
      enum: ['Low', 'Normal', 'High', 'Urgent'],
      default: 'Normal',
    },
    scheduledDate: {
      type: Date,
    },
    duration: {
      type: Number,
      default: 0,
      min: 0,
    },
    stage: {
      type: String,
      enum: ['New', 'In Progress', 'Repaired', 'Scrap'],
      default: 'New',
    },
    company: {
      type: String,
      default: 'GearGuard Inc.',
    },
    notes: {
      type: String,
    },
    instructions: {
      type: String,
    },
    completedDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-fill category and maintenance team from equipment
maintenanceRequestSchema.pre('save', async function(next) {
  if (this.equipment && !this.category) {
    const Equipment = mongoose.model('Equipment');
    const equipment = await Equipment.findById(this.equipment)
      .populate('category')
      .populate('maintenanceTeam');
    
    if (equipment) {
      this.category = equipment.category;
      this.maintenanceTeam = equipment.maintenanceTeam;
    }
  }
  next();
});

module.exports = mongoose.model('MaintenanceRequest', maintenanceRequestSchema);
