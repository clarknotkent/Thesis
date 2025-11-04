import api from './api';

export const getFaqs = () => api.get('/faqs');

export const createFaq = (faqData) => api.post('/faqs', faqData);

export const updateFaq = (id, faqData) => api.put(`/faqs/${id}`, faqData);

export const deleteFaq = (id) => api.delete(`/faqs/${id}`);
