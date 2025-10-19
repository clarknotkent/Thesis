<template>
  <!-- Page mode: render the editor as a full page (no modal chrome) -->
  <div v-if="embeddedPage" class="vaccination-editor-page container-fluid py-3">
    <div class="d-flex align-items-center mb-3">
      <h3 class="mb-0">
        <i class="bi bi-shield-check me-2"></i>
        Manage Vaccination Records
      </h3>
      <button class="btn btn-outline-secondary ms-auto" @click="onClose">Back</button>
    </div>
    <div class="card shadow-sm">
      <div class="card-body p-3">
        <!-- Loading State -->
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="text-muted mt-3">Loading vaccination records...</p>
        </div>

        <!-- Main Interface: Only show when NOT in visit context -->
        <div v-else-if="!visitContext">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h6 class="mb-0">
                <span class="fw-bold">Patient:</span> {{ patientData?.firstname }} {{ patientData?.surname }}
              </h6>
              <p class="text-muted small mb-0">
                {{ patientData?.sex }}, {{ calculateAge(patientData?.date_of_birth) }}
              </p>
            </div>

            <div class="btn-group btn-group-sm">
              <button class="btn btn-success" @click="startInFacilityAdd">
                <i class="bi bi-plus-circle me-1"></i> Add Vaccination Record
              </button>
            </div>
          </div>

          <!-- Vaccination Records (merged list; edit allowed only for outside records) -->
          <div class="table-responsive">
            <h6 class="fw-bold mb-3">Vaccination Records</h6>
            <table class="table table-hover table-striped">
              <thead class="table-light">
                <tr>
                  <th>Vaccine Name</th>
                  <th>Disease Prevented</th>
                  <th>Dose</th>
                  <th>Date Administered</th>
                  <th>Age at Administration</th>
                  <th>Administered By</th>
                  <th>Site</th>
                  <th>Facility</th>
                  <th>Status</th>
                  <th>Remarks</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(vaccination, index) in sortedVaccinations" :key="vaccination.immunization_id || vaccination.id || index">
                  <td class="fw-semibold">
                    {{ vaccination.vaccine_antigen_name || vaccination.vaccineName || vaccination.antigen_name || vaccination.antigenName || 'Unknown' }}
                  </td>
                  <td>
                    <small>{{ vaccination.disease_prevented || vaccination.diseasePrevented || vaccination.lotNumber || vaccination.batch_number || vaccination.batchNumber || '—' }}</small>
                  </td>
                  <td>
                    <span v-if="vaccination.dose_number || vaccination.doseNumber || vaccination.dose" class="badge bg-secondary">
                      Dose {{ vaccination.dose_number || vaccination.doseNumber || vaccination.dose }}
                    </span>
                    <span v-else class="text-muted">—</span>
                  </td>
                  <td>
                    <small>{{ formatDate(vaccination.administered_date || vaccination.date_administered || vaccination.dateAdministered) }}</small>
                  </td>
                  <td>
                    <small>{{ vaccination.age_at_administration || vaccination.ageAtAdministration || '—' }}</small>
                  </td>
                  <td>
                    <small>{{
                      vaccination.administered_by_name ||
                      vaccination.administeredBy ||
                      vaccination.health_worker_name ||
                      vaccination.healthWorkerName ||
                      vaccination.worker_name ||
                      vaccination.workerName ||
                      vaccination.recorded_by_name ||
                      'Taken Outside'
                    }}</small>
                  </td>
                  <td>
                    <small>{{ deriveSite(vaccination) }}</small>
                  </td>
                  <td>
                    <small>{{ deriveFacility(vaccination) }}</small>
                  </td>
                  <td>
                    <span class="badge" :class="getStatusBadgeClass(vaccination.status)">
                      {{ vaccination.status || 'Completed' }}
                    </span>
                  </td>
                  <td>
                    <small class="text-muted">{{ vaccination.remarks || vaccination.notes || '—' }}</small>
                  </td>
                  <td>
                    <div class="btn-group btn-group-sm">
                      <button class="btn btn-outline-primary" :disabled="!isOutside(vaccination)" :title="isOutside(vaccination) ? 'Edit' : 'Edit allowed for Outside records only'" @click="editVaccinationRecord(index)">
                        <i class="bi bi-pencil"></i>
                      </button>
                      <button class="btn btn-outline-danger" @click="deleteVaccinationRecord(index)" title="Delete">
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="filteredVaccinations.length === 0">
                  <td colspan="11" class="text-center py-4 text-muted">
                    <i class="bi bi-shield-exclamation me-2"></i>
                    No vaccination records found for this patient
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Removed separate outside list; merged above -->

          <!-- Next Scheduled Vaccinations -->
          <div class="mt-4">
            <h6 class="fw-bold mb-3">Upcoming Scheduled Vaccinations</h6>
            <div v-if="upcomingSchedules.length > 0" class="table-responsive">
              <table class="table table-bordered">
                <thead class="table-light">
                  <tr>
                    <th>Vaccine Name</th>
                    <th>Scheduled Date</th>
                    <th>Dose Number</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(vaccine, index) in upcomingSchedules" :key="index">
                    <td class="fw-semibold">{{ vaccine.vaccineName || 'Unknown' }}</td>
                    <td>{{ formatDate(vaccine.scheduledDate) || 'N/A' }}</td>
                    <td>{{ vaccine.doseNumber || 'N/A' }}</td>
                    <td>
                      <span class="badge" :class="getStatusBadgeClass(vaccine.status)">
                        {{ vaccine.status || 'Unknown' }}
                      </span>
                      <span v-if="computeDaysOverdue(vaccine) > 0" class="badge bg-danger ms-2">{{ computeDaysOverdue(vaccine) }}d overdue</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="alert alert-info">
              <i class="bi bi-info-circle me-2"></i>
              No upcoming scheduled vaccinations found for this patient.
              <br><small>This could mean all recommended vaccinations have been completed, or schedule data is not available.</small>
            </div>
          </div>
          
          <!-- Debug: Show raw schedule data -->
          <div class="mt-3 p-3 bg-light border rounded" v-if="showDebug">
            <h6 class="text-muted">Debug: Schedule Data</h6>
            <div class="row">
              <div class="col-md-6">
                <strong>Raw nextScheduledVaccinations:</strong>
                <pre class="small">{{ JSON.stringify(patientData?.nextScheduledVaccinations, null, 2) }}</pre>
              </div>
              <div class="col-md-6">
                <strong>Patient Data Keys:</strong>
                <pre class="small">{{ patientData ? Object.keys(patientData).join('\n') : 'No patient data' }}</pre>
                <strong>Patient DOB:</strong> {{ patientData?.date_of_birth || 'Not available' }}
                <br><strong>Patient ID:</strong> {{ patientData?.patient_id || props.patientId }}
                <br><strong>Array Length:</strong> {{ patientData?.nextScheduledVaccinations?.length || 0 }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Vaccination Record Modal (kept as modal even in page mode) -->
    <div class="modal fade" :class="{ show: showNewVaccinationModal || showEditVaccinationModal }" 
         :style="{ display: (showNewVaccinationModal || showEditVaccinationModal) ? 'block' : 'none' }" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <div class="d-flex align-items-center w-100">
              <h5 class="modal-title me-auto">
                <i class="bi bi-shield-plus me-2"></i>
                {{ showEditVaccinationModal ? 'Edit' : 'Add New' }} Vaccination Record
              </h5>
              <!-- Inside the add/edit vaccination modal: outside toggle at upper right -->
              <div class="form-check form-switch" v-if="!showEditVaccinationModal">
                <input class="form-check-input" type="checkbox" id="insideOutsideToggle" v-model="outsideImmunization">
                <label class="form-check-label" for="insideOutsideToggle">Outside record</label>
              </div>
            </div>
            <button type="button" class="btn-close" @click="closeVaccinationModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveVaccinationRecord">
              <div class="row g-3">
                <div class="col-12">
                  <small class="text-muted d-block">
                    Outside = vaccinations done outside the facility. No inventory is used; choose a vaccine from the catalog. In-facility = administered here; choose a stock from inventory and ensure a same-day visit exists.
                  </small>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Vaccine *</label>
                  <!-- In-facility: choose from inventory stocks -->
                  <select v-if="!outsideImmunization" class="form-select" v-model="vaccinationForm.inventoryId" @change="onVaccineSelect" :required="!outsideImmunization" :disabled="showEditVaccinationModal">
                    <option value="">Select a vaccine stock</option>
                    <option v-for="v in vaccineOptions" :key="v.inventory_id" :value="v.inventory_id" :disabled="v.isExpired">
                      {{ v.display_name }}<span v-if="v.isExpired"> — [EXPIRED]</span>
                    </option>
                  </select>
                  <!-- Outside: choose vaccine (no inventory) -->
                  <select v-else class="form-select" v-model="vaccinationForm.vaccineId" @change="onVaccineCatalogSelect" :required="outsideImmunization" :disabled="showEditVaccinationModal">
                    <option value="">Select a vaccine</option>
                    <option v-for="v in vaccineCatalog" :key="v.vaccine_id || v.id" :value="v.vaccine_id || v.id">
                      {{ v.antigen_name || v.name || 'Vaccine' }}
                    </option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Disease Prevented</label>
                  <input type="text" class="form-control" v-model="vaccinationForm.diseasePrevented" readonly>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Dose Number *</label>
                  <select class="form-select" v-model="vaccinationForm.doseNumber" required>
                    <option value="">Select dose</option>
                    <option v-for="dose in availableDoses" :key="dose" :value="dose">Dose {{ dose }}</option>
                  </select>
                  <div v-if="autoSelectHint" class="form-text text-success">{{ autoSelectHint }}</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Date Administered *</label>
                  <input type="date" class="form-control" v-model="vaccinationForm.dateAdministered" required>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Age at Administration</label>
                  <input type="text" class="form-control" v-model="vaccinationForm.ageAtAdministration" readonly>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Manufacturer</label>
                  <input type="text" class="form-control" v-model="vaccinationForm.vaccineManufacturer" readonly>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Lot Number</label>
                  <input type="text" class="form-control" v-model="vaccinationForm.lotNumber" readonly>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Site of Administration</label>
                  <select class="form-select" v-model="vaccinationForm.siteOfAdministration">
                    <option value="">Select a site</option>
                    <option value="Left arm (deltoid)">Left arm (deltoid)</option>
                    <option value="Right arm (deltoid)">Right arm (deltoid)</option>
                    <option value="Left thigh (anterolateral)">Left thigh (anterolateral)</option>
                    <option value="Right thigh (anterolateral)">Right thigh (anterolateral)</option>
                    <option value="Oral">Oral</option>
                  </select>
                </div>
                <div class="col-md-6" v-if="!outsideImmunization">
                  <label class="form-label">Health Staff *</label>
                  <select class="form-select" v-model="vaccinationForm.healthWorkerId" required>
                    <option value="">Select health staff</option>
                    <option v-for="hw in nurses" :key="hw.id || hw.health_worker_id" :value="hw.id || hw.health_worker_id">
                      {{ hw.name }} ({{ hw.hs_type || hw.hw_type || hw.role || hw.type }})
                    </option>
                    <option v-if="nurses.length === 0" disabled>No nurses/nutritionists available</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Facility Name</label>
                  <input type="text" class="form-control" v-model="vaccinationForm.facilityName">
                </div>
                <div class="col-md-6">
                  <label class="form-label">Remarks</label>
                  <textarea class="form-control" rows="2" v-model="vaccinationForm.remarks"></textarea>
                </div>
              </div>

                <!-- Visit Picker Inline (for in-facility add) -->
                <div v-if="showVisitPicker" class="modal fade" :class="{ show: showVisitPicker }" :style="{ display: showVisitPicker ? 'block' : 'none' }" tabindex="-1">
                  <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                      <div class="modal-header">
                        <h5 class="modal-title">Select a Visit</h5>
                        <button type="button" class="btn-close" @click="showVisitPicker = false"></button>
                      </div>
                      <div class="modal-body">
                        <div v-if="loadingVisits" class="text-center py-3"><div class="spinner-border text-primary"></div></div>
                        <div v-else>
                          <div v-if="visits.length === 0" class="text-muted text-center py-3">No visits found. Create a visit from Add Patient Record (in-facility).</div>
                          <div class="list-group">
                            <button v-for="v in visits" :key="v.visit_id || v.id" type="button" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center" @click="pickVisit(v)">
                              <span>{{ formatDateShort(v.created_at || v.visit_date) }}</span>
                              <small class="text-muted">{{ v.visit_type || v.service_rendered || 'Visit' }}</small>
                            </button>
                          </div>
                          <div class="mt-3 d-flex justify-content-end">
                            <button type="button" class="btn btn-outline-secondary btn-sm" @click="openOutsideRecordFromVisitPicker">
                              <i class="bi bi-geo-alt me-1"></i> Outside record
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              <div class="mt-4 text-muted small">
                <i class="bi bi-info-circle me-1"></i>
                Fields marked with * are required
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" @click="closeVaccinationModal">Cancel</button>
                <button type="submit" class="btn btn-primary" :disabled="saving || !canSave">
                  <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
                  {{ showEditVaccinationModal ? 'Update' : 'Add' }} Record
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Visit Picker Modal (moved outside main modal) -->
    <div v-if="showVisitPicker" class="modal fade" :class="{ show: showVisitPicker }" :style="{ display: showVisitPicker ? 'block' : 'none', zIndex: 1060 }" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Select a Visit</h5>
            <button type="button" class="btn-close" @click="showVisitPicker = false"></button>
          </div>
          <div class="modal-body">
            <div v-if="loadingVisits" class="text-center py-3"><div class="spinner-border text-primary"></div></div>
            <div v-else>
              <div v-if="visits.length === 0" class="text-muted text-center py-3">No visits found. Create a visit from Add Patient Record (in-facility).</div>
              <div class="list-group">
                <button v-for="v in visits" :key="v.visit_id || v.id" type="button" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center" @click="pickVisit(v)">
                  <span>{{ formatDateShort(v.created_at || v.visit_date) }}</span>
                  <small class="text-muted">{{ v.visit_type || v.service_rendered || 'Visit' }}</small>
                </button>
              </div>
              <div class="mt-3 d-flex justify-content-end">
                <button type="button" class="btn btn-outline-secondary btn-sm" @click="openOutsideRecordFromVisitPicker">
                  <i class="bi bi-geo-alt me-1"></i> Create Record
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Backdrop for visit picker -->
    <div v-if="showVisitPicker" class="modal-backdrop fade show" :style="{ zIndex: 1050 }" @click="showVisitPicker = false"></div>

    <!-- Embedded Visit View (read-only + services active) -->
    <div v-if="showVisitView" class="card border-primary mt-3">
      <div class="card-header d-flex align-items-center justify-content-between">
        <h6 class="mb-0">Visit Details</h6>
        <button type="button" class="btn-close" @click="closeVisitView"></button>
      </div>
      <div class="card-body p-0">
        <div class="p-3">
          <VisitEditor
            :show="true"
            :initial-patient-id="patientId"
            :lock-patient="true"
            :collected-vaccinations="[]"
            :record-mode="false"
            :embedded="true"
            :view-mode="true"
            :existing-visit-id="selectedVisitId"
            @close="closeVisitView"
            @saved="onVisitSaved"
            @update-collected-vaccinations="noop"
          />
        </div>
      </div>
    </div>
  </div>

  <!-- Modal mode: keep previous behaviour for backward compatibility -->
  <div v-else class="modal fade" :class="{ show }" :style="{ display: show ? 'block' : 'none' }" tabindex="-1">
    <div class="modal-dialog modal-xl">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            <i class="bi bi-shield-check me-2"></i>
            Manage Vaccination Records
          </h5>
          <button type="button" class="btn-close" @click="closeMainModal"></button>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="modal-body text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="text-muted mt-3">Loading vaccination records...</p>
        </div>

        <!-- Main Interface: Only show when NOT in visit context -->
        <div v-else-if="!visitContext" class="modal-body">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h6 class="mb-0">
                <span class="fw-bold">Patient:</span> {{ patientData?.firstname }} {{ patientData?.surname }}
              </h6>
              <p class="text-muted small mb-0">
                {{ patientData?.sex }}, {{ calculateAge(patientData?.date_of_birth) }}
              </p>
            </div>

            <div class="btn-group btn-group-sm">
              <button class="btn btn-success" @click="startInFacilityAdd">
                <i class="bi bi-plus-circle me-1"></i> Add Vaccination Record
              </button>
            </div>
          </div>

          <!-- Vaccination History Table -->
          <div class="table-responsive">
            <table class="table table-striped table-hover">
              <thead class="table-dark">
                <tr>
                  <th>#</th>
                  <th>Vaccine Name</th>
                  <th>Disease Prevented</th>
                  <th>Date Administered</th>
                  <th>Age at Administration</th>
                  <th>Manufacturer</th>
                  <th>Lot Number</th>
                  <th>Health Worker</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(vaccine, index) in filteredVaccinations" :key="vaccine.immunization_id || vaccine.id || index">
                  <td>{{ index + 1 }}</td>
                  <td class="fw-semibold">{{ vaccine.vaccineName }}</td>
                  <td>{{ vaccine.diseasePrevented }}</td>
                  <td>{{ formatDate(vaccine.dateAdministered) }}</td>
                  <td>{{ vaccine.ageAtAdministration }}</td>
                  <td>{{ vaccine.vaccineManufacturer }}</td>
                  <td><code>{{ vaccine.lotNumber }}</code></td>
                  <td>{{ vaccine.healthWorker }}</td>
                  <td>
                    <div class="btn-group btn-group-sm">
                      <button class="btn btn-outline-primary" @click="editVaccinationRecord(index)" title="Edit">
                        <i class="bi bi-pencil"></i>
                      </button>
                      <button class="btn btn-outline-danger" @click="deleteVaccinationRecord(index)" title="Delete">
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="filteredVaccinations.length === 0">
                  <td colspan="9" class="text-center py-4 text-muted">
                    <i class="bi bi-shield-exclamation me-2"></i>
                    No vaccination records found for this patient
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Next Scheduled Vaccinations -->
          <div class="mt-4">
            <h6 class="fw-bold mb-3">Upcoming Scheduled Vaccinations</h6>
            <div v-if="patientData?.nextScheduledVaccinations && patientData.nextScheduledVaccinations.length > 0" class="table-responsive">
              <table class="table table-bordered">
                <thead class="table-light">
                  <tr>
                    <th>Vaccine Name</th>
                    <th>Scheduled Date</th>
                    <th>Dose Number</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(vaccine, index) in patientData.nextScheduledVaccinations" :key="index">
                    <td class="fw-semibold">{{ vaccine.vaccineName || 'Unknown' }}</td>
                    <td>{{ formatDate(vaccine.scheduledDate) || 'N/A' }}</td>
                    <td>{{ vaccine.doseNumber || 'N/A' }}</td>
                    <td>
                      <span class="badge" :class="getStatusBadgeClass(vaccine.status)">
                        {{ vaccine.status || 'Unknown' }}
                      </span>
                      <span v-if="computeDaysOverdue(vaccine) > 0" class="badge bg-danger ms-2">{{ computeDaysOverdue(vaccine) }}d overdue</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="alert alert-info">
              <i class="bi bi-info-circle me-2"></i>
              No upcoming scheduled vaccinations found for this patient.
              <br><small>This could mean all recommended vaccinations have been completed, or schedule data is not available.</small>
            </div>
          </div>
          
          <!-- Debug: Show raw schedule data -->
          <div class="mt-3 p-3 bg-light border rounded" v-if="showDebug">
            <h6 class="text-muted">Debug: Schedule Data</h6>
            <div class="row">
              <div class="col-md-6">
                <strong>Raw nextScheduledVaccinations:</strong>
                <pre class="small">{{ JSON.stringify(patientData?.nextScheduledVaccinations, null, 2) }}</pre>
              </div>
              <div class="col-md-6">
                <strong>Patient Data Keys:</strong>
                <pre class="small">{{ patientData ? Object.keys(patientData).join('\n') : 'No patient data' }}</pre>
                <strong>Patient DOB:</strong> {{ patientData?.date_of_birth || 'Not available' }}
                <br><strong>Patient ID:</strong> {{ patientData?.patient_id || props.patientId }}
                <br><strong>Array Length:</strong> {{ patientData?.nextScheduledVaccinations?.length || 0 }}
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="closeMainModal">Close</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Add/Edit Vaccination Record Modal -->
  <div class="modal fade" :class="{ show: showNewVaccinationModal || showEditVaccinationModal }" 
       :style="{ display: (showNewVaccinationModal || showEditVaccinationModal) ? 'block' : 'none' }" tabindex="-1">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <div class="d-flex align-items-center w-100">
            <h5 class="modal-title me-auto">
              <i class="bi bi-shield-plus me-2"></i>
              {{ showEditVaccinationModal ? 'Edit' : 'Add New' }} Vaccination Record
            </h5>
            <!-- Inside the add/edit vaccination modal: outside toggle at upper right -->
            <div class="form-check form-switch" v-if="!showEditVaccinationModal">
              <input class="form-check-input" type="checkbox" id="insideOutsideToggle" v-model="outsideImmunization">
              <label class="form-check-label" for="insideOutsideToggle">Outside record</label>
            </div>
          </div>
          <button type="button" class="btn-close" @click="closeVaccinationModal"></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveVaccinationRecord">
            <div class="row g-3">
              <div class="col-12">
                <small class="text-muted d-block">
                  Outside = vaccinations done outside the facility. No inventory is used; choose a vaccine from the catalog. In-facility = administered here; choose a stock from inventory and ensure a same-day visit exists.
                </small>
              </div>
              <div class="col-md-6">
                <label class="form-label">Vaccine *</label>
                <!-- In-facility: choose from inventory stocks -->
                <select v-if="!outsideImmunization" class="form-select" v-model="vaccinationForm.inventoryId" @change="onVaccineSelect" :required="!outsideImmunization" :disabled="showEditVaccinationModal">
                  <option value="">Select a vaccine stock</option>
                  <option v-for="v in vaccineOptions" :key="v.inventory_id" :value="v.inventory_id" :disabled="v.isExpired">
                    {{ v.display_name }}<span v-if="v.isExpired"> — [EXPIRED]</span>
                  </option>
                </select>
                <!-- Outside: choose vaccine (no inventory) -->
                <select v-else class="form-select" v-model="vaccinationForm.vaccineId" @change="onVaccineCatalogSelect" :required="outsideImmunization" :disabled="showEditVaccinationModal">
                  <option value="">Select a vaccine</option>
                  <option v-for="v in vaccineCatalog" :key="v.vaccine_id || v.id" :value="v.vaccine_id || v.id">
                    {{ v.antigen_name || v.name || 'Vaccine' }}
                  </option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label">Disease Prevented</label>
                <input type="text" class="form-control" v-model="vaccinationForm.diseasePrevented" readonly>
              </div>
              <div class="col-md-6">
                <label class="form-label">Dose Number *</label>
                <select class="form-select" v-model="vaccinationForm.doseNumber" required>
                  <option value="">Select dose</option>
                  <option v-for="dose in availableDoses" :key="dose" :value="dose">Dose {{ dose }}</option>
                </select>
                <div v-if="autoSelectHint" class="form-text text-success">{{ autoSelectHint }}</div>
              </div>
              <div class="col-md-6">
                <label class="form-label">Date Administered *</label>
                <input type="date" class="form-control" v-model="vaccinationForm.dateAdministered" required>
              </div>
              <div class="col-md-6">
                <label class="form-label">Age at Administration</label>
                <input type="text" class="form-control" v-model="vaccinationForm.ageAtAdministration" readonly>
              </div>
              <div class="col-md-6">
                <label class="form-label">Manufacturer</label>
                <input type="text" class="form-control" v-model="vaccinationForm.vaccineManufacturer" readonly>
              </div>
              <div class="col-md-6">
                <label class="form-label">Lot Number</label>
                <input type="text" class="form-control" v-model="vaccinationForm.lotNumber" readonly>
              </div>
              <div class="col-md-6">
                <label class="form-label">Site of Administration</label>
                <select class="form-select" v-model="vaccinationForm.siteOfAdministration">
                  <option value="">Select a site</option>
                  <option value="Left arm (deltoid)">Left arm (deltoid)</option>
                  <option value="Right arm (deltoid)">Right arm (deltoid)</option>
                  <option value="Left thigh (anterolateral)">Left thigh (anterolateral)</option>
                  <option value="Right thigh (anterolateral)">Right thigh (anterolateral)</option>
                  <option value="Oral">Oral</option>
                </select>
              </div>
              <div class="col-md-6" v-if="!outsideImmunization">
                <label class="form-label">Health Staff *</label>
                <select class="form-select" v-model="vaccinationForm.healthWorkerId" required>
                  <option value="">Select health staff</option>
                  <option v-for="hw in nurses" :key="hw.id || hw.health_worker_id" :value="hw.id || hw.health_worker_id">
                    {{ hw.name }} ({{ hw.hs_type || hw.hw_type || hw.role || hw.type }})
                  </option>
                  <option v-if="nurses.length === 0" disabled>No nurses/nutritionists available</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label">Facility Name</label>
                <input type="text" class="form-control" v-model="vaccinationForm.facilityName">
              </div>
              <div class="col-md-6">
                <label class="form-label">Remarks</label>
                <textarea class="form-control" rows="2" v-model="vaccinationForm.remarks"></textarea>
              </div>
            </div>

              <!-- Visit Picker Inline (for in-facility add) -->
              <div v-if="showVisitPicker" class="modal fade" :class="{ show: showVisitPicker }" :style="{ display: showVisitPicker ? 'block' : 'none' }" tabindex="-1">
                <div class="modal-dialog modal-lg">
                  <div class="modal-content">
                    <div class="modal-header">
                      <h5 class="modal-title">Select a Visit</h5>
                      <button type="button" class="btn-close" @click="showVisitPicker = false"></button>
                    </div>
                    <div class="modal-body">
                      <div v-if="loadingVisits" class="text-center py-3"><div class="spinner-border text-primary"></div></div>
                      <div v-else>
                        <div v-if="visits.length === 0" class="text-muted text-center py-3">No visits found. Create a visit from Add Patient Record (in-facility).</div>
                        <div class="list-group">
                          <button v-for="v in visits" :key="v.visit_id || v.id" type="button" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center" @click="pickVisit(v)">
                            <span>{{ formatDateShort(v.created_at || v.visit_date) }}</span>
                            <small class="text-muted">{{ v.visit_type || v.service_rendered || 'Visit' }}</small>
                          </button>
                        </div>
                        <div class="mt-3 d-flex justify-content-end">
                          <button type="button" class="btn btn-outline-secondary btn-sm" @click="openOutsideRecordFromVisitPicker">
                            <i class="bi bi-geo-alt me-1"></i> Outside record
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            <div class="mt-4 text-muted small">
              <i class="bi bi-info-circle me-1"></i>
              Fields marked with * are required
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeVaccinationModal">Cancel</button>
              <button type="submit" class="btn btn-primary" :disabled="saving || !canSave">
                <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
                {{ showEditVaccinationModal ? 'Update' : 'Add' }} Record
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>

  <!-- Visit Picker Modal (moved outside main modal) -->
  <div v-if="showVisitPicker" class="modal fade" :class="{ show: showVisitPicker }" :style="{ display: showVisitPicker ? 'block' : 'none', zIndex: 1060 }" tabindex="-1">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Select a Visit</h5>
          <button type="button" class="btn-close" @click="showVisitPicker = false"></button>
        </div>
        <div class="modal-body">
          <div v-if="loadingVisits" class="text-center py-3"><div class="spinner-border text-primary"></div></div>
          <div v-else>
            <div v-if="visits.length === 0" class="text-muted text-center py-3">No visits found. Create a visit from Add Patient Record (in-facility).</div>
            <div class="list-group">
              <button v-for="v in visits" :key="v.visit_id || v.id" type="button" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center" @click="pickVisit(v)">
                <span>{{ formatDateShort(v.created_at || v.visit_date) }}</span>
                <small class="text-muted">{{ v.visit_type || v.service_rendered || 'Visit' }}</small>
              </button>
            </div>
            <div class="mt-3 d-flex justify-content-end">
              <button type="button" class="btn btn-outline-secondary btn-sm" @click="openOutsideRecordFromVisitPicker">
                <i class="bi bi-geo-alt me-1"></i> Create Record
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal Backdrop only for main modal -->
  <div v-if="show" class="modal-backdrop fade show"></div>

  <!-- Modal Backdrop for visit picker -->
  <div v-if="showVisitPicker" class="modal-backdrop fade show" :style="{ zIndex: 1050 }" @click="showVisitPicker = false"></div>

  <!-- Embedded Visit View (read-only + services active) -->
  <div v-if="showVisitView" class="card border-primary mt-3">
    <div class="card-header d-flex align-items-center justify-content-between">
      <h6 class="mb-0">Visit Details</h6>
      <button type="button" class="btn-close" @click="closeVisitView"></button>
    </div>
    <div class="card-body p-0">
      <div class="p-3">
        <VisitEditor
          :show="true"
          :initial-patient-id="patientId"
          :lock-patient="true"
          :collected-vaccinations="[]"
          :record-mode="false"
          :embedded="true"
          :view-mode="true"
          :existing-visit-id="selectedVisitId"
          @close="closeVisitView"
          @saved="onVisitSaved"
          @update-collected-vaccinations="noop"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue';
import VisitEditor from '@/components/common/VisitEditor.vue'
import api from '@/services/api';
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { getCurrentPHDate, utcToPH } from '@/utils/dateUtils'
import { useRouter } from 'vue-router'

const { addToast } = useToast()
const { confirm } = useConfirm()

console.log('API service imported:', api);

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  patientId: {
    type: String,
    default: ''
  },
  patientData: {
    type: Object,
    default: null
  },
  visitContext: {
    type: Boolean,
    default: false
  },
  // When true, pre-selects the Outside Immunization mode when opening the add/edit modal
  defaultOutside: {
    type: Boolean,
    default: false
  },
  embeddedPage: {
    type: Boolean,
    default: false
  }
});

