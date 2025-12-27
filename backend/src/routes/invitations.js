const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Invitation = require('../models/Invitation');
const Notification = require('../models/Notification');
const User = require('../models/User');
const MaintenanceTeam = require('../models/MaintenanceTeam');
const { sendEmail } = require('../utils/email');
const { 
  notifyTeamInvitation,
  notifyInvitationAccepted,
  notifyInvitationRejected 
} = require('../utils/notificationHelper');

// Get all invitations for logged-in user
router.get('/my-invitations', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('📧 Fetching invitations for user:', user.email);
    console.log('📧 User ID:', user._id);
    const userEmail = user.email.toLowerCase().trim();
    console.log('📧 Email (cleaned):', userEmail);
    
    // First, let's see ALL invitations in the database for debugging
    const allInvitations = await Invitation.find({});
    console.log('📧 TOTAL invitations in DB:', allInvitations.length);
    
    const matchingEmailInvitations = await Invitation.find({
      receiverEmail: userEmail
    });
    console.log('📧 Invitations matching email (any status):', matchingEmailInvitations.length);
    matchingEmailInvitations.forEach(inv => {
      console.log('   -', {
        id: inv._id,
        status: inv.status,
        expires: inv.expiresAt,
        isExpired: inv.expiresAt < new Date(),
        receiverEmail: inv.receiverEmail,
        team: inv.teamName
      });
    });
    
    // Query with better logging
    const query = {
      $or: [
        { receiverEmail: userEmail },
        { receiverUser: user._id }
      ],
      status: 'pending',
      expiresAt: { $gt: new Date() }
    };
    
    console.log('📧 Query:', JSON.stringify(query, null, 2));
    
    const invitations = await Invitation.find(query)
    .populate('sender', 'name email')
    .populate('team', 'name description')
    .sort({ createdAt: -1 });

    console.log('📧 Found pending non-expired invitations:', invitations.length);

    res.json(invitations);
  } catch (error) {
    console.error('❌ Error fetching invitations:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Send invitation to join team
router.post('/send', async (req, res) => {
  try {
    const { email, teamId, role, message } = req.body;
    const senderId = req.user._id || req.user.id;

    console.log('📤 Sending invitation:', { email, teamId, role, senderId });

    // Validate inputs
    if (!email || !teamId) {
      return res.status(400).json({ message: 'Email and team ID are required' });
    }

    // Get sender info
    const sender = await User.findById(senderId);
    if (!sender) {
      return res.status(404).json({ message: 'Sender not found' });
    }

    console.log('👤 Sender:', sender.name, sender.role);

    // Get team info
    const team = await MaintenanceTeam.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    console.log('👥 Team:', team.name);

    // Check if sender has permission (must be manager or admin)
    const isManager = sender.role === 'manager';
    const isAdmin = sender.role === 'admin';
    
    if (!isManager && !isAdmin) {
      return res.status(403).json({ message: 'Only managers or admins can send invitations' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    // Check if already in team
    if (existingUser && team.members.includes(existingUser._id)) {
      return res.status(400).json({ message: 'User is already a member of this team' });
    }

    // Check for existing pending invitation
    const existingInvitation = await Invitation.findOne({
      receiverEmail: email.toLowerCase(),
      team: teamId,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    });

    if (existingInvitation) {
      return res.status(400).json({ message: 'An invitation has already been sent to this email for this team' });
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex');

    console.log('💾 Creating invitation in database...');

    // Create invitation
    const invitation = new Invitation({
      sender: senderId,
      senderName: sender.name,
      receiverEmail: email.toLowerCase(),
      receiverUser: existingUser ? existingUser._id : null,
      team: teamId,
      teamName: team.name,
      role: role || 'member',
      token,
      message: message || '',
      status: 'pending'
    });

    await invitation.save();

    console.log('✅ Invitation created:', invitation._id);
    console.log('📝 Saved invitation data:', {
      id: invitation._id,
      receiverEmail: invitation.receiverEmail,
      receiverUser: invitation.receiverUser,
      team: invitation.team,
      teamName: invitation.teamName,
      status: invitation.status,
      expiresAt: invitation.expiresAt
    });

    // Verify it was saved by querying back
    const verifyInvitation = await Invitation.findById(invitation._id);
    console.log('🔍 Verification - Invitation exists in DB:', !!verifyInvitation);
    if (verifyInvitation) {
      console.log('🔍 Verification - Email in DB:', verifyInvitation.receiverEmail);
    }

    // Create notification if user exists
    if (existingUser) {
      await notifyTeamInvitation(
        existingUser._id,
        sender.name,
        team.name,
        invitation._id
      ).catch(err => console.error('Error creating notification:', err));
    }

    // Send email notification
    const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invitations?token=${token}`;
    
    await sendEmail({
      to: email,
      subject: `Invitation to join ${team.name} on GearGuard`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Team Invitation</h2>
          <p>Hello,</p>
          <p><strong>${sender.name}</strong> has invited you to join the maintenance team <strong>${team.name}</strong> on GearGuard.</p>
          ${message ? `<p><em>Message: ${message}</em></p>` : ''}
          <p><strong>Team:</strong> ${team.name}</p>
          <p><strong>Role:</strong> ${role || 'member'}</p>
          <div style="margin: 30px 0;">
            <a href="${inviteUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Invitation
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">This invitation will expire in 7 days.</p>
          <p style="color: #666; font-size: 14px;">If you didn't expect this invitation, you can safely ignore this email.</p>
        </div>
      `
    });

    res.status(201).json({ 
      message: 'Invitation sent successfully',
      invitation: {
        id: invitation._id,
        receiverEmail: invitation.receiverEmail,
        teamName: invitation.teamName,
        status: invitation.status
      }
    });
  } catch (error) {
    console.error('Error sending invitation:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Accept invitation
router.post('/accept/:invitationId', async (req, res) => {
  try {
    const { invitationId } = req.params;
    const userId = req.user._id || req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('✅ Accepting invitation:', invitationId, 'for user:', user.email);

    // Find invitation
    const invitation = await Invitation.findById(invitationId);
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    // Check if invitation belongs to this user
    if (invitation.receiverEmail.toLowerCase() !== user.email.toLowerCase()) {
      return res.status(403).json({ message: 'This invitation is not for you' });
    }

    // Check if invitation is still pending
    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: `Invitation has already been ${invitation.status}` });
    }

    // Check if expired
    if (invitation.isExpired()) {
      invitation.status = 'expired';
      await invitation.save();
      return res.status(400).json({ message: 'Invitation has expired' });
    }

    // Add user to team
    const team = await MaintenanceTeam.findById(invitation.team);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    console.log('👥 Adding user to team:', team.name);

    // Check if already a member
    if (!team.members.includes(userId)) {
      team.members.push(userId);
      await team.save();
      console.log('✅ User added to team. Total members:', team.members.length);
    } else {
      console.log('ℹ️ User already a member of this team');
    }

    // Update invitation status
    invitation.status = 'accepted';
    invitation.respondedAt = new Date();
    invitation.receiverUser = userId;
    await invitation.save();

    console.log('✅ Invitation accepted successfully');

    // Create notification for sender
    await notifyInvitationAccepted(
      invitation.sender,
      user.name,
      team.name
    ).catch(err => console.error('Error creating notification:', err));

    // Send email to sender
    const sender = await User.findById(invitation.sender);
    if (sender) {
      await sendEmail({
        to: sender.email,
        subject: `${user.name} accepted your team invitation`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #16a34a;">Invitation Accepted!</h2>
            <p><strong>${user.name}</strong> has accepted your invitation to join <strong>${team.name}</strong>.</p>
            <p>They are now a member of your team.</p>
          </div>
        `
      });
    }

    res.json({ 
      message: 'Invitation accepted successfully',
      team: {
        id: team._id,
        name: team.name
      }
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reject invitation
router.post('/reject/:invitationId', async (req, res) => {
  try {
    const { invitationId } = req.params;
    const userId = req.user._id || req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find invitation
    const invitation = await Invitation.findById(invitationId);
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    // Check if invitation belongs to this user
    if (invitation.receiverEmail.toLowerCase() !== user.email.toLowerCase()) {
      return res.status(403).json({ message: 'This invitation is not for you' });
    }

    // Check if invitation is still pending
    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: `Invitation has already been ${invitation.status}` });
    }

    // Update invitation status
    invitation.status = 'rejected';
    invitation.respondedAt = new Date();
    invitation.receiverUser = userId;
    await invitation.save();

    // Create notification for sender
    await notifyInvitationRejected(
      invitation.sender,
      user.name,
      invitation.teamName
    ).catch(err => console.error('Error creating notification:', err));

    res.json({ message: 'Invitation rejected' });
  } catch (error) {
    console.error('Error rejecting invitation:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get invitation by token (for email links)
router.get('/token/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const invitation = await Invitation.findOne({ token })
      .populate('sender', 'name email')
      .populate('team', 'name description');

    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    // Check if expired
    if (invitation.isExpired()) {
      invitation.status = 'expired';
      await invitation.save();
      return res.status(400).json({ message: 'Invitation has expired' });
    }

    res.json(invitation);
  } catch (error) {
    console.error('Error fetching invitation:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get sent invitations (for team leaders/admins)
router.get('/sent', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const invitations = await Invitation.find({ sender: userId })
      .populate('team', 'name')
      .populate('receiverUser', 'name email')
      .sort({ createdAt: -1 });

    res.json(invitations);
  } catch (error) {
    console.error('Error fetching sent invitations:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
