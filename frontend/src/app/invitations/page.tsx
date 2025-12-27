'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { invitationAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Invitation {
  _id: string;
  sender: { name: string; email: string };
  teamName: string;
  role: string;
  message: string;
  createdAt: string;
  expiresAt: string;
  status: string;
}

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchInvitations();
    }
  }, [user]);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching invitations...');
      const response = await invitationAPI.getMyInvitations();
      console.log('✅ Invitations response:', response.data);
      console.log('📊 Number of invitations:', response.data.length);
      setInvitations(response.data);
    } catch (error) {
      console.error('❌ Error fetching invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (invitationId: string) => {
    try {
      setActionLoading(invitationId);
      await invitationAPI.acceptInvitation(invitationId);
      
      // Show success message
      alert('Invitation accepted! You are now a member of the team.');
      
      // Refresh invitations
      await fetchInvitations();
      
      // Dispatch event to update teams page
      window.dispatchEvent(new Event('teamUpdated'));
      
      // Redirect to teams page
      router.push('/teams');
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      alert(error.response?.data?.message || 'Failed to accept invitation');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (invitationId: string) => {
    if (!confirm('Are you sure you want to reject this invitation?')) {
      return;
    }

    try {
      setActionLoading(invitationId);
      await invitationAPI.rejectInvitation(invitationId);
      
      // Show success message
      alert('Invitation rejected');
      
      // Refresh invitations
      await fetchInvitations();
    } catch (error: any) {
      console.error('Error rejecting invitation:', error);
      alert(error.response?.data?.message || 'Failed to reject invitation');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDaysRemaining = (expiresAt: string) => {
    const days = Math.ceil((new Date(expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-odoo-bg-app flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-odoo-primary mx-auto"></div>
          <p className="mt-4 text-odoo-text-muted">Loading invitations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-odoo-bg-app py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm border border-odoo-border">
          <div className="border-b border-odoo-border bg-gray-50 px-6 py-4">
            <h1 className="text-4xl md:text-5xl font-semibold text-odoo-text-primary">
              Team Invitations
            </h1>
            <p className="text-sm text-odoo-text-muted mt-1">
              Manage your pending team invitations
            </p>
          </div>

          <div className="p-6">
            {invitations.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <h3 className="text-lg font-medium text-odoo-text-primary mb-2">No pending invitations</h3>
                <p className="text-odoo-text-muted">You don't have any pending team invitations at the moment.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {invitations.map((invitation) => {
                  const daysRemaining = getDaysRemaining(invitation.expiresAt);
                  
                  return (
                    <div
                      key={invitation._id}
                      className="border border-odoo-border rounded-lg p-5 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-2xl">👥</span>
                            <h3 className="text-lg font-semibold text-odoo-text-primary">
                              {invitation.teamName}
                            </h3>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <p className="text-odoo-text-muted">
                              <span className="font-medium">From:</span> {invitation.sender.name} ({invitation.sender.email})
                            </p>
                            <p className="text-odoo-text-muted">
                              <span className="font-medium">Role:</span> {invitation.role}
                            </p>
                            {invitation.message && (
                              <p className="text-odoo-text-muted">
                                <span className="font-medium">Message:</span> {invitation.message}
                              </p>
                            )}
                            <p className="text-odoo-text-muted">
                              <span className="font-medium">Sent:</span> {formatDate(invitation.createdAt)}
                            </p>
                            <p className={`text-sm ${daysRemaining <= 2 ? 'text-odoo-danger' : 'text-odoo-text-muted'}`}>
                              <span className="font-medium">Expires:</span> {daysRemaining > 0 ? `in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}` : 'Today'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-3 mt-4 pt-4 border-t border-odoo-border">
                        <button
                          onClick={() => handleAccept(invitation._id)}
                          disabled={actionLoading === invitation._id}
                          className="flex-1 px-4 py-2 bg-odoo-primary text-white rounded-md hover:bg-odoo-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading === invitation._id ? 'Processing...' : 'Accept Invitation'}
                        </button>
                        <button
                          onClick={() => handleReject(invitation._id)}
                          disabled={actionLoading === invitation._id}
                          className="flex-1 px-4 py-2 border border-odoo-border text-odoo-text-muted rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
