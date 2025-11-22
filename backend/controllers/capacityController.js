import capacityModel from '../models/capacityModel.js';
import { getSupabaseForRequest } from '../utils/supabaseClient.js';
import { getActorId } from '../utils/actor.js';

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
};

/**
 * PUT /api/capacity/limits
 * Update capacity limits for a specific date
 */
export const updateCapacityLimits = async (req, res) => {
  try {
    const { date, amCapacity, pmCapacity } = req.body;
    const supabase = getSupabaseForRequest(req);
    const userId = getActorId(req);

    if (!date || amCapacity === undefined || pmCapacity === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Date, amCapacity, and pmCapacity are required' 
      });
    }

    // Validate capacities are positive integers
    if (!Number.isInteger(amCapacity) || !Number.isInteger(pmCapacity) || 
        amCapacity < 0 || pmCapacity < 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Capacities must be non-negative integers' 
      });
    }

    const updated = await capacityModel.updateCapacityLimits(
      date, 
      amCapacity, 
      pmCapacity, 
      userId,
      supabase
    );
    
    res.json({
      success: true,
      message: 'Capacity limits updated successfully',
      data: updated
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
 * Get list of patients scheduled for a date (and optionally a specific slot)
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

    if (slot && !['AM', 'PM'].includes(slot.toUpperCase())) {
      return res.status(400).json({ 
        success: false, 
        message: 'Slot must be either AM or PM' 
      });
    }

    const patients = await capacityModel.getScheduledPatients(
      date, 
      slot ? slot.toUpperCase() : null, 
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
