import api from './api';

// Get FAQs (online-only mode)
export const getFaqs = async () => {
	try {
		const res = await api.get('/faqs')
		let items = []
		if (Array.isArray(res?.data)) {
			items = res.data
		} else if (Array.isArray(res?.data?.data)) {
			items = res.data.data
		} else if (Array.isArray(res?.data?.items)) {
			items = res.data.items
		} else if (Array.isArray(res?.data?.data?.items)) {
			items = res.data.data.items
		}
		console.log(`❓ FAQs loaded from API: ${items.length}`)
		return { data: items }
	} catch (error) {
		console.error('Failed to load FAQs:', error)
		return { data: [] }
	}
}

export const createFaq = (faqData) => api.post('/faqs', faqData);

export const updateFaq = (id, faqData) => api.put(`/faqs/${id}`, faqData);

export const deleteFaq = (id) => api.delete(`/faqs/${id}`);