console.log('VaccinationRecordEditor props:', { show: props.show, patientId: props.patientId });

const emit = defineEmits(['close', 'update', 'vaccinations-collected', 'open-add-patient-record']);

// State management
const loading = ref(false);
const saving = ref(false);
const patientData = ref(null);
const vaccineOptions = ref([]);
const healthWorkers = ref([]);
const nurses = ref([]);
const showNewVaccinationModal = ref(false);
const showEditVaccinationModal = ref(false);
// Visit picker state
const showVisitPicker = ref(false);
const loadingVisits = ref(false);
const visits = ref([]);
const currentEditIndex = ref(-1);
const showDebug = ref(false);
const collectedVaccinations = ref([]); // Store vaccinations collected in visit context
const availableDoses = ref([1, 2, 3, 4, 5]);
const autoSelectHint = ref('');
const outsideImmunization = ref(false);
const vaccineCatalog = ref([]);
const router = useRouter();
// Outside record modal state
// const showOutsideRecord = ref(false);

// Form for vaccination record
const vaccinationForm = ref({
  inventoryId: '',
  vaccineId: '',
  vaccineName: '',
  diseasePrevented: '',
  doseNumber: '',
  dateAdministered: getCurrentPHDate(), // Default to today in PH timezone
  ageAtAdministration: '',
  vaccineManufacturer: '',
  lotNumber: '',
  siteOfAdministration: '',
  healthWorkerId: '',
  facilityName: '',
  remarks: ''
});
// Helpers for new flow
const formatDateShort = (d) => {
  if (!d) return ''
  try {
    return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'Asia/Manila' })
  } catch {
    return new Date(d).toLocaleDateString()
  }
}

