import supabase from '../db.js';

const createFAQ = async (payload) => {
  const { data, error } = await supabase.from('faqs').insert(payload).select().single();
  if (error) throw error;
  return data;
};

const listFAQs = async () => {
  const { data, error } = await supabase.from('faqs').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

const updateFAQ = async (faq_id, payload) => {
  const { data, error } = await supabase.from('faqs').update(payload).eq('faq_id', faq_id).select().single();
  if (error) throw error;
  return data;
};

const deleteFAQ = async (faq_id) => {
  const { data, error } = await supabase.from('faqs').delete().eq('faq_id', faq_id).select().single();
  if (error) throw error;
  return data;
};

export { createFAQ, listFAQs, updateFAQ, deleteFAQ };
