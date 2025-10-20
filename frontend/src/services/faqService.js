import api from './api';

export const getFaqs = () => {
  return api.get('/faqs');
};

export const createFaq = (faqData) => {
  return api.post('/faqs', faqData);
};

export const updateFaq = (id, faqData) => {
    return api.put(`/faqs/${id}`, faqData);
};

export const deleteFaq = (id) => {
    return api.delete(`/faqs/${id}`);
};
