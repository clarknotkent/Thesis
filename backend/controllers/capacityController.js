import capacityModel from '../models/capacityModel.js';
import { getSupabaseForRequest } from '../utils/supabaseClient.js';
import { getActorId } from '../utils/actor.js';
import { TIME_BLOCKS, PATIENTS_PER_BLOCK, DAILY_CAPACITY } from '../constants/schedulingConfig.js';

/**
 * GET /api/capacity/date/:date
 * Get capacity info for a specific date
 */
export const getCapacityForDate = async (req, res) => {
  try {
    const { date } = req.params;
    const supabase = getSupabaseForRequest(req);

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    const capacity = await capacityModel.getCapacityForDate(date, supabase);

    res.json({
      success: true,
      data: capacity
    });
  } catch (error) {
    console.error('[capacityController.getCapacityForDate] error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch capacity',
      error: error.message
    });
  }
};

/**
 * GET /api/capacity/range?start=YYYY-MM-DD&end=YYYY-MM-DD
 * Get capacity info for a date range (for calendar view)
 */
export const getCapacityRange = async (req, res) => {
  try {
    const { start, end } = req.query;
    const supabase = getSupabaseForRequest(req);

    if (!start || !end) {
      return res.status(400).json({
        success: false,
        message: 'Start and end dates are required'
      });
    }

    // Validate date formats
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    const capacities = await capacityModel.getCapacityRange(start, end, supabase);

    res.json({
      success: true,
      data: capacities
    });
  } catch (error) {
    console.error('[capacityController.getCapacityRange] error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch capacity range',
      error: error.message
    });
  }
};/**
 * PUT /api/capacity/limits
 * Update capacity limits for a specific date.
 * Accepts { date, dailyCapacity, bufferSlots } or legacy { date, amCapacity, pmCapacity }
 */
export const updateCapacityLimits = async (req, res) => {
  try {
    const { date, dailyCapacity, bufferSlots, amCapacity, pmCapacity } = req.body;
    const supabase = getSupabaseForRequest(req);
    const userId = getActorId(req);

    if (!date) {
      return res.status(400).json({ success: false, message: 'Date is required' });
    }

    // Support legacy API: convert amCapacity+pmCapacity to dailyCapacity
    const legacyCapacity = (amCapacity != null || pmCapacity != null) ? ((amCapacity ?? 0) + (pmCapacity ?? 0)) : null;
    const effectiveCapacity = (dailyCapacity ?? legacyCapacity) || DAILY_CAPACITY;
    const effectiveBuffer = bufferSlots ?? 1;

    // Ensure config row exists
    await capacityModel.getCapacityForDate(date, supabase);

    const { data, error } = await supabase
      .from('daily_capacity_config')
      .update({
        daily_capacity: effectiveCapacity,
        buffer_slots: effectiveBuffer,
        am_capacity: effectiveCapacity,
        pm_capacity: 0,
        updated_at: new Date().toISOString(),
        updated_by: userId
      })
      .eq('date', date)
      .eq('is_deleted', false)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Capacity limits updated successfully',
      data
    });
  } catch (error) {
    console.error('[capacityController.updateCapacityLimits] error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update capacity limits',
      error: error.message
    });
  }
};

/**
 * PUT /api/capacity/notes
 * Update notes for a specific date
 */
export const updateCapacityNotes = async (req, res) => {
  try {
    const { date, notes } = req.body;
    const supabase = getSupabaseForRequest(req);
    const userId = getActorId(req);

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }

    const updated = await capacityModel.updateCapacityNotes(
      date,
      notes || null,
      userId,
      supabase
    );

    res.json({
      success: true,
      message: 'Notes updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('[capacityController.updateCapacityNotes] error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notes',
      error: error.message
    });
  }
};

/**
 * GET /api/capacity/available-slot/:date
 * Get next available time slot for a date
 */
export const getAvailableSlot = async (req, res) => {
  try {
    const { date } = req.params;
    const supabase = getSupabaseForRequest(req);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    const slot = await capacityModel.getAvailableSlot(date, supabase);

    res.json({
      success: true,
      data: { date, slot }
    });
  } catch (error) {
    console.error('[capacityController.getAvailableSlot] error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get available slot',
      error: error.message
    });
  }
};

/**
 * GET /api/capacity/next-available?start=YYYY-MM-DD
 * Find next available date and slot
 */
export const findNextAvailable = async (req, res) => {
  try {
    const { start } = req.query;
    const supabase = getSupabaseForRequest(req);

    if (!start) {
      return res.status(400).json({
        success: false,
        message: 'Start date is required'
      });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    const nextAvailable = await capacityModel.findNextAvailableSlot(start, 90, supabase);

    res.json({
      success: true,
      data: nextAvailable
    });
  } catch (error) {
    console.error('[capacityController.findNextAvailable] error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to find next available slot',
      error: error.message
    });
  }
};

/**
 * GET /api/capacity/patients/:date/:slot?
 * Get list of patients scheduled for a date (and optionally a specific time block)
 */
