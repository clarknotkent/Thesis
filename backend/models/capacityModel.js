import serviceSupabase from '../db.js';
import {
  TIME_BLOCKS,
  PATIENTS_PER_BLOCK,
  DAILY_CAPACITY,
  BUFFER_SLOTS,
  BOOKABLE_CAPACITY,
  isOperatingDay,
  findNextAvailableBlock
} from '../constants/schedulingConfig.js';

function withClient(client) {
  return client || serviceSupabase;
}

const capacityModel = {
  /**
   * Get capacity configuration for a specific date
   * Creates default config if it doesn't exist
   */
  getCapacityForDate: async (date, client) => {
    try {
      const supabase = withClient(client);
      const { data, error } = await supabase.rpc('get_or_create_capacity_config', {
        p_date: date
      });

      if (error) throw error;
      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('Error fetching capacity for date:', error);
      throw error;
    }
  },

  /**
   * Get capacity for a date range (for calendar view).
   * Returns daily capacity + total booked + per-block breakdown.
   */
  getCapacityRange: async (startDate, endDate, client) => {
    try {
      const supabase = withClient(client);

      // Fetch config rows
      const { data: configs, error: cfgErr } = await supabase
        .from('daily_capacity_config')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .eq('is_deleted', false)
        .order('date', { ascending: true });
      if (cfgErr) throw cfgErr;

      // Fetch all active schedules in range for block counts
      const { data: schedules, error: schErr } = await supabase
        .from('patientschedule')
        .select('scheduled_date, time_slot')
        .gte('scheduled_date', startDate)
        .lte('scheduled_date', endDate)
        .eq('is_deleted', false)
        .not('status', 'in', '(Completed,Cancelled)');
      if (schErr) throw schErr;

      // Build per-date block counts
      const dateBlockCounts = {};
      const dateTotals = {};
      (schedules || []).forEach(s => {
        const d = s.scheduled_date;
        if (!dateBlockCounts[d]) dateBlockCounts[d] = {};
        if (!dateTotals[d]) dateTotals[d] = 0;
        const block = s.time_slot || '07:30';
        dateBlockCounts[d][block] = (dateBlockCounts[d][block] || 0) + 1;
        dateTotals[d]++;
      });

      const existingDates = new Map((configs || []).map(d => [d.date, d]));

      const result = [];
      const start = new Date(startDate);
      const end = new Date(endDate);

      for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        const dateStr = date.toISOString().split('T')[0];
        const cfg = existingDates.get(dateStr);
        const totalBooked = dateTotals[dateStr] || 0;
        const blockCounts = dateBlockCounts[dateStr] || {};
        const capacity = cfg?.daily_capacity || DAILY_CAPACITY;
        const buffer = cfg?.buffer_slots ?? BUFFER_SLOTS;

        result.push({
          date: dateStr,
          daily_capacity: capacity,
          total_booked: totalBooked,
          buffer_slots: buffer,
          bookable_capacity: capacity - buffer,
          notes: cfg?.notes || null,
          blocks: TIME_BLOCKS.map(b => ({
            time: b,
            booked: blockCounts[b] || 0,
            capacity: PATIENTS_PER_BLOCK
          })),
          // Legacy fields for backward compatibility
          am_capacity: capacity,
          pm_capacity: 0,
          am_booked: totalBooked,
          pm_booked: 0
        });
      }

      return result;
    } catch (error) {
      console.error('Error fetching capacity range:', error);
      throw error;
    }
  },

  /**
   * Update capacity limits for a specific date
   */
  updateCapacityLimits: async (date, amCapacity, pmCapacity, userId = null, client) => {
    try {
      const supabase = withClient(client);

      // First ensure the config exists
      await capacityModel.getCapacityForDate(date, client);

      const { data, error } = await supabase
        .from('daily_capacity_config')
        .update({
          am_capacity: amCapacity,
          pm_capacity: pmCapacity,
          updated_at: new Date().toISOString(),
          updated_by: userId
        })
        .eq('date', date)
        .eq('is_deleted', false)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating capacity limits:', error);
      throw error;
    }
  },

  /**
   * Update notes for a specific date
   */
  updateCapacityNotes: async (date, notes, userId = null, client) => {
    try {
      const supabase = withClient(client);

      // First ensure the config exists
      await capacityModel.getCapacityForDate(date, client);

      const { data, error } = await supabase
        .from('daily_capacity_config')
        .update({
          notes: notes,
          updated_at: new Date().toISOString(),
          updated_by: userId
        })
        .eq('date', date)
        .eq('is_deleted', false)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating capacity notes:', error);
      throw error;
    }
  },

  /**
   * Get available time block for a specific date.
   * Returns a block time string (e.g. '07:30') or null if full.
   */
  getAvailableSlot: async (date, client) => {
    try {
      const supabase = withClient(client);
      const { data, error } = await supabase.rpc('get_available_slot', {
        p_date: date
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting available slot:', error);
      throw error;
    }
  },

  /**
   * Get block-level counts for a date (how many patients per block).
   */
  getBlockCounts: async (date, client) => {
    try {
      const supabase = withClient(client);
      const { data, error } = await supabase
        .from('patientschedule')
        .select('time_slot')
        .eq('scheduled_date', date)
        .eq('is_deleted', false)
        .not('status', 'in', '(Completed,Cancelled)');

      if (error) throw error;

      const counts = {};
      TIME_BLOCKS.forEach(b => { counts[b] = 0; });
      (data || []).forEach(s => {
        const block = s.time_slot || '07:30';
        counts[block] = (counts[block] || 0) + 1;
      });
      return counts;
    } catch (error) {
      console.error('Error getting block counts:', error);
      throw error;
    }
  },

  /**
   * Find next available date/block starting from a given date.
   * Skips weekends (non-operating days).
   */
  findNextAvailableSlot: async (startDate, maxDaysAhead = 90, client) => {
    try {
      const start = new Date(startDate);

      for (let i = 0; i < maxDaysAhead; i++) {
        const checkDate = new Date(start);
        checkDate.setDate(start.getDate() + i);

        // Skip non-operating days (weekends)
        if (!isOperatingDay(checkDate.getDay())) continue;

        const dateStr = checkDate.toISOString().split('T')[0];

        const blockCounts = await capacityModel.getBlockCounts(dateStr, client);
        const block = findNextAvailableBlock(blockCounts);
        if (block) {
          return { date: dateStr, slot: block };
        }
      }

      // Fallback
      return { date: startDate, slot: '07:30' };
    } catch (error) {
      console.error('Error finding next available slot:', error);
      throw error;
    }
  },

  /**
   * Get list of patients scheduled for a specific date and optional time block.
   */
  getScheduledPatients: async (date, timeBlock = null, client) => {
    try {
      const supabase = withClient(client);
      let query = supabase
        .from('patientschedule')
        .select(`
          patient_schedule_id,
          scheduled_date,
          time_slot,
          status,
          dose_number,
          vaccine_id,
          vaccines:vaccine_id (
            vaccine_id,
            antigen_name,
            brand_name
          ),
          patients:patient_id (
            patient_id,
            firstname,
            middlename,
            surname,
            date_of_birth,
            sex,
            barangay
          )
        `)
        .eq('scheduled_date', date)
        .eq('is_deleted', false)
        .not('status', 'in', '(Completed,Cancelled)');

      if (timeBlock) {
        query = query.eq('time_slot', timeBlock);
      }

      const { data, error } = await query.order('time_slot', { ascending: true });

      if (error) throw error;

      return (data || []).map(schedule => ({
        scheduleId: schedule.patient_schedule_id,
        scheduledDate: schedule.scheduled_date,
        timeBlock: schedule.time_slot,
        timeSlot: schedule.time_slot, // backward compat
        status: schedule.status,
        doseNumber: schedule.dose_number,
        vaccine: {
          id: schedule.vaccines?.vaccine_id,
          name: schedule.vaccines?.antigen_name,
          brand: schedule.vaccines?.brand_name
        },
        patient: {
          id: schedule.patients?.patient_id,
          name: [
            schedule.patients?.firstname,
            schedule.patients?.middlename,
            schedule.patients?.surname
          ].filter(Boolean).join(' '),
          dateOfBirth: schedule.patients?.date_of_birth,
          sex: schedule.patients?.sex,
          barangay: schedule.patients?.barangay
        }
      }));
    } catch (error) {
      console.error('Error fetching scheduled patients:', error);
      throw error;
    }
  },

  /**
   * Recalculate capacity counts from actual schedules
   * Useful for fixing discrepancies
   */
  recalculateCapacity: async (date, client) => {
    try {
      const supabase = withClient(client);
      const { error } = await supabase.rpc('recalc_capacity_from_schedules', {
        p_date: date
      });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error recalculating capacity:', error);
      throw error;
    }
  },

  /**
   * Get capacity statistics for a date range
   */
  getCapacityStats: async (startDate, endDate, client) => {
    try {
      const capacities = await capacityModel.getCapacityRange(startDate, endDate, client);

      let totalCapacity = 0;
      let totalBooked = 0;
      let fullDays = 0;
      let nearFullDays = 0;

      capacities.forEach(day => {
        const dayCapacity = day.daily_capacity || DAILY_CAPACITY;
        const dayBooked = day.total_booked || 0;

        totalCapacity += dayCapacity;
        totalBooked += dayBooked;

        const utilizationPercent = (dayBooked / dayCapacity) * 100;
        if (utilizationPercent >= 100) fullDays++;
        else if (utilizationPercent >= 80) nearFullDays++;
      });

      return {
        totalCapacity,
        totalBooked,
        utilizationPercent: totalCapacity > 0 ? (totalBooked / totalCapacity) * 100 : 0,
        fullDays,
        nearFullDays,
        totalDays: capacities.length
      };
    } catch (error) {
      console.error('Error calculating capacity stats:', error);
      throw error;
    }
  },

  /**
   * Manually increment booked count (use with caution)
   */
  incrementSlotBooking: async (date, slot, client) => {
    try {
      const supabase = withClient(client);
      const { error } = await supabase.rpc('increment_slot_booking', {
        p_date: date,
        p_slot: slot
      });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error incrementing slot booking:', error);
      throw error;
    }
  },

  /**
   * Manually decrement booked count (use with caution)
   */
  decrementSlotBooking: async (date, slot, client) => {
    try {
      const supabase = withClient(client);
      const { error } = await supabase.rpc('decrement_slot_booking', {
        p_date: date,
        p_slot: slot
      });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error decrementing slot booking:', error);
      throw error;
    }
  }
};

export default capacityModel;
