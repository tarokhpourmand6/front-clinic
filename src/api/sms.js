// src/api/sms.js
import api from './axios'; // baseURL تنظیم شده به بک‌اند

export const sendSms = (payload) => api.post('/sms/send', payload);
export const sendWelcomeSms = (payload) => api.post('/sms/welcome', payload);
export const sendBirthdaySms = (payload) => api.post('/sms/birthday', payload);
export const sendReminderSms = (payload) => api.post('/sms/reminder', payload);