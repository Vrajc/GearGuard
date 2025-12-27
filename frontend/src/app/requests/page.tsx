'use client';

import { useEffect, useState } from 'react';
import { maintenanceRequestAPI, equipmentAPI } from '@/lib/api';
import type { MaintenanceRequest, Equipment } from '@/types';
import Modal from '@/components/Modal';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function RequestsPage() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [originalStage, setOriginalStage] = useState<MaintenanceRequest['stage'] | null>(null);
  const [formData, setFormData] = useState({
    subject: '',
    requestType: 'Corrective' as 'Corrective' | 'Preventive',
    equipment: '',
    priority: 'Normal' as 'Low' | 'Normal' | 'High' | 'Urgent',
    scheduledDate: '',
    duration: 1,
    notes: '',
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [requestsRes, equipmentRes] = await Promise.all([
        maintenanceRequestAPI.getAll(),
        equipmentAPI.getAll(),
      ]);
      setRequests(requestsRes.data);
      setEquipment(equipmentRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await maintenanceRequestAPI.create(formData);
      setIsModalOpen(false);
      setFormData({
        subject: '',
        requestType: 'Corrective',
        equipment: '',
        priority: 'Normal',
        scheduledDate: '',
        duration: 1,
        notes: '',
      });
      fetchData();
    } catch (error) {
      console.error('Error creating request:', error);
      alert('Failed to create request');
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const draggedRequest = requests.find((r) => r._id === event.active.id);
    if (draggedRequest) {
      setOriginalStage(draggedRequest.stage);
      console.log('🎯 Drag started:', {
        requestId: event.active.id,
        subject: draggedRequest.subject,
        originalStage: draggedRequest.stage,
      });
    }
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the active request
    const activeRequest = requests.find((r) => r._id === activeId);
    if (!activeRequest) return;

    // Check if we're over a stage column
    if (stages.includes(overId)) {
      // Update the stage immediately for smooth UX
      setRequests((prevRequests) =>
        prevRequests.map((r) =>
          r._id === activeId ? { ...r, stage: overId as MaintenanceRequest['stage'] } : r
        )
      );
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    const draggedId = active.id as string;
    
    setActiveId(null);

    if (!over) {
      setOriginalStage(null);
      return;
    }

    const overId = over.id as string;
    const activeRequest = requests.find((r) => r._id === draggedId);
    
    if (!activeRequest || !originalStage) {
      setOriginalStage(null);
      return;
    }

    // Determine the new stage
    let newStage: MaintenanceRequest['stage'] = activeRequest.stage;
    if (stages.includes(overId)) {
      newStage = overId as MaintenanceRequest['stage'];
    } else {
      // If dropped on a card, use that card's stage
      const overRequest = requests.find((r) => r._id === overId);
      if (overRequest) {
        newStage = overRequest.stage;
      }
    }

    console.log('📍 Drag ended:', {
      requestId: draggedId,
      subject: activeRequest.subject,
      originalStage: originalStage,
      newStage: newStage,
      stageChanged: newStage !== originalStage,
    });

    // Compare with the ORIGINAL stage, not the current one
    if (newStage !== originalStage) {
      console.log('🔄 Updating request stage:', {
        requestId: draggedId,
        requestSubject: activeRequest.subject,
        oldStage: originalStage,
        newStage: newStage,
      });
      
      try {
        const updateData: any = { stage: newStage };
        
        // Enhanced Scrap Logic - Problem Statement Requirement
        if (newStage === 'Scrap' && activeRequest.equipment) {
          const equipmentName = typeof activeRequest.equipment === 'object' 
            ? activeRequest.equipment.name 
            : 'this equipment';
          
          const confirmScrap = window.confirm(
            `⚠️ SCRAP EQUIPMENT WARNING ⚠️\n\n` +
            `Equipment: "${equipmentName}"\n\n` +
            `This action will:\n` +
            `✓ Mark the equipment as SCRAPPED\n` +
            `✓ Set equipment as unusable (isScrap flag)\n` +
            `✓ Record scrap date in the system\n` +
            `✓ Set health to 0%\n` +
            `✓ Remove from active equipment tracking\n\n` +
            `This change is permanent. Continue?`
          );
          
          if (!confirmScrap) {
            console.log('❌ Scrap cancelled by user');
            // Revert the optimistic update
            await fetchData();
            setOriginalStage(null);
            return;
          }
          
          // Update equipment to scrapped status
          const equipmentId = typeof activeRequest.equipment === 'object' 
            ? activeRequest.equipment._id 
            : activeRequest.equipment;
          
          try {
            await equipmentAPI.update(equipmentId, {
              status: 'Scrapped',
              isScrap: true,
              scrapDate: new Date().toISOString(),
              healthPercentage: 0,
            });
            console.log('✅ Equipment marked as scrapped:', equipmentId);
            
            updateData.completedDate = new Date().toISOString();
            updateData.notes = (updateData.notes || '') + `\n[AUTO] Equipment scrapped on ${new Date().toLocaleString()}`;
            
            alert(
              `✅ EQUIPMENT SCRAPPED\n\n` +
              `"${equipmentName}" has been marked as SCRAPPED.\n\n` +
              `The equipment is now:\n` +
              `• Flagged as unusable (isScrap: true)\n` +
              `• Removed from active tracking\n` +
              `• Health set to 0%\n` +
              `• Scrap date recorded\n\n` +
              `You can view it in the Equipment page under "Scrapped" filter.`
            );
          } catch (equipError) {
            console.error('❌ Error updating equipment:', equipError);
            alert('Failed to update equipment status. The request will still be moved to Scrap.');
          }
        }
        
        // Set completion date for Repaired stage
        if (newStage === 'Repaired' && !updateData.completedDate) {
          updateData.completedDate = new Date().toISOString();
        }
        
        // Update in backend
        const response = await maintenanceRequestAPI.update(draggedId, updateData);
        console.log('✅ Backend update successful:', response.data);
        
        // Refresh data to ensure consistency
        await fetchData();
        console.log('✅ Data refreshed after update');
      } catch (error: any) {
        console.error('❌ Error updating request stage:', error);
        console.error('Error details:', error.response?.data);
        alert(`Failed to update request stage: ${error.response?.data?.message || error.message}`);
        // Revert the optimistic update
        fetchData();
      }
    } else {
      console.log('ℹ️ No stage change detected, skipping update');
    }
    
    setOriginalStage(null);
  };

  const stages = ['New', 'In Progress', 'Repaired', 'Scrap'];

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
          <h1 className="text-4xl md:text-5xl font-bold text-odoo-text-primary mb-2">
            Maintenance Requests
          </h1>
          <p className="text-odoo-text-secondary">{requests.length} total requests</p>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={() => setView('kanban')}
            className={`odoo-button ${view === 'kanban' ? 'odoo-button-primary' : 'odoo-button-secondary'}`}
          >
            Kanban
          </button>
          <button
            onClick={() => setView('list')}
            className={`odoo-button ${view === 'list' ? 'odoo-button-primary' : 'odoo-button-secondary'}`}
          >
            List
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="odoo-button-primary"
          >
            + New Request
          </button>
        </div>
      </div>

      {/* Kanban View */}
      {view === 'kanban' && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stages.map((stage) => (
              <KanbanColumn
                key={stage}
                title={stage}
                id={stage}
                requests={requests.filter((r) => r.stage === stage)}
              />
            ))}
          </div>
          <DragOverlay>
            {activeId ? (
              <RequestCard
                request={requests.find((r) => r._id === activeId)!}
                isDragging
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="odoo-card p-6">
          <table className="w-full">
            <thead>
              <tr className="border-b border-odoo-border">
                <th className="text-left py-3 px-4 text-odoo-text-muted text-sm font-medium">Subject</th>
                <th className="text-left py-3 px-4 text-odoo-text-muted text-sm font-medium">Equipment</th>
                <th className="text-left py-3 px-4 text-odoo-text-muted text-sm font-medium">Type</th>
                <th className="text-left py-3 px-4 text-odoo-text-muted text-sm font-medium">Priority</th>
                <th className="text-left py-3 px-4 text-odoo-text-muted text-sm font-medium">Stage</th>
                <th className="text-left py-3 px-4 text-odoo-text-muted text-sm font-medium">Technician</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request._id} className="border-b border-odoo-border hover:bg-odoo-bg-app transition-colors">
                  <td className="py-3 px-4 text-odoo-text-primary font-medium">{request.subject}</td>
                  <td className="py-3 px-4 text-odoo-text-muted">
                    {typeof request.equipment === 'object' ? request.equipment.name : '-'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`odoo-badge ${request.requestType === 'Preventive' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}`}>
                      {request.requestType}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`odoo-badge ${getPriorityColor(request.priority)}`}>
                      {request.priority}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`odoo-badge ${getStageColor(request.stage)}`}>
                      {request.stage}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-odoo-text-muted">
                    {request.technician?.name || 'Unassigned'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Request Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Maintenance Request">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-odoo-text-primary mb-2">
              Subject (What is wrong?) *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Leaking Oil, Machine Not Starting, Strange Noise"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-4 py-2 border border-odoo-border rounded focus:outline-none focus:ring-2 focus:ring-odoo-primary"
            />
            <p className="text-xs text-odoo-text-muted mt-1">
              Briefly describe the issue or maintenance needed
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-odoo-text-primary mb-2">
              Request Type *
            </label>
            <select
              required
              value={formData.requestType}
              onChange={(e) => setFormData({ ...formData, requestType: e.target.value as any })}
              className="w-full px-4 py-2 border border-odoo-border rounded focus:outline-none focus:ring-2 focus:ring-odoo-primary"
            >
              <option value="Corrective">Corrective (Unplanned Repair/Breakdown)</option>
              <option value="Preventive">Preventive (Planned/Routine Checkup)</option>
            </select>
            <p className="text-xs text-odoo-text-muted mt-1">
              Choose Corrective for breakdowns, Preventive for scheduled maintenance
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-odoo-text-primary mb-2">
              Equipment (Which machine is affected?) *
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
            <p className="text-xs text-odoo-text-muted mt-1">
              Select the equipment that requires maintenance
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-odoo-text-primary mb-2">
              Priority *
            </label>
            <select
              required
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
              className="w-full px-4 py-2 border border-odoo-border rounded focus:outline-none focus:ring-2 focus:ring-odoo-primary"
            >
              <option value="Low">Low</option>
              <option value="Normal">Normal</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-odoo-text-primary mb-2">
              Scheduled Date (When should work happen?) *
            </label>
            <input
              type="date"
              required
              value={formData.scheduledDate}
              onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
              className="w-full px-4 py-2 border border-odoo-border rounded focus:outline-none focus:ring-2 focus:ring-odoo-primary"
            />
            <p className="text-xs text-odoo-text-muted mt-1">
              This request will appear on the Calendar View on this date
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-odoo-text-primary mb-2">
              Duration (How long did/will repair take?) *
            </label>
            <input
              type="number"
              min="1"
              required
              placeholder="in hours"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-odoo-border rounded focus:outline-none focus:ring-2 focus:ring-odoo-primary"
            />
            <p className="text-xs text-odoo-text-muted mt-1">
              Estimated or actual duration in hours
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-odoo-text-primary mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Additional details, observations, or special instructions..."
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
              Create Request
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function KanbanColumn({ title, id, requests }: { title: string; id: string; requests: MaintenanceRequest[] }) {
  const { setNodeRef } = useSortable({
    id: id,
    data: {
      type: 'column',
      stage: id,
    },
  });

  return (
    <div ref={setNodeRef} className="odoo-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-odoo-text-primary">{title}</h3>
        <span className="text-sm text-odoo-text-muted bg-odoo-bg-app px-2 py-1 rounded">
          {requests.length}
        </span>
      </div>
      <SortableContext items={requests.map((r) => r._id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3 min-h-[200px]">
          {requests.map((request) => (
            <RequestCard key={request._id} request={request} />
          ))}
          {requests.length === 0 && (
            <p className="text-center text-odoo-text-muted py-8">No requests</p>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

function RequestCard({ request, isDragging = false }: { request: MaintenanceRequest; isDragging?: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: request._id,
    data: {
      type: 'request',
      request,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white p-4 rounded border border-odoo-border hover:border-odoo-primary transition-colors cursor-grab active:cursor-grabbing shadow-sm ${
        isDragging ? 'shadow-lg ring-2 ring-odoo-primary' : ''
      }`}
    >
      <h4 className="text-odoo-text-primary font-medium mb-2">{request.subject}</h4>
      <div className="flex items-center space-x-2 mb-2">
        <span className={`odoo-badge ${request.requestType === 'Preventive' ? 'bg-odoo-info/10 text-odoo-info' : 'bg-odoo-warning/10 text-odoo-warning'}`}>
          {request.requestType}
        </span>
        <span className={`odoo-badge ${getPriorityColor(request.priority)}`}>
          {request.priority}
        </span>
      </div>
      {request.technician && (
        <p className="text-sm text-odoo-text-muted">
          👤 {request.technician.name}
        </p>
      )}
    </div>
  );
}

function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    Low: 'bg-odoo-text-muted/20 text-odoo-text-muted border border-odoo-text-muted/30',
    Normal: 'bg-odoo-info/10 text-odoo-info border border-odoo-info/30',
    High: 'bg-odoo-warning/10 text-odoo-warning border border-odoo-warning/30',
    Urgent: 'bg-odoo-danger/10 text-odoo-danger border border-odoo-danger/30',
  };
  return colors[priority] || colors.Normal;
}

function getStageColor(stage: string): string {
  const colors: Record<string, string> = {
    New: 'odoo-badge-new',
    'In Progress': 'odoo-badge-progress',
    Repaired: 'odoo-badge-repaired',
    Scrap: 'odoo-badge-scrap',
  };
  return colors[stage] || 'odoo-badge-new';
}
