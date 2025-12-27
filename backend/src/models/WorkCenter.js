const mongoose = require('mongoose');

const workCenterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Work center name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Work center code is required'],
      unique: true,
      trim: true,
    },
    tag: {
      type: String,
      trim: true,
    },
    alternativeWorkCenters: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkCenter',
    }],
    costPerHour: {
      type: Number,
      default: 0,
      min: 0,
    },
    capacity: {
      type: Number,
      default: 0,
      min: 0,
    },
    timeEfficiency: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    oeeTarget: {
      type: Number,
      default: 80,
      min: 0,
      max: 100,
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

module.exports = mongoose.model('WorkCenter', workCenterSchema);
