const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Equipment name is required'],
      trim: true,
    },
    serialNumber: {
      type: String,
      required: [true, 'Serial number is required'],
      unique: true,
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EquipmentCategory',
      required: true,
    },
    purchaseDate: {
      type: Date,
    },
    warrantyExpiry: {
      type: Date,
    },
    location: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
      default: '',
    },
    usedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    maintenanceTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MaintenanceTeam',
    },
    assignedTechnician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    workCenter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkCenter',
    },
    healthPercentage: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    isScrap: {
      type: Boolean,
      default: false,
    },
    scrapDate: {
      type: Date,
    },
    description: {
      type: String,
    },
    status: {
      type: String,
      enum: ['Active', 'Under Maintenance', 'Inactive', 'Scrapped'],
      default: 'Active',
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

module.exports = mongoose.model('Equipment', equipmentSchema);
