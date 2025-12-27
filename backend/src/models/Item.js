const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide an item name'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
    },
    category: {
      type: String,
      required: [true, 'Please provide a category'],
      enum: ['Electronics', 'Tools', 'Equipment', 'Accessories', 'Other'],
    },
    quantity: {
      type: Number,
      required: [true, 'Please provide quantity'],
      min: 0,
    },
    location: {
      type: String,
      required: [true, 'Please provide a location'],
    },
    status: {
      type: String,
      enum: ['Available', 'In Use', 'Maintenance', 'Retired'],
      default: 'Available',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Item', itemSchema);
