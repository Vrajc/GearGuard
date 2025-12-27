'use client';

import { useEffect, useState } from 'react';
import { dashboardAPI, maintenanceRequestAPI } from '@/lib/api';
import type { DashboardStats, MaintenanceRequest } from '@/types';
import ProtectedRoute from '@/components/ProtectedRoute';

function DashboardContent() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentRequests, setRecentRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, requestsRes] = await Promise.all([
        dashboardAPI.getStats(),
        maintenanceRequestAPI.getAll(),
      ]);
      setStats(statsRes.data);
      setRecentRequests(requestsRes.data.slice(0, 5)); // Get 5 most recent
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-odoo-text-muted">Loading dashboard...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-odoo-text-muted">Unable to load dashboard data</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-odoo-text-primary mb-2">
          Dashboard
        </h1>
        <p className="text-lg text-odoo-text-secondary">Welcome to GearGuard Maintenance Tracker</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <KPICard
          title="Total Equipment"
          value={stats.totalEquipment}
          iconPath="/icons/wrench.svg"
          color="teal"
        />
        <KPICard
          title="Active Requests"
          value={stats.activeRequests}
          iconPath="/icons/clipboard.svg"
          color="yellow"
        />
        <KPICard
          title="Avg. Equipment Health"
          value={`${stats.avgHealthPercentage}%`}
          iconPath="/icons/heart.svg"
          color="pink"
        />
        <KPICard
          title="Upcoming Maintenance"
          value={stats.upcomingMaintenance}
          iconPath="/icons/calendar.svg"
          color="yellow"
        />
        <KPICard
          title="Total Technicians"
          value={stats.totalTechnicians}
          iconPath="/icons/team.svg"
          color="purple"
        />
        <KPICard
          title="Completed This Month"
          value={stats.completedThisMonth}
          iconPath="/icons/star.svg"
          color="green"
        />
      </div>

      {/* Recent Maintenance Requests */}
      <div className="odoo-card p-6">
        <h2 className="text-2xl md:text-3xl font-semibold text-odoo-text-primary mb-4">
          Recent Maintenance Requests
        </h2>
        <div className="space-y-3">
          {recentRequests.length > 0 ? (
            recentRequests.map((request) => (
              <RequestCard key={request._id} request={request} />
            ))
          ) : (
            <p className="text-center text-odoo-text-muted py-8">No maintenance requests yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function KPICard({ 
  title, 
  value, 
  iconPath, 
  color 
}: { 
  title: string; 
  value: string | number; 
  iconPath: string; 
  color: 'teal' | 'yellow' | 'pink' | 'purple' | 'green';
}) {
  return (
    <div className="odoo-card p-6 hover:scale-105 transition-transform duration-300">
      <div className="flex items-center justify-between mb-4">
        <img src={iconPath} alt={title} className="w-12 h-12" />
      </div>
      <h3 className="text-2xl font-bold text-odoo-text-primary mb-1 relative">
        <span className="relative z-10">{value}</span>
      </h3>
      <p className="text-sm text-odoo-text-muted">{title}</p>
    </div>
  );
}

function RequestCard({ request }: { request: MaintenanceRequest }) {
  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      Low: 'bg-odoo-text-muted/20 text-odoo-text-muted',
      Normal: 'bg-odoo-info/10 text-odoo-info',
      High: 'bg-odoo-warning/10 text-odoo-warning',
      Urgent: 'bg-odoo-danger/10 text-odoo-danger',
    };
    return colors[priority] || colors.Normal;
  };

  return (
    <div className="flex items-center justify-between p-4 bg-odoo-bg-app rounded hover:bg-odoo-bg-sidebar transition-colors cursor-pointer">
      <div className="flex-1">
        <h4 className="font-medium text-odoo-text-primary">{request.subject}</h4>
        <p className="text-sm text-odoo-text-muted">
          {request.equipment && typeof request.equipment === 'object' ? request.equipment.name : 'No equipment'}
        </p>
      </div>
      <div className="flex items-center space-x-3">
        <span className={`odoo-badge ${getPriorityColor(request.priority)}`}>
          {request.priority}
        </span>
        <span className="text-sm text-odoo-text-muted">
          {request.technician?.name || 'Unassigned'}
        </span>
      </div>
    </div>
  );
}
