const Notification = require('../models/Notification');

/**
 * Helper functions to create notifications for various activities
 */

// Team related notifications
async function notifyTeamInvitation(userId, senderName, teamName, invitationId) {
  return await Notification.create({
    user: userId,
    type: 'team_invitation',
    title: 'New Team Invitation',
    message: `${senderName} invited you to join ${teamName}`,
    relatedId: invitationId,
    relatedModel: 'Invitation',
    actionUrl: '/invitations'
  });
}

async function notifyInvitationAccepted(senderId, userName, teamName) {
  return await Notification.create({
    user: senderId,
    type: 'invitation_accepted',
    title: 'Invitation Accepted',
    message: `${userName} has accepted your invitation to join ${teamName}`,
    actionUrl: '/teams'
  });
}

async function notifyInvitationRejected(senderId, userName, teamName) {
  return await Notification.create({
    user: senderId,
    type: 'invitation_rejected',
    title: 'Invitation Rejected',
    message: `${userName} has declined your invitation to join ${teamName}`,
    actionUrl: '/teams'
  });
}

async function notifyTeamMemberAdded(userId, teamName, addedByName) {
  return await Notification.create({
    user: userId,
    type: 'system',
    title: 'Added to Team',
    message: `${addedByName} added you to ${teamName}`,
    actionUrl: '/teams'
  });
}

async function notifyTeamMemberRemoved(userId, teamName) {
  return await Notification.create({
    user: userId,
    type: 'system',
    title: 'Removed from Team',
    message: `You have been removed from ${teamName}`,
    actionUrl: '/teams'
  });
}

// Maintenance Request notifications
async function notifyMaintenanceAssigned(userId, equipmentName, requestId) {
  return await Notification.create({
    user: userId,
    type: 'maintenance_assigned',
    title: 'Maintenance Request Assigned',
    message: `You have been assigned a maintenance request for ${equipmentName}`,
    relatedId: requestId,
    relatedModel: 'MaintenanceRequest',
    actionUrl: '/requests'
  });
}

async function notifyMaintenanceCreated(teamMembers, equipmentName, createdByName, requestId) {
  const notifications = teamMembers.map(memberId => ({
    user: memberId,
    type: 'maintenance_assigned',
    title: 'New Maintenance Request',
    message: `${createdByName} created a maintenance request for ${equipmentName}`,
    relatedId: requestId,
    relatedModel: 'MaintenanceRequest',
    actionUrl: '/requests'
  }));
  
  return await Notification.insertMany(notifications);
}

async function notifyMaintenanceStatusChange(userId, equipmentName, status, requestId) {
  const statusMessages = {
    'in-progress': 'started working on',
    'completed': 'completed',
    'cancelled': 'cancelled'
  };
  
  return await Notification.create({
    user: userId,
    type: 'maintenance_completed',
    title: `Maintenance Request ${status}`,
    message: `Maintenance request for ${equipmentName} has been ${statusMessages[status] || status}`,
    relatedId: requestId,
    relatedModel: 'MaintenanceRequest',
    actionUrl: '/requests'
  });
}

async function notifyRequestCreator(creatorId, equipmentName, status, technician) {
  return await Notification.create({
    user: creatorId,
    type: 'maintenance_completed',
    title: 'Maintenance Request Update',
    message: `Your maintenance request for ${equipmentName} is now ${status}${technician ? ` by ${technician}` : ''}`,
    actionUrl: '/requests'
  });
}

// Equipment notifications
async function notifyEquipmentAlert(userIds, equipmentName, alertType, equipmentId) {
  const alertMessages = {
    'maintenance_due': 'requires maintenance',
    'critical': 'has a critical alert',
    'warning': 'has a warning',
    'status_change': 'status has changed'
  };
  
  const notifications = userIds.map(userId => ({
    user: userId,
    type: 'equipment_alert',
    title: 'Equipment Alert',
    message: `${equipmentName} ${alertMessages[alertType] || 'needs attention'}`,
    relatedId: equipmentId,
    relatedModel: 'Equipment',
    actionUrl: '/equipment'
  }));
  
  return await Notification.insertMany(notifications);
}

async function notifyEquipmentCreated(userIds, equipmentName, createdByName) {
  const notifications = userIds.map(userId => ({
    user: userId,
    type: 'system',
    title: 'New Equipment Added',
    message: `${createdByName} added new equipment: ${equipmentName}`,
    actionUrl: '/equipment'
  }));
  
  return await Notification.insertMany(notifications);
}

async function notifyEquipmentUpdated(userIds, equipmentName, updatedByName) {
  const notifications = userIds.map(userId => ({
    user: userId,
    type: 'system',
    title: 'Equipment Updated',
    message: `${updatedByName} updated ${equipmentName}`,
    actionUrl: '/equipment'
  }));
  
  return await Notification.insertMany(notifications);
}

// User notifications
async function notifyUserRegistered(userId, userName) {
  return await Notification.create({
    user: userId,
    type: 'system',
    title: 'Welcome to GearGuard!',
    message: `Welcome ${userName}! Your account has been successfully created.`,
    actionUrl: '/dashboard'
  });
}

async function notifyRoleChanged(userId, newRole, changedByName) {
  return await Notification.create({
    user: userId,
    type: 'system',
    title: 'Role Updated',
    message: `${changedByName} changed your role to ${newRole}`,
    actionUrl: '/dashboard'
  });
}

// Work Center notifications
async function notifyWorkCenterAssigned(userId, workCenterName) {
  return await Notification.create({
    user: userId,
    type: 'system',
    title: 'Work Center Assignment',
    message: `You have been assigned to ${workCenterName}`,
    actionUrl: '/dashboard'
  });
}

module.exports = {
  // Team notifications
  notifyTeamInvitation,
  notifyInvitationAccepted,
  notifyInvitationRejected,
  notifyTeamMemberAdded,
  notifyTeamMemberRemoved,
  
  // Maintenance notifications
  notifyMaintenanceAssigned,
  notifyMaintenanceCreated,
  notifyMaintenanceStatusChange,
  notifyRequestCreator,
  
  // Equipment notifications
  notifyEquipmentAlert,
  notifyEquipmentCreated,
  notifyEquipmentUpdated,
  
  // User notifications
  notifyUserRegistered,
  notifyRoleChanged,
  notifyWorkCenterAssigned
};
