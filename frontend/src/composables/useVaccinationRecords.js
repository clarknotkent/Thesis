import { ref, computed } from 'vue';
import api from '@/services/api';
import { useToast } from '@/composables/useToast';
import { useConfirm } from '@/composables/useConfirm';
import { getCurrentPHDate, utcToPH } from '@/utils/dateUtils';

export function useVaccinationRecords(patientId, patientDataProp) {
  const { addToast } = useToast();
  const { confirm } = useConfirm();

  // State management
  const loading = ref(false);
  const saving = ref(false);
  const patientData = ref(null);
  const vaccineOptions = ref([]);
  const healthWorkers = ref([]);
  const nurses = ref([]);
  const availableDoses = ref([1, 2, 3, 4, 5]);
  const autoSelectHint = ref('');
  const vaccineCatalog = ref([]);
  const outsideImmunization = ref(false);

  // Visit picker state
  const showVisitPicker = ref(false);
  const loadingVisits = ref(false);
  const visits = ref([]);

  // Schedule editing state
  const editingScheduleIndex = ref(-1);
  const newScheduleDate = ref('');

  // Form for vaccination record
  const vaccinationForm = ref({
    inventoryId: '',
    vaccineId: '',
    vaccineName: '',
    diseasePrevented: '',
    doseNumber: '',
    dateAdministered: getCurrentPHDate(),
    ageAtAdministration: '',
    vaccineManufacturer: '',
    lotNumber: '',
    siteOfAdministration: '',
    healthWorkerId: '',
    facilityName: '',
    remarks: ''
  });

  // Initialize default form for new vaccination record
  const initVaccinationForm = () => {
    vaccinationForm.value = {
      inventoryId: '',
      vaccineId: '',
      vaccineName: '',
      diseasePrevented: '',
      doseNumber: '',
      dateAdministered: getCurrentPHDate(),
      ageAtAdministration: '',
      vaccineManufacturer: '',
      lotNumber: '',
      siteOfAdministration: '',
      healthWorkerId: '',
      facilityName: '',
      remarks: ''
    };
  };

  // Fetch patient data
  const fetchPatientData = async () => {
    if (!patientId.value) {
      return;
    }

    // If patient data is provided as prop, use it directly
    if (patientDataProp.value) {
      patientData.value = patientDataProp.value;
      return;
    }

    try {
      loading.value = true;

      // Fetch patient details and vaccine list in parallel to normalize names
      const [resp, vaccinesResp] = await Promise.all([
        api.get(`/patients/${patientId.value}/details`).catch((error) => {
          console.error('Error fetching patient details:', error);
          return api.get(`/patients/${patientId.value}`).catch((basicError) => {
            console.error('Error fetching patient details from fallback endpoint:', basicError);
            return { data: null };
          });
        }),
        api.get('/vaccines').catch((error) => {
          console.error('Error fetching vaccines:', error);
          return { data: [] };
        })
      ]);

      patientData.value = resp.data?.data || null;
      const vaccinesList = vaccinesResp.data || [];
      const vaccineLookup = {};

      if (Array.isArray(vaccinesList)) {
        vaccinesList.forEach(v => {
          const id = v.vaccine_id || v.id;
          vaccineLookup[id] = v.antigen_name || v.name || v.label || '';
        });
      }

      // Normalize vaccinationHistory entries
      if (patientData.value?.vaccinationHistory && Array.isArray(patientData.value.vaccinationHistory)) {
        patientData.value.vaccinationHistory = patientData.value.vaccinationHistory
          .map(im => ({
            ...im,
            vaccineId: im.vaccineId || im.vaccine_id || (im.vaccine && (im.vaccine.vaccine_id || im.vaccine.id)) || null,
            vaccineName: im.vaccineName || im.vaccine_name || (im.vaccine && (im.vaccine.antigen_name || im.vaccine.name)) || vaccineLookup[im.vaccineId] || vaccineLookup[im.vaccine_id] || ''
          }))
          .filter(im => {
            const recPid = im.patient_id ?? im.patientId ?? im.patient_id_fk ?? im.patient?.patient_id ?? im.patient?.id;
            return recPid ? String(recPid) === String(patientId.value) : true;
          });
      }

      // Normalize nextScheduledVaccinations
      if (patientData.value?.nextScheduledVaccinations && Array.isArray(patientData.value.nextScheduledVaccinations)) {
        patientData.value.nextScheduledVaccinations = patientData.value.nextScheduledVaccinations.map(s => ({
          ...s,
          patient_schedule_id: s.patient_schedule_id || s.patientScheduleId || s.id,
          eligible_date: s.eligible_date || s.eligibleDate,
          vaccineId: s.vaccineId || s.vaccine_id || null,
          vaccineName: s.vaccineName || s.vaccine_name || s.antigen_name || (s.vaccine && (s.vaccine.antigen_name || s.vaccine.name)) || vaccineLookup[s.vaccineId] || vaccineLookup[s.vaccine_id] || '',
          scheduledDate: s.scheduledDate || s.scheduled_date || s.due_date,
          ageAtSchedule: s.ageAtSchedule || s.age_at_schedule || s.scheduled_age,
          doseNumber: s.doseNumber || s.dose_number || s.dose || 1,
          status: s.status || s.schedule_status || 'pending'
        }));
      }
    } catch (error) {
      console.error('Error fetching patient details:', error);
      addToast({ title: 'Error', message: 'Failed to load patient data. Please try again.', type: 'error' });
    } finally {
      loading.value = false;
    }
  };

  // Fetch vaccine options (inventory/stocks)
  const fetchVaccineOptions = async () => {
    try {
      const response = await api.get('/vaccines/inventory');
      const list = Array.isArray(response.data?.data) ? response.data.data : (Array.isArray(response.data) ? response.data : []);
      vaccineOptions.value = list.map(v => ({
        inventory_id: v.inventory_id || v.id,
        vaccine_id: v.vaccine_id,
        antigen_name: v.vaccinemaster?.antigen_name || v.antigen_name || 'Unknown',
        lot_number: v.lot_number || '',
        manufacturer: v.vaccinemaster?.manufacturer || v.manufacturer || '',
        disease_prevented: v.vaccinemaster?.disease_prevented || '',
        expiration_date: v.expiration_date || '',
        current_stock_level: v.current_stock_level || 0,
        isExpired: v.expiration_date ? new Date(v.expiration_date) < new Date(new Date().setHours(0, 0, 0, 0)) : false,
        display_name: `${v.vaccinemaster?.antigen_name || 'Unknown'} (${v.vaccinemaster?.disease_prevented || 'Unknown'}) - Lot: ${v.lot_number || 'N/A'} - Expires: ${v.expiration_date ? new Date(v.expiration_date).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila' }) : 'N/A'} - ${v.vaccinemaster?.manufacturer || 'Unknown'}`
      }));
    } catch (error) {
      console.error('Error fetching vaccine inventory:', error);
      vaccineOptions.value = [];
    }
  };

  // Fetch vaccine catalog (for outside immunizations)
  const fetchVaccineCatalog = async () => {
    try {
      const response = await api.get('/vaccines');
      const list = Array.isArray(response.data?.data) ? response.data.data : (Array.isArray(response.data) ? response.data : []);
      vaccineCatalog.value = list.map(v => ({
        vaccine_id: v.vaccine_id || v.id,
        antigen_name: v.antigen_name || v.name || '',
        disease_prevented: v.disease_prevented || '',
        manufacturer: v.manufacturer || ''
      }));
    } catch (error) {
      console.error('Error fetching vaccine catalog:', error);
      vaccineCatalog.value = [];
    }
  };

  // Fetch health workers
  const fetchHealthWorkers = async () => {
    try {
      const resp = await api.get('/health-staff');

      let allWorkers = [];
      if (resp.data?.data?.healthWorkers && Array.isArray(resp.data.data.healthWorkers)) {
        allWorkers = resp.data.data.healthWorkers;
      } else if (Array.isArray(resp.data)) {
        allWorkers = resp.data;
      } else if (resp.data?.data && Array.isArray(resp.data.data)) {
        allWorkers = resp.data.data;
      } else if (resp.data?.users && Array.isArray(resp.data.users)) {
        allWorkers = resp.data.users;
      } else if (resp.data?.healthWorkers && Array.isArray(resp.data.healthWorkers)) {
        allWorkers = resp.data.healthWorkers;
      }

      healthWorkers.value = allWorkers.filter(hw => {
        const hsType = hw.hs_type || hw.hw_type || hw.role || hw.type || '';
        return hsType.toLowerCase().includes('bhs');
      }).map(hw => ({
        id: hw.user_id || hw.id || hw.health_worker_id,
        health_worker_id: hw.health_worker_id || hw.user_id || hw.id,
        name: [hw.firstname, hw.middlename, hw.surname].filter(Boolean).join(' ').trim() || hw.name || hw.fullname,
        role: hw.hs_type || hw.hw_type || hw.role || hw.type
      }));

      nurses.value = allWorkers.filter(hw => {
        const hsType = hw.hs_type || hw.hw_type || hw.role || hw.type || '';
        return hsType.toLowerCase().includes('nurse') || hsType.toLowerCase().includes('nutritionist');
      }).map(hw => ({
        id: hw.user_id || hw.id || hw.health_worker_id,
        health_worker_id: hw.health_worker_id || hw.user_id || hw.id,
        name: [hw.firstname, hw.middlename, hw.surname].filter(Boolean).join(' ').trim() || hw.name || hw.fullname,
        role: hw.hs_type || hw.hw_type || hw.role || hw.type,
        hs_type: hw.hs_type || hw.hw_type || hw.role || hw.type
      }));
    } catch (err) {
      console.error('Error fetching health workers:', err);
      healthWorkers.value = [];
      nurses.value = [];
    }
  };

  // Fetch visits for visit picker
  const fetchVisits = async () => {
    loadingVisits.value = true;
    visits.value = [];
    try {
      const res = await api.get('/visits', { params: { patient_id: patientId.value } });
      visits.value = res.data?.items || res.data?.data || res.data || [];
    } catch (e) {
      visits.value = [];
    } finally {
      loadingVisits.value = false;
    }
  };

  // Calculate age at administration based on patient's DOB and selected date
  const calculateAgeAtAdministration = () => {
    if (!patientData.value) {
      return;
    }

    const dob = patientData.value?.date_of_birth;
    const adminDate = vaccinationForm.value.dateAdministered;

    if (!dob || !adminDate) {
      vaccinationForm.value.ageAtAdministration = '';
      return;
    }

    try {
      const birth = new Date(dob);
      const admin = new Date(adminDate);

      if (isNaN(birth.getTime()) || isNaN(admin.getTime())) {
        vaccinationForm.value.ageAtAdministration = '';
        return;
      }

      let totalMonths = (admin.getFullYear() - birth.getFullYear()) * 12 + (admin.getMonth() - birth.getMonth());
      let days = admin.getDate() - birth.getDate();

      if (days < 0) {
        totalMonths--;
        const prevMonth = new Date(admin.getFullYear(), admin.getMonth() - 1, 1);
        const daysInPrevMonth = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0).getDate();
        days += daysInPrevMonth;
      }

      if (totalMonths < 0) {
        totalMonths = 0;
      }

      if (totalMonths === 0 && days === 0) {
        vaccinationForm.value.ageAtAdministration = '0 days';
      } else {
        const monthsPart = totalMonths > 0 ? `${totalMonths} month${totalMonths !== 1 ? 's' : ''}` : '';
        const daysPart = days > 0 ? `${days} day${days !== 1 ? 's' : ''}` : '';

        if (monthsPart && daysPart) {
          vaccinationForm.value.ageAtAdministration = `${monthsPart} ${daysPart}`;
        } else if (monthsPart) {
          vaccinationForm.value.ageAtAdministration = monthsPart;
        } else {
          vaccinationForm.value.ageAtAdministration = daysPart;
        }
      }
    } catch (error) {
      console.error('Error calculating age:', error);
      vaccinationForm.value.ageAtAdministration = '';
    }
  };

  // When a vaccine is selected, autofill details from vaccineOptions
  const onVaccineSelect = async () => {
    const iid = vaccinationForm.value.inventoryId;
    if (!iid) {
      vaccinationForm.value.diseasePrevented = '';
      vaccinationForm.value.vaccineManufacturer = '';
      vaccinationForm.value.vaccineName = '';
      vaccinationForm.value.lotNumber = '';
      vaccinationForm.value.vaccineId = '';
      availableDoses.value = [1, 2, 3, 4, 5];
      autoSelectHint.value = '';
      return;
    }

    const v = (vaccineOptions.value || []).find(x => x.inventory_id === iid);
    if (v) {
      vaccinationForm.value.diseasePrevented = v.disease_prevented || '';
      vaccinationForm.value.vaccineManufacturer = v.manufacturer || '';
      vaccinationForm.value.vaccineName = v.antigen_name || '';
      vaccinationForm.value.lotNumber = v.lot_number || '';
      vaccinationForm.value.vaccineId = v.vaccine_id || '';
    }

    calculateAgeAtAdministration();

    try {
      const res = await api.get(`/patients/${patientId.value}/smart-doses`, { params: { vaccine_id: vaccinationForm.value.vaccineId } });
      const data = res.data?.data || res.data || {};
      const doses = Array.isArray(data.available_doses) ? data.available_doses : (Array.isArray(data.doses) ? data.doses : []);
      availableDoses.value = doses.length > 0 ? doses : [1, 2, 3, 4, 5];

      if (data.auto_select) {
        vaccinationForm.value.doseNumber = data.auto_select;
        autoSelectHint.value = `Auto-selected Dose ${data.auto_select} based on schedule`;
      } else if (doses.length === 1) {
        vaccinationForm.value.doseNumber = doses[0];
        autoSelectHint.value = `Auto-selected Dose ${doses[0]} (only remaining)`;
      } else {
        autoSelectHint.value = '';
      }
    } catch (err) {
      console.warn('Smart dose endpoint not available or failed.', err);
      availableDoses.value = [1, 2, 3, 4, 5];
      autoSelectHint.value = '';
    }
  };

  // When a vaccine is selected from catalog (outside flow)
  const onVaccineCatalogSelect = async () => {
    const vid = vaccinationForm.value.vaccineId;
    if (!vid) {
      vaccinationForm.value.diseasePrevented = '';
      vaccinationForm.value.vaccineManufacturer = '';
      vaccinationForm.value.vaccineName = '';
      availableDoses.value = [1, 2, 3, 4, 5];
      autoSelectHint.value = '';
      return;
    }

    const v = (vaccineCatalog.value || []).find(x => x.vaccine_id === vid);
    if (v) {
      vaccinationForm.value.vaccineName = v.antigen_name || '';
      vaccinationForm.value.diseasePrevented = v.disease_prevented || '';
      vaccinationForm.value.vaccineManufacturer = v.manufacturer || '';
      vaccinationForm.value.lotNumber = '';
    }

    calculateAgeAtAdministration();

    try {
      const res = await api.get(`/patients/${patientId.value}/smart-doses`, { params: { vaccine_id: vaccinationForm.value.vaccineId } });
      const data = res.data?.data || res.data || {};
      const doses = Array.isArray(data.available_doses) ? data.available_doses : (Array.isArray(data.doses) ? data.doses : []);
      availableDoses.value = doses.length > 0 ? doses : [1, 2, 3, 4, 5];

      if (data.auto_select) {
        vaccinationForm.value.doseNumber = data.auto_select;
        autoSelectHint.value = `Auto-selected Dose ${data.auto_select} based on schedule`;
      } else if (doses.length === 1) {
        vaccinationForm.value.doseNumber = doses[0];
        autoSelectHint.value = `Auto-selected Dose ${doses[0]} (only remaining)`;
      } else {
        autoSelectHint.value = '';
      }
    } catch (err) {
      console.warn('Smart dose endpoint not available or failed.', err);
      availableDoses.value = [1, 2, 3, 4, 5];
      autoSelectHint.value = '';
    }
  };

  // Delete vaccination record
  const deleteVaccinationRecord = async (vaccine) => {
    try {
      await confirm({
        title: 'Delete Vaccination Record',
        message: `Are you sure you want to delete the vaccination record for ${vaccine.vaccineName}? This action cannot be undone.`,
        variant: 'danger',
        confirmText: 'Delete',
        cancelText: 'Cancel'
      });

      saving.value = true;
      if (vaccine.immunization_id) {
        await api.delete(`/immunizations/${vaccine.immunization_id}`);
      } else {
        await api.delete(`/patients/${patientId.value}/vaccinations`, { 
          data: { lotNumber: vaccine.lotNumber, dateAdministered: vaccine.dateAdministered } 
        });
      }

      await fetchPatientData();
      addToast({ title: 'Deleted', message: 'Vaccination record deleted successfully', type: 'success' });
      return true;
    } catch (error) {
      if (error && error.message !== 'User cancelled') {
        console.error('Error deleting vaccination record:', error);
        addToast({ title: 'Error', message: 'Failed to delete vaccination record. Please try again.', type: 'error' });
      }
      return false;
    } finally {
      saving.value = false;
    }
  };

  // Save vaccination record (add new or update existing)
  const saveVaccinationRecord = async (isEdit, immunizationId, visitContext, selectedVisitId) => {
    try {
      saving.value = true;

      // If in visit context, return vaccination data for the visit
      if (visitContext) {
        const remarksWithSite = vaccinationForm.value.siteOfAdministration
          ? `${vaccinationForm.value.remarks || ''} (Site: ${vaccinationForm.value.siteOfAdministration})`.trim()
          : vaccinationForm.value.remarks || '';

        const savedVaccination = {
          patient_id: patientId.value,
          inventory_id: vaccinationForm.value.inventoryId,
          vaccine_id: vaccinationForm.value.vaccineId,
          vaccine_name: vaccinationForm.value.vaccineName,
          disease_prevented: vaccinationForm.value.diseasePrevented,
          dose_number: vaccinationForm.value.doseNumber || 1,
          administered_date: vaccinationForm.value.dateAdministered,
          age_at_administration: vaccinationForm.value.ageAtAdministration,
          administered_by: vaccinationForm.value.healthWorkerId,
          facility_name: vaccinationForm.value.facilityName,
          remarks: remarksWithSite
        };

        addToast({ title: 'Success', message: 'Vaccination administered and recorded', type: 'success' });
        return { success: true, data: savedVaccination, isVisitContext: true };
      }

      // Normal database save logic
      if (isEdit && immunizationId) {
        const remarksWithSite = vaccinationForm.value.siteOfAdministration
          ? `${vaccinationForm.value.remarks || ''} (Site: ${vaccinationForm.value.siteOfAdministration})`.trim()
          : vaccinationForm.value.remarks || '';

        await api.put(`/immunizations/${immunizationId}`, {
          administered_date: vaccinationForm.value.dateAdministered,
          dose_number: vaccinationForm.value.doseNumber,
          site_of_administration: vaccinationForm.value.siteOfAdministration,
          administered_by: vaccinationForm.value.healthWorkerId,
          facility_name: vaccinationForm.value.facilityName,
          remarks: remarksWithSite
        });
      } else {
        const remarksWithSite = vaccinationForm.value.siteOfAdministration
          ? `${vaccinationForm.value.remarks || ''} (Site: ${vaccinationForm.value.siteOfAdministration})`.trim()
          : vaccinationForm.value.remarks || '';

        if (outsideImmunization.value) {
          await api.post(`/immunizations`, {
            patient_id: patientId.value,
            vaccine_id: vaccinationForm.value.vaccineId,
            administered_date: vaccinationForm.value.dateAdministered,
            dose_number: vaccinationForm.value.doseNumber || 1,
            administered_by: vaccinationForm.value.healthWorkerId,
            facility_name: vaccinationForm.value.facilityName,
            remarks: remarksWithSite,
            outside: true
          });
        } else {
          const payload = {
            patient_id: patientId.value,
            inventory_id: vaccinationForm.value.inventoryId,
            vaccine_id: vaccinationForm.value.vaccineId,
            administered_date: vaccinationForm.value.dateAdministered,
            dose_number: vaccinationForm.value.doseNumber || 1,
            administered_by: vaccinationForm.value.healthWorkerId,
            facility_name: vaccinationForm.value.facilityName,
            remarks: remarksWithSite
          };
          if (selectedVisitId) payload.visit_id = selectedVisitId;
          await api.post(`/immunizations`, payload);
        }
      }

      await fetchPatientData();
      return { success: true };
    } catch (error) {
      console.error('Error saving vaccination record:', error);
      addToast({ title: 'Error', message: 'Failed to save vaccination record. Please try again.', type: 'error' });
      return { success: false };
    } finally {
      saving.value = false;
    }
  };

  // Reschedule vaccination
  const saveScheduleDate = async (vaccine, newDate) => {
    if (!newDate) {
      addToast({ title: 'Error', message: 'Please select a valid date.', type: 'error' });
      return false;
    }

    try {
      await confirm({
        title: 'Confirm Reschedule',
        message: `This will reschedule this vaccination to ${formatDate(newDate)}. Related vaccinations in the schedule may also be adjusted. Do you want to proceed?`,
        variant: 'warning',
        confirmText: 'Yes, Reschedule',
        cancelText: 'Cancel'
      });

      saving.value = true;
      await api.post('/immunizations/manual-reschedule', {
        p_patient_schedule_id: vaccine.patient_schedule_id || vaccine.patientScheduleId,
        p_new_scheduled_date: newDate,
        cascade: true,
        force_override: true
      });

      addToast({ title: 'Success', message: 'Vaccination rescheduled successfully.', type: 'success' });
      await fetchPatientData();
      return true;
    } catch (error) {
      if (error && error.message !== 'User cancelled') {
        console.error('Error rescheduling vaccination:', error);
        const message = error.response?.data?.message || 'Failed to reschedule vaccination.';
        addToast({ title: 'Error', message, type: 'error' });
      }
      return false;
    } finally {
      saving.value = false;
    }
  };

  // Helper functions
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-PH', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateShort = (d) => {
    if (!d) return '';
    try {
      return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'Asia/Manila' });
    } catch {
      return new Date(d).toLocaleDateString();
    }
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return '';

    const birth = new Date(birthDate);
    const today = new Date();
    const ageInMonths = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());

    if (ageInMonths < 12) {
      return `${ageInMonths} months`;
    } else {
      const years = Math.floor(ageInMonths / 12);
      const months = ageInMonths % 12;
      return months > 0 ? `${years}y ${months}m` : `${years} years`;
    }
  };

  const getStatusBadgeClass = (status) => {
    if (!status) return 'bg-secondary';

    const statusLower = status.toString().toLowerCase().trim();

    switch (statusLower) {
      case 'due':
      case 'due now':
      case 'scheduled':
        return 'bg-warning text-dark';
      case 'overdue':
      case 'past due':
      case 'late':
        return 'bg-danger';
      case 'completed':
      case 'done':
      case 'administered':
      case 'given':
        return 'bg-success';
      case 'upcoming':
      case 'future':
      case 'pending':
        return 'bg-info';
      case 'missed':
      case 'skipped':
        return 'bg-secondary';
      default:
        return 'bg-secondary';
    }
  };

  const computeDaysOverdue = (s) => {
    const scheduled = s.scheduledDate || s.scheduled_date || s.date || null;
    if (!scheduled) return 0;
    const grace = parseInt(s.grace_period || s.gracePeriod || s.dose_grace_days || 0, 10) || 0;
    const scheduledDate = new Date(scheduled);
    const deadline = new Date(scheduledDate);
    deadline.setDate(deadline.getDate() + grace);
    const now = new Date();
    if (now <= deadline) return 0;
    const diffMs = now.getTime() - deadline.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  };

  const deriveSite = (v) => {
    const remarks = v?.remarks || v?.notes || '';
    if (remarks) {
      const m = remarks.match(/(?:site|injection site)\s*[:\-]\s*([^;,\.\n]+)/i);
      if (m && m[1]) return m[1].trim();
      if (/deltoid|thigh|vastus|buttock|arm|left|right|intramuscular|subcutaneous/i.test(remarks)) return remarks;
    }
    return v?.site || v?.site_of_administration || v?.siteOfAdministration || '—';
  };

  const deriveFacility = (v) => {
    const isOutside = !!(v?.immunization_outside || v?.is_outside || v?.isOutside || v?.outside_immunization || v?.outside);
    if (isOutside) return 'Outside';
    return (
      v?.immunization_facility_name ||
      v?.facility_name ||
      v?.facilityName ||
      v?.health_center ||
      v?.healthCenter ||
      '—'
    );
  };

  const isOutside = (v) => !!(v?.immunization_outside || v?.is_outside || v?.isOutside || v?.outside_immunization || v?.outside);

  const getMinDate = (vaccine) => {
    const baseline = vaccine.eligible_date || vaccine.eligibleDate || vaccine.baseline_date || vaccine.baselineDate || patientData.value?.date_of_birth;
    return baseline ? utcToPH(baseline).format('YYYY-MM-DD') : '';
  };

  // Computed properties
  const filteredVaccinations = computed(() => {
    const list = patientData.value?.vaccinationHistory || [];
    return list.filter(im => {
      const recPid = im?.patient_id ?? im?.patientId ?? im?.patient_id_fk ?? im?.patient?.patient_id ?? im?.patient?.id;
      return recPid ? String(recPid) === String(patientId.value) : true;
    });
  });

  const sortedVaccinations = computed(() => {
    const list = filteredVaccinations.value || [];
    return [...list].sort((a, b) => {
      const aDate = a.administered_date || a.date_administered || a.dateAdministered;
      const bDate = b.administered_date || b.date_administered || b.dateAdministered;
      const dateA = aDate ? new Date(aDate).getTime() : 0;
      const dateB = bDate ? new Date(bDate).getTime() : 0;
      return dateB - dateA;
    });
  });

  const upcomingSchedules = computed(() => {
    const arr = patientData.value?.nextScheduledVaccinations || [];
    const filtered = arr.filter(s => {
      const st = String(s?.status || s?.schedule_status || '').toLowerCase();
      return !['completed', 'done', 'administered', 'given'].includes(st);
    });
    return filtered.sort((a, b) => {
      const da = new Date(a.scheduledDate || a.scheduled_date || 0).getTime();
      const db = new Date(b.scheduledDate || b.scheduled_date || 0).getTime();
      return da - db;
    });
  });

  const canSave = computed(() => {
    const hasBasics = !!vaccinationForm.value.dateAdministered && !!vaccinationForm.value.doseNumber && !!vaccinationForm.value.healthWorkerId;
    if (!hasBasics) return false;

    if (outsideImmunization.value) {
      return !!vaccinationForm.value.vaccineId;
    }

    if (!vaccinationForm.value.inventoryId) return false;
    const inv = (vaccineOptions.value || []).find(x => x.inventory_id === vaccinationForm.value.inventoryId);
    return inv ? !inv.isExpired : false;
  });

  return {
    // State
    loading,
    saving,
    patientData,
    vaccineOptions,
    healthWorkers,
    nurses,
    availableDoses,
    autoSelectHint,
    vaccineCatalog,
    outsideImmunization,
    vaccinationForm,
    showVisitPicker,
    loadingVisits,
    visits,
    editingScheduleIndex,
    newScheduleDate,

    // Methods
    initVaccinationForm,
    fetchPatientData,
    fetchVaccineOptions,
    fetchVaccineCatalog,
    fetchHealthWorkers,
    fetchVisits,
    calculateAgeAtAdministration,
    onVaccineSelect,
    onVaccineCatalogSelect,
    deleteVaccinationRecord,
    saveVaccinationRecord,
    saveScheduleDate,

    // Helper functions
    formatDate,
    formatDateShort,
    calculateAge,
    getStatusBadgeClass,
    computeDaysOverdue,
    deriveSite,
    deriveFacility,
    isOutside,
    getMinDate,

    // Computed
    filteredVaccinations,
    sortedVaccinations,
    upcomingSchedules,
    canSave
  };
}
