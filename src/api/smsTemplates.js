// src/api/smsTemplates.js
import axios from "axios";

const BASE = import.meta.env.VITE_API_BASE_URL || "/api";

export const listSmsTemplates = async (q = "") =>
  (await axios.get(`${BASE}/sms-templates`, { params: q ? { q } : {} })).data;

export const getSmsTemplate = async (id) =>
  (await axios.get(`${BASE}/sms-templates/${id}`)).data;

export const createSmsTemplate = async (payload) =>
  (await axios.post(`${BASE}/sms-templates`, payload)).data;

export const updateSmsTemplate = async (id, payload) =>
  (await axios.put(`${BASE}/sms-templates/${id}`, payload)).data;

export const removeSmsTemplate = async (id) =>
  (await axios.delete(`${BASE}/sms-templates/${id}`)).data;

export const sendByTemplate = async ({ templateName, params, to }) =>
  (await axios.post(`${BASE}/sms-templates/send-template`, { templateName, params, to })).data;