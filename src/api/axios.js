import axios from 'axios';

const api = axios.create({
  baseURL: 'https://clinic-crm-backend.onrender.com/api',
  withCredentials: true,
});

export default api;