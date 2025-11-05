import api from './api';
import db from '@/services/offline/db-parent-portal'

// Get FAQs with offline fallback; returns an object with { data: [...] } to mimic axios-like shape
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
	} catch (_) {
		try {
			const cached = await db.faqs?.toArray?.()
			const items = Array.isArray(cached) ? cached.map(f => ({
				faq_id: f.faq_id || f.id,
				question: f.question || f.q,
				answer: f.answer || f.a,
				updated_at: f.updated_at || f.updatedAt
			})) : []
			console.log(`📴 FAQs loaded from offline cache: ${items.length}`)
			return { data: items }
		} catch {
			console.log('📴 No FAQs in offline cache')
			return { data: [] }
		}
	}
}

export const createFaq = (faqData) => api.post('/faqs', faqData);

export const updateFaq = (id, faqData) => api.put(`/faqs/${id}`, faqData);

export const deleteFaq = (id) => api.delete(`/faqs/${id}`);
