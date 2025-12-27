'use client';

import { useEffect, useState } from 'react';
import { maintenanceRequestAPI } from '@/lib/api';
import type { MaintenanceRequest } from '@/types';

interface ReportStats {
  byTeam: { name: string; count: number; percentage: number }[];
  byCategory: { name: string; count: number; percentage: number }[];
  byStage: { name: string; count: number; percentage: number }[];
  byPriority: { name: string; count: number; percentage: number }[];
  byType: { name: string; count: number; percentage: number }[];
  totalRequests: number;
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ReportStats>({
    byTeam: [],
    byCategory: [],
    byStage: [],
    byPriority: [],
    byType: [],
    totalRequests: 0,
  });
  const [activeView, setActiveView] = useState<'team' | 'category' | 'stage' | 'priority' | 'type'>('team');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await maintenanceRequestAPI.getAll();
      const requests: MaintenanceRequest[] = response.data;
      
      // Calculate stats
      const teamStats = calculateStats(requests, 'maintenanceTeam');
      const categoryStats = calculateStats(requests, 'category');
      const stageStats = calculateStats(requests, 'stage');
      const priorityStats = calculateStats(requests, 'priority');
      const typeStats = calculateStats(requests, 'requestType');

      setStats({
        byTeam: teamStats,
        byCategory: categoryStats,
        byStage: stageStats,
        byPriority: priorityStats,
        byType: typeStats,
        totalRequests: requests.length,
      });
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (requests: MaintenanceRequest[], field: string) => {
    const counts: { [key: string]: number } = {};
    const total = requests.length;

    requests.forEach((req: any) => {
      let value = req[field];
      
      if (typeof value === 'object' && value !== null) {
        value = value.name || 'Unassigned';
      } else if (!value) {
        value = 'Unassigned';
      }

      counts[value] = (counts[value] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  };

  const getMaxCount = (data: { count: number }[]) => {
    return Math.max(...data.map(d => d.count), 1);
  };

  const getColorForIndex = (index: number) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-red-500',
      'bg-orange-500',
    ];
    return colors[index % colors.length];
  };

  const getCurrentData = () => {
    switch (activeView) {
      case 'team': return stats.byTeam;
      case 'category': return stats.byCategory;
      case 'stage': return stats.byStage;
      case 'priority': return stats.byPriority;
      case 'type': return stats.byType;
      default: return [];
    }
  };

  const getViewTitle = () => {
    switch (activeView) {
      case 'team': return 'Requests per Maintenance Team';
      case 'category': return 'Requests per Equipment Category';
      case 'stage': return 'Requests by Stage';
      case 'priority': return 'Requests by Priority';
      case 'type': return 'Requests by Type';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-odoo-text-muted">Loading reports...</div>
      </div>
    );
  }

  const currentData = getCurrentData();
  const maxCount = getMaxCount(currentData);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-odoo-text mb-2">
          Analytics & Reports
        </h1>
        <p className="text-odoo-text-muted">
          Visual insights into maintenance request distribution
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Total Requests</h3>
            <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-4xl font-bold">{stats.totalRequests}</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Teams</h3>
            <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <p className="text-4xl font-bold">{stats.byTeam.length}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Categories</h3>
            <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
          <p className="text-4xl font-bold">{stats.byCategory.length}</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Avg per Team</h3>
            <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-4xl font-bold">
            {stats.byTeam.length > 0 ? Math.round(stats.totalRequests / stats.byTeam.length) : 0}
          </p>
        </div>
      </div>

      {/* View Selector */}
      <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveView('team')}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
            activeView === 'team'
              ? 'bg-odoo-primary text-white'
              : 'bg-odoo-bg-sidebar text-odoo-text-muted hover:bg-odoo-bg-app'
          }`}
        >
          📊 By Team
        </button>
        <button
          onClick={() => setActiveView('category')}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
            activeView === 'category'
              ? 'bg-odoo-primary text-white'
              : 'bg-odoo-bg-sidebar text-odoo-text-muted hover:bg-odoo-bg-app'
          }`}
        >
          📈 By Category
        </button>
        <button
          onClick={() => setActiveView('stage')}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
            activeView === 'stage'
              ? 'bg-odoo-primary text-white'
              : 'bg-odoo-bg-sidebar text-odoo-text-muted hover:bg-odoo-bg-app'
          }`}
        >
          📉 By Stage
        </button>
        <button
          onClick={() => setActiveView('priority')}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
            activeView === 'priority'
              ? 'bg-odoo-primary text-white'
              : 'bg-odoo-bg-sidebar text-odoo-text-muted hover:bg-odoo-bg-app'
          }`}
        >
          🎯 By Priority
        </button>
        <button
          onClick={() => setActiveView('type')}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
            activeView === 'type'
              ? 'bg-odoo-primary text-white'
              : 'bg-odoo-bg-sidebar text-odoo-text-muted hover:bg-odoo-bg-app'
          }`}
        >
          🔧 By Type
        </button>
      </div>

      {/* Chart Container */}
      <div className="odoo-card p-6">
        <h2 className="text-xl font-bold text-odoo-text-primary mb-6">{getViewTitle()}</h2>

        {currentData.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-odoo-text-muted">No data available for this view</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Bar Chart */}
            <div className="space-y-3">
              {currentData.map((item, index) => (
                <div key={item.name} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded ${getColorForIndex(index)}`}></div>
                      <span className="text-sm font-medium text-odoo-text-primary">
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-odoo-text-muted">{item.percentage}%</span>
                      <span className="text-lg font-bold text-odoo-text-primary min-w-[3rem] text-right">
                        {item.count}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-3 rounded-full ${getColorForIndex(index)} transition-all duration-500`}
                      style={{ width: `${(item.count / maxCount) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pivot Table */}
            <div className="mt-8 border-t pt-6">
              <h3 className="text-lg font-semibold text-odoo-text-primary mb-4">Detailed Breakdown</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-odoo-bg-app">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-odoo-text-primary">
                        {activeView === 'team' ? 'Team Name' : 
                         activeView === 'category' ? 'Category' :
                         activeView === 'stage' ? 'Stage' :
                         activeView === 'priority' ? 'Priority' : 'Type'}
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-odoo-text-primary">
                        Count
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-odoo-text-primary">
                        Percentage
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-odoo-text-primary">
                        Visual
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-odoo-border">
                    {currentData.map((item, index) => (
                      <tr key={item.name} className="hover:bg-odoo-bg-app transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-odoo-text-primary">
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded ${getColorForIndex(index)}`}></div>
                            <span>{item.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-lg font-bold text-odoo-text-primary">
                          {item.count}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-odoo-text-muted">
                          {item.percentage}%
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${getColorForIndex(index)}`}
                                style={{ width: `${item.percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-odoo-bg-app font-semibold">
                    <tr>
                      <td className="px-4 py-3 text-sm text-odoo-text-primary">Total</td>
                      <td className="px-4 py-3 text-center text-lg text-odoo-text-primary">
                        {stats.totalRequests}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-odoo-text-primary">100%</td>
                      <td className="px-4 py-3"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
