import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const login = (credentials) => api.post('/auth/login', credentials);
export const register = (userData) => api.post('/auth/register', userData);

// Tasks
export const getTasks = (orgId, params) => api.get(`/orgs/${orgId}/tasks`, { params });
export const getTask = (orgId, taskId) => api.get(`/orgs/${orgId}/tasks/${taskId}`);
export const createTask = (orgId, data) => api.post(`/orgs/${orgId}/tasks`, data);
export const updateTask = (orgId, taskId, data) => api.put(`/orgs/${orgId}/tasks/${taskId}`, data);
export const deleteTask = (orgId, taskId) => api.delete(`/orgs/${orgId}/tasks/${taskId}`);

// Task Activity & Comments
export const getTaskActivity = (orgId, taskId) => api.get(`/orgs/${orgId}/tasks/${taskId}/activity`);
export const addTaskComment = (orgId, taskId, body) => api.post(`/orgs/${orgId}/tasks/${taskId}/comments`, { body });

// Users
export const getUsers = (orgId) => api.get(`/orgs/${orgId}/users`);
export const updateUserRole = (orgId, userId, role) => api.put(`/orgs/${orgId}/users/${userId}/role`, { role });

// Dashboard
export const getDashboardStats = (orgId) => api.get(`/orgs/${orgId}/dashboard`);

// Audit Logs
export const getAuditLogs = (orgId, params) => api.get(`/orgs/${orgId}/audit-logs`, { params });

// Notifications
export const getNotifications = (orgId, params) => api.get(`/orgs/${orgId}/notifications`, { params });
export const getUnreadNotificationCount = (orgId) => api.get(`/orgs/${orgId}/notifications/unread-count`);
export const markNotificationAsRead = (orgI, notificationId) => api.put(`/orgs/${orgId}/notifications/${notificationId}/read`);
export const markAllNotificationsAsRead = (orgId) => api.put(`/orgs/${orgId}/notifications/mark-all-read`);
export const getNotificationPreferences = (orgId) => api.get(`/orgs/${orgId}/notifications/preferences`);
export const updateNotificationPreferences = (orgId, prefs) => api.put(`/orgs/${orgId}/notifications/preferences`, prefs);

// Reports
export const getReportTaskDistribution = (orgId) => api.get(`/orgs/${orgId}/reports/task-distribution`);
export const getReportTasksOverTime = (orgId) => api.get(`/orgs/${orgId}/reports/tasks-completed-over-time`);
export const getReportTeamWorkload = (orgId) => api.get(`/orgs/${orgId}/reports/team-workload`);

// Task Templates
export const getTaskTemplates = (orgId) => api.get(`/orgs/${orgId}/task-templates`);
export const createTaskTemplate = (orgId, data) => api.post(`/orgs/${orgId}/task-templates`, data);
export const updateTaskTemplate = (orgId, templateId, data) => api.put(`/orgs/${orgId}/task-templates/${templateId}`, data);
export const deleteTaskTemplate = (orgId, templateId) => api.delete(`/orgs/${orgId}/task-templates/${templateId}`);
export const createTaskFromTemplate = (orgId, templateId) => api.post(`/orgs/${orgId}/task-templates/${templateId}/create-task`);

export default api;
