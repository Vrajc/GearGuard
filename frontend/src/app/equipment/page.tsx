'use client';

import { useEffect, useState } from 'react';
import { equipmentAPI, categoryAPI, teamAPI, userAPI, maintenanceRequestAPI } from '@/lib/api';
import type { Equipment, EquipmentCategory, MaintenanceTeam, User, MaintenanceRequest } from '@/types';
import Modal from '@/components/Modal';
import { useAuth } from '@/contexts/AuthContext';

export default function EquipmentPage() {
  const { user } = useAuth();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [categories, setCategories] = useState<EquipmentCategory[]>([]);
  const [teams, setTeams] = useState<MaintenanceTeam[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'maintenance' | 'scrapped'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [groupBy, setGroupBy] = useState<'none' | 'department' | 'employee'>('none');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRequestsModalOpen, setIsRequestsModalOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [equipmentRequests, setEquipmentRequests] = useState<MaintenanceRequest[]>([]);
  const [requestStats, setRequestStats] = useState<{ total: number; open: number }>({ total: 0, open: 0 });
  const [formData, setFormData] = useState({
    name: '',
    serialNumber: '',
    category: '',
    purchaseDate: '',
    warrantyExpiry: '',
    location: '',
    department: '',
    usedBy: '',
    assignedTechnician: '',
    maintenanceTeam: '',
    healthPercentage: 100,
    description: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [equipmentRes, categoriesRes, teamsRes, usersRes] = await Promise.all([
        equipmentAPI.getAll(),
        categoryAPI.getAll(),
        teamAPI.getAll(),
        userAPI.getAll(),
      ]);
      setEquipment(equipmentRes.data);
      setCategories(categoriesRes.data);
      setTeams(teamsRes.data);
      setUsers(usersRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await equipmentAPI.create(formData);
      setIsModalOpen(false);
      setFormData({
        name: '',
        serialNumber: '',
        category: '',
        purchaseDate: '',
        warrantyExpiry: '',
        location: '',
        department: '',
        usedBy: '',
        assignedTechnician: '',
        maintenanceTeam: '',
        healthPercentage: 100,
        description: '',
      });
      fetchData();
    } catch (error) {
      console.error('Error creating equipment:', error);
      alert('Failed to create equipment');
    }
  };

  const handleCardClick = async (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setIsDetailModalOpen(true);
    
    // Fetch maintenance requests for this equipment
    try {
      const response = await maintenanceRequestAPI.getAll();
      const eqRequests = response.data.filter(
        (req: MaintenanceRequest) => 
          (typeof req.equipment === 'object' ? req.equipment?._id : req.equipment) === equipment._id
      );
      setEquipmentRequests(eqRequests);
      
      const openRequests = eqRequests.filter((r: MaintenanceRequest) => 
        ['New', 'In Progress'].includes(r.stage)
      );
      setRequestStats({ total: eqRequests.length, open: openRequests.length });
    } catch (error) {
      console.error('Error fetching equipment requests:', error);
      setEquipmentRequests([]);
      setRequestStats({ total: 0, open: 0 });
    }
  };

  const handleEditClick = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setFormData({
      name: equipment.name,
      serialNumber: equipment.serialNumber,
      category: typeof equipment.category === 'object' ? equipment.category._id : equipment.category,
      purchaseDate: equipment.purchaseDate ? equipment.purchaseDate.split('T')[0] : '',
      warrantyExpiry: equipment.warrantyExpiry ? equipment.warrantyExpiry.split('T')[0] : '',
      location: equipment.location || '',
      department: equipment.department || '',
      usedBy: equipment.usedBy?._id || '',
      assignedTechnician: equipment.assignedTechnician?._id || '',
      maintenanceTeam: typeof equipment.maintenanceTeam === 'object' ? equipment.maintenanceTeam?._id || '' : equipment.maintenanceTeam || '',
      healthPercentage: equipment.healthPercentage,
      description: equipment.description || '',
    });
    setIsDetailModalOpen(false);
    setIsEditModalOpen(true);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEquipment) return;
    
    try {
      await equipmentAPI.update(selectedEquipment._id, formData);
      setIsEditModalOpen(false);
      setSelectedEquipment(null);
      setFormData({
        name: '',
        serialNumber: '',
        category: '',
        purchaseDate: '',
        warrantyExpiry: '',
        location: '',
        department: '',
        usedBy: '',
        assignedTechnician: '',
        maintenanceTeam: '',
        healthPercentage: 100,
        description: '',
      });
      fetchData();
    } catch (error) {
      console.error('Error updating equipment:', error);
      alert('Failed to update equipment');
    }
  };

  const handleDelete = async () => {
    if (!selectedEquipment) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedEquipment.name}? This action cannot be undone.`)) {
      return;
    }

    try {
      await equipmentAPI.delete(selectedEquipment._id);
      setIsDetailModalOpen(false);
      setIsEditModalOpen(false);
      setSelectedEquipment(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting equipment:', error);
      alert('Failed to delete equipment');
    }
  };

  const canManage = user?.role === 'admin' || user?.role === 'manager';

  const filteredEquipment = equipment.filter((eq) => {
    // Status filter
    if (filter === 'all') {
      // Continue with search
    } else if (filter === 'active' && eq.status !== 'Active') return false;
    else if (filter === 'maintenance' && eq.status !== 'Under Maintenance') return false;
    else if (filter === 'scrapped' && eq.status !== 'Scrapped') return false;

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesName = eq.name.toLowerCase().includes(search);
      const matchesSerial = eq.serialNumber.toLowerCase().includes(search);
      const matchesLocation = eq.location?.toLowerCase().includes(search);
      const matchesEmployee = eq.usedBy?.name?.toLowerCase().includes(search);
      const matchesDepartment = eq.department?.toLowerCase().includes(search);
      const matchesUserDepartment = eq.usedBy?.department?.toLowerCase().includes(search);
      
      if (!matchesName && !matchesSerial && !matchesLocation && !matchesEmployee && !matchesDepartment && !matchesUserDepartment) {
        return false;
      }
    }

    return true;
  });

  // Group equipment
  const groupedEquipment: Record<string, Equipment[]> = {};
  
  if (groupBy === 'department') {
    filteredEquipment.forEach((eq) => {
      const dept = eq.department || eq.usedBy?.department || 'Unassigned';
      if (!groupedEquipment[dept]) groupedEquipment[dept] = [];
      groupedEquipment[dept].push(eq);
    });
  } else if (groupBy === 'employee') {
    filteredEquipment.forEach((eq) => {
      const emp = eq.usedBy?.name || 'Unassigned';
      if (!groupedEquipment[emp]) groupedEquipment[emp] = [];
      groupedEquipment[emp].push(eq);
    });
  } else {
    groupedEquipment['All Equipment'] = filteredEquipment;
  }

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
            Equipment
          </h1>
          <p className="text-odoo-text-muted">{equipment.length} total equipment items</p>
        </div>
        {canManage && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="odoo-button-primary"
          >
            + New Equipment
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex space-x-2 mb-6">
        <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>
          All ({equipment.length})
        </FilterButton>
        <FilterButton active={filter === 'active'} onClick={() => setFilter('active')}>
          Active ({equipment.filter(e => e.status === 'Active').length})
        </FilterButton>
        <FilterButton active={filter === 'maintenance'} onClick={() => setFilter('maintenance')}>
          Maintenance ({equipment.filter(e => e.status === 'Under Maintenance').length})
        </FilterButton>
        <FilterButton active={filter === 'scrapped'} onClick={() => setFilter('scrapped')}>
          Scrapped ({equipment.filter(e => e.status === 'Scrapped').length})
        </FilterButton>
      </div>

      {/* Search and Group By Controls */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name, serial number, location, employee, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-odoo-border rounded focus:outline-none focus:ring-2 focus:ring-odoo-primary"
          />
        </div>
        <div className="w-48">
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as 'none' | 'department' | 'employee')}
            className="w-full px-4 py-2 border border-odoo-border rounded focus:outline-none focus:ring-2 focus:ring-odoo-primary"
          >
            <option value="none">No Grouping</option>
            <option value="department">Group by Department</option>
            <option value="employee">Group by Employee</option>
          </select>
        </div>
      </div>

      {/* Equipment Grid with Grouping */}
      {Object.entries(groupedEquipment).map(([groupName, items]) => (
        <div key={groupName} className="mb-8">
          {groupBy !== 'none' && (
            <h2 className="text-xl font-bold text-odoo-text-primary mb-4 pb-2 border-b border-odoo-border">
              {groupName} ({items.length})
            </h2>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <EquipmentCard 
                key={item._id} 
                equipment={item} 
                onClick={() => handleCardClick(item)}
              />
            ))}
          </div>
        </div>
      ))}

      {filteredEquipment.length === 0 && (
        <div className="text-center py-16">
          <p className="text-odoo-text-muted text-lg">No equipment found</p>
        </div>
      )}

      {/* Create Equipment Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Equipment">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-odoo-text-primary mb-2">
              Equipment Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-odoo-border rounded focus:outline-none focus:ring-2 focus:ring-odoo-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-odoo-text-primary mb-2">
              Serial Number *
            </label>
            <input
              type="text"
              required
              value={formData.serialNumber}
              onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
              className="w-full px-4 py-2 border border-odoo-border rounded focus:outline-none focus:ring-2 focus:ring-odoo-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-odoo-text-primary mb-2">
              Category *
            </label>
            <select
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border border-odoo-border rounded focus:outline-none focus:ring-2 focus:ring-odoo-primary"
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-odoo-text-primary mb-2">
              Location *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Building A - Floor 2 - Production Line 1"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2 border border-odoo-border rounded focus:outline-none focus:ring-2 focus:ring-odoo-primary"
            />
            <p className="text-xs text-odoo-text-muted mt-1">
              Physical location where the equipment is installed
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-odoo-text-primary mb-2">
              Department *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Production, IT, Maintenance, Warehouse"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-4 py-2 border border-odoo-border rounded focus:outline-none focus:ring-2 focus:ring-odoo-primary"
            />
            <p className="text-xs text-odoo-text-muted mt-1">
              Which department owns/uses this equipment
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-odoo-text-primary mb-2">
                Used By (Employee)
              </label>
              <select
                value={formData.usedBy}
                onChange={(e) => setFormData({ ...formData, usedBy: e.target.value })}
                className="w-full px-4 py-2 border border-odoo-border rounded focus:outline-none focus:ring-2 focus:ring-odoo-primary"
              >
                <option value="">Unassigned</option>
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.role})
                  </option>
                ))}
              </select>
              <p className="text-xs text-odoo-text-muted mt-1">
                Which employee uses this equipment
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-odoo-text-primary mb-2">
                Assigned Technician
              </label>
              <select
                value={formData.assignedTechnician}
                onChange={(e) => setFormData({ ...formData, assignedTechnician: e.target.value })}
                className="w-full px-4 py-2 border border-odoo-border rounded focus:outline-none focus:ring-2 focus:ring-odoo-primary"
              >
                <option value="">Unassigned</option>
                {users.filter(u => u.role === 'technician').map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-odoo-text-muted mt-1">
                Technician responsible for this equipment
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-odoo-text-primary mb-2">
              Maintenance Team *
            </label>
            <select
              required
              value={formData.maintenanceTeam}
              onChange={(e) => setFormData({ ...formData, maintenanceTeam: e.target.value })}
              className="w-full px-4 py-2 border border-odoo-border rounded focus:outline-none focus:ring-2 focus:ring-odoo-primary"
            >
              <option value="">Select Team</option>
              {teams.map((team) => (
                <option key={team._id} value={team._id}>{team.name}</option>
              ))}
            </select>
            <p className="text-xs text-odoo-text-muted mt-1">
              Assign a dedicated maintenance team (required)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-odoo-text-primary mb-2">
                Purchase Date *
              </label>
              <input
                type="date"
                required
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                className="w-full px-4 py-2 border border-odoo-border rounded focus:outline-none focus:ring-2 focus:ring-odoo-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-odoo-text-primary mb-2">
                Warranty Expiry *
              </label>
              <input
                type="date"
                required
                value={formData.warrantyExpiry}
                onChange={(e) => setFormData({ ...formData, warrantyExpiry: e.target.value })}
                className="w-full px-4 py-2 border border-odoo-border rounded focus:outline-none focus:ring-2 focus:ring-odoo-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-odoo-text-primary mb-2">
              Health Percentage
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="range"
                min="0"
                max="100"
                value={formData.healthPercentage}
                onChange={(e) => setFormData({ ...formData, healthPercentage: parseInt(e.target.value) })}
                className="flex-1 h-2 bg-odoo-bg-app rounded-lg appearance-none cursor-pointer accent-odoo-primary"
              />
              <span className="text-odoo-text-primary font-semibold w-12 text-right">
                {formData.healthPercentage}%
              </span>
            </div>
            <p className="text-xs text-odoo-text-muted mt-1">
              Set the initial health condition of the equipment (0-100%)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-odoo-text-primary mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
              Create Equipment
            </button>
          </div>
        </form>
      </Modal>

      {/* Equipment Details Modal */}
      {selectedEquipment && (
        <Modal 
          isOpen={isDetailModalOpen} 
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedEquipment(null);
          }} 
          title="Equipment Details"
        >
          <div className="space-y-4">
            {/* Status Badge */}
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-odoo-text-primary mb-1">
                  {selectedEquipment.name}
                </h2>
                <p className="text-sm text-odoo-text-muted font-mono">
                  {selectedEquipment.serialNumber}
                </p>
              </div>
              <span className={`odoo-badge ${getStatusColor(selectedEquipment.status)}`}>
                {selectedEquipment.status}
              </span>
            </div>

            {/* Description */}
            {selectedEquipment.description && (
              <div className="bg-odoo-bg-app p-4 rounded-lg">
                <p className="text-sm text-odoo-text-muted">{selectedEquipment.description}</p>
              </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4 py-4">
              <DetailItem 
                label="Category" 
                value={typeof selectedEquipment.category === 'object' ? selectedEquipment.category.name : '-'} 
              />
              <DetailItem 
                label="Location" 
                value={selectedEquipment.location || '-'} 
              />
              <DetailItem 
                label="Department" 
                value={selectedEquipment.department || '-'} 
              />
              <DetailItem 
                label="Used By" 
                value={selectedEquipment.usedBy?.name || 'Unassigned'} 
              />
              <DetailItem 
                label="Assigned Technician" 
                value={selectedEquipment.assignedTechnician?.name || 'Unassigned'} 
              />
              <DetailItem 
                label="Maintenance Team" 
                value={selectedEquipment.maintenanceTeam?.name || 'Unassigned'} 
              />
              <DetailItem 
                label="Purchase Date" 
                value={selectedEquipment.purchaseDate ? new Date(selectedEquipment.purchaseDate).toLocaleDateString() : '-'} 
              />
              <DetailItem 
                label="Warranty Expiry" 
                value={selectedEquipment.warrantyExpiry ? new Date(selectedEquipment.warrantyExpiry).toLocaleDateString() : '-'} 
              />
            </div>

            {/* Health Bar */}
            <div className="py-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-odoo-text-primary">Equipment Health</span>
                <span className={`text-lg font-bold ${getHealthColor(selectedEquipment.healthPercentage)}`}>
                  {selectedEquipment.healthPercentage}%
                </span>
              </div>
              <div className="w-full bg-odoo-bg-app rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    selectedEquipment.healthPercentage >= 80
                      ? 'bg-odoo-success'
                      : selectedEquipment.healthPercentage >= 50
                      ? 'bg-odoo-warning'
                      : 'bg-odoo-danger'
                  }`}
                  style={{ width: `${selectedEquipment.healthPercentage}%` }}
                />
              </div>
            </div>

            {/* Smart Buttons Section */}
            <div className="bg-odoo-bg-app p-4 rounded-lg border-t border-odoo-border">
              <h4 className="text-sm font-semibold text-odoo-text-primary mb-3">Quick Actions</h4>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setIsRequestsModalOpen(true)}
                  className="flex items-center justify-between p-3 bg-white border-2 border-odoo-primary/20 rounded-lg hover:shadow-lg hover:border-odoo-primary/40 transition-all group"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-odoo-primary/10 rounded-full flex items-center justify-center group-hover:bg-odoo-primary/20 transition-colors">
                      <svg className="w-5 h-5 text-odoo-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-odoo-text-primary">Maintenance</p>
                      <p className="text-xs text-odoo-text-muted">View all requests</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* Badge showing open requests count - Problem Statement Requirement */}
                    <div className={`flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg ${
                      requestStats.open > 0 
                        ? 'bg-odoo-warning text-white' 
                        : 'bg-odoo-success/20 text-odoo-success'
                    }`}>
                      {requestStats.open}
                    </div>
                  </div>
                </button>
                <div className="flex items-center justify-between p-3 bg-white border border-odoo-border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-odoo-text-muted">Equipment</p>
                      <p className="text-sm font-semibold text-odoo-text-primary">Status</p>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                    selectedEquipment.status === 'Active' ? 'bg-odoo-success/20 text-odoo-success' :
                    selectedEquipment.status === 'Under Maintenance' ? 'bg-odoo-warning/20 text-odoo-warning' :
                    selectedEquipment.status === 'Scrapped' ? 'bg-odoo-danger/20 text-odoo-danger' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {selectedEquipment.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-odoo-border">
              {canManage && (
                <>
                  <button
                    onClick={() => handleEditClick(selectedEquipment)}
                    className="odoo-button-primary"
                  >
                    Edit Equipment
                  </button>
                  {user?.role === 'admin' && (
                    <button
                      onClick={handleDelete}
                      className="px-4 py-2 bg-odoo-danger text-white rounded hover:bg-odoo-danger/90 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </>
              )}
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedEquipment(null);
                }}
                className="odoo-button-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Equipment Modal */}
      {selectedEquipment && (
        <Modal 
          isOpen={isEditModalOpen} 
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedEquipment(null);
          }} 
          title="Edit Equipment"
        >
          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-odoo-text-primary mb-2">
                Equipment Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-odoo-border rounded focus:outline-none focus:ring-2 focus:ring-odoo-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-odoo-text-primary mb-2">
                Serial Number *
              </label>
              <input
                type="text"
                required
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                className="w-full px-4 py-2 border border-odoo-border rounded focus:outline-none focus:ring-2 focus:ring-odoo-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-odoo-text-primary mb-2">
                Category *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-odoo-border rounded focus:outline-none focus:ring-2 focus:ring-odoo-primary"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-odoo-text-primary mb-2">
                Location *
              </label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-2 border border-odoo-border rounded focus:outline-none focus:ring-2 focus:ring-odoo-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-odoo-text-primary mb-2">
                Department *
              </label>
              <input
                type="text"
                required
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-4 py-2 border border-odoo-border rounded focus:outline-none focus:ring-2 focus:ring-odoo-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-odoo-text-primary mb-2">
                  Used By (Employee)
                </label>
                <select
                  value={formData.usedBy}
                  onChange={(e) => setFormData({ ...formData, usedBy: e.target.value })}
                  className="w-full px-4 py-2 border border-odoo-border rounded focus:outline-none focus:ring-2 focus:ring-odoo-primary"
                >
                  <option value="">Unassigned</option>
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-odoo-text-primary mb-2">
                  Assigned Technician
                </label>
                <select
                  value={formData.assignedTechnician}
                  onChange={(e) => setFormData({ ...formData, assignedTechnician: e.target.value })}
                  className="w-full px-4 py-2 border border-odoo-border rounded focus:outline-none focus:ring-2 focus:ring-odoo-primary"
                >
                  <option value="">Unassigned</option>
                  {users.filter(u => u.role === 'technician').map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-odoo-text-primary mb-2">
                Maintenance Team *
              </label>
              <select
                required
                value={formData.maintenanceTeam}
                onChange={(e) => setFormData({ ...formData, maintenanceTeam: e.target.value })}
                className="w-full px-4 py-2 border border-odoo-border rounded focus:outline-none focus:ring-2 focus:ring-odoo-primary"
              >
                <option value="">Select Team</option>
                {teams.map((team) => (
                  <option key={team._id} value={team._id}>{team.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-odoo-text-primary mb-2">
                  Purchase Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  className="w-full px-4 py-2 border border-odoo-border rounded focus:outline-none focus:ring-2 focus:ring-odoo-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-odoo-text-primary mb-2">
                  Warranty Expiry *
                </label>
                <input
                  type="date"
                  required
                  value={formData.warrantyExpiry}
                  onChange={(e) => setFormData({ ...formData, warrantyExpiry: e.target.value })}
                  className="w-full px-4 py-2 border border-odoo-border rounded focus:outline-none focus:ring-2 focus:ring-odoo-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-odoo-text-primary mb-2">
                Health Percentage
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.healthPercentage}
                  onChange={(e) => setFormData({ ...formData, healthPercentage: parseInt(e.target.value) })}
                  className="flex-1 h-2 bg-odoo-bg-app rounded-lg appearance-none cursor-pointer accent-odoo-primary"
                />
                <span className="text-odoo-text-primary font-semibold w-12 text-right">
                  {formData.healthPercentage}%
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-odoo-text-primary mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-odoo-border rounded focus:outline-none focus:ring-2 focus:ring-odoo-primary"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              {user?.role === 'admin' && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="mr-auto px-4 py-2 bg-odoo-danger text-white rounded hover:bg-odoo-danger/90 transition-colors"
                >
                  Delete Equipment
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedEquipment(null);
                }}
                className="odoo-button-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="odoo-button-primary">
                Update Equipment
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Maintenance Requests Modal */}
      {selectedEquipment && (
        <Modal
          isOpen={isRequestsModalOpen}
          onClose={() => setIsRequestsModalOpen(false)}
          title={`Maintenance History`}
        >
          <div className="space-y-4">
            {/* Equipment Info Header */}
            <div className="bg-odoo-primary/5 border-l-4 border-odoo-primary p-4 rounded-r-lg">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-odoo-primary rounded-full flex items-center justify-center text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-odoo-text-primary">{selectedEquipment.name}</h3>
                  <p className="text-sm text-odoo-text-muted">Serial: {selectedEquipment.serialNumber}</p>
                </div>
              </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-blue-600">{requestStats.total}</div>
                <div className="text-sm text-blue-600 mt-1">Total Requests</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-orange-600">{requestStats.open}</div>
                <div className="text-sm text-orange-600 mt-1">Open Requests</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-green-600">
                  {requestStats.total - requestStats.open}
                </div>
                <div className="text-sm text-green-600 mt-1">Completed</div>
              </div>
            </div>

            {/* Requests List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {equipmentRequests.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-odoo-text-muted">No maintenance requests found for this equipment</p>
                  <p className="text-sm text-odoo-text-muted mt-2">Create a request from the Requests page</p>
                </div>
              ) : (
                equipmentRequests.map((request) => (
                  <div
                    key={request._id}
                    className="border border-odoo-border rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-odoo-text-primary mb-1">{request.subject}</h4>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs px-2 py-1 rounded ${
                            request.requestType === 'Corrective'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {request.requestType}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            request.priority === 'Urgent'
                              ? 'bg-red-100 text-red-700'
                              : request.priority === 'High'
                              ? 'bg-orange-100 text-orange-700'
                              : request.priority === 'Normal'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {request.priority}
                          </span>
                        </div>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                        request.stage === 'New'
                          ? 'bg-blue-100 text-blue-800'
                          : request.stage === 'In Progress'
                          ? 'bg-yellow-100 text-yellow-800'
                          : request.stage === 'Repaired'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {request.stage}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-odoo-text-muted">Created:</span>
                        <span className="ml-2 text-odoo-text-primary font-medium">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {request.scheduledDate && (
                        <div>
                          <span className="text-odoo-text-muted">Scheduled:</span>
                          <span className="ml-2 text-odoo-text-primary font-medium">
                            {new Date(request.scheduledDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {request.technician && (
                        <div>
                          <span className="text-odoo-text-muted">Technician:</span>
                          <span className="ml-2 text-odoo-text-primary font-medium">
                            {typeof request.technician === 'object' ? request.technician.name : '-'}
                          </span>
                        </div>
                      )}
                      {request.maintenanceTeam && (
                        <div>
                          <span className="text-odoo-text-muted">Team:</span>
                          <span className="ml-2 text-odoo-text-primary font-medium">
                            {typeof request.maintenanceTeam === 'object' ? request.maintenanceTeam.name : '-'}
                          </span>
                        </div>
                      )}
                    </div>

                    {request.notes && (
                      <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-odoo-text-muted">
                        <strong>Notes:</strong> {request.notes}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-odoo-border">
              <button
                onClick={() => setIsRequestsModalOpen(false)}
                className="odoo-button-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-odoo-text-muted mb-1">{label}</p>
      <p className="text-sm font-medium text-odoo-text-primary">{value}</p>
    </div>
  );
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    Active: 'bg-odoo-success/10 text-odoo-success border-odoo-success/30',
    'Under Maintenance': 'bg-odoo-warning/10 text-odoo-warning border-odoo-warning/30',
    Inactive: 'bg-odoo-text-muted/20 text-odoo-text-muted border-odoo-text-muted/30',
    Scrapped: 'bg-odoo-danger/10 text-odoo-danger border-odoo-danger/30',
  };
  return colors[status] || colors.Active;
}

function getHealthColor(health: number) {
  if (health >= 80) return 'text-odoo-success';
  if (health >= 50) return 'text-odoo-warning';
  return 'text-odoo-danger';
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded font-medium transition-colors ${
        active
          ? 'bg-odoo-primary text-white'
          : 'bg-odoo-bg-sidebar text-odoo-text-muted hover:bg-odoo-bg-app'
      }`}
    >
      {children}
    </button>
  );
}

function EquipmentCard({ equipment, onClick }: { equipment: Equipment; onClick: () => void }) {
  const isWarrantyExpired = equipment.warrantyExpiry && new Date(equipment.warrantyExpiry) < new Date();
  const isWarrantyExpiringSoon = equipment.warrantyExpiry && 
    new Date(equipment.warrantyExpiry) > new Date() && 
    new Date(equipment.warrantyExpiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return (
    <div 
      onClick={onClick}
      className="odoo-card p-6 cursor-pointer"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-odoo-text-primary mb-1">{equipment.name}</h3>
          <p className="text-sm text-odoo-text-muted font-mono">{equipment.serialNumber}</p>
        </div>
        <span className={`odoo-badge ${getStatusColor(equipment.status)}`}>
          {equipment.status}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm">
          <span className="text-odoo-text-muted w-28">Category:</span>
          <span className="text-odoo-text-primary">
            {typeof equipment.category === 'object' ? equipment.category.name : '-'}
          </span>
        </div>
        <div className="flex items-center text-sm">
          <span className="text-odoo-text-muted w-28">Location:</span>
          <span className="text-odoo-text-primary font-medium">{equipment.location || '-'}</span>
        </div>
        {equipment.department && (
          <div className="flex items-center text-sm">
            <span className="text-odoo-text-muted w-28">Department:</span>
            <span className="text-odoo-text-primary font-semibold">{equipment.department}</span>
          </div>
        )}
        {equipment.warrantyExpiry && (
          <div className="flex items-center text-sm">
            <span className="text-odoo-text-muted w-28">Warranty:</span>
            <span className={`font-medium ${
              isWarrantyExpired ? 'text-odoo-danger' : 
              isWarrantyExpiringSoon ? 'text-odoo-warning' : 
              'text-odoo-success'
            }`}>
              {isWarrantyExpired ? 'Expired' : 
               isWarrantyExpiringSoon ? 'Expiring Soon' : 
               'Active'}
            </span>
          </div>
        )}
        <div className="flex items-center text-sm">
          <span className="text-odoo-text-muted w-28">Used By:</span>
          <span className="text-odoo-text-primary font-medium">
            {equipment.usedBy?.name || 'Unassigned'}
          </span>
        </div>
        <div className="flex items-center text-sm">
          <span className="text-odoo-text-muted w-28">Technician:</span>
          <span className="text-odoo-text-primary font-medium">
            {equipment.assignedTechnician?.name || 'Unassigned'}
          </span>
        </div>
        <div className="flex items-center text-sm">
          <span className="text-odoo-text-muted w-28">Team:</span>
          <span className="text-odoo-text-primary font-medium">
            {equipment.maintenanceTeam?.name || 'Unassigned'}
          </span>
        </div>
      </div>

      {/* Health Bar */}
      <div className="mb-2">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-odoo-text-muted">Health</span>
          <span className={`text-sm font-semibold ${getHealthColor(equipment.healthPercentage)}`}>
            {equipment.healthPercentage}%
          </span>
        </div>
        <div className="w-full bg-odoo-bg-app rounded-full h-2">
          <div
            className={`h-2 rounded-full ${
              equipment.healthPercentage >= 80
                ? 'bg-odoo-success'
                : equipment.healthPercentage >= 50
                ? 'bg-odoo-warning'
                : 'bg-odoo-danger'
            }`}
            style={{ width: `${equipment.healthPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
