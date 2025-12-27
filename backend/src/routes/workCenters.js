const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const WorkCenter = require('../models/WorkCenter');

// Get all work centers
router.get('/', auth, async (req, res) => {
  try {
    const workCenters = await WorkCenter.find()
      .populate('alternativeWorkCenters', 'name code');
    
    res.json(workCenters);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single work center
router.get('/:id', auth, async (req, res) => {
  try {
    const workCenter = await WorkCenter.findById(req.params.id)
      .populate('alternativeWorkCenters', 'name code');
    
    if (!workCenter) {
      return res.status(404).json({ message: 'Work center not found' });
    }
    
    res.json(workCenter);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create work center
router.post('/', auth, authorize('manager', 'admin'), async (req, res) => {
  try {
    const workCenter = new WorkCenter(req.body);
    await workCenter.save();
    await workCenter.populate('alternativeWorkCenters', 'name code');
    
    res.status(201).json(workCenter);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update work center
router.put('/:id', auth, authorize('manager', 'admin'), async (req, res) => {
  try {
    const workCenter = await WorkCenter.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('alternativeWorkCenters', 'name code');
    
    if (!workCenter) {
      return res.status(404).json({ message: 'Work center not found' });
    }
    
    res.json(workCenter);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete work center
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const workCenter = await WorkCenter.findByIdAndDelete(req.params.id);
    
    if (!workCenter) {
      return res.status(404).json({ message: 'Work center not found' });
    }
    
    res.json({ message: 'Work center deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
