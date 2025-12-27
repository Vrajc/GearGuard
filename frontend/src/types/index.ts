export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'employee' | 'technician' | 'manager' | 'admin';
  department?: string;
  isActive: boolean;
  company: string;
  createdAt: string;
  updatedAt: string;
}

export interface Equipment {
  _id: string;
  name: string;
  serialNumber: string;
  category: EquipmentCategory;
  purchaseDate?: string;
  warrantyExpiry?: string;
  location?: string;
  department?: string;
  usedBy?: User;
  maintenanceTeam?: MaintenanceTeam;
  assignedTechnician?: User;
  workCenter?: WorkCenter;
  healthPercentage: number;
  isScrap: boolean;
  scrapDate?: string;
  description?: string;
  status: 'Active' | 'Under Maintenance' | 'Inactive' | 'Scrapped';
  company: string;
  createdAt: string;
  updatedAt: string;
}

export interface EquipmentCategory {
  _id: string;
  name: string;
  responsibleUser?: User;
  company: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkCenter {
  _id: string;
  name: string;
  code: string;
  tag?: string;
  alternativeWorkCenters?: WorkCenter[];
  costPerHour: number;
  capacity: number;
  timeEfficiency: number;
  oeeTarget: number;
  company: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceTeam {
  _id: string;
  name: string;
  members: User[];
  description?: string;
  company: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceRequest {
  _id: string;
  subject: string;
  createdBy: User;
  requestType: 'Corrective' | 'Preventive';
  equipment?: Equipment;
  workCenter?: WorkCenter;
  category?: EquipmentCategory;
  maintenanceTeam?: MaintenanceTeam;
  technician?: User;
  priority: 'Low' | 'Normal' | 'High' | 'Urgent';
  scheduledDate?: string;
  duration: number;
  stage: 'New' | 'In Progress' | 'Repaired' | 'Scrap';
  company: string;
  notes?: string;
  instructions?: string;
  completedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalEquipment: number;
  activeRequests: number;
  avgHealthPercentage: number;
  upcomingMaintenance: number;
  totalTechnicians: number;
  completedThisMonth: number;
}
