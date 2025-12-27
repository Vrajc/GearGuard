const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const MaintenanceTeam = require('../models/MaintenanceTeam');
const { notifyTeamMemberAdded, notifyTeamMemberRemoved } = require('../utils/notificationHelper');

// Get all teams
router.get('/', auth, async (req, res) => {
  try {
    // req.user is populated by the auth middleware with full user object
    const userId = req.user._id || req.user.id;
    const userRole = req.user.role;
    
    console.log('📊 Fetching teams for user:', userId, 'Role:', userRole);
    
    // Admins and managers see all teams
    // Regular users (technicians, etc.) only see teams they're members of
    let query = {};
    if (userRole !== 'admin' && userRole !== 'manager') {
      query = { members: userId };
      console.log('👤 Filtering teams where user is a member');
    } else {
      console.log('👑 Admin/Manager - showing all teams');
    }
    
    const teams = await MaintenanceTeam.find(query)
      .populate('members', 'name email role');
    
    console.log('✅ Found teams:', teams.length);
    
    res.json(teams);
  } catch (error) {
    console.error('❌ Error fetching teams:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single team
router.get('/:id', auth, async (req, res) => {
  try {
    const team = await MaintenanceTeam.findById(req.params.id)
      .populate('members', 'name email role');
    
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    res.json(team);
  } catch (error) {
    console.error('❌ Error fetching team:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create team
router.post('/', auth, authorize('manager', 'admin'), async (req, res) => {
  try {
    // Validate required fields
    if (!req.body.name || req.body.name.trim() === '') {
      return res.status(400).json({ 
        message: 'Validation error', 
        error: 'Team name is required' 
      });
    }

    const teamData = {
      name: req.body.name.trim(),
      members: Array.isArray(req.body.members) ? req.body.members : [],
      description: req.body.description || '',
      company: req.user.company || 'GearGuard Inc.',
    };
    
    const team = new MaintenanceTeam(teamData);
    await team.save();
    await team.populate('members', 'name email role');
    
    res.status(201).json(team);
  } catch (error) {
    console.error('❌ Error creating team:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation error', 
        error: messages.join(', '),
        details: messages
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Duplicate error', 
        error: 'A team with this name already exists' 
      });
    }
    
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message
    });
  }
});

// Update team
router.put('/:id', auth, authorize('manager', 'admin'), async (req, res) => {
  try {
    const oldTeam = await MaintenanceTeam.findById(req.params.id);
    
    const team = await MaintenanceTeam.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('members', 'name email role');
    
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    // Notify new members added
    if (req.body.members && oldTeam) {
      const oldMemberIds = oldTeam.members.map(m => m.toString());
      const newMemberIds = req.body.members.map(m => m.toString());
      
      // Find newly added members
      const addedMembers = newMemberIds.filter(id => !oldMemberIds.includes(id));
      for (const memberId of addedMembers) {
        await notifyTeamMemberAdded(
          memberId,
          team.name,
          req.user.name || 'Manager'
        ).catch(err => console.error('Error creating notification:', err));
      }
      
      // Find removed members
      const removedMembers = oldMemberIds.filter(id => !newMemberIds.includes(id));
      for (const memberId of removedMembers) {
        await notifyTeamMemberRemoved(
          memberId,
          team.name
        ).catch(err => console.error('Error creating notification:', err));
      }
    }
    
    res.json(team);
  } catch (error) {
    console.error('❌ Error updating team:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete team
router.delete('/:id', auth, authorize('manager', 'admin'), async (req, res) => {
  try {
    const team = await MaintenanceTeam.findByIdAndDelete(req.params.id);
    
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting team:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
