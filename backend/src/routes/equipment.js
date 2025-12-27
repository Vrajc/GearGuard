const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const Equipment = require('../models/Equipment');
const mongoose = require('mongoose');
const User = require('../models/User');
const { notifyEquipmentCreated, notifyEquipmentUpdated, notifyEquipmentAlert } = require('../utils/notificationHelper');

// Get all equipment
router.get('/', auth, async (req, res) => {
  try {
    const equipment = await Equipment.find()
      .populate('category', 'name')
      .populate('assignedTechnician', 'name email department')
      .populate('maintenanceTeam', 'name')
      .populate('usedBy', 'name email department')
      .populate('workCenter', 'name code');
    
    res.json(equipment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single equipment
router.get('/:id', auth, async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id)
      .populate('category')
      .populate('assignedTechnician', 'name email department')
      .populate('maintenanceTeam')
      .populate('usedBy', 'name email department')
      .populate('workCenter');
    
    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }
    
    res.json(equipment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create equipment
router.post('/', auth, authorize('manager', 'admin'), async (req, res) => {
  try {
    const equipment = new Equipment(req.body);
    await equipment.save();
    await equipment.populate('category assignedTechnician maintenanceTeam usedBy workCenter');
    
    // Notify relevant users about new equipment
    const usersToNotify = [];
    
    // Notify assigned technician
    if (equipment.assignedTechnician) {
      usersToNotify.push(equipment.assignedTechnician._id);
    }
    
    // Notify team members
    if (equipment.maintenanceTeam && equipment.maintenanceTeam.members) {
      equipment.maintenanceTeam.members.forEach(memberId => {
        if (!usersToNotify.includes(memberId.toString())) {
          usersToNotify.push(memberId);
        }
      });
    }
    
    // Notify users in the work center (managers/admins)
    const managers = await User.find({ role: { $in: ['manager', 'admin'] } }).select('_id');
    managers.forEach(manager => {
      if (!usersToNotify.includes(manager._id.toString())) {
        usersToNotify.push(manager._id);
      }
    });
    
    if (usersToNotify.length > 0) {
      await notifyEquipmentCreated(
        usersToNotify,
        equipment.name,
        req.user.name || 'Admin'
      ).catch(err => console.error('Error creating notifications:', err));
    }
    
    res.status(201).json(equipment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update equipment
router.put('/:id', auth, authorize('manager', 'admin'), async (req, res) => {
  try {
    const oldEquipment = await Equipment.findById(req.params.id);
    
    const equipment = await Equipment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('category assignedTechnician maintenanceTeam usedBy workCenter');
    
    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }
    
    // Notify relevant users about equipment update
    const usersToNotify = [];
    
    // Notify assigned technician if changed
    if (equipment.assignedTechnician && 
        oldEquipment.assignedTechnician?.toString() !== equipment.assignedTechnician._id.toString()) {
      usersToNotify.push(equipment.assignedTechnician._id);
    }
    
    // Notify old technician if changed
    if (oldEquipment.assignedTechnician && 
        oldEquipment.assignedTechnician.toString() !== equipment.assignedTechnician?._id.toString()) {
      if (!usersToNotify.includes(oldEquipment.assignedTechnician.toString())) {
        usersToNotify.push(oldEquipment.assignedTechnician);
      }
    }
    
    // Notify team members
    if (equipment.maintenanceTeam && equipment.maintenanceTeam.members) {
      equipment.maintenanceTeam.members.forEach(memberId => {
        if (!usersToNotify.includes(memberId.toString())) {
          usersToNotify.push(memberId);
        }
      });
    }
    
    // Notify if status changed to critical
    if (req.body.status && ['Broken', 'Critical', 'Under Repair'].includes(req.body.status)) {
      const managers = await User.find({ role: { $in: ['manager', 'admin'] } }).select('_id');
      managers.forEach(manager => {
        if (!usersToNotify.includes(manager._id.toString())) {
          usersToNotify.push(manager._id);
        }
      });
      
      if (usersToNotify.length > 0) {
        await notifyEquipmentAlert(
          usersToNotify,
          equipment.name,
          'status_change',
          equipment._id
        ).catch(err => console.error('Error creating alert:', err));
      }
    } else if (usersToNotify.length > 0) {
      await notifyEquipmentUpdated(
        usersToNotify,
        equipment.name,
        req.user.name || 'Admin'
      ).catch(err => console.error('Error creating notifications:', err));
    }
    
    res.json(equipment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete equipment
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const equipment = await Equipment.findByIdAndDelete(req.params.id);
    
    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }
    
    res.json({ message: 'Equipment deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get equipment statistics (for smart buttons)
router.get('/:id/stats', auth, async (req, res) => {
  try {
    const MaintenanceRequest = require('../models/MaintenanceRequest');
    
    const stats = await MaintenanceRequest.aggregate([
      {
        $match: {
          equipment: mongoose.Types.ObjectId(req.params.id)
        }
      },
      {
        $group: {
          _id: '$stage',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const total = await MaintenanceRequest.countDocuments({
      equipment: req.params.id
    });
    
    const open = await MaintenanceRequest.countDocuments({
      equipment: req.params.id,
      stage: { $in: ['New', 'In Progress'] }
    });
    
    res.json({ total, open, byStage: stats });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all maintenance requests for specific equipment (Smart Button)
router.get('/:id/maintenance-requests', auth, async (req, res) => {
  try {
    const MaintenanceRequest = require('../models/MaintenanceRequest');
    
    const requests = await MaintenanceRequest.find({
      equipment: req.params.id
    })
      .populate('createdBy', 'name email')
      .populate('technician', 'name email')
      .populate('maintenanceTeam', 'name')
      .populate('equipment', 'name serialNumber')
      .sort('-createdAt');
    
    const total = requests.length;
    const open = requests.filter(r => ['New', 'In Progress'].includes(r.stage)).length;
    
    const byStage = requests.reduce((acc, req) => {
      acc[req.stage] = (acc[req.stage] || 0) + 1;
      return acc;
    }, {});
    
    res.json({ 
      total, 
      open, 
      byStage,
      requests 
    });
  } catch (error) {
    console.error('Error fetching equipment requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
