const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const Item = require('../models/Item');

// @route   GET /api/items
// @desc    Get all items
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const items = await Item.find().populate('owner', 'name email');
    res.json(items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/items/:id
// @desc    Get item by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate('owner', 'name email');
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/items
// @desc    Create a new item
// @access  Private
router.post(
  '/',
  [
    auth,
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('category').isIn(['Electronics', 'Tools', 'Equipment', 'Accessories', 'Other']),
    body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a positive number'),
    body('location').trim().notEmpty().withMessage('Location is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description, category, quantity, location, status } = req.body;

      const item = new Item({
        name,
        description,
        category,
        quantity,
        location,
        status,
        owner: req.user._id,
      });

      await item.save();
      await item.populate('owner', 'name email');

      res.status(201).json(item);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   PUT /api/items/:id
// @desc    Update item
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, category, quantity, location, status } = req.body;

    let item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Check if user is the owner or admin
    if (item.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    item = await Item.findByIdAndUpdate(
      req.params.id,
      { name, description, category, quantity, location, status },
      { new: true, runValidators: true }
    ).populate('owner', 'name email');

    res.json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/items/:id
// @desc    Delete item
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Check if user is the owner or admin
    if (item.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Item.findByIdAndDelete(req.params.id);

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
