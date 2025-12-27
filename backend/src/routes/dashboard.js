const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Equipment = require('../models/Equipment');
const MaintenanceRequest = require('../models/MaintenanceRequest');
const User = require('../models/User');

// Get dashboard statistics
router.get('/stats', auth, async (req, res) => {
  try {
    // Total equipment count
    const totalEquipment = await Equipment.countDocuments({ isScrap: false });
    
    // Active maintenance requests (New + In Progress)
    const activeRequests = await MaintenanceRequest.countDocuments({
      stage: { $in: ['New', 'In Progress'] }
    });
    
    // Average equipment health
    const healthAgg = await Equipment.aggregate([
      { $match: { isScrap: false } },
      { $group: { _id: null, avgHealth: { $avg: '$healthPercentage' } } }
    ]);
    const avgHealthPercentage = healthAgg.length > 0 ? Math.round(healthAgg[0].avgHealth) : 0;
    
    // Upcoming maintenance (next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const upcomingMaintenance = await MaintenanceRequest.countDocuments({
      scheduledDate: { $gte: new Date(), $lte: nextWeek },
      stage: { $in: ['New', 'In Progress'] }
    });
    
    // Total technicians
    const totalTechnicians = await User.countDocuments({ role: 'technician' });
    
    // Completed this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const completedThisMonth = await MaintenanceRequest.countDocuments({
      stage: 'Repaired',
      completedDate: { $gte: startOfMonth }
    });
    
    res.json({
      totalEquipment,
      activeRequests,
      avgHealthPercentage,
      upcomingMaintenance,
      totalTechnicians,
      completedThisMonth
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
