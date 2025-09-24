const { logActivity } = require('../models/activityLogger');
const { ACTIVITY } = require('../constants/activityTypes');

async function logSystemStart(meta) {
  return logActivity({ action_type: ACTIVITY.SYSTEM.START, description: 'System start', user_id: null, entity_type: 'system', entity_id: null, new_value: meta || null });
}
async function logSystemShutdown(meta) {
  return logActivity({ action_type: ACTIVITY.SYSTEM.SHUTDOWN, description: 'System shutdown', user_id: null, entity_type: 'system', entity_id: null, new_value: meta || null });
}
async function logTaskRun(name, meta) {
  return logActivity({ action_type: ACTIVITY.TASK.RUN, description: `Task run: ${name}`, user_id: null, entity_type: 'task', entity_id: name, new_value: meta || null });
}
async function logTaskSuccess(name, meta) {
  return logActivity({ action_type: ACTIVITY.TASK.SUCCESS, description: `Task success: ${name}`, user_id: null, entity_type: 'task', entity_id: name, new_value: meta || null });
}
async function logTaskFailure(name, error, meta) {
  return logActivity({ action_type: ACTIVITY.TASK.FAILURE, description: `Task failure: ${name}`, user_id: null, entity_type: 'task', entity_id: name, old_value: meta || null, new_value: { error: error?.message || String(error) } });
}

module.exports = { logSystemStart, logSystemShutdown, logTaskRun, logTaskSuccess, logTaskFailure };
