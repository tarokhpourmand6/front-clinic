import api from './axios';
const unwrap = (p) => p.then((r) => r.data);

export const listSmsTemplates  = (q)        => unwrap(api.get('/sms-templates', { params: q }));
export const getSmsTemplate    = (id)       => unwrap(api.get(`/sms-templates/${id}`));
export const createSmsTemplate = (body)     => unwrap(api.post('/sms-templates', body));
export const updateSmsTemplate = (id, body) => unwrap(api.put(`/sms-templates/${id}`, body));
export const removeSmsTemplate = (id)       => unwrap(api.delete(`/sms-templates/${id}`));

export const sendByTemplate = async (payload) => {
  try {
    // مسیر اول: اگر بک‌اند این روت را داشته باشد
    return await unwrap(api.post('/sms-templates/send-template', payload));
  } catch (e) {
    if (e?.response?.status === 404) {
      // مسیر جایگزین رایج در بک‌اندها
      return await unwrap(api.post('/sms/send-template', payload));
    }
    throw e;
  }
};
// payload = { templateName? | templateId?, to, params:{ name?, date?, time?, clinic? } }