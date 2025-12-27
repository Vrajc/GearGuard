'use client';

import { useEffect, useState } from 'react';
import { teamAPI, userAPI, invitationAPI } from '@/lib/api';
import type { MaintenanceTeam, User } from '@/types';
import Modal from '@/components/Modal';
import { useAuth } from '@/contexts/AuthContext';

export default function TeamsPage() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<MaintenanceTeam[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<MaintenanceTeam | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    members: [] as string[],
    description: '',
  });
  const [inviteData, setInviteData] = useState({
    email: '',
    role: 'member',
    message: '',
  });

  useEffect(() => {
    fetchData();
  }, [refreshKey]);

  useEffect(() => {
    // Listen for custom event to refresh teams
    const handleTeamUpdate = () => {
      console.log('🔄 Team update event received, refreshing data...');
      setRefreshKey(prev => prev + 1);
    };
    
    window.addEventListener('teamUpdated', handleTeamUpdate);
    
    return () => {
      window.removeEventListener('teamUpdated', handleTeamUpdate);
    };
  }, []);

  const fetchData = async () => {
    try {
      console.log('📊 Fetching teams and users data...');
      setLoading(true);
      
      // Fetch teams and users separately to identify which fails
      let teamsRes, usersRes;
      
      try {
        console.log('📊 Fetching teams...');
        teamsRes = await teamAPI.getAll();
        console.log('✅ Teams fetched:', teamsRes.data.length);
        setTeams(teamsRes.data);
      } catch (teamError: any) {
        console.error('❌ Error fetching teams:', teamError);
        console.error('   Status:', teamError.response?.status);
        console.error('   Data:', teamError.response?.data);
        console.error('   Message:', teamError.message);
        alert(`Failed to load teams: ${teamError.response?.data?.message || teamError.message}`);
        throw teamError;
      }
      
      try {
        console.log('📊 Fetching users...');
        usersRes = await userAPI.getAll();
        console.log('✅ Users fetched:', usersRes.data.length);
        // Filter for technicians and managers only
        setUsers(usersRes.data.filter((u: User) => 
          u.role === 'technician' || u.role === 'manager'
        ));
      } catch (userError: any) {
        console.error('❌ Error fetching users:', userError);
        console.error('   Status:', userError.response?.status);
        console.error('   Data:', userError.response?.data);
        // Users failing is less critical, just log it
        console.warn('Could not fetch users for selection');
      }
      
    } catch (error: any) {
      console.error('💥 Fatal error in fetchData:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Please enter a team name');
      return;
    }

    // Members are now optional - can create empty team and invite via email later
    
    setIsSubmitting(true);
    
    try {
      const teamData = {
        name: formData.name.trim(),
        members: formData.members,
        description: formData.description.trim(),
      };
      
      await teamAPI.create(teamData);
      
      setIsModalOpen(false);
      setFormData({ name: '', members: [], description: '' });
      alert('Team created successfully!');
      await fetchData();
    } catch (error: any) {
      console.error('❌ Error creating team:', error);
      
      let errorMsg = 'Failed to create team';
      
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMsg = error.response.data;
        } else if (error.response.data.message) {
          errorMsg = error.response.data.message;
        } else if (error.response.data.error) {
          errorMsg = error.response.data.error;
        }
        
        if (error.response.data.details && Array.isArray(error.response.data.details)) {
          errorMsg += '\n' + error.response.data.details.join('\n');
        }
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      if (error.code === 'ERR_NETWORK') {
        errorMsg = 'Network error: Cannot connect to server. Please check if the backend is running.';
      }
      
      if (error.response?.status === 401) {
        errorMsg = 'Unauthorized: Please log in again.';
      }
      
      alert(`Error: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMember = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      members: prev.members.includes(userId)
        ? prev.members.filter(id => id !== userId)
        : [...prev.members, userId]
    }));
  };

  const handleInvite = (team: MaintenanceTeam) => {
    setSelectedTeam(team);
    setInviteData({ email: '', role: 'member', message: '' });
    setIsInviteModalOpen(true);
  };

  const handleViewDetails = (team: MaintenanceTeam) => {
    setSelectedTeam(team);
    setIsDetailModalOpen(true);
  };

  const handleEditClick = (team: MaintenanceTeam) => {
    setSelectedTeam(team);
    setFormData({
      name: team.name,
      members: team.members.map(m => m._id),
      description: team.description || '',
    });
    setIsDetailModalOpen(false);
    setIsEditModalOpen(true);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTeam || !formData.name.trim()) {
      alert('Please enter a team name');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await teamAPI.update(selectedTeam._id, {
        name: formData.name.trim(),
        members: formData.members,
        description: formData.description.trim(),
      });
      
      setIsEditModalOpen(false);
      setSelectedTeam(null);
      setFormData({ name: '', members: [], description: '' });
      alert('Team updated successfully!');
      await fetchData();
    } catch (error: any) {
      console.error('❌ Error updating team:', error);
      alert(`Error: ${error.response?.data?.message || 'Failed to update team'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (teamId: string, teamName: string) => {
    if (!confirm(`Are you sure you want to delete "${teamName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await teamAPI.delete(teamId);
      setIsDetailModalOpen(false);
      setIsEditModalOpen(false);
      setSelectedTeam(null);
      alert('Team deleted successfully!');
      await fetchData();
    } catch (error: any) {
      console.error('❌ Error deleting team:', error);
      alert(`Error: ${error.response?.data?.message || 'Failed to delete team'}`);
    }
  };

  const canManage = user?.role === 'admin' || user?.role === 'manager';

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteData.email.trim() || !selectedTeam) {
      alert('Please enter an email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteData.email)) {
      alert('Please enter a valid email address');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await invitationAPI.sendInvitation({
        email: inviteData.email.trim(),
        teamId: selectedTeam._id,
        role: inviteData.role,
        message: inviteData.message.trim(),
      });
      
      setIsInviteModalOpen(false);
      setInviteData({ email: '', role: 'member', message: '' });
      alert('Invitation sent successfully!');
    } catch (error: any) {
      console.error('❌ Error sending invitation:', error);
      
      let errorMsg = 'Failed to send invitation';
      
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMsg = error.response.data;
        } else if (error.response.data.message) {
          errorMsg = error.response.data.message;
        }
      }
      
      alert(`Error: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-odoo-text-muted">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-odoo-text mb-2">
            Maintenance Teams
          </h1>
          <p className="text-odoo-text-muted">{teams.length} teams</p>
        </div>
        {canManage && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="odoo-button-primary"
          >
            + New Team
          </button>
        )}
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => (
          <TeamCard 
            key={team._id} 
            team={team} 
            onInvite={handleInvite}
            onClick={handleViewDetails}
            canManage={canManage}
          />
        ))}
      </div>

      {teams.length === 0 && (
        <div className="text-center py-16">
          <p className="text-odoo-text-muted text-lg">No teams found</p>
          <p className="text-odoo-text-muted text-sm mt-2">Create your first maintenance team to get started</p>
        </div>
      )}

      {/* Create Team Modal */}
      <Modal isOpen={isModalOpen} onClose={() => !isSubmitting && setIsModalOpen(false)} title="Create Maintenance Team">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-odoo-text-primary mb-2">
              Team Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-odoo-border rounded focus:outline-none focus:ring-2 focus:ring-odoo-primary"
              placeholder="Enter team name"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-odoo-text-primary mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-odoo-border rounded focus:outline-none focus:ring-2 focus:ring-odoo-primary"
              placeholder="Optional description"
              rows={2}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-odoo-text-primary mb-2">
              Team Members (Optional - {formData.members.length} selected)
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto border border-odoo-border rounded p-3">
              {users.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-odoo-text-muted mb-2">
                    No existing technicians or managers available
                  </p>
                  <p className="text-xs text-odoo-text-muted">
                    💡 Tip: Create the team first, then use "Invite Member" to add people via email
                  </p>
                </div>
              ) : (
                users.map((user) => (
                  <label 
                    key={user._id} 
                    className="flex items-center space-x-3 cursor-pointer hover:bg-odoo-bg-app p-2 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={formData.members.includes(user._id)}
                      onChange={() => toggleMember(user._id)}
                      className="w-4 h-4 text-odoo-primary focus:ring-odoo-primary"
                      disabled={isSubmitting}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-odoo-text-primary">{user.name}</p>
                      <p className="text-xs text-odoo-text-muted capitalize">{user.role} • {user.email}</p>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="odoo-button-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="odoo-button-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Team'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Invite Member Modal */}
      <Modal 
        isOpen={isInviteModalOpen} 
        onClose={() => !isSubmitting && setIsInviteModalOpen(false)} 
        title={`Invite Member to ${selectedTeam?.name}`}
      >
        <form onSubmit={handleSendInvitation} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-odoo-text-primary mb-2">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={inviteData.email}
              onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
              className="w-full px-4 py-2 border border-odoo-border rounded focus:outline-none focus:ring-2 focus:ring-odoo-primary"
              placeholder="Enter email address"
              disabled={isSubmitting}
            />
            <p className="text-xs text-odoo-text-muted mt-1">
              An invitation email will be sent to this address
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-odoo-text-primary mb-2">
              Role
            </label>
            <select
              value={inviteData.role}
              onChange={(e) => setInviteData({ ...inviteData, role: e.target.value })}
              className="w-full px-4 py-2 border border-odoo-border rounded focus:outline-none focus:ring-2 focus:ring-odoo-primary"
              disabled={isSubmitting}
            >
              <option value="member">Member</option>
              <option value="leader">Leader</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-odoo-text-primary mb-2">
              Personal Message (Optional)
            </label>
            <textarea
              value={inviteData.message}
              onChange={(e) => setInviteData({ ...inviteData, message: e.target.value })}
              className="w-full px-4 py-2 border border-odoo-border rounded focus:outline-none focus:ring-2 focus:ring-odoo-primary"
              placeholder="Add a personal message to the invitation..."
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setIsInviteModalOpen(false)}
              className="odoo-button-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="odoo-button-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </Modal>
      
      {/* Team Details Modal */}
      {selectedTeam && (
        <Modal 
          isOpen={isDetailModalOpen} 
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedTeam(null);
          }} 
          title="Team Details"
        >
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-odoo-text-primary mb-2">
                {selectedTeam.name}
              </h2>
              {selectedTeam.description && (
                <p className="text-sm text-odoo-text-muted">{selectedTeam.description}</p>
              )}
            </div>

            <div className="bg-odoo-bg-app p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-odoo-text-primary">Team Members</h3>
                <span className="bg-odoo-primary/20 text-odoo-primary px-3 py-1 rounded-full text-sm font-medium">
                  {selectedTeam.members.length} members
                </span>
              </div>
              
              {selectedTeam.members.length > 0 ? (
                <div className="space-y-2">
                  {selectedTeam.members.map((member) => (
                    <div key={member._id} className="flex items-center space-x-3 p-3 bg-white rounded border border-odoo-border">
                      <div className="w-10 h-10 bg-odoo-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-odoo-text-primary">{member.name}</p>
                        <p className="text-xs text-odoo-text-muted">{member.email}</p>
                      </div>
                      <span className="text-xs px-2 py-1 bg-odoo-bg-sidebar text-odoo-text-muted rounded capitalize">
                        {member.role}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-odoo-text-muted text-center py-4">
                  No members assigned yet
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-odoo-border">
              {canManage && (
                <>
                  <button
                    onClick={() => handleEditClick(selectedTeam)}
                    className="odoo-button-primary"
                  >
                    Edit Team
                  </button>
                  <button
                    onClick={() => handleDelete(selectedTeam._id, selectedTeam.name)}
                    className="px-4 py-2 bg-odoo-danger text-white rounded hover:bg-odoo-danger/90 transition-colors"
                  >
                    Delete Team
                  </button>
                </>
              )}
              <button
                onClick={() => handleInvite(selectedTeam)}
                className="odoo-button-secondary"
              >
                Invite Member
              </button>
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedTeam(null);
                }}
                className="odoo-button-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Team Modal */}
      {selectedTeam && (
        <Modal 
          isOpen={isEditModalOpen} 
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedTeam(null);
          }} 
          title="Edit Team"
        >
          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-odoo-text-primary mb-2">
                Team Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-odoo-border rounded focus:outline-none focus:ring-2 focus:ring-odoo-primary"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-odoo-text-primary mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-odoo-border rounded focus:outline-none focus:ring-2 focus:ring-odoo-primary"
                rows={2}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-odoo-text-primary mb-2">
                Team Members ({formData.members.length} selected)
              </label>
              <div className="space-y-2 max-h-64 overflow-y-auto border border-odoo-border rounded p-3">
                {users.length === 0 ? (
                  <p className="text-sm text-odoo-text-muted text-center py-4">
                    No users available
                  </p>
                ) : (
                  users.map((user) => (
                    <label 
                      key={user._id} 
                      className="flex items-center space-x-3 cursor-pointer hover:bg-odoo-bg-app p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={formData.members.includes(user._id)}
                        onChange={() => toggleMember(user._id)}
                        className="w-4 h-4 text-odoo-primary focus:ring-odoo-primary"
                        disabled={isSubmitting}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-odoo-text-primary">{user.name}</p>
                        <p className="text-xs text-odoo-text-muted capitalize">{user.role} • {user.email}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => handleDelete(selectedTeam._id, selectedTeam.name)}
                className="mr-auto px-4 py-2 bg-odoo-danger text-white rounded hover:bg-odoo-danger/90 transition-colors"
                disabled={isSubmitting}
              >
                Delete Team
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedTeam(null);
                }}
                className="odoo-button-secondary"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="odoo-button-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Updating...' : 'Update Team'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function TeamCard({ 
  team, 
  onInvite, 
  onClick,
  canManage 
}: { 
  team: MaintenanceTeam; 
  onInvite: (team: MaintenanceTeam) => void;
  onClick: (team: MaintenanceTeam) => void;
  canManage: boolean;
}) {
  return (
    <div 
      onClick={() => onClick(team)}
      className="odoo-card p-6 cursor-pointer"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-odoo-text-primary">{team.name}</h3>
        <span className="bg-odoo-primary/20 text-odoo-primary px-3 py-1 rounded-full text-sm font-medium">
          {team.members.length} members
        </span>
      </div>

      {team.description && (
        <p className="text-sm text-odoo-text-muted mb-4">{team.description}</p>
      )}

      <div className="space-y-2 mb-4">
        {team.members.slice(0, 5).map((member) => (
          <div key={member._id} className="flex items-center space-x-3 p-2 bg-odoo-bg-sidebar rounded">
            <div className="w-8 h-8 bg-odoo-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
              {member.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="text-sm text-odoo-text-primary font-medium">{member.name}</p>
              <p className="text-xs text-odoo-text-muted capitalize">{member.role}</p>
            </div>
          </div>
        ))}
        {team.members.length > 5 && (
          <p className="text-sm text-odoo-text-muted text-center">
            +{team.members.length - 5} more
          </p>
        )}
        {team.members.length === 0 && (
          <p className="text-sm text-odoo-text-muted text-center py-2">
            No members assigned
          </p>
        )}
      </div>

      {/* Invite Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onInvite(team);
        }}
        className="w-full px-4 py-2 bg-odoo-primary hover:bg-odoo-primary-hover text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <span>Invite Member</span>
      </button>
    </div>
  );
}
