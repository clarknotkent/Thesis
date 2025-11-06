import { logActivity } from '../models/activityLogger.js';
import { ACTIVITY } from '../constants/activityTypes.js';

async function logSystemStart(meta) {
  return await logActivity({ action_type: ACTIVITY.SYSTEM.START, description: 'System start', user_id: null, entity_type: 'system', entity_id: null, new_value: meta || null });
}
async function logSystemShutdown(meta) {
  return await logActivity({ action_type: ACTIVITY.SYSTEM.SHUTDOWN, description: 'System shutdown', user_id: null, entity_type: 'system', entity_id: null, new_value: meta || null });
}
async function logTaskRun(name, meta) {
  return await logActivity({ action_type: ACTIVITY.TASK.RUN, description: `Task run: ${name}`, user_id: null, entity_type: 'task', entity_id: name, new_value: meta || null });
}
async function logTaskSuccess(name, meta) {
  return await logActivity({ action_type: ACTIVITY.TASK.SUCCESS, description: `Task success: ${name}`, user_id: null, entity_type: 'task', entity_id: name, new_value: meta || null });
}
async function logTaskFailure(name, error, meta) {
  return await logActivity({ action_type: ACTIVITY.TASK.FAILURE, description: `Task failure: ${name}`, user_id: null, entity_type: 'task', entity_id: name, old_value: meta || null, new_value: { error: error?.message || String(error) } });
}

export { logSystemStart, logSystemShutdown, logTaskRun, logTaskSuccess, logTaskFailure };