const fetchVisits = async () => {
  loadingVisits.value = true
  visits.value = []
  try {
    const res = await api.get('/visits', { params: { patient_id: props.patientId } })
    visits.value = res.data?.items || res.data?.data || res.data || []
  } catch (e) {
    visits.value = []
  } finally {
    loadingVisits.value = false
  }
}

const startInFacilityAdd = async () => {
  // Ensure we are in in-facility mode initially
  outsideImmunization.value = false
  // Show visit picker first (even if empty)
  showVisitPicker.value = true
  await fetchVisits()
}

const pickVisit = (v) => {
  // Instead of showing visit view, navigate to Add Patient Record page (embedded) when in page mode
  showVisitPicker.value = false
  const visitId = v.visit_id || v.id
  if (props.embeddedPage && router) {
    router.push({
      name: 'AddPatientRecord',
      query: {
        patientId: props.patientId,
        visitId,
        // ensure record-only mode is OFF for in-facility with a visit
        outside: 'false'
      }
    })
  } else {
    emit('open-add-patient-record', { outside: false, visitId, patientId: props.patientId })
  }
}

const selectedVisitId = ref(null)
const showVisitView = ref(false)

const startOutsideAdd = () => {
  // Open add modal with outside pre-enabled
  outsideImmunization.value = true
  openNewVaccinationModal()
}

const openOutsideRecordFromVisitPicker = () => {
  console.log('Opening outside record flow')
  showVisitPicker.value = false
  if (props.embeddedPage && router) {
    router.push({
      name: 'AddPatientRecord',
      query: {
        patientId: props.patientId,
        outside: 'true'
      }
    })
  } else {
    emit('open-add-patient-record', { outside: true, patientId: props.patientId })
  }
}

const closeVisitView = () => {
  showVisitView.value = false
}

const onVisitSaved = () => {
  showVisitView.value = false
}

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
  if (!props.patientId) {
    console.log('No patientId provided to component');
    return;
  }

  // If patient data is provided as prop, use it directly
  if (props.patientData) {
    console.log('Using patient data from props:', props.patientData);
    patientData.value = props.patientData;
    console.log('Patient DOB from props:', patientData.value?.date_of_birth);
    return;
  }

  try {
    loading.value = true;
    console.log('Fetching patient data for patientId:', props.patientId);
    console.log('Making API call to:', `/patients/${props.patientId}/details`);
    
    // Fetch patient details and vaccine list in parallel to normalize names
    const [resp, vaccinesResp] = await Promise.all([
      api.get(`/patients/${props.patientId}`).catch((error) => {
        console.error('Error fetching patient details:', error);
        // Try the details endpoint as fallback
        return api.get(`/patients/${props.patientId}/details`).catch((detailsError) => {
          console.error('Error fetching patient details from fallback endpoint:', detailsError);
          return { data: null };
        });
      }),
      api.get('/vaccines').catch((error) => {
        console.error('Error fetching vaccines:', error);
        return { data: [] };
      })
    ])

    console.log('Raw nextScheduledVaccinations:', resp.data?.data?.nextScheduledVaccinations);
    console.log('First raw schedule item:', resp.data?.data?.nextScheduledVaccinations?.[0]);
    console.log('All keys in first schedule item:', resp.data?.data?.nextScheduledVaccinations?.[0] ? Object.keys(resp.data?.data?.nextScheduledVaccinations[0]) : 'No data');

    patientData.value = resp.data?.data || null
    console.log('Patient data set to:', patientData.value);
    console.log('Patient DOB:', patientData.value?.date_of_birth);
    const vaccinesList = vaccinesResp.data || []
    const vaccineLookup = {}
    if (Array.isArray(vaccinesList)) {
      vaccinesList.forEach(v => {
        const id = v.vaccine_id || v.id
        vaccineLookup[id] = v.antigen_name || v.name || v.label || ''
      })
    }

    // Normalize vaccinationHistory entries to include vaccineName where missing
    if (patientData.value?.vaccinationHistory && Array.isArray(patientData.value.vaccinationHistory)) {
        patientData.value.vaccinationHistory = patientData.value.vaccinationHistory.map(im => ({
        ...im,
        vaccineId: im.vaccineId || im.vaccine_id || (im.vaccine && (im.vaccine.vaccine_id || im.vaccine.id)) || null,
        vaccineName: im.vaccineName || im.vaccine_name || (im.vaccine && (im.vaccine.antigen_name || im.vaccine.name)) || vaccineLookup[im.vaccineId] || vaccineLookup[im.vaccine_id] || ''
        }))
        // Defensive filter by current patient id to avoid cross-patient leakage
        .filter(im => {
          const recPid = im.patient_id ?? im.patientId ?? im.patient_id_fk ?? im.patient?.patient_id ?? im.patient?.id
          return recPid ? String(recPid) === String(props.patientId) : true
        })
    }

    // Normalize nextScheduledVaccinations similarly
    if (patientData.value?.nextScheduledVaccinations && Array.isArray(patientData.value.nextScheduledVaccinations)) {
      patientData.value.nextScheduledVaccinations = patientData.value.nextScheduledVaccinations.map(s => ({
        ...s,
        vaccineId: s.vaccineId || s.vaccine_id || s.vaccine_id || null,
        vaccineName: s.vaccineName || s.vaccine_name || s.antigen_name || (s.vaccine && (s.vaccine.antigen_name || s.vaccine.name)) || vaccineLookup[s.vaccineId] || vaccineLookup[s.vaccine_id] || '',
        scheduledDate: s.scheduledDate || s.scheduled_date || s.due_date,
        ageAtSchedule: s.ageAtSchedule || s.age_at_schedule || s.scheduled_age,
        doseNumber: s.doseNumber || s.dose_number || s.dose || 1,
        status: s.status || s.schedule_status || 'pending'
      }))
    }
    
    console.log('Normalized nextScheduledVaccinations:', patientData.value?.nextScheduledVaccinations);
    console.log('First schedule item:', patientData.value?.nextScheduledVaccinations?.[0]);
  } catch (error) {
    console.error('Error fetching patient details:', error);
    addToast({ title: 'Error', message: 'Failed to load patient data. Please try again.', type: 'error' })
  } finally {
    loading.value = false;
    // Recalculate age if modal is open and form has date
    if ((showNewVaccinationModal.value || showEditVaccinationModal.value) && vaccinationForm.value.dateAdministered) {
      console.log('Recalculating age in finally block');
      calculateAgeAtAdministration();
    }
  }
};

// Fetch vaccine options (inventory/stocks)
const fetchVaccineOptions = async () => {
  try {
    const response = await api.get('/vaccines/inventory');
    // Accept both .data.data and .data as array
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
      isExpired: v.expiration_date ? new Date(v.expiration_date) < new Date(new Date().setHours(0,0,0,0)) : false,
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
    
    // Handle different possible response structures - prioritize new backend structure
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
    } else {
      console.warn('Unexpected health workers response structure:', resp.data);
      allWorkers = [];
    }
    
    // Filter BHS for visit recording (if needed for other contexts)
    healthWorkers.value = allWorkers.filter(hw => {
      const hsType = hw.hs_type || hw.hw_type || hw.role || hw.type || '';
      return hsType.toLowerCase().includes('bhs');
    }).map(hw => ({
      id: hw.user_id || hw.id || hw.health_worker_id,
      health_worker_id: hw.health_worker_id || hw.user_id || hw.id,
      name: [hw.firstname, hw.middlename, hw.surname].filter(Boolean).join(' ').trim() || hw.name || hw.fullname,
      role: hw.hs_type || hw.hw_type || hw.role || hw.type
    }));
    
    // Filter nurses and nutritionists for vaccination administration
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
    
    console.log('Health staff filtered:', { 
      bhs: healthWorkers.value.length, 
      nursesAndNutritionists: nurses.value.length,
      availableTypes: [...new Set(allWorkers.map(hw => hw.hs_type || hw.hw_type || hw.role || hw.type))]
    });
  } catch (err) {
    console.error('Error fetching health workers:', err);
    healthWorkers.value = [];
    nurses.value = [];
  }
}

