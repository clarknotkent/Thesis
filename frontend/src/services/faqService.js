import offlineAPI from './offlineAPI';

export const getFaqs = () => offlineAPI.get('/faqs');

export const createFaq = (faqData) => offlineAPI.post('/faqs', faqData);

export const updateFaq = (id, faqData) => offlineAPI.put(`/faqs/${id}`, faqData);

export const deleteFaq = (id) => offlineAPI.delete(`/faqs/${id}`);
