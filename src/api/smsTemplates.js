// src/api/smsTemplates.js
import api from './axios';

const unwrap = (p) => p.then((r) => r.data);

export const listSmsTemplates  = (q)        => unwrap(api.get('/sms-templates', { params: q }));
export const getSmsTemplate    = (id)       => unwrap(api.get(`/sms-templates/${id}`));
export const createSmsTemplate = (body)     => unwrap(api.post('/sms-templates', body));
export const updateSmsTemplate = (id, body) => unwrap(api.put(`/sms-templates/${id}`, body));
// هم‌نام با استفاده در کامپوننت:
export const removeSmsTemplate = (id)       => unwrap(api.delete(`/sms-templates/${id}`));
export const sendByTemplate    = (payload)  => unwrap(api.post('/sms-templates/send-template', payload));
// payload = { templateName? | templateId?, to?, params:{ name?, date?, time?, clinic? } }