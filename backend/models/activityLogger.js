const supabase = require('../db');

/**
 * Log an activity to the activitylogs table.
 * @param {Object} params - Activity log parameters
 * @param {string} params.action_type - The type of action (must match activity_action_types)
 * @param {string} params.description - Description of the activity
 * @param {number} params.user_id - The user performing the action
 * @param {Object} [params.extra] - Any extra fields (optional)
 * @returns {Promise<Object>} The inserted activity log row
 */
const logActivity = async ({ action_type, description, user_id, ...extra }) => {
  const payload = {
    action_type,
    description,
    user_id,
    ...extra,
    timestamp: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from('activitylogs')
    .insert([payload])
    .select()
    .single();
  if (error) throw error;
  return data;
};

module.exports = {
  logActivity,
};
