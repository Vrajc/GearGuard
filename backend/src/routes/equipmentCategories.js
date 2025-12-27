const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const EquipmentCategory = require('../models/EquipmentCategory');
const Notification = require('../models/Notification');

// Get all categories
router.get('/', auth, async (req, res) => {
  try {
    const categories = await EquipmentCategory.find()
      .populate('responsibleUser', 'name email');
    
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single category
router.get('/:id', auth, async (req, res) => {
  try {
    const category = await EquipmentCategory.findById(req.params.id)
      .populate('responsibleUser', 'name email');
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    res.json(category);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create category
router.post('/', auth, async (req, res) => {
  try {
    const category = new EquipmentCategory(req.body);
    await category.save();
    await category.populate('responsibleUser', 'name email');
    
    res.status(201).json(category);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update category
router.put('/:id', auth, authorize('manager', 'admin'), async (req, res) => {
  try {
    const oldCategory = await EquipmentCategory.findById(req.params.id);
    
    const category = await EquipmentCategory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('responsibleUser', 'name email');
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Notify if responsible user changed
    if (req.body.responsibleUser && 
        oldCategory.responsibleUser?.toString() !== req.body.responsibleUser.toString()) {
      await Notification.create({
        user: req.body.responsibleUser,
        type: 'system',
        title: 'Category Assignment',
        message: `You have been assigned as responsible for ${category.name} category`,
        actionUrl: '/equipment'
      }).catch(err => console.error('Error creating notification:', err));
    }
    
    res.json(category);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete category
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const category = await EquipmentCategory.findByIdAndDelete(req.params.id);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
