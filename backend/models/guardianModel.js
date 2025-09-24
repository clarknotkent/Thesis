const supabase = require('../db');

const guardianModel = {
  // Fetch all guardians (for dropdown) from users table where role='guardian'
  getAllGuardians: async () => {
    try {
      // Join users with guardians table to get family_number (left join to include users without guardian records)
      const { data, error } = await supabase
        .from('users')
        .select(`
          user_id,
          surname,
          firstname,
          middlename,
          contact_number,
          email,
          address,
          guardians!guardians_user_id_fkey (
            family_number
          )
        `)
        .eq('role', 'Guardian')
        .eq('is_deleted', false)
        .order('surname', { ascending: true });

      if (error) throw error;
      
      // Transform data for dropdown compatibility
      const guardiansWithFullName = (data || []).map(user => ({
        guardian_id: user.user_id,
        user_id: user.user_id,
        surname: user.surname,
        firstname: user.firstname,
        middlename: user.middlename,
        contact_number: user.contact_number,
        email: user.email,
        address: user.address,
  family_number: user.guardians[0]?.family_number || '',
        full_name: `${user.surname}, ${user.firstname} ${user.middlename || ''}`.trim()
      }));

      return guardiansWithFullName;
    } catch (error) {
      console.error('Error fetching guardians:', error);
      throw error;
    }
  },

  // Get guardian by ID
  getGuardianById: async (id) => {
    try {
      const { data, error } = await supabase
        .from('guardians')
        .select('*')
        .eq('guardian_id', id)
        .eq('is_deleted', false)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error) {
      console.error('Error fetching guardian by ID:', error);
      throw error;
    }
  },

  // Create a new guardian
  createGuardian: async (guardianData) => {
    try {
      // Auto-generate family_number if not provided (column is NOT NULL)
      let familyNumber = guardianData.family_number;
      if (!familyNumber) {
        familyNumber = 'FAM-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(Math.random() * 1e4).toString().padStart(4, '0');
      }
      const { data, error } = await supabase
        .from('guardians')
        .insert({
          surname: guardianData.surname,
          firstname: guardianData.firstname,
          middlename: guardianData.middlename,
          birthdate: guardianData.birthdate,
          address: guardianData.address,
          occupation: guardianData.occupation,
          contact_number: guardianData.contact_number,
          alternative_contact_number: guardianData.alternative_contact_number,
          email: guardianData.email,
          family_number: familyNumber,
          user_id: guardianData.user_id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating guardian:', error);
      throw error;
    }
  },

  // Update a guardian
  updateGuardian: async (id, guardianData) => {
    try {
      const { data, error } = await supabase
        .from('guardians')
        .update({
          ...guardianData,
          updated_at: new Date().toISOString()
        })
        .eq('guardian_id', id)
        .eq('is_deleted', false)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating guardian:', error);
      throw error;
    }
  },

  // Soft delete a guardian
  deleteGuardian: async (id, deletedBy) => {
    try {
      const { data, error } = await supabase
        .from('guardians')
        .update({ 
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: deletedBy 
        })
        .eq('guardian_id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error deleting guardian:', error);
      throw error;
    }
  },
};

module.exports = guardianModel;