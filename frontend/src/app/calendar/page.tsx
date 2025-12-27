'use client';

import { useState, useEffect } from 'react';
import { maintenanceRequestAPI, equipmentAPI } from '@/lib/api';
import type { MaintenanceRequest, Equipment } from '@/types';
import Modal from '@/components/Modal';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [formData, setFormData] = useState({
    subject: '',
    requestType: 'Preventive' as 'Preventive',
    equipment: '',
    priority: 'Normal' as 'Normal',
    scheduledDate: '',
    duration: 2,
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [equipmentRes, requestsRes] = await Promise.all([
        equipmentAPI.getAll(),
        maintenanceRequestAPI.getAll(),
      ]);
      setEquipment(equipmentRes.data);
      setRequests(requestsRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const fetchEquipment = async () => {
    try {
      const res = await equipmentAPI.getAll();
      setEquipment(res.data);
    } catch (error) {
      console.error('Error fetching equipment:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await maintenanceRequestAPI.create(formData);
      setIsModalOpen(false);
      setFormData({
        subject: '',
        requestType: 'Preventive',
        equipment: '',
        priority: 'Normal',
        scheduledDate: '',
        duration: 2,
        notes: '',
      });
      setSelectedDate('');
      alert('Maintenance scheduled successfully!');
      fetchData(); // Refresh data to show new request
    } catch (error) {
      console.error('Error scheduling maintenance:', error);
      alert('Failed to schedule maintenance');
    }
  };

  // Handle clicking on a calendar date
  const handleDateClick = (day: number) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const clickedDate = new Date(year, month, day);
    
    // Format date as YYYY-MM-DD in local timezone (avoid timezone conversion issues)
    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    setSelectedDate(formattedDate);
    setFormData({
      ...formData,
      scheduledDate: formattedDate,
    });
    setIsModalOpen(true);
  };

  // Get requests for a specific day
  const getRequestsForDay = (day: number) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    return requests.filter((request) => {
      if (!request.scheduledDate) return false;
      
      const requestDate = new Date(request.scheduledDate);
      return (
        requestDate.getDate() === day &&
        requestDate.getMonth() === month &&
        requestDate.getFullYear() === year
      );
    });
  };

  // Get upcoming requests (next 7 days)
  const getUpcomingRequests = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    return requests
      .filter((request) => {
        if (!request.scheduledDate) return false;
        const requestDate = new Date(request.scheduledDate);
        return requestDate >= today && requestDate <= nextWeek;
      })
      .sort((a, b) => {
        const dateA = new Date(a.scheduledDate!).getTime();
        const dateB = new Date(b.scheduledDate!).getTime();
        return dateA - dateB;
      });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const today = new Date();
  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-odoo-text-primary mb-2">
            Maintenance Calendar
          </h1>
          <p className="text-odoo-text-secondary">
            Click any date to schedule maintenance. Requests appear on their scheduled dates automatically.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="odoo-button-primary"
        >
          + Schedule Maintenance
        </button>
      </div>

      {/* Calendar Controls */}
      <div className="odoo-card p-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={previousMonth}
            className="odoo-button-secondary px-3 py-2"
          >
            ← Previous
          </button>
          <h2 className="text-xl font-semibold text-odoo-text-primary">{monthName}</h2>
          <button
            onClick={nextMonth}
            className="odoo-button-secondary px-3 py-2"
          >
            Next →
          </button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-odoo-text-primary font-semibold">💡</span>
            <span className="text-odoo-text-muted font-medium">Click any date to schedule</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-odoo-info/30"></div>
            <span className="text-odoo-text-muted">Preventive</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-odoo-warning/30"></div>
            <span className="text-odoo-text-muted">Corrective</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-odoo-text-muted">🔴 Urgent/High</span>
            <span className="text-odoo-text-muted">🟡 Normal</span>
            <span className="text-odoo-text-muted">🟢 Low</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Day Headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="text-center font-semibold text-odoo-text-muted py-2"
            >
              {day}
            </div>
          ))}

          {/* Empty cells for days before month starts */}
          {Array.from({ length: startingDayOfWeek }).map((_, index) => (
            <div key={`empty-${index}`} className="aspect-square" />
          ))}

          {/* Calendar Days */}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;
            const isTodayDate = isToday(day);
            const dayRequests = getRequestsForDay(day);

            return (
              <div
                key={day}
                onClick={() => handleDateClick(day)}
                className={`
                  aspect-square border border-odoo-border rounded p-2 cursor-pointer
                  hover:border-odoo-primary hover:shadow-md hover:scale-105 transition-all
                  ${isTodayDate ? 'bg-odoo-primary/10 border-odoo-primary' : 'bg-white'}
                `}
                title="Click to schedule maintenance for this date"
              >
                <div className="flex flex-col h-full">
                  <span
                    className={`
                      text-sm font-medium mb-1
                      ${isTodayDate ? 'text-odoo-primary font-bold' : 'text-odoo-text-primary'}
                    `}
                  >
                    {day}
                  </span>
                  {/* Show actual maintenance requests */}
                  {dayRequests.length > 0 && (
                    <div className="text-xs space-y-1 overflow-hidden">
                      {dayRequests.slice(0, 3).map((request) => {
                        const bgColor = request.requestType === 'Preventive' 
                          ? 'bg-odoo-info/10 text-odoo-info' 
                          : 'bg-odoo-warning/10 text-odoo-warning';
                        const priorityDot = request.priority === 'Urgent' || request.priority === 'High'
                          ? '🔴 '
                          : request.priority === 'Normal'
                          ? '🟡 '
                          : '🟢 ';
                        
                        return (
                          <div
                            key={request._id}
                            className={`${bgColor} px-1 py-0.5 rounded truncate pointer-events-none`}
                            title={`${request.subject} - ${request.priority} priority`}
                          >
                            {priorityDot}{request.subject}
                          </div>
                        );
                      })}
                      {dayRequests.length > 3 && (
                        <div className="text-odoo-text-muted text-center pointer-events-none">
                          +{dayRequests.length - 3} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Maintenance Section */}
      <div className="mt-8 odoo-card p-6">
        <h3 className="text-xl font-semibold text-odoo-text-primary mb-4">Upcoming Maintenance (Next 7 Days)</h3>
        {loading ? (
          <p className="text-odoo-text-muted">Loading...</p>
        ) : getUpcomingRequests().length === 0 ? (
          <p className="text-odoo-text-muted">No upcoming maintenance scheduled</p>
        ) : (
          <div className="space-y-3">
            {getUpcomingRequests().map((request) => {
              const requestDate = new Date(request.scheduledDate!);
              const isToday = requestDate.toDateString() === new Date().toDateString();
              const isTomorrow = requestDate.toDateString() === new Date(Date.now() + 86400000).toDateString();
              
              const dateLabel = isToday 
                ? 'Today'
                : isTomorrow
                ? 'Tomorrow'
                : requestDate.toLocaleDateString('default', { month: 'short', day: 'numeric' });
              
              const typeColor = request.requestType === 'Preventive'
                ? 'bg-odoo-info/10 text-odoo-info border-odoo-info/30'
                : 'bg-odoo-warning/10 text-odoo-warning border-odoo-warning/30';
              
              const priorityColor = request.priority === 'Urgent'
                ? 'bg-odoo-danger/10 text-odoo-danger border-odoo-danger/30'
                : request.priority === 'High'
                ? 'bg-odoo-warning/10 text-odoo-warning border-odoo-warning/30'
                : 'bg-odoo-success/10 text-odoo-success border-odoo-success/30';

              return (
                <div
                  key={request._id}
                  className="flex items-center justify-between p-3 bg-odoo-bg-app rounded hover:bg-odoo-bg-sidebar transition-colors cursor-pointer"
                >
                  <div className="flex-1">
                    <p className="font-medium text-odoo-text-primary">{request.subject}</p>
                    <p className="text-sm text-odoo-text-muted">
                      {dateLabel} • {request.equipment?.name || 'No equipment'} • {request.technician?.name || 'Unassigned'}
                    </p>
                    {request.duration > 0 && (
                      <p className="text-xs text-odoo-text-muted mt-1">
                        Duration: {request.duration} hour{request.duration !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <span className={`odoo-badge ${priorityColor}`}>
                      {request.priority}
                    </span>
                    <span className={`odoo-badge ${typeColor}`}>
                      {request.requestType}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Schedule Maintenance Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setSelectedDate('');
        }} 
        title={selectedDate ? `Schedule Maintenance for ${new Date(selectedDate).toLocaleDateString('default', { month: 'long', day: 'numeric', year: 'numeric' })}` : "Schedule Maintenance"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {selectedDate && (
            <div className="bg-odoo-info/10 border border-odoo-info/30 rounded p-3 text-sm text-odoo-info">
              📅 Creating maintenance for: <strong>{new Date(selectedDate).toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</strong>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-odoo-text-primary mb-2">
              Subject *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Routine PM Check, Oil Change, Inspection"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-4 py-2 border border-odoo-border rounded focus:outline-none focus:ring-2 focus:ring-odoo-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-odoo-text-primary mb-2">
              Equipment *
            </label>
            <select
              required
              value={formData.equipment}
              onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
              className="w-full px-4 py-2 border border-odoo-border rounded focus:outline-none focus:ring-2 focus:ring-odoo-primary"
            >
              <option value="">Select Equipment</option>
              {equipment.map((eq) => (
                <option key={eq._id} value={eq._id}>{eq.name} - {eq.serialNumber}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-odoo-text-primary mb-2">
              Scheduled Date *
            </label>
            <input
              type="date"
              required
              value={formData.scheduledDate}
              onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
              className="w-full px-4 py-2 border border-odoo-border rounded focus:outline-none focus:ring-2 focus:ring-odoo-primary"
            />
            <p className="text-xs text-odoo-text-muted mt-1">
              {selectedDate 
                ? "Date pre-filled from calendar click. You can change it if needed." 
                : "This maintenance will appear in the calendar on this date"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-odoo-text-primary mb-2">
              Duration (hours) *
            </label>
            <input
              type="number"
              min="1"
              required
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-odoo-border rounded focus:outline-none focus:ring-2 focus:ring-odoo-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-odoo-text-primary mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-odoo-border rounded focus:outline-none focus:ring-2 focus:ring-odoo-primary"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="odoo-button-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="odoo-button-primary">
              Schedule
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
