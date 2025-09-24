const supabase = require('../db');

let actionTypeCache = null;
let lastLoadTs = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function loadActionTypes() {
  const now = Date.now();
  if (actionTypeCache && (now - lastLoadTs) < CACHE_TTL_MS) return actionTypeCache;
  const { data, error } = await supabase.from('activity_action_types').select('action_type');
  if (error) {
    console.warn('[activityLogger] Failed to load activity_action_types:', error.message);
    if (!actionTypeCache) {
      // minimal fallback so calls don't crash; will attempt reload next call
      actionTypeCache = new Set();
    }
    return actionTypeCache;
  }
  actionTypeCache = new Set(data.map(r => r.action_type));
  lastLoadTs = now;
  return actionTypeCache;
}

// Generic activity logger. Accepts optional entity context and diffs.
const logActivity = async ({ action_type, description, user_id = null, entity_type = null, entity_id = null, old_value = null, new_value = null, skipValidation = false, ...rest }) => {
  if (!action_type) throw new Error('action_type required');
  if (!description) description = action_type;
  if (!skipValidation) {
    const types = await loadActionTypes();
    if (!types.has(action_type)) {
      console.warn(`[activityLogger] Unknown action_type '${action_type}' - skipping log`);
      return null;
    }
  }
  const payload = {
    action_type,
    description,
    user_id,
    entity_type,
    entity_id,
    old_value,
    new_value,
    ...rest,
    timestamp: new Date().toISOString(),
  };
  try {
    const preview = { ...payload };
    if (preview.old_value && typeof preview.old_value === 'object') {
      preview.old_value = Object.keys(preview.old_value).slice(0,8).reduce((a,k)=>{a[k]=preview.old_value[k];return a;},{});
    }
    if (preview.new_value && typeof preview.new_value === 'object') {
      preview.new_value = Object.keys(preview.new_value).slice(0,8).reduce((a,k)=>{a[k]=preview.new_value[k];return a;},{});
    }
    console.log(`[activity] ${payload.action_type} user=${payload.user_id ?? 'sys'} entity=${payload.entity_type||''}:${payload.entity_id||''} desc="${payload.description}"`);
    // DEBUG: print payload keys and a trimmed JSON for diagnosis
    try { console.debug('[activityLogger] payload-preview:', JSON.stringify(preview)); } catch(_) {}
  } catch(_) {}
  const { data, error } = await supabase.from('activitylogs').insert([payload]).select().single();
  if (error) {
    console.error('[activityLogger] insert error:', error);
    throw error;
  }
  console.debug('[activityLogger] insert result:', data && data.action_type ? `${data.action_type} id=${data.id||data.activity_id||''}` : JSON.stringify(data));
  return data;
};

module.exports = { logActivity };
