const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const MaintenanceRequest = require('../models/MaintenanceRequest');
const Equipment = require('../models/Equipment');
const { 
  notifyMaintenanceCreated, 
  notifyMaintenanceAssigned, 
  notifyMaintenanceStatusChange,
  notifyRequestCreator 
} = require('../utils/notificationHelper');

// Get all requests
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    
    // Admins and managers see all requests
    if (userRole === 'admin' || userRole === 'manager') {
      const requests = await MaintenanceRequest.find()
        .populate('createdBy', 'name email')
        .populate('equipment', 'name serialNumber')
        .populate('workCenter', 'name code')
        .populate('category', 'name')
        .populate('maintenanceTeam', 'name members')
        .populate('technician', 'name email')
        .sort('-createdAt');
      
      return res.json(requests);
    }
    
    // For technicians and employees, find their teams
    const MaintenanceTeam = require('../models/MaintenanceTeam');
    const userTeams = await MaintenanceTeam.find({ members: userId });
    const teamIds = userTeams.map(team => team._id);
    
    // Get requests assigned to their teams OR created by them
    const requests = await MaintenanceRequest.find({
      $or: [
        { maintenanceTeam: { $in: teamIds } },
        { createdBy: userId },
        { technician: userId }
      ]
    })
      .populate('createdBy', 'name email')
      .populate('equipment', 'name serialNumber')
      .populate('workCenter', 'name code')
      .populate('category', 'name')
      .populate('maintenanceTeam', 'name members')
      .populate('technician', 'name email')
      .sort('-createdAt');
    
    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single request
router.get('/:id', auth, async (req, res) => {
  try {
    const request = await MaintenanceRequest.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('equipment')
      .populate('workCenter')
      .populate('category')
      .populate('maintenanceTeam')
      .populate('technician', 'name email');
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    res.json(request);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create request
router.post('/', auth, async (req, res) => {
  try {
    const requestData = {
      ...req.body,
      createdBy: req.user._id,
    };
    
    const request = new MaintenanceRequest(requestData);
    await request.save();
    await request.populate('createdBy equipment workCenter category maintenanceTeam technician');
    
    // Notify team members if team is assigned
    if (request.maintenanceTeam && request.maintenanceTeam.members && request.maintenanceTeam.members.length > 0) {
      const equipmentName = request.equipment?.name || 'Equipment';
      const createdByName = req.user.name || 'User';
      
      // Filter out the creator from notifications
      const teamMembersToNotify = request.maintenanceTeam.members
        .filter(memberId => memberId.toString() !== req.user._id.toString());
      
      if (teamMembersToNotify.length > 0) {
        await notifyMaintenanceCreated(
          teamMembersToNotify,
          equipmentName,
          createdByName,
          request._id
        ).catch(err => console.error('Error creating notifications:', err));
      }
    }
    
    // Notify assigned technician if specified
    if (request.technician && request.technician._id.toString() !== req.user._id.toString()) {
      const equipmentName = request.equipment?.name || 'Equipment';
      await notifyMaintenanceAssigned(
        request.technician._id,
        equipmentName,
        request._id
      ).catch(err => console.error('Error creating notification:', err));
    }
    
    res.status(201).json(request);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update request
router.put('/:id', auth, async (req, res) => {
  try {
    console.log('🔄 UPDATE REQUEST - ID:', req.params.id);
    console.log('📝 Update data:', JSON.stringify(req.body, null, 2));
    
    const request = await MaintenanceRequest.findById(req.params.id)
      .populate('maintenanceTeam', 'members');
    
    if (!request) {
      console.error('❌ Request not found:', req.params.id);
      return res.status(404).json({ message: 'Request not found' });
    }
    
    // Authorization check: Only allow if user is admin, manager, request creator, or team member
    const userId = req.user._id;
    const userRole = req.user.role;
    const isCreator = request.createdBy.toString() === userId.toString();
    const isAssignedTechnician = request.technician && request.technician.toString() === userId.toString();
    const isTeamMember = request.maintenanceTeam && 
      request.maintenanceTeam.members.some(memberId => memberId.toString() === userId.toString());
    
    if (userRole !== 'admin' && userRole !== 'manager' && !isCreator && !isTeamMember && !isAssignedTechnician) {
      console.error('❌ Unauthorized: User not authorized to update this request');
      return res.status(403).json({ 
        message: 'You are not authorized to update this request. Only team members can action team requests.' 
      });
    }
    
    console.log('📋 Current request stage:', request.stage);
    console.log('🔄 New stage:', req.body.stage);
    
    const oldStage = request.stage;
    const oldTechnician = request.technician;
    const oldStatus = request.status;
    
    // Handle stage change to Scrap
    if (req.body.stage === 'Scrap' && request.equipment) {
      console.log('🗑️ Marking equipment as scrap');
      await Equipment.findByIdAndUpdate(request.equipment, {
        isScrap: true,
        scrapDate: new Date(),
        status: 'Scrapped',
      });
    }
    
    // Handle completion
    if (req.body.stage === 'Repaired' && !request.completedDate) {
      console.log('✅ Setting completion date');
      req.body.completedDate = new Date();
    }
    
    const updatedRequest = await MaintenanceRequest.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy equipment workCenter category maintenanceTeam technician');
    
    console.log('✅ Request updated successfully');
    console.log('📋 Updated stage:', updatedRequest.stage);
    
    // Send notifications for important changes
    const equipmentName = updatedRequest.equipment?.name || 'Equipment';
    
    // Notify on status/stage changes
    if (oldStage !== updatedRequest.stage || oldStatus !== updatedRequest.status) {
      // Notify creator if not the one making the change
      if (updatedRequest.createdBy._id.toString() !== userId.toString()) {
        const status = updatedRequest.stage || updatedRequest.status;
        const technicianName = updatedRequest.technician?.name || 'a technician';
        await notifyRequestCreator(
          updatedRequest.createdBy._id,
          equipmentName,
          status,
          technicianName
        ).catch(err => console.error('Error creating notification:', err));
      }
      
      // Notify team members if stage changed
      if (updatedRequest.maintenanceTeam && updatedRequest.maintenanceTeam.members) {
        const status = updatedRequest.stage || updatedRequest.status;
        const membersToNotify = updatedRequest.maintenanceTeam.members
          .filter(memberId => memberId.toString() !== userId.toString());
        
        for (const memberId of membersToNotify) {
          await notifyMaintenanceStatusChange(
            memberId,
            equipmentName,
            status,
            updatedRequest._id
          ).catch(err => console.error('Error creating notification:', err));
        }
      }
    }
    
    // Notify if technician was assigned or changed
    if (req.body.technician && oldTechnician?.toString() !== req.body.technician.toString()) {
      if (req.body.technician.toString() !== userId.toString()) {
        await notifyMaintenanceAssigned(
          req.body.technician,
          equipmentName,
          updatedRequest._id
        ).catch(err => console.error('Error creating notification:', err));
      }
    }
    
    res.json(updatedRequest);
  } catch (error) {
    console.error('❌ UPDATE ERROR:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete request
router.delete('/:id', auth, async (req, res) => {
  try {
    const request = await MaintenanceRequest.findByIdAndDelete(req.params.id);
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    res.json({ message: 'Request deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