export const getScheduledPatients = async (req, res) => {
  try {
    const { date, slot } = req.params;
    const supabase = getSupabaseForRequest(req);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    // Accept block times (e.g. '07:30'), legacy AM/PM, or nothing for ALL
    let blockFilter = null;
    if (slot && slot.toUpperCase() !== 'ALL') {
      blockFilter = slot;
    }

    const patients = await capacityModel.getScheduledPatients(
      date,
      blockFilter,
      supabase
    );

    res.json({
      success: true,
      data: {
        date,
        slot: slot ? slot.toUpperCase() : 'ALL',
        count: patients.length,
        patients
      }
    });
  } catch (error) {
    console.error('[capacityController.getScheduledPatients] error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch scheduled patients',
      error: error.message
    });
  }
};

/**
 * POST /api/capacity/recalculate/:date
 * Recalculate capacity counts from actual schedules
 */
export const recalculateCapacity = async (req, res) => {
  try {
    const { date } = req.params;
    const supabase = getSupabaseForRequest(req);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    await capacityModel.recalculateCapacity(date, supabase);
    const updated = await capacityModel.getCapacityForDate(date, supabase);

    res.json({
      success: true,
      message: 'Capacity recalculated successfully',
      data: updated
    });
  } catch (error) {
    console.error('[capacityController.recalculateCapacity] error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to recalculate capacity',
      error: error.message
    });
  }
};

/**
 * GET /api/capacity/stats?start=YYYY-MM-DD&end=YYYY-MM-DD
 * Get capacity statistics for a date range
 */
export const getCapacityStats = async (req, res) => {
  try {
    const { start, end } = req.query;
    const supabase = getSupabaseForRequest(req);

    if (!start || !end) {
      return res.status(400).json({
        success: false,
        message: 'Start and end dates are required'
      });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    const stats = await capacityModel.getCapacityStats(start, end, supabase);

    res.json({
      success: true,
      data: {
        period: { start, end },
        ...stats
      }
    });
  } catch (error) {
    console.error('[capacityController.getCapacityStats] error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get capacity statistics',
      error: error.message
    });
  }
};

/**
 * GET /api/capacity/blocks/:date
 * Get per-block counts for a specific date.
 */
export const getBlockCounts = async (req, res) => {
  try {
    const { date } = req.params;
    const supabase = getSupabaseForRequest(req);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ success: false, message: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const counts = await capacityModel.getBlockCounts(date, supabase);

    res.json({
      success: true,
      data: {
        date,
        blocks: TIME_BLOCKS.map(b => ({
          time: b,
          booked: counts[b] || 0,
          capacity: PATIENTS_PER_BLOCK
        }))
      }
    });
  } catch (error) {
    console.error('[capacityController.getBlockCounts] error:', error);
    res.status(500).json({ success: false, message: 'Failed to get block counts', error: error.message });
  }
};

/**
 * POST /api/capacity/quick-reschedule
 * Quick reschedule: verifies target block has < 3 active appointments, then moves the schedule.
 */
export const quickReschedule = async (req, res) => {
  try {
    const { patientScheduleId, targetDate, targetBlock } = req.body;
    const supabase = getSupabaseForRequest(req);
    const userId = getActorId(req);

    if (!patientScheduleId || !targetDate) {
      return res.status(400).json({ success: false, message: 'patientScheduleId and targetDate are required' });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
      return res.status(400).json({ success: false, message: 'Invalid date format. Use YYYY-MM-DD' });
    }

    // Validate operating day
    const dayOfWeek = new Date(targetDate).getDay();
    if (![1, 2, 3, 4, 5].includes(dayOfWeek)) {
      return res.status(400).json({ success: false, message: 'Target date must be a weekday (Mon-Fri)' });
    }

    // Auto-select block if not provided
    let block = targetBlock;
    if (!block) {
      const counts = await capacityModel.getBlockCounts(targetDate, supabase);
      // For reschedules, allow using the buffer slot
      const { findNextAvailableBlock: findBlock } = await import('../constants/schedulingConfig.js');
      block = findBlock(counts, true); // isReschedule = true
      if (!block) {
        return res.status(409).json({ success: false, message: 'Target date is fully booked (no blocks available)' });
      }
    }

    // Validate block has room (< 3)
    const counts = await capacityModel.getBlockCounts(targetDate, supabase);
    if ((counts[block] || 0) >= PATIENTS_PER_BLOCK) {
      return res.status(409).json({
        success: false,
        message: `Time block ${block} already has ${PATIENTS_PER_BLOCK} patients. Choose a different block.`
      });
    }

    // Perform the reschedule
    const { data, error } = await supabase
      .from('patientschedule')
      .update({
        scheduled_date: targetDate,
        time_slot: block,
        status: 'Rescheduled',
        updated_at: new Date().toISOString(),
        updated_by: userId
      })
      .eq('patient_schedule_id', patientScheduleId)
      .eq('is_deleted', false)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: `Rescheduled to ${targetDate} block ${block}`,
      data
    });
  } catch (error) {
    console.error('[capacityController.quickReschedule] error:', error);
    res.status(500).json({ success: false, message: 'Failed to quick-reschedule', error: error.message });
  }
};
