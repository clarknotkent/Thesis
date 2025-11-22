import serviceSupabase from '../db.js';

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
   * Get capacity for a date range (for calendar view)
   */
  getCapacityRange: async (startDate, endDate, client) => {
    try {
      const supabase = withClient(client);
      const { data, error } = await supabase
        .from('daily_capacity_config')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .eq('is_deleted', false)
        .order('date', { ascending: true });

      if (error) throw error;

      // Fill in missing dates with defaults
      const result = [];
      const start = new Date(startDate);
      const end = new Date(endDate);
      const existingDates = new Map(data.map(d => [d.date, d]));

      for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        const dateStr = date.toISOString().split('T')[0];
        if (existingDates.has(dateStr)) {
          result.push(existingDates.get(dateStr));
        } else {
          // Create default entry
          result.push({
            date: dateStr,
            am_capacity: 25,
            pm_capacity: 25,
            am_booked: 0,
            pm_booked: 0,
            notes: null
          });
        }
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
   * Get available time slot for a specific date
   * Returns 'AM', 'PM', or null if both full
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
   * Find next available date/slot starting from a given date
   */
  findNextAvailableSlot: async (startDate, maxDaysAhead = 90, client) => {
    try {
      const supabase = withClient(client);
      const start = new Date(startDate);
      
      for (let i = 0; i < maxDaysAhead; i++) {
        const checkDate = new Date(start);
        checkDate.setDate(start.getDate() + i);
        const dateStr = checkDate.toISOString().split('T')[0];
        
        const slot = await capacityModel.getAvailableSlot(dateStr, client);
        if (slot) {
          return { date: dateStr, slot };
        }
      }
      
      // If no slot found, return the start date with AM as fallback
      return { date: startDate, slot: 'AM' };
    } catch (error) {
      console.error('Error finding next available slot:', error);
      throw error;
    }
  },

  /**
   * Get list of patients scheduled for a specific date and time slot
   */
  getScheduledPatients: async (date, timeSlot = null, client) => {
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

      if (timeSlot) {
        query = query.eq('time_slot', timeSlot);
      }

      const { data, error } = await query.order('time_slot', { ascending: true });

      if (error) throw error;

      // Format the data for easier consumption
      return (data || []).map(schedule => ({
        scheduleId: schedule.patient_schedule_id,
        scheduledDate: schedule.scheduled_date,
        timeSlot: schedule.time_slot,
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
        const dayCapacity = day.am_capacity + day.pm_capacity;
        const dayBooked = day.am_booked + day.pm_booked;
        
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
