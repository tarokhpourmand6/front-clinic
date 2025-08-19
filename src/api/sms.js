import api from './axios';

const u = (p) => p.then((r) => r.data);

// ارسال متن دلخواه
export const sendSms = ({ phone, to, text, message }) =>
  u(api.post('/sms/send', {
    to: to || phone,         // هم to هم phone را پوشش می‌دهیم
    phone: phone || to,      // اگر بک‌اند از phone بخواند
    text: text ?? message,   // اگر نام فیلد message باشد
  }));

export const sendWelcomeSms = ({ to, phone, name, clinic }) =>
  u(api.post('/sms/welcome', { to: to || phone, phone: phone || to, name, clinic }));

export const sendBirthdaySms = ({ to, phone, name, clinic }) =>
  u(api.post('/sms/birthday', { to: to || phone, phone: phone || to, name, clinic }));

export const sendReminderSms = ({ to, phone, name, date, time, clinic }) =>
  u(api.post('/sms/reminder', { to: to || phone, phone: phone || to, name, date, time, clinic }));