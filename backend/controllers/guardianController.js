const guardianModel = require('../models/guardianModel');
const notificationModel = require('../models/notificationModel');
const { getSupabaseForRequest } = require('../utils/supabaseClient');

// Get all guardians for dropdown
const getAllGuardians = async (req, res) => {
  try {
    const guardians = await guardianModel.getAllGuardians();
    
    res.json({ 
      success: true, 
      data: guardians 
    });
  } catch (error) {
    console.error('Error fetching guardians:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch guardians', 
      error: error.message 
    });
  }
};

// Get guardian by ID
const getGuardianById = async (req, res) => {
  try {
    const { id } = req.params;
    const guardian = await guardianModel.getGuardianById(id);
    
    if (!guardian) {
      return res.status(404).json({ 
        success: false,
        message: 'Guardian not found' 
      });
    }
    
    res.json({ 
      success: true, 
      data: guardian 
    });
  } catch (error) {
    console.error('Error fetching guardian:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch guardian details', 
      error: error.message 
    });
  }
};

// Create a new guardian
const createGuardian = async (req, res) => {
  try {
    const guardianData = req.body;
    
    // Validate required fields
    if (!guardianData.firstname || !guardianData.surname) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing required fields: firstname, surname' 
      });
    }

    const newGuardian = await guardianModel.createGuardian(guardianData);

    // Send welcome notification
    try {
      await notificationModel.createNotification({
        channel: 'Push',
        recipient_user_id: newGuardian.user_id,
        template_code: 'welcome_guardian',
        message_body: `Welcome ${newGuardian.firstname} ${newGuardian.surname}! Your account has been created successfully.`,
        related_entity_type: 'guardian',
        related_entity_id: newGuardian.guardian_id
      }, req.user?.user_id || null);
    } catch (notifError) {
      console.warn('Failed to send welcome notification:', notifError.message);
    }

    res.status(201).json({ 
      success: true,
      message: 'Guardian created successfully', 
      data: newGuardian
    });
  } catch (error) {
    console.error('Error creating guardian:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create guardian', 
      error: error.message 
    });
  }
};

// Update a guardian
const updateGuardian = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const updatedGuardian = await guardianModel.updateGuardian(id, updates);
    
    if (!updatedGuardian) {
      return res.status(404).json({ 
        success: false,
        message: 'Guardian not found' 
      });
    }
    
    res.json({ 
      success: true,
      message: 'Guardian updated successfully',
      data: updatedGuardian 
    });
  } catch (error) {
    console.error('Error updating guardian:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update guardian', 
      error: error.message 
    });
  }
};

// Delete a guardian (soft delete)
const deleteGuardian = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id; // From auth middleware
    
    const result = await guardianModel.deleteGuardian(id, userId);

    if (!result) {
      return res.status(404).json({ 
        success: false,
        message: 'Guardian not found' 
      });
    }

    // result may include cancelledSmsCount for visibility
    const cancelled = result.cancelledSmsCount || 0;
    console.log(`[guardianController] deleteGuardian: cancelled ${cancelled} sms_logs for guardian ${id}`);

    res.json({ 
      success: true,
      message: `Guardian deleted successfully. Cancelled pending scheduled SMS: ${cancelled}`
    });
  } catch (error) {
    console.error('Error deleting guardian:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete guardian', 
      error: error.message 
    });
  }
};

module.exports = {
  getAllGuardians,
  getGuardianById,
  createGuardian,
  updateGuardian,
  deleteGuardian,
  // admin helper: cancel pending scheduled SMS for a guardian
  cancelPendingSmsForGuardian: async (req, res) => {
    try {
      const { id } = req.params;
      const supabase = getSupabaseForRequest(req);

      const { data, error } = await supabase
        .from('sms_logs')
        .update({
          is_deleted: true,
          status: 'cancelled',
          error_message: 'Cancelled by admin: guardian cleanup',
          updated_at: new Date().toISOString()
        })
        .eq('guardian_id', id)
        .eq('status', 'pending')
        .eq('type', 'scheduled')
        .select('id');

      if (error) {
        console.error('[cancelPendingSmsForGuardian] supabase error:', error);
        return res.status(500).json({ success: false, message: 'Failed to cancel sms_logs', error: error.message || error });
      }

      const count = Array.isArray(data) ? data.length : 0;
      console.log(`[cancelPendingSmsForGuardian] Cancelled ${count} pending scheduled sms_logs for guardian ${id}`);
      return res.json({ success: true, cancelled: count, ids: (data || []).map(r => r.id) });
    } catch (err) {
      console.error('[cancelPendingSmsForGuardian] unexpected error:', err);
      return res.status(500).json({ success: false, message: 'Internal error', error: err?.message || String(err) });
    }
  }
};