import axios from 'axios';

const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

const getUserId = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      return user.id || user.ID;
    } catch (error) {
      console.error('Error parsing user:', error);
      return null;
    }
  }
  return null;
};

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const userId = getUserId();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (userId) {
      config.headers['X-User-ID'] = userId.toString();
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      response: error.response?.data
    });
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const testConnection = () => {
  return api.get('/test');
};

export const authAPI = {
  register: (userData) => api.post('/register', userData),
  login: (credentials) => api.post('/login', credentials),
  checkAuth: () => api.get('/check-auth'),
};

export const eventsAPI = {
  getEvents: () => api.get('/events'),
  createEvent: (eventData) => api.post('/events', eventData),
  updateEvent: (id, eventData) => api.put(`/events/${id}`, eventData),
  deleteEvent: (id) => api.delete(`/events/${id}`),
};

export const tasksAPI = {
  getTasks: () => api.get('/tasks'),
  createTask: (taskData) => api.post('/tasks', taskData),
  updateTask: (id, taskData) => api.put(`/tasks/${id}`, taskData),
  toggleTaskCompletion: (id, isCompleted) => api.put(`/tasks/${id}/toggle`, { is_completed: isCompleted }),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
};

export const scheduleAPI = {
  getSchedule: () => api.get('/schedule'),
  getWeekSchedule: () => api.get('/schedule/week'),
};

export const statsAPI = {
  getStats: () => api.get('/stats'),
};

export default api;