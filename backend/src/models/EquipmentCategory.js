const mongoose = require('mongoose');

const equipmentCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
    },
    responsibleUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    company: {
      type: String,
      default: 'GearGuard Inc.',
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('EquipmentCategory', equipmentCategorySchema);
