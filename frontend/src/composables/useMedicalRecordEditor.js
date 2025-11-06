import { ref, computed, watch } from 'vue';
import api from '@/services/api';
import { useToast } from '@/composables/useToast';
import { useConfirm } from '@/composables/useConfirm';
import { getCurrentPHDate, utcToPH } from '@/utils/dateUtils';

export function useMedicalRecordEditor(props) {
  const { addToast } = useToast();
  const { confirm } = useConfirm();

  // State
  const patients = ref([]);
  const patientSearch = ref('');
  const healthWorkers = ref([]);
  const nurses = ref([]);
  const loading = ref(false);
  const selectedPatientData = ref(null);
  const showVaccinationForm = ref(false);
  const savingVaccination = ref(false);
  const vaccineOptions = ref([]);
  const vaccineCatalog = ref([]);
  const showNipOnly = ref(false);
  const availableDoses = ref([1, 2, 3, 4, 5]);
  const autoSelectHint = ref('');
  const hasOutsideInRecord = ref(false);

  // Local buffer for collected vaccinations
  const localCollectedVaccinations = ref(
    Array.isArray(props.collectedVaccinations) ? [...props.collectedVaccinations] : []
  );

  // Forms
  const form = ref({
    patient_id: '',
    recorded_by: '',
    visit_date: getCurrentPHDate(),
    vitals: {
      temperature: '',
      muac: '',
      respiration: '',
      weight: '',
      height: ''
    },
    findings: '',
    service_rendered: ''
  });

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
    remarks: '',
    outside: false,
    editingIndex: undefined
  });

  // Computed properties
  const viewOnly = computed(() => !!props.viewMode);
  const existingRecordMode = computed(() => !!props.existingVisitId);
  const lockPatientEffective = computed(() => props.lockPatient || !!props.existingVisitId);

  const isSaveDisabled = computed(() => 
    existingRecordMode.value && 
    !props.editMode && 
    (!localCollectedVaccinations.value || localCollectedVaccinations.value.length === 0)
  );

  const autoFilledFindings = computed(() => {
    if (!localCollectedVaccinations.value || localCollectedVaccinations.value.length === 0) return '';
    
    const services = localCollectedVaccinations.value;
    const vaccineCount = services.filter(s => s.inventory_id || s.vaccine_id).length;
    const dewormingCount = services.filter(s => s.deworming_type).length;
    const vitaminACount = services.filter(s => s.vitamin_a_type).length;
    
    const findings = [];
    if (vaccineCount > 0) findings.push(`${vaccineCount} vaccine${vaccineCount > 1 ? 's' : ''} administered`);
    if (dewormingCount > 0) findings.push(`${dewormingCount} deworming treatment${dewormingCount > 1 ? 's' : ''} given`);
    if (vitaminACount > 0) findings.push(`${vitaminACount} vitamin A supplement${vitaminACount > 1 ? 's' : ''} provided`);
    
    return findings.join(', ');
  });

  const autoFilledServiceRendered = computed(() => {
    if (!localCollectedVaccinations.value || localCollectedVaccinations.value.length === 0) return '';
    
    const services = localCollectedVaccinations.value;
    const vaccineCount = services.filter(s => s.inventory_id || s.vaccine_id).length;
    const dewormingCount = services.filter(s => s.deworming_type).length;
    const vitaminACount = services.filter(s => s.vitamin_a_type).length;
    
    const servicesRendered = [];
    if (vaccineCount > 0) servicesRendered.push(`Vaccination (${vaccineCount} dose${vaccineCount > 1 ? 's' : ''})`);
    if (dewormingCount > 0) servicesRendered.push(`Deworming (${dewormingCount} treatment${dewormingCount > 1 ? 's' : ''})`);
    if (vitaminACount > 0) servicesRendered.push(`Vitamin A supplementation (${vitaminACount} dose${vitaminACount > 1 ? 's' : ''})`);
    
    return servicesRendered.join(', ');
  });

  const patientDisplayName = computed(() => {
    if (selectedPatientData.value) {
      const p = selectedPatientData.value;
      const parts = [
        p.firstname || p.first_name || p.firstName,
        p.middlename || p.middle_name || p.middleName,
        p.surname || p.last_name || p.lastName
      ].filter(Boolean);
      const name = parts.join(' ').trim();
      if (name) return name;
    }
    try {
      const opt = (patients.value || []).find(o => String(o.id) === String(form.value.patient_id));
      return opt?.childInfo?.name || '—';
    } catch {
      return '—';
    }
  });

  const recordedByDisplayName = computed(() => {
    const hw = healthWorkers.value.find(h => String(h.user_id) === String(form.value.recorded_by));
    return hw?.fullname || form.value.recorded_by || '—';
  });

  // Data fetching methods
  const fetchPatients = async () => {
    try {
      const params = { limit: 100 };
      if (patientSearch.value && patientSearch.value.trim() !== '') {
        params.search = patientSearch.value.trim();
      }
      const res = await api.get('/patients', { params });
      const payload = res.data?.data || {};
      const list = payload.patients || payload.items || payload || [];
      patients.value = list.map(p => ({
        id: String(p.patient_id || p.id),
        childInfo: { name: [p.firstname, p.middlename, p.surname].filter(Boolean).join(' ').trim() }
      }));
      
      if (form.value.patient_id && selectedPatientData.value) {
        const existingPatient = patients.value.find(p => p.id === form.value.patient_id);
        if (!existingPatient) {
          const currentPatient = {
            id: form.value.patient_id,
            childInfo: { 
              name: [selectedPatientData.value.firstname, selectedPatientData.value.middlename, selectedPatientData.value.surname]
                .filter(Boolean).join(' ').trim() 
            }
          };
          patients.value.unshift(currentPatient);
        }
      }
    } catch (err) {
      console.error('Failed to load patients', err);
      patients.value = [];
    }
  };

  const fetchHealthWorkers = async () => {
    try {
      const res = await api.get('/health-staff');
      
      let list = [];
      if (res.data?.data?.healthWorkers && Array.isArray(res.data.data.healthWorkers)) {
        list = res.data.data.healthWorkers;
      } else if (res.data?.data?.healthStaff && Array.isArray(res.data.data.healthStaff)) {
        list = res.data.data.healthStaff;
      } else if (Array.isArray(res.data)) {
        list = res.data;
      } else if (res.data?.data && Array.isArray(res.data.data)) {
        list = res.data.data;
      } else if (res.data?.users && Array.isArray(res.data.users)) {
        list = res.data.users;
      } else if (res.data?.healthWorkers && Array.isArray(res.data.healthWorkers)) {
        list = res.data.healthWorkers;
      } else if (res.data?.healthStaff && Array.isArray(res.data.healthStaff)) {
        list = res.data.healthStaff;
      }
      
      const rawRole = (hw) => String(hw.hs_type || hw.hw_type || hw.role || hw.type || '').toLowerCase();
      const isHealthStaffRole = (r) => {
        const s = r.toLowerCase();
        return ['bhs', 'barangay health staff', 'barangay health worker', 'health staff', 'health worker']
          .some(k => s.includes(k));
      };
      const isNurseOrNutritionistRole = (r) => {
        const s = r.toLowerCase();
        return s.includes('nurse') || s.includes('rn') || s.includes('nutritionist') || s.includes('dietitian') || s.includes('nd');
      };
      const displayRole = (r) => {
        if (isNurseOrNutritionistRole(r)) {
          return r.includes('nutrition') || r.includes('diet') ? 'Nutritionist' : 'Nurse';
        }
        if (isHealthStaffRole(r)) return 'Health Staff';
        return r || 'Health Staff';
      };

      healthWorkers.value = list
        .filter(hw => isHealthStaffRole(rawRole(hw)))
        .map(hw => ({
          user_id: hw.user_id || hw.id || hw.health_worker_id,
          fullname: [hw.firstname, hw.middlename, hw.surname].filter(Boolean).join(' ').trim() || hw.name || hw.fullname,
          hs_type: displayRole(rawRole(hw))
        }));
      
      nurses.value = list
        .filter(hw => isNurseOrNutritionistRole(rawRole(hw)))
        .map(hw => ({
          user_id: hw.user_id || hw.id || hw.health_worker_id,
          fullname: [hw.firstname, hw.middlename, hw.surname].filter(Boolean).join(' ').trim() || hw.name || hw.fullname,
          hs_type: displayRole(rawRole(hw))
        }));
    } catch (err) {
      console.error('Failed to load health workers:', err);
      healthWorkers.value = [];
      nurses.value = [];
    }
  };

  const fetchVaccineOptions = async () => {
    try {
      const params = {};
      if (showNipOnly.value) params.is_nip = true;
      const res = await api.get('/vaccines/inventory', { params });
      const payload = res.data?.data || [];
      vaccineOptions.value = payload.map(v => ({
        inventory_id: v.inventory_id || v.id,
        vaccine_id: v.vaccine_id,
        display_name: `${v.vaccinemaster?.antigen_name || 'Unknown'} (${v.vaccinemaster?.disease_prevented || 'Unknown'}) - Lot: ${v.lot_number || 'N/A'} - Exp: ${v.expiration_date ? formatDate(v.expiration_date) : 'N/A'}`,
        vaccine_name: v.vaccinemaster?.antigen_name || 'Unknown',
        disease_prevented: v.vaccinemaster?.disease_prevented || 'Unknown',
        manufacturer: v.vaccinemaster?.manufacturer || 'Unknown',
        lot_number: v.lot_number,
        expiration_date: v.expiration_date
      }));
    } catch (err) {
      console.error('Failed to load vaccine options:', err);
      vaccineOptions.value = [];
    }
  };

  const fetchVaccineCatalog = async () => {
    try {
      const params = {};
      if (showNipOnly.value) params.is_nip = true;
      const res = await api.get('/vaccines', { params });
      const payload = res.data?.data;
      const list = Array.isArray(payload?.vaccines)
        ? payload.vaccines
        : (Array.isArray(res.data?.vaccines) ? res.data.vaccines : (Array.isArray(res.data) ? res.data : []));
      vaccineCatalog.value = list.map(v => ({
        vaccine_id: v.vaccine_id || v.id,
        antigen_name: v.antigen_name || v.name || 'Unknown',
        disease_prevented: v.disease_prevented || '',
        manufacturer: v.manufacturer || ''
      }));
    } catch (e) {
      console.error('Failed to load vaccine catalog:', e);
      vaccineCatalog.value = [];
    }
  };

  const fetchSelectedPatientData = async (patientId) => {
    if (!patientId) {
      selectedPatientData.value = null;
      return;
    }
    
    try {
      const response = await api.get(`/patients/${patientId}`);
      selectedPatientData.value = response.data?.data || null;
    } catch (error) {
      console.error('Error fetching patient details:', error);
      selectedPatientData.value = null;
    }
  };

  const fetchExistingRecord = async (visitId) => {
    try {
      loading.value = true;
      const res = await api.get(`/visits/${visitId}`);
      const data = res.data?.data || res.data || {};

      const patientId = String(data.patient_id || form.value.patient_id || props.initialPatientId || '');
      
      if (data.patient_name) {
        selectedPatientData.value = {
          patient_id: patientId,
          firstname: data.patient_name.split(' ')[0] || '',
          middlename: data.patient_name.split(' ').slice(1, -1).join(' ') || '',
          surname: data.patient_name.split(' ').slice(-1)[0] || ''
        };
      } else if (patientId) {
        await fetchSelectedPatientData(patientId);
      }
      
      if (patientId && patients.value.length > 0) {
        const existingPatient = patients.value.find(p => p.id === patientId);
        if (!existingPatient && selectedPatientData.value) {
          const currentPatient = {
            id: patientId,
            childInfo: { 
              name: [selectedPatientData.value.firstname, selectedPatientData.value.middlename, selectedPatientData.value.surname]
                .filter(Boolean).join(' ').trim() 
            }
          };
          patients.value.unshift(currentPatient);
        }
      }

      form.value.patient_id = patientId;
      form.value.recorded_by = String(data.recorded_by || '');

      if (data.recorded_by && isNaN(data.recorded_by)) {
        const hw = healthWorkers.value.find(h => h.fullname === data.recorded_by || h.name === data.recorded_by);
        if (hw) {
          form.value.recorded_by = String(hw.user_id);
        }
      }

      form.value.visit_date = data.visit_date ? utcToPH(data.visit_date).format('YYYY-MM-DD') : form.value.visit_date;
      form.value.findings = data.findings || '';
      form.value.service_rendered = data.service_rendered || '';

      try {
        const ims = Array.isArray(data.immunizations_given) ? data.immunizations_given : (Array.isArray(data.immunizations) ? data.immunizations : []);
        hasOutsideInRecord.value = ims.some(im => !!(im?.outside || im?.immunization_outside || im?.is_outside || im?.isOutside || im?.outside_immunization));
      } catch {
        hasOutsideInRecord.value = false;
      }

      // Map vitals
      if (data.vitals) {
        form.value.vitals = {
          temperature: data.vitals.temperature ?? '',
          muac: data.vitals.muac ?? '',
          respiration: data.vitals.respiration ?? '',
          weight: data.vitals.weight ?? '',
          height: data.vitals.height ?? ''
        };
      } else if (data.vital_signs) {
        const vs = data.vital_signs;
        form.value.vitals = {
          temperature: vs.temperature ?? '',
          muac: vs.muac ?? '',
          respiration: vs.respiration_rate ?? '',
          weight: vs.weight ?? '',
          height: vs.height_length ?? ''
        };
      } else if (
        data.temperature !== undefined ||
        data.muac !== undefined ||
        data.respiration_rate !== undefined ||
        data.weight !== undefined ||
        data.height_length !== undefined
      ) {
        form.value.vitals = {
          temperature: data.temperature ?? '',
          muac: data.muac ?? '',
          respiration: (data.respiration_rate ?? data.respiration) ?? '',
          weight: data.weight ?? '',
          height: (data.height_length ?? data.height) ?? ''
        };
      } else {
        try {
          const vitalsRes = await api.get(`/vitals/${visitId}`);
          const v = vitalsRes.data?.data || vitalsRes.data || {};
          form.value.vitals = {
            temperature: v.temperature ?? '',
            muac: v.muac ?? '',
            respiration: v.respiration ?? '',
            weight: v.weight ?? '',
            height: v.height ?? ''
          };
        } catch (e) {
          form.value.vitals = { temperature: '', muac: '', respiration: '', weight: '', height: '' };
        }
      }

      if (existingRecordMode.value) {
        vaccinationForm.value.healthWorkerId = form.value.recorded_by;
      }
    } catch (e) {
      console.warn('Failed to load existing record details', e);
    } finally {
      loading.value = false;
    }
  };

  // Vaccination form methods
  const onVaccineSelect = async (newInventoryId) => {
    vaccinationForm.value.inventoryId = newInventoryId;
    
    if (!newInventoryId) {
      vaccinationForm.value.diseasePrevented = '';
      vaccinationForm.value.doseNumber = '';
      vaccinationForm.value.vaccineManufacturer = '';
      vaccinationForm.value.lotNumber = '';
      vaccinationForm.value.vaccineName = '';
      availableDoses.value = [1, 2, 3, 4, 5];
      autoSelectHint.value = '';
      return;
    }

    const selectedVaccine = vaccineOptions.value.find(v => v.inventory_id === newInventoryId);
    if (selectedVaccine) {
      vaccinationForm.value.vaccineName = selectedVaccine.vaccine_name || '';
      vaccinationForm.value.diseasePrevented = selectedVaccine.disease_prevented || '';
      vaccinationForm.value.vaccineManufacturer = selectedVaccine.manufacturer || '';
      vaccinationForm.value.lotNumber = selectedVaccine.lot_number || '';
    }
    
    updateAgeCalculation();

    try {
      if (form.value.patient_id) {
        const res = await api.get(`/patients/${form.value.patient_id}/smart-doses`, { 
          params: { vaccine_id: selectedVaccine?.vaccine_id } 
        });
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
      }
    } catch (e) {
      availableDoses.value = [1, 2, 3, 4, 5];
      autoSelectHint.value = '';
    }
  };

  const onVaccineCatalogSelect = async (newVaccineId) => {
    vaccinationForm.value.vaccineId = newVaccineId;
    
    if (!newVaccineId) {
      vaccinationForm.value.diseasePrevented = '';
      vaccinationForm.value.vaccineManufacturer = '';
      vaccinationForm.value.vaccineName = '';
      availableDoses.value = [1, 2, 3, 4, 5];
      autoSelectHint.value = '';
      return;
    }
    
    const v = (vaccineCatalog.value || []).find(x => x.vaccine_id === newVaccineId);
    if (v) {
      vaccinationForm.value.vaccineName = v.antigen_name || '';
      vaccinationForm.value.diseasePrevented = v.disease_prevented || '';
      vaccinationForm.value.vaccineManufacturer = v.manufacturer || '';
      vaccinationForm.value.lotNumber = '';
    }
    
    updateAgeCalculation();

    try {
      if (form.value.patient_id) {
        const res = await api.get(`/patients/${form.value.patient_id}/smart-doses`, { 
          params: { vaccine_id: newVaccineId } 
        });
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
      }
    } catch (e) {
      availableDoses.value = [1, 2, 3, 4, 5];
      autoSelectHint.value = '';
    }
  };

  const updateAgeCalculation = () => {
    if (selectedPatientData.value?.date_of_birth && vaccinationForm.value.dateAdministered) {
      vaccinationForm.value.ageAtAdministration = calculateAgeAtDate(
        selectedPatientData.value.date_of_birth,
        vaccinationForm.value.dateAdministered
      );
    }
  };

  const calculateAgeAtDate = (birthDate, targetDate) => {
    if (!birthDate || !targetDate) return '';

    const birth = new Date(birthDate);
    const target = new Date(targetDate);

    if (target < birth) return '0 days old';

    let totalMonths = (target.getFullYear() - birth.getFullYear()) * 12 + (target.getMonth() - birth.getMonth());
    let days = target.getDate() - birth.getDate();

    if (days < 0) {
      totalMonths--;
      const prevMonthLastDay = new Date(target.getFullYear(), target.getMonth(), 0);
      const daysInPrevMonth = prevMonthLastDay.getDate();
      days += daysInPrevMonth;
    }

    if (totalMonths < 0) totalMonths = 0;

    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;

    if (years === 0) {
      if (months === 0) {
        return `${days} day${days !== 1 ? 's' : ''} old`;
      }
      return `${months} month${months !== 1 ? 's' : ''}, ${days} day${days !== 1 ? 's' : ''} old`;
    }
    return `${years} year${years !== 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''}, ${days} day${days !== 1 ? 's' : ''} old`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-PH', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const onNipToggle = () => {
    if (vaccinationForm.value.outside) {
      fetchVaccineCatalog();
    } else {
      fetchVaccineOptions();
    }
  };

  return {
    // State
    patients,
    patientSearch,
    healthWorkers,
    nurses,
    loading,
    selectedPatientData,
    showVaccinationForm,
    savingVaccination,
    vaccineOptions,
    vaccineCatalog,
    showNipOnly,
    availableDoses,
    autoSelectHint,
    hasOutsideInRecord,
    localCollectedVaccinations,
    form,
    vaccinationForm,

    // Computed
    viewOnly,
    existingRecordMode,
    lockPatientEffective,
    isSaveDisabled,
    autoFilledFindings,
    autoFilledServiceRendered,
    patientDisplayName,
    recordedByDisplayName,

    // Methods
    fetchPatients,
    fetchHealthWorkers,
    fetchVaccineOptions,
    fetchVaccineCatalog,
    fetchSelectedPatientData,
    fetchExistingRecord,
    onVaccineSelect,
    onVaccineCatalogSelect,
    updateAgeCalculation,
    calculateAgeAtDate,
    formatDate,
    onNipToggle
  };
}
