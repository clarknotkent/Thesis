const supabase = require('../db');

const vaccineModel = {
  // Get all vaccines with filtering and pagination
  getAllVaccines: async (filters = {}, page = 1, limit = 10) => {
    try {
      let query = supabase
        .from('vaccinemaster')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters.vaccine_type) {
        query = query.eq('vaccine_type', filters.vaccine_type);
      }
      
      if (filters.age_group) {
        query = query.eq('age_group', filters.age_group);
      }
      
      if (filters.search) {
        query = query.or(`antigen_name.ilike.%${filters.search}%,brand_name.ilike.%${filters.search}%`);
      }

      // Apply pagination
      const offset = (page - 1) * limit;
      const { data, error, count } = await query
        .range(offset, offset + limit - 1)
        .order('antigen_name', { ascending: true });

      if (error) throw error;

      return {
        vaccines: data || [],
        totalCount: count || 0,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil((count || 0) / limit)
      };
    } catch (error) {
      console.error('Error fetching vaccines:', error);
      throw error;
    }
  },

  // Get vaccine by ID
  getVaccineById: async (id) => {
    try {
      const { data, error } = await supabase
        .from('vaccinemaster')
        .select('*')
        .eq('vaccine_id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error) {
      console.error('Error fetching vaccine by ID:', error);
      throw error;
    }
  },

  // Create new vaccine
  createVaccine: async (vaccineData) => {
    try {
      const { data, error } = await supabase
        .from('vaccinemaster')
        .insert({
          antigen_name: vaccineData.antigen_name,
          brand_name: vaccineData.brand_name,
          manufacturer: vaccineData.manufacturer,
          vaccine_type: vaccineData.vaccine_type,
          dosage: vaccineData.dosage,
          route_of_administration: vaccineData.route_of_administration,
          storage_requirements: vaccineData.storage_requirements,
          contraindications: vaccineData.contraindications,
          adverse_reactions: vaccineData.adverse_reactions
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating vaccine:', error);
      throw error;
    }
  },

  // Update vaccine
  updateVaccine: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('vaccinemaster')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating vaccine:', error);
      throw error;
    }
  },

  // Soft delete vaccine
  deleteVaccine: async (id) => {
    try {
      const { data, error } = await supabase
        .from('vaccinemaster')
        .update({ 
          is_deleted: true,
          deleted_at: new Date().toISOString()
        })
        .eq('vaccine_id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error deleting vaccine:', error);
      throw error;
    }
  },

  // Get vaccine schedule by age group
  getVaccineScheduleByAgeGroup: async (ageGroup) => {
    try {
      const { data, error } = await supabase
        .from('schedulemaster')
        .select(`
          *,
          vaccine:vaccine_id (
            vaccine_id,
            antigen_name,
            brand_name,
            dosage,
            route_of_administration
          )
        `)
        .eq('age_group', ageGroup)
        .eq('is_deleted', false)
        .order('recommended_age_weeks', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching vaccine schedule:', error);
      throw error;
    }
  },

  // vaccinemaster Management Functions
  // Add vaccine vaccinemaster
  addvaccinemaster: async (vaccinemasterData) => {
    try {
      const { data, error } = await supabase
        .from('vaccinemaster')
        .insert({
          vaccine_id: vaccinemasterData.vaccine_id,
          lot_number: vaccinemasterData.lot_number,
          expiry_date: vaccinemasterData.expiry_date,
          quantity: vaccinemasterData.quantity,
          cost_per_dose: vaccinemasterData.cost_per_dose,
          supplier: vaccinemasterData.supplier,
          received_date: vaccinemasterData.received_date,
          location: vaccinemasterData.location,
          status: vaccinemasterData.status
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding vaccinemaster:', error);
      throw error;
    }
  },

  // Get vaccinemaster by ID
  getvaccinemasterById: async (id) => {
    try {
      const { data, error } = await supabase
        .from('vaccinemaster')
        .select(`
          *,
          vaccines:vaccine_id (
            antigen_name,
            brand_name,
            vaccine_type
          )
        `)
        .eq('vaccinemaster_id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching vaccinemaster by ID:', error);
      throw error;
    }
  },

  // Update vaccinemaster
  updatevaccinemaster: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('vaccinemaster')
        .update({
          ...updates
        })
        .eq('vaccinemaster_id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating vaccinemaster:', error);
      throw error;
    }
  },

  // Delete vaccinemaster
  deletevaccinemaster: async (id) => {
    try {
      const { data, error } = await supabase
        .from('vaccinemaster')
        .update({ is_deleted: true })
        .eq('vaccinemaster_id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error deleting vaccinemaster:', error);
      throw error;
    }
  },

  // Get all vaccinemaster with filtering
  getAllvaccinemaster: async (filters = {}, page = 1, limit = 10) => {
    try {
      let query = supabase
        .from('vaccinemaster')
        .select(`
          *,
          vaccines:vaccine_id (
            antigen_name,
            brand_name,
            vaccine_type
          )
        `, { count: 'exact' })
        .eq('is_deleted', false)
        .order('vaccinemaster_id', { ascending: false });

      // Apply filters
      if (filters.vaccine_id) {
        query = query.eq('vaccine_id', filters.vaccine_id);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.location) {
        query = query.eq('location', filters.location);
      }
      if (filters.expiring_soon) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);
        query = query.lt('expiry_date', futureDate.toISOString());
      }

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;
      return {
        vaccinemaster: data,
        totalCount: count,
        currentPage: page,
        totalPages: Math.ceil(count / limit)
      };
    } catch (error) {
      console.error('Error fetching vaccinemaster:', error);
      throw error;
    }
  },

  // vaccinemaster Request Functions
  // Create vaccinemaster request
  createvaccinemasterRequest: async (requestData) => {
    try {
      const { data, error } = await supabase
        .from('vaccinemaster_requests')
        .insert({
          vaccine_id: requestData.vaccine_id,
          requested_quantity: requestData.requested_quantity,
          priority: requestData.priority,
          reason: requestData.reason,
          requested_by: requestData.requested_by,
          facility_id: requestData.facility_id,
          urgency_date: requestData.urgency_date,
          notes: requestData.notes,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating vaccinemaster request:', error);
      throw error;
    }
  },

  // Update vaccinemaster request
  updatevaccinemasterRequest: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('vaccinemaster_requests')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating vaccinemaster request:', error);
      throw error;
    }
  },

  // Get all vaccinemaster requests
  getAllvaccinemasterRequests: async (filters = {}, page = 1, limit = 10) => {
    try {
      let query = supabase
        .from('vaccinemaster_requests')
        .select(`
          *,
          vaccines:vaccine_id (
            antigen_name,
            manufacturer
          ),
          requested_by_user:requested_by (
            username,
            email
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters.facility_id) {
        query = query.eq('facility_id', filters.facility_id);
      }

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;
      return {
        requests: data,
        totalCount: count,
        currentPage: page,
        totalPages: Math.ceil(count / limit)
      };
    } catch (error) {
      console.error('Error fetching vaccinemaster requests:', error);
      throw error;
    }
  },

  // vaccinemaster Transaction Functions
  // Create vaccinemaster transaction
  createvaccinemasterTransaction: async (transactionData) => {
    try {
      const { data, error } = await supabase
        .from('vaccinemaster_transactions')
        .insert({
          vaccinemaster_id: transactionData.vaccinemaster_id,
          transaction_type: transactionData.transaction_type,
          quantity: transactionData.quantity,
          reference_id: transactionData.reference_id,
          reference_type: transactionData.reference_type,
          performed_by: transactionData.performed_by,
          notes: transactionData.notes,
          transaction_date: transactionData.transaction_date,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating vaccinemaster transaction:', error);
      throw error;
    }
  },

  // Get all vaccinemaster transactions
  getAllvaccinemasterTransactions: async (filters = {}, page = 1, limit = 10) => {
    try {
      let query = supabase
        .from('vaccinemaster_transactions')
        .select(`
          *,
          vaccinemaster:vaccinemaster_id (
            batch_number,
            vaccines:vaccine_id (
              antigen_name
            )
          ),
          performed_by_user:performed_by (
            username,
            email
          )
        `, { count: 'exact' })
        .order('transaction_date', { ascending: false });

      // Apply filters
      if (filters.vaccinemaster_id) {
        query = query.eq('vaccinemaster_id', filters.vaccinemaster_id);
      }
      if (filters.transaction_type) {
        query = query.eq('transaction_type', filters.transaction_type);
      }
      if (filters.date_from) {
        query = query.gte('transaction_date', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('transaction_date', filters.date_to);
      }

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;
      return {
        transactions: data,
        totalCount: count,
        currentPage: page,
        totalPages: Math.ceil(count / limit)
      };
    } catch (error) {
      console.error('Error fetching vaccinemaster transactions:', error);
      throw error;
    }
  }
};

module.exports = vaccineModel;
