'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { notificationAPI, invitationAPI } from '@/lib/api';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationFilter, setNotificationFilter] = useState<'all' | 'unread'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { user, logout } = useAuth();
  const router = useRouter();
  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchUnreadCount();
      
      // Poll for new notifications every 30 seconds
      const interval = setInterval(() => {
        fetchUnreadCount();
        if (isNotificationOpen) {
          fetchNotifications();
        }
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user, notificationFilter, isNotificationOpen]);

  const fetchNotifications = async () => {
    try {
      const response = await notificationAPI.getAll(notificationFilter === 'unread');
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationAPI.getUnreadCount();
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleNotificationClick = async (notification: any) => {
    try {
      if (!notification.isRead) {
        await notificationAPI.markAsRead(notification._id);
        await fetchUnreadCount();
      }
      
      // Navigate to action URL if available
      if (notification.actionUrl) {
        router.push(notification.actionUrl);
        setIsNotificationOpen(false);
      }
      
      // Refresh notifications
      await fetchNotifications();
    } catch (error) {
      console.error('Error handling notification:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      await fetchNotifications();
      await fetchUnreadCount();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDeleteNotification = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    try {
      setDeletingId(notificationId);
      await notificationAPI.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      await fetchUnreadCount();
    } catch (error) {
      console.error('Error deleting notification:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearRead = async () => {
    try {
      await notificationAPI.clearRead();
      await fetchNotifications();
      await fetchUnreadCount();
    } catch (error) {
      console.error('Error clearing read notifications:', error);
    }
  };

  const handleMarkAsRead = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    try {
      await notificationAPI.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => (n._id === notificationId ? { ...n, isRead: true } : n))
      );
      await fetchUnreadCount();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, string> = {
      team_invitation: '👥',
      invitation_accepted: '✅',
      invitation_rejected: '❌',
      maintenance_assigned: '🔧',
      maintenance_completed: '✔️',
      maintenance_updated: '🔄',
      equipment_alert: '⚠️',
      equipment_created: '➕',
      equipment_updated: '📝',
      user_role_changed: '👤',
      work_center_assigned: '🏭',
      system: '🔔',
    };
    return icons[type] || '📢';
  };

  const formatTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  // Don't show header if user is not authenticated
  if (!user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const getUserInitial = () => {
    return user?.name?.charAt(0).toUpperCase() || 'U';
  };

  return (
    <header className="bg-white border-b border-odoo-border sticky top-0 z-50 shadow-sm">
      <nav className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-odoo-primary rounded flex items-center justify-center">
                <span className="text-white font-bold text-lg">G</span>
              </div>
              <span className="text-xl font-semibold text-odoo-text-primary">GearGuard</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <NavLink href="/dashboard">Dashboard</NavLink>
            <NavLink href="/requests">Requests</NavLink>
            <NavLink href="/equipment">Equipment</NavLink>
            <NavLink href="/teams">Teams</NavLink>
            <NavLink href="/calendar">Calendar</NavLink>
            <NavLink href="/reports">Reports</NavLink>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* Notification Bell */}
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => {
                  setIsNotificationOpen(!isNotificationOpen);
                  if (!isNotificationOpen) {
                    fetchNotifications();
                  }
                }}
                className="text-odoo-text-muted hover:text-odoo-primary transition-colors relative"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-odoo-danger text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {isNotificationOpen && (
                <div className="absolute right-0 mt-2 w-[28rem] bg-white rounded-lg shadow-lg border border-odoo-border max-h-[36rem] overflow-hidden flex flex-col">
                  {/* Header with filters */}
                  <div className="px-4 py-3 border-b border-odoo-border">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-semibold text-odoo-text-primary">Notifications</p>
                      <button
                        onClick={() => setIsNotificationOpen(false)}
                        className="text-odoo-text-muted hover:text-odoo-text-primary"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    {/* Filter tabs */}
                    <div className="flex gap-2 mb-3">
                      <button
                        onClick={() => setNotificationFilter('all')}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                          notificationFilter === 'all'
                            ? 'bg-odoo-primary text-white'
                            : 'bg-gray-100 text-odoo-text-secondary hover:bg-gray-200'
                        }`}
                      >
                        All ({notifications.length})
                      </button>
                      <button
                        onClick={() => setNotificationFilter('unread')}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                          notificationFilter === 'unread'
                            ? 'bg-odoo-primary text-white'
                            : 'bg-gray-100 text-odoo-text-secondary hover:bg-gray-200'
                        }`}
                      >
                        Unread ({unreadCount})
                      </button>
                    </div>

                    {/* Action buttons */}
                    {unreadCount > 0 && (
                      <div className="flex gap-2">
                        <button
                          onClick={handleMarkAllRead}
                          className="w-full px-3 py-1.5 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 transition-colors"
                        >
                          Mark All Read
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Notifications list */}
                  <div className="overflow-y-auto flex-1">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-odoo-text-muted">
                        <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <p className="text-sm">
                          {notificationFilter === 'unread' ? "You're all caught up!" : 'No notifications yet'}
                        </p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif._id}
                          className={`px-4 py-3 hover:bg-odoo-bg-app transition-colors border-b border-odoo-border group ${
                            !notif.isRead ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Icon */}
                            <span className="text-2xl flex-shrink-0">{getNotificationIcon(notif.type)}</span>
                            
                            {/* Content */}
                            <div 
                              className="flex-1 min-w-0 cursor-pointer"
                              onClick={() => handleNotificationClick(notif)}
                            >
                              <p className={`text-sm font-medium ${!notif.isRead ? 'text-odoo-primary' : 'text-odoo-text-primary'}`}>
                                {notif.title}
                              </p>
                              <p className="text-xs text-odoo-text-muted mt-1 line-clamp-2">{notif.message}</p>
                              <p className="text-xs text-odoo-text-muted mt-1">{formatTimeAgo(notif.createdAt)}</p>
                            </div>

                            {/* Action buttons */}
                            <div className="flex gap-1 flex-shrink-0">
                              {!notif.isRead && (
                                <button
                                  onClick={(e) => handleMarkAsRead(e, notif._id)}
                                  className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                                  title="Mark as read"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </button>
                              )}
                              <button
                                onClick={(e) => handleDeleteNotification(e, notif._id)}
                                disabled={deletingId === notif._id}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                                title="Delete"
                              >
                                {deletingId === notif._id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* User Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button 
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 text-odoo-text-primary hover:text-odoo-primary transition-colors"
              >
                <div className="w-8 h-8 bg-odoo-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {getUserInitial()}
                </div>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-odoo-border py-1">
                  <div className="px-4 py-2 border-b border-odoo-border">
                    <p className="text-sm font-medium text-odoo-text-primary">{user?.name}</p>
                    <p className="text-xs text-odoo-text-muted">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-odoo-text-secondary hover:bg-odoo-bg-app transition-colors"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <button 
            className="md:hidden text-odoo-text-primary"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-odoo-border">
            <div className="flex flex-col space-y-2">
              <NavLink href="/dashboard" mobile>Dashboard</NavLink>
              <NavLink href="/requests" mobile>Requests</NavLink>
              <NavLink href="/equipment" mobile>Equipment</NavLink>
              <NavLink href="/teams" mobile>Teams</NavLink>
              <NavLink href="/calendar" mobile>Calendar</NavLink>
              <NavLink href="/reports" mobile>Reports</NavLink>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

function NavLink({ href, children, mobile = false }: { href: string; children: React.ReactNode; mobile?: boolean }) {
  const baseClasses = "transition-colors duration-200";
  const desktopClasses = "px-3 py-2 rounded text-sm font-medium text-odoo-text-secondary hover:text-odoo-primary hover:bg-odoo-bg-app";
  const mobileClasses = "px-4 py-2 text-base text-odoo-text-secondary hover:text-odoo-primary hover:bg-odoo-bg-app rounded";
  
  return (
    <Link 
      href={href} 
      className={`${baseClasses} ${mobile ? mobileClasses : desktopClasses}`}
    >
      {children}
    </Link>
  );
}
