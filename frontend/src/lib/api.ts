import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  console.log('🚀 API Request:', config.method?.toUpperCase(), config.url);
  console.log('   Base URL:', config.baseURL);
  console.log('   Full URL:', `${config.baseURL}${config.url}`);
  
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('   Auth: Token attached');
  } else {
    console.log('   Auth: No token');
  }
  return config;
});

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error.response?.status, error.config?.url);
    console.error('   Error data:', error.response?.data);
    return Promise.reject(error);
  }
);

// API functions
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (name: string, email: string, password: string, role?: string) =>
    api.post('/auth/register', { name, email, password, role }),
  getCurrentUser: () => api.get('/auth/me'),
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    api.post(`/auth/reset-password/${token}`, { password }),
};

export const equipmentAPI = {
  getAll: () => api.get('/equipment'),
  getById: (id: string) => api.get(`/equipment/${id}`),
  create: (data: any) => api.post('/equipment', data),
  update: (id: string, data: any) => api.put(`/equipment/${id}`, data),
  delete: (id: string) => api.delete(`/equipment/${id}`),
};

export const maintenanceRequestAPI = {
  getAll: () => api.get('/maintenance-requests'),
  getById: (id: string) => api.get(`/maintenance-requests/${id}`),
  create: (data: any) => api.post('/maintenance-requests', data),
  update: (id: string, data: any) => api.put(`/maintenance-requests/${id}`, data),
  delete: (id: string) => api.delete(`/maintenance-requests/${id}`),
};

export const categoryAPI = {
  getAll: () => api.get('/equipment-categories'),
  create: (data: any) => api.post('/equipment-categories', data),
};

export const teamAPI = {
  getAll: () => {
    console.log('📞 Calling teamAPI.getAll()');
    return api.get('/maintenance-teams');
  },
  getById: (id: string) => api.get(`/maintenance-teams/${id}`),
  create: (data: any) => {
    console.log('📞 Calling teamAPI.create() with data:', JSON.stringify(data, null, 2));
    return api.post('/maintenance-teams', data);
  },
  update: (id: string, data: any) => {
    console.log('📞 Calling teamAPI.update() with id:', id, 'data:', data);
    return api.put(`/maintenance-teams/${id}`, data);
  },
  delete: (id: string) => {
    console.log('📞 Calling teamAPI.delete() with id:', id);
    return api.delete(`/maintenance-teams/${id}`);
  },
};

export const userAPI = {
  getAll: () => api.get('/users'),
  getById: (id: string) => api.get(`/users/${id}`),
  getTechnicians: () => api.get('/users?role=technician'),
};

export const workCenterAPI = {
  getAll: () => api.get('/work-centers'),
  create: (data: any) => api.post('/work-centers', data),
  update: (id: string, data: any) => api.put(`/work-centers/${id}`, data),
  delete: (id: string) => api.delete(`/work-centers/${id}`),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

export const invitationAPI = {
  getMyInvitations: () => api.get('/invitations/my-invitations'),
  sendInvitation: (data: { email: string; teamId: string; role?: string; message?: string }) =>
    api.post('/invitations/send', data),
  acceptInvitation: (invitationId: string) =>
    api.post(`/invitations/accept/${invitationId}`),
  rejectInvitation: (invitationId: string) =>
    api.post(`/invitations/reject/${invitationId}`),
  getByToken: (token: string) =>
    api.get(`/invitations/token/${token}`),
  getSentInvitations: () => api.get('/invitations/sent'),
};

export const notificationAPI = {
  getAll: (unreadOnly?: boolean) =>
    api.get('/notifications', { params: { unreadOnly } }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/mark-all-read'),
  deleteNotification: (id: string) => api.delete(`/notifications/${id}`),
  clearRead: () => api.delete('/notifications/clear-read'),
};

export default api;