// When a vaccine is selected, autofill details from vaccineOptions
const onVaccineSelect = async () => {
  const iid = vaccinationForm.value.inventoryId;
  console.log('Vaccine selected with inventory ID:', iid);
  if (!iid) {
    vaccinationForm.value.diseasePrevented = '';
    vaccinationForm.value.vaccineManufacturer = '';
    vaccinationForm.value.vaccineName = '';
    vaccinationForm.value.lotNumber = '';
    vaccinationForm.value.vaccineId = '';
    availableDoses.value = [1,2,3,4,5];
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
  // Calculate age at administration
  console.log('Recalculating age after vaccine selection');
  calculateAgeAtAdministration();

  // Smart dose options and auto-select
  try {
    const res = await api.get(`/patients/${props.patientId}/smart-doses`, { params: { vaccine_id: vaccinationForm.value.vaccineId } });
    const data = res.data?.data || res.data || {};
    const doses = Array.isArray(data.available_doses) ? data.available_doses : (Array.isArray(data.doses) ? data.doses : []);
    availableDoses.value = doses.length > 0 ? doses : [1,2,3,4,5];
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
    availableDoses.value = [1,2,3,4,5];
    autoSelectHint.value = '';
  }
}

// When a vaccine is selected from catalog (outside flow)
const onVaccineCatalogSelect = async () => {
  const vid = vaccinationForm.value.vaccineId;
  if (!vid) {
    vaccinationForm.value.diseasePrevented = '';
    vaccinationForm.value.vaccineManufacturer = '';
    vaccinationForm.value.vaccineName = '';
    availableDoses.value = [1,2,3,4,5];
    autoSelectHint.value = '';
    return;
  }
  const v = (vaccineCatalog.value || []).find(x => (x.vaccine_id === vid));
  if (v) {
    vaccinationForm.value.vaccineName = v.antigen_name || '';
    vaccinationForm.value.diseasePrevented = v.disease_prevented || '';
    vaccinationForm.value.vaccineManufacturer = v.manufacturer || '';
    vaccinationForm.value.lotNumber = '';
  }
  calculateAgeAtAdministration();

  // Smart dose options and auto-select for outside flow
  try {
    const res = await api.get(`/patients/${props.patientId}/smart-doses`, { params: { vaccine_id: vaccinationForm.value.vaccineId } });
    const data = res.data?.data || res.data || {};
    const doses = Array.isArray(data.available_doses) ? data.available_doses : (Array.isArray(data.doses) ? data.doses : []);
    availableDoses.value = doses.length > 0 ? doses : [1,2,3,4,5];
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
    availableDoses.value = [1,2,3,4,5];
    autoSelectHint.value = '';
  }
}

// Calculate age at administration based on patient's DOB and selected date
const calculateAgeAtAdministration = () => {
  if (!patientData.value) {
    console.log('Patient data not loaded yet, skipping age calculation');
    return; // Don't calculate if patient data not loaded yet
  }
  
  const dob = patientData.value?.date_of_birth;
  const adminDate = vaccinationForm.value.dateAdministered;
  
  console.log('Calculating age at administration:', { 
    dob, 
    adminDate, 
    patientDataLoaded: !!patientData.value,
    fullPatientData: patientData.value 
  });
  
  if (!dob || !adminDate) {
    console.log('Missing DOB or admin date, setting age to empty');
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
    
    // Calculate age in months and days
    let totalMonths = (admin.getFullYear() - birth.getFullYear()) * 12 + (admin.getMonth() - birth.getMonth());
    let days = admin.getDate() - birth.getDate();
    
    // Adjust for negative days
    if (days < 0) {
      totalMonths--;
      // Calculate days in previous month
      const prevMonth = new Date(admin.getFullYear(), admin.getMonth() - 1, 1);
      const daysInPrevMonth = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0).getDate();
      days += daysInPrevMonth;
    }
    
    // Ensure totalMonths is not negative
    if (totalMonths < 0) {
      totalMonths = 0;
    }
    
    // Build age string in months and days format
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
    
    console.log('Calculated age:', vaccinationForm.value.ageAtAdministration);
  } catch (error) {
    console.error('Error calculating age:', error);
    vaccinationForm.value.ageAtAdministration = '';
  }
}

// Open new vaccination modal and initialize form
const openNewVaccinationModal = () => {
  console.log('Opening new vaccination modal');
  initVaccinationForm();
  showNewVaccinationModal.value = true;
  // Calculate age immediately after opening modal
  calculateAgeAtAdministration();
}

// Edit vaccination record
const editVaccinationRecord = async (index) => {
  console.log('Editing vaccination record at index:', index);
  if (!patientData.value?.vaccinationHistory?.[index]) {
    console.log('No vaccination record found at index:', index);
    return;
  }
  
  // Refresh patient data to ensure schedules are up to date
  await fetchPatientData();
  
  const record = patientData.value.vaccinationHistory[index];
  vaccinationForm.value = { ...record };
  // Ensure vaccineId and healthWorkerId are set for the select inputs
  vaccinationForm.value.vaccineId = record.vaccineId || record.vaccine_id || (record.vaccine && (record.vaccine.vaccine_id || record.vaccine.id)) || '';
  vaccinationForm.value.healthWorkerId = record.administered_by || record.healthWorkerId || '';
  
  // Format date for input
  if (record.dateAdministered) {
    vaccinationForm.value.dateAdministered = utcToPH(record.dateAdministered);
  }
  
  currentEditIndex.value = index;
  showEditVaccinationModal.value = true;
  
  // Calculate age at administration after modal is shown and form is set up
  calculateAgeAtAdministration();
};

// Delete vaccination record by immunization id
const deleteVaccinationRecord = async (index) => {
  if (!patientData.value?.vaccinationHistory?.[index]) return;

  const vaccine = patientData.value.vaccinationHistory[index];
  
  try {
    await confirm({
      title: 'Delete Vaccination Record',
      message: `Are you sure you want to delete the vaccination record for ${vaccine.vaccineName}? This action cannot be undone.`,
      variant: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    })
    
    try {
      saving.value = true;
      if (vaccine.immunization_id) {
        await api.delete(`/immunizations/${vaccine.immunization_id}`);
      } else {
        // Fallback: send delete by patient and matching lot/date
        await api.delete(`/patients/${props.patientId}/vaccinations`, { data: { lotNumber: vaccine.lotNumber, dateAdministered: vaccine.dateAdministered } });
      }
      
      // Schedule maintenance is handled by backend; no explicit schedule update call needed here.
      
      await fetchPatientData(); // Refresh data
      addToast({ title: 'Deleted', message: 'Vaccination record deleted successfully', type: 'success' })
      emit('update'); // Notify parent component
    } catch (error) {
      console.error('Error deleting vaccination record:', error);
      addToast({ title: 'Error', message: 'Failed to delete vaccination record. Please try again.', type: 'error' })
    } finally {
      saving.value = false;
    }
  } catch {
    // User cancelled
  }
};

// Save vaccination record (add new or update existing)
const saveVaccinationRecord = async () => {
  try {
    saving.value = true;

    // If in visit context, save to database and emit the vaccination data for the visit
    if (props.visitContext) {
      // Build vaccination object to be saved with the visit (no direct API call here)
      const remarksWithSite = vaccinationForm.value.siteOfAdministration 
        ? `${vaccinationForm.value.remarks || ''} (Site: ${vaccinationForm.value.siteOfAdministration})`.trim()
        : vaccinationForm.value.remarks || ''

      const savedVaccination = {
        patient_id: props.patientId,
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

      // Emit the vaccination data to parent component for visit reference
      emit('vaccinations-collected', [savedVaccination]);

      addToast({ title: 'Success', message: 'Vaccination administered and recorded', type: 'success' });
      closeVaccinationModal();
      // Close the main modal as well since we're done
      emit('close');
      return;
    }

    // Normal database save logic for standalone vaccination editing
    if (showEditVaccinationModal.value && currentEditIndex.value >= 0) {
      // Update existing immunization by id
      const existing = patientData.value.vaccinationHistory[currentEditIndex.value];
      if (existing && existing.immunization_id) {
        const remarksWithSite = vaccinationForm.value.siteOfAdministration 
          ? `${vaccinationForm.value.remarks || ''} (Site: ${vaccinationForm.value.siteOfAdministration})`.trim()
          : vaccinationForm.value.remarks || ''

        await api.put(`/immunizations/${existing.immunization_id}`, {
          administered_date: vaccinationForm.value.dateAdministered,
          dose_number: vaccinationForm.value.doseNumber || existing.dose_number || 1,
          site_of_administration: vaccinationForm.value.siteOfAdministration,
          administered_by: vaccinationForm.value.healthWorkerId,
          facility_name: vaccinationForm.value.facilityName,
          remarks: remarksWithSite
        });
      } else {
        // Fallback: replace via patient vaccinations endpoint
        const updatedRecords = [...patientData.value.vaccinationHistory];
        updatedRecords[currentEditIndex.value] = { ...vaccinationForm.value };
        await api.put(`/patients/${props.patientId}/vaccinations`, { vaccinationHistory: updatedRecords });
      }
    } else {
      // Create new immunization (associate to patient)
      // Send minimal fields; backend will compute age_at_administration from patient's DOB and administered_date
      const remarksWithSite = vaccinationForm.value.siteOfAdministration 
        ? `${vaccinationForm.value.remarks || ''} (Site: ${vaccinationForm.value.siteOfAdministration})`.trim()
        : vaccinationForm.value.remarks || ''

      if (outsideImmunization.value) {
        // Outside flow: no inventory, send outside flag
        await api.post(`/immunizations`, {
          patient_id: props.patientId,
          vaccine_id: vaccinationForm.value.vaccineId,
          administered_date: vaccinationForm.value.dateAdministered,
          dose_number: vaccinationForm.value.doseNumber || 1,
          administered_by: vaccinationForm.value.healthWorkerId,
          facility_name: vaccinationForm.value.facilityName,
          remarks: remarksWithSite,
          outside: true
        });
      } else {
        // In-facility: inventory is required; backend will validate same-day visit with vitals exists
        const payload = {
          patient_id: props.patientId,
          inventory_id: vaccinationForm.value.inventoryId,
          vaccine_id: vaccinationForm.value.vaccineId,
          administered_date: vaccinationForm.value.dateAdministered,
          dose_number: vaccinationForm.value.doseNumber || 1,
          administered_by: vaccinationForm.value.healthWorkerId,
          facility_name: vaccinationForm.value.facilityName,
          remarks: remarksWithSite
        }
        if (selectedVisitId.value) payload.visit_id = selectedVisitId.value
        await api.post(`/immunizations`, payload)
      }
    }

    // Schedule statuses are maintained by backend logic; no explicit call needed here.

    await fetchPatientData(); // Refresh data
    emit('update'); // Notify parent component
    closeVaccinationModal();
  } catch (error) {
    console.error('Error saving vaccination record:', error);
    addToast({ title: 'Error', message: 'Failed to save vaccination record. Please try again.', type: 'error' })
  } finally {
    saving.value = false;
  }
};

// Close vaccination modal and reset form
const closeVaccinationModal = () => {
  showNewVaccinationModal.value = false;
  showEditVaccinationModal.value = false;
  currentEditIndex.value = -1;
  initVaccinationForm();
};

// Close main modal
const closeMainModal = () => {
  // If in visit context, emit collected vaccinations before closing
  if (props.visitContext && collectedVaccinations.value.length > 0) {
    emit('vaccinations-collected', collectedVaccinations.value);
  }
  // If embedded as page, navigate back instead of emitting close
  if (props.embeddedPage) {
    router.back();
  } else {
    emit('close');
  }
};

// onClose handler for page header/back button
const onClose = () => {
  if (props.embeddedPage) return router.back();
  return emit('close');
}

// Helper functions
const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-PH', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
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
  console.log('Processing status:', status, '->', statusLower);
  
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
      console.log('Unknown status:', statusLower);
      return 'bg-secondary';
  }
};

// Compute days overdue for a schedule row
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
}

// Watch for show prop changes to fetch data when modal opens
watch(() => props.show, (newVal) => {
  console.log('Show prop changed to:', newVal, 'patientId:', props.patientId);
  if (newVal && props.patientId) {
    fetchPatientData();
    fetchVaccineOptions();
    fetchHealthWorkers();
  }
  // When modal is toggled open, set the outside toggle based on defaultOutside hint
  if (newVal) {
    outsideImmunization.value = !!props.defaultOutside;
  }
});

// Watch for date changes to recalculate age
watch(() => vaccinationForm.value.dateAdministered, (newDate) => {
  console.log('Date administered changed to:', newDate);
  calculateAgeAtAdministration();
});

// Watch outside toggle to reset conflicting fields
watch(() => outsideImmunization.value, (isOutside) => {
  if (isOutside) {
    vaccinationForm.value.inventoryId = '';
    vaccinationForm.value.lotNumber = '';
    // Ensure catalog is loaded
    fetchVaccineCatalog();
  } else {
    vaccinationForm.value.vaccineId = '';
    // Ensure inventory options are loaded
    fetchVaccineOptions();
  }
});

onMounted(() => {
  console.log('VaccinationRecordEditor mounted with props:', { show: props.show, embeddedPage: props.embeddedPage, patientId: props.patientId, visitContext: props.visitContext });
  if ((props.embeddedPage || props.show) && props.patientId) {
    fetchPatientData();
    fetchVaccineOptions();
    fetchVaccineCatalog();
    fetchHealthWorkers();

    // If in visit context, automatically open the add vaccination modal
    if (props.visitContext && props.show) {
      console.log('Opening add vaccination modal automatically for visit context');
      setTimeout(() => {
        openNewVaccinationModal();
      }, 500); // Small delay to ensure data is loaded
    }
  }
  // Initialize outside mode based on defaultOutside on mount
  outsideImmunization.value = !!props.defaultOutside;
});

// Validation for save button
const canSave = computed(() => {
  // Shared required fields
  const hasBasics = !!vaccinationForm.value.dateAdministered && !!vaccinationForm.value.doseNumber && !!vaccinationForm.value.healthWorkerId;
  if (!hasBasics) return false;
  if (props.visitContext) {
    // In visit context, we still require a stock selection for in-facility
    if (!vaccinationForm.value.inventoryId) return false;
    // Block expired stock selections
    const inv = (vaccineOptions.value || []).find(x => x.inventory_id === vaccinationForm.value.inventoryId);
    return inv ? !inv.isExpired : false;
  }
  // Standalone
  if (outsideImmunization.value) {
    return !!vaccinationForm.value.vaccineId;
  }
  if (!vaccinationForm.value.inventoryId) return false;
  const inv = (vaccineOptions.value || []).find(x => x.inventory_id === vaccinationForm.value.inventoryId);
  return inv ? !inv.isExpired : false;
});

const noop = () => {}

// Filter vaccination history strictly for current patient id
const filteredVaccinations = computed(() => {
  const list = patientData.value?.vaccinationHistory || []
  return list.filter(im => {
    const recPid = im?.patient_id ?? im?.patientId ?? im?.patient_id_fk ?? im?.patient?.patient_id ?? im?.patient?.id
    return recPid ? String(recPid) === String(props.patientId) : true
  })
})

// Sort vaccinations for table view (most recent first)
const sortedVaccinations = computed(() => {
  const list = filteredVaccinations.value || []
  return [...list].sort((a, b) => {
    const aDate = a.administered_date || a.date_administered || a.dateAdministered
    const bDate = b.administered_date || b.date_administered || b.dateAdministered
    const dateA = aDate ? new Date(aDate).getTime() : 0
    const dateB = bDate ? new Date(bDate).getTime() : 0
    return dateB - dateA
  })
})

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

// Derive fields for display consistent with VaccinationHistory
const deriveSite = (v) => {
  const remarks = v?.remarks || v?.notes || ''
  if (remarks) {
    const m = remarks.match(/(?:site|injection site)\s*[:\-]\s*([^;,\.\n]+)/i)
    if (m && m[1]) return m[1].trim()
    if (/deltoid|thigh|vastus|buttock|arm|left|right|intramuscular|subcutaneous/i.test(remarks)) return remarks
  }
  return v?.site || v?.site_of_administration || v?.siteOfAdministration || '—'
}

const deriveFacility = (v) => {
  const isOutside = !!(v?.immunization_outside || v?.is_outside || v?.isOutside || v?.outside_immunization || v?.outside)
  if (isOutside) return 'Outside'
  return (
    v?.immunization_facility_name ||
    v?.facility_name ||
    v?.facilityName ||
    v?.health_center ||
    v?.healthCenter ||
    '—'
  )
}

const isOutside = (v) => !!(v?.immunization_outside || v?.is_outside || v?.isOutside || v?.outside_immunization || v?.outside)
</script>

<style scoped>
.modal.show {
  background-color: rgba(0, 0, 0, 0.5);
}

code {
  background: #e9ecef;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
}

.btn-group .btn {
  border-radius: 0.25rem;
  margin-right: 0.125rem;
}

.btn-group .btn:last-child {
  margin-right: 0;
}
</style>
