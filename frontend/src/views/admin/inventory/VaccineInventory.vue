<template>
  <AdminLayout>
    <div class="container-fluid">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 class="h3 mb-0 text-gray-800">Vaccine Inventory</h1>
          <p class="text-muted mb-0">Manage vaccine types and track vaccine stock levels</p>
        </div>
        <div class="d-flex gap-2">
          <!-- Temporarily hidden per request; Receiving Reports is the canonical add path -->
          <router-link v-if="false" class="btn btn-outline-primary" to="/admin/vaccines/add-stock">
            <i class="bi bi-plus-circle me-2"></i>Add New Stock
          </router-link>
          <router-link v-if="false" class="btn btn-outline-success" to="/admin/vaccines/add-vaccine">
            <i class="bi bi-plus-circle me-2"></i>Add New Vaccine
          </router-link>
          <button class="btn btn-primary" @click="goToCreateReceiving">
            <i class="bi bi-plus-circle me-2"></i>New Receiving Report
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <!-- Inventory Summary -->
      <div v-if="!loading" class="row g-3 mb-4">
        <!-- Total Types -->
        <div class="col-md-3">
          <div class="card border-start border-primary border-4 shadow h-100 py-2">
            <div class="card-body">
              <div class="d-flex align-items-center justify-content-between">
                <div>
                  <div class="text-xs fw-bold text-primary text-uppercase mb-1">Total Types</div>
                  <div class="h5 mb-0 fw-bold text-gray-800">{{ stats.totalTypes }}</div>
                </div>
                <div class="col-auto">
                  <i class="bi bi-collection text-primary" style="font-size: 2rem;"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Total Doses -->
        <div class="col-md-3">
          <div class="card border-start border-success border-4 shadow h-100 py-2">
            <div class="card-body">
              <div class="d-flex align-items-center justify-content-between">
                <div>
                  <div class="text-xs fw-bold text-success text-uppercase mb-1">Total Doses</div>
                  <div class="h5 mb-0 fw-bold text-gray-800">{{ stats.totalDoses }}</div>
                </div>
                <div class="col-auto">
                  <i class="bi bi-capsule text-success" style="font-size: 2rem;"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Low Stock -->
        <div class="col-md-3">
          <div class="card border-start border-warning border-4 shadow h-100 py-2">
            <div class="card-body">
              <div class="d-flex align-items-center justify-content-between">
                <div>
                  <div class="text-xs fw-bold text-warning text-uppercase mb-1">Low Stock</div>
                  <div class="h5 mb-0 fw-bold text-gray-800">{{ stats.lowStock }}</div>
                </div>
                <div class="col-auto">
                  <i class="bi bi-exclamation-triangle text-warning" style="font-size: 2rem;"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Expiring Soon -->
        <div class="col-md-3">
          <div class="card border-start border-danger border-4 shadow h-100 py-2">
            <div class="card-body">
              <div class="d-flex align-items-center justify-content-between">
                <div>
                  <div class="text-xs fw-bold text-danger text-uppercase mb-1">Expiring Soon</div>
                  <div class="h5 mb-0 fw-bold text-gray-800">{{ stats.expiringSoon }}</div>
                </div>
                <div class="col-auto">
                  <i class="bi bi-calendar-x text-danger" style="font-size: 2rem;"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Inventory Table -->
      <div v-if="!loading" class="card shadow mb-4">
        <div class="card-header py-3 d-flex justify-content-between align-items-center">
          <h6 class="m-0 fw-bold text-primary">Vaccine Stock</h6>
          <div class="d-flex gap-2 align-items-center">
            <div class="input-group w-25">
              <input 
                type="text" 
                class="form-control" 
                placeholder="Search vaccines..." 
                v-model="searchTerm"
                aria-label="Search"
                @input="watchSearchTerm"
              >
              <button class="btn btn-outline-primary" type="button">
                <i class="bi bi-search"></i>
              </button>
            </div>
            <div class="dropdown ms-2">
              <button class="btn btn-outline-secondary dropdown-toggle" type="button" id="filterDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                Filter: {{ currentFilter }}
              </button>
              <ul class="dropdown-menu" aria-labelledby="filterDropdown">
                <li><a class="dropdown-item" href="#" @click.prevent="setFilter('All')">All</a></li>
                <li><a class="dropdown-item" href="#" @click.prevent="setFilter('NIP')">NIP</a></li>
                <li><a class="dropdown-item" href="#" @click.prevent="setFilter('Others')">Others</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-hover">
              <thead class="table-light">
                <tr>
                  <th>Vaccine Name</th>
                  <th>Brand Name</th>
                  <th>Manufacturer</th>
                  <th>Expiry Date</th>
                  <th>Quantity</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="vaccine in paginatedVaccines" :key="vaccine.id">
                  <td class="fw-semibold">{{ vaccine.vaccineName }}</td>
                  <td>{{ vaccine.brandName }}</td>
                  <td>{{ vaccine.manufacturer }}</td>
                  <td>{{ formatDate(vaccine.expiryDate) }}</td>
                  <td>
                    <span class="fw-bold" :class="getQuantityClass(vaccine.quantity)">
                      {{ vaccine.quantity }}
                    </span>
                  </td>
                  <td>
                    <span class="badge" :class="getStatusBadgeClass(vaccine.status)">
                      {{ vaccine.status }}
                    </span>
                  </td>
                  <td>
                    <div class="d-flex gap-2">
                      <router-link 
                        :to="`/admin/vaccines/view/${vaccine.id}`"
                        class="btn btn-sm btn-outline-primary"
                      >
                        <i class="bi bi-eye me-2"></i>View
                      </router-link>
                      <button 
                        class="btn btn-sm btn-outline-danger" 
                        @click="deleteVaccine(vaccine)"
                      >
                        <i class="bi bi-trash me-2"></i>Delete
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="paginatedVaccines.length === 0">
                  <td colspan="7" class="text-center text-muted py-4">
                    No vaccines found
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="card-footer">
          <AppPagination
            :currentPage="currentPage"
            :totalPages="totalPages"
            :totalItems="filteredVaccines.length"
            :itemsPerPage="itemsPerPage"
            @page-changed="goToPage"
          />
        </div>
      </div>

      <!-- Vaccine Schedules Section -->
      <VaccineScheduleSection v-if="!loading" :existing-vaccines="existingVaccines" />

      <!-- Receiving Reports Section -->
      <div class="card shadow mb-4">
        <div class="card-header py-3 d-flex justify-content-between align-items-center">
          <h6 class="m-0 fw-bold text-primary">Receiving Reports</h6>
          <div class="d-flex align-items-center gap-2">
            <input class="form-control" placeholder="Search RR-..." v-model="receivingSearch" @input="fetchReceivingList" style="max-width: 240px;" />
            <select class="form-select" v-model="receivingStatus" @change="fetchReceivingList" style="max-width: 180px;">
              <option value="">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <button class="btn btn-outline-secondary" @click="fetchReceivingList" title="Refresh"><i class="bi bi-arrow-clockwise"></i></button>
          </div>
        </div>
        <div class="card-body">
          <div v-if="receivingLoading" class="text-center py-4">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </div>
          <div v-else class="table-responsive">
            <table class="table table-hover table-striped">
              <thead class="table-light">
                <tr>
                  <th>Report #</th>
                  <th>Delivery Date</th>
                  <th>Delivered By</th>
                  <th>Received By</th>
                  <th>Total Items</th>
                  <th>Total Qty</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in receivingList.items" :key="r.report_id" @click="goToViewReceiving(r)" style="cursor:pointer;">
                  <td class="fw-semibold">{{ r.report_number }}</td>
                  <td>{{ formatDate(r.delivery_date) }}</td>
                  <td>{{ r.delivered_by }}</td>
                  <td>{{ r.received_by_name || '-' }}</td>
                  <td>{{ r.total_items || 0 }}</td>
                  <td>{{ r.total_quantity || 0 }}</td>
                  <td>
                    <span class="badge" :class="getReceivingBadgeClass(r.status)">{{ r.status }}</span>
                  </td>
                  <td>
                    <div class="btn-group btn-group-sm">
                      <button class="btn btn-outline-primary" @click.stop="goToViewReceiving(r)"><i class="bi bi-eye"></i></button>
                      <button class="btn btn-outline-success" :disabled="r.status!=='DRAFT'" @click.stop="goToCompleteReceiving(r)"><i class="bi bi-check2-circle"></i></button>
                      <button class="btn btn-outline-danger" :disabled="r.status!=='DRAFT'" @click.stop="goToCancelReceiving(r)"><i class="bi bi-x-circle"></i></button>
                    </div>
                  </td>
                </tr>
                <tr v-if="(receivingList.items||[]).length===0">
                  <td colspan="8" class="text-center text-muted py-4">No receiving reports found</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Add/Edit Stock Modal -->
      <div class="modal fade" :class="{ show: showAddModal || showAddStockModal }" :style="{ display: (showAddModal || showAddStockModal) ? 'block' : 'none' }" tabindex="-1">
        <div class="modal-dialog modal-dialog-scrollable" style="max-width: 75vw; width: 75vw;">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="bi bi-plus-circle me-2"></i>
                {{ isEditing ? 'Edit Inventory Details' : 'Add New Stock' }}
              </h5>
              <button type="button" class="btn-close" @click="closeModal"></button>
            </div>
            <div class="modal-body px-4">
              <form id="stock-form" @submit.prevent="saveVaccine">
                <!-- Stock Information -->
                <div class="row mb-4">
                  <div class="col-12">
                    <h6 class="text-primary fw-bold mb-3">
                      <i class="bi bi-box-seam me-2"></i>Stock Information
                    </h6>
                    <div class="row g-4">
                      <div class="col-xl-6 col-lg-6 col-md-6">
                        <label for="vaccineSelect" class="form-label">Select Vaccine Type: <span class="text-danger">*</span></label>
                        <select 
                          class="form-select" 
                          id="vaccineSelect"
                          v-model="form.vaccine_id" 
                          @change="onVaccineSelect"
                          required
                        >
                          <option value="">-- Select a Vaccine Type --</option>
                          <option v-for="vaccine in existingVaccines" :key="vaccine.id" :value="vaccine.id">
                            {{ vaccine.antigen_name }} - {{ vaccine.brand_name }}
                          </option>
                        </select>
                      </div>
                      <div class="col-xl-6 col-lg-6 col-md-6">
                        <label for="brandName" class="form-label">Brand Name:</label>
                        <input 
                          type="text" 
                          class="form-control bg-light" 
                          id="brandName"
                          v-model="form.brandName" 
                          readonly
                          placeholder="Auto-populated from selected vaccine"
                        >
                      </div>
                      <div class="col-xl-6 col-lg-6 col-md-6">
                        <label for="manufacturer" class="form-label">Manufacturer: <span class="text-danger">*</span></label>
                        <input 
                          type="text" 
                          class="form-control" 
                          id="manufacturer"
                          v-model="form.manufacturer" 
                          required
                          list="manufacturerOptionsList"
                          placeholder="e.g., Pfizer Inc., Moderna Inc."
                        >
                        <datalist id="manufacturerOptionsList">
                          <option v-for="m in manufacturerOptions" :key="m" :value="m"></option>
                        </datalist>
                      </div>
                      <div class="col-xl-6 col-lg-6 col-md-6" v-if="!isEditing">
                        <label for="quantity" class="form-label">Stock Quantity: <span class="text-danger">*</span></label>
                        <input 
                          type="number" 
                          class="form-control" 
                          id="quantity"
                          v-model="form.quantity" 
                          min="0"
                          required
                          placeholder="Number of doses"
                        >
                      </div>
                      <div class="col-xl-6 col-lg-6 col-md-6" v-if="isEditing">
                        <label for="currentQuantity" class="form-label">Current Stock Quantity:</label>
                        <input 
                          type="number" 
                          class="form-control bg-light" 
                          id="currentQuantity"
                          v-model="form.quantity" 
                          readonly
                          placeholder="Current stock level"
                        >
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Stock Adjustment (only when editing) -->
                <div class="row mb-4" v-if="isEditing">
                  <div class="col-12">
                    <h6 class="text-primary fw-bold mb-3">
                      <i class="bi bi-arrow-left-right me-2"></i>Stock Adjustment
                    </h6>
                    <div class="row g-4">
                      <div class="col-xl-6 col-lg-6 col-md-6">
                        <label for="adjustType" class="form-label">Transaction Type:</label>
                        <select 
                          class="form-select" 
                          id="adjustType"
                          v-model="adjustForm.type"
                        >
                          <option value="ADJUST">ADJUST (Set to exact quantity)</option>
                          <option value="RETURN">RETURN (Remove from stock)</option>
                          <option value="EXPIRED">EXPIRED (Mark as expired)</option>
                        </select>
                        <small class="text-muted">ADJUST sets stock to the exact quantity you enter. Others modify current stock.</small>
                      </div>
                      <div class="col-xl-6 col-lg-6 col-md-6">
                        <label for="adjustQuantity" class="form-label">Adjust Quantity:</label>
                        <input 
                          type="number" 
                          class="form-control" 
                          id="adjustQuantity"
                          v-model.number="adjustForm.quantity"
                          min="0"
                          placeholder="0"
                        >
                        <small class="text-muted">Leave at 0 for no adjustment</small>
                      </div>
                      <div class="col-12">
                        <label for="adjustNote" class="form-label">Adjustment Note:</label>
                        <textarea 
                          class="form-control" 
                          id="adjustNote"
                          v-model="adjustForm.note"
                          rows="2"
                          placeholder="Reason for adjustment (optional)"
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Batch & Storage Information -->
                <div class="row mb-4">
                  <div class="col-12">
                    <h6 class="text-primary fw-bold mb-3">
                      <i class="bi bi-archive me-2"></i>Batch & Storage Information
                    </h6>
                    <div class="row g-4">
                      <div class="col-xl-4 col-lg-4 col-md-6">
                        <label for="lotNumber" class="form-label">Lot Number: <span class="text-danger">*</span></label>
                        <input 
                          type="text" 
                          class="form-control" 
                          id="lotNumber"
                          v-model="form.lotNumber" 
                          required
                          placeholder="e.g., LOT123456"
                        >
                      </div>
                      <div class="col-xl-4 col-lg-4 col-md-6">
                        <label for="expirationDate" class="form-label">Expiration Date: <span class="text-danger">*</span></label>
                        <DateInput v-model="form.expirationDate" />
                      </div>
                      <div class="col-xl-4 col-lg-4 col-md-6">
                        <label for="storageLocation" class="form-label">Storage Location:</label>
                        <input
                          type="text"
                          class="form-control"
                          id="storageLocation"
                          v-model="form.storageLocation"
                          list="storageLocations"
                          placeholder="e.g., Cold Room A, Refrigerator 1"
                        >
                        <datalist id="storageLocations">
                          <option v-for="opt in storageLocationOptions" :key="opt" :value="opt">{{ opt }}</option>
                        </datalist>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeModal">
                <i class="bi bi-x-circle me-2"></i>Cancel
              </button>
              <button type="submit" class="btn btn-primary" :disabled="saving" form="stock-form">
                <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
                <i v-else class="bi bi-check-circle me-2"></i>
                {{ isEditing ? 'Update' : 'Add' }} Stock
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Inventory Details Modal -->
      <div class="modal fade" :class="{ show: showDetailsModal }" :style="{ display: showDetailsModal ? 'block' : 'none' }" tabindex="-1">
        <div class="modal-dialog modal-dialog-scrollable" style="max-width: 700px; width: 700px;">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="bi bi-eye me-2"></i>
                Inventory Details
              </h5>
              <button type="button" class="btn-close" @click="closeDetailsModal"></button>
            </div>
            <div class="modal-body px-4" v-if="selectedInventory">
              <div class="row g-3">
                <div class="col-md-6">
                  <div class="form-text">Vaccine</div>
                  <div class="fw-semibold">{{ selectedInventory.vaccineName }}</div>
                </div>
                <div class="col-md-6">
                  <div class="form-text">Manufacturer</div>
                  <div class="fw-semibold">{{ selectedInventory.manufacturer || '-' }}</div>
                </div>
                <div class="col-md-6">
                  <div class="form-text">Brand</div>
                  <div class="fw-semibold">{{ selectedInventory.brandName || '-' }}</div>
                </div>
                <div class="col-md-6">
                  <div class="form-text">Lot Number</div>
                  <div class="fw-semibold">{{ selectedInventory.batchNo || selectedInventory.lotNumber || '-' }}</div>
                </div>
                <div class="col-md-6">
                  <div class="form-text">Expiration Date</div>
                  <div class="fw-semibold">{{ formatDate(selectedInventory.expiryDate) }}</div>
                </div>
                <div class="col-md-6">
                  <div class="form-text">Storage Location</div>
                  <div class="fw-semibold">{{ selectedInventory.storageLocation || '-' }}</div>
                </div>
                <div class="col-md-6">
                  <div class="form-text">Quantity</div>
                  <div class="fw-semibold">{{ selectedInventory.quantity }}</div>
                </div>
                <div class="col-md-6">
                  <div class="form-text">Status</div>
                  <span class="badge" :class="getStatusBadgeClass(selectedInventory.status)">{{ selectedInventory.status }}</span>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeDetailsModal">
                <i class="bi bi-x-circle me-2"></i>Close
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Expires Today Notice Modal -->
      <div class="modal fade" :class="{ show: showExpiresTodayModal }" :style="{ display: showExpiresTodayModal ? 'block' : 'none' }" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title text-danger">
                <i class="bi bi-exclamation-octagon me-2"></i>
                Lot Expires Today
              </h5>
              <button type="button" class="btn-close" @click="showExpiresTodayModal = false"></button>
            </div>
            <div class="modal-body">
              <p class="mb-2">The lot you just saved has an expiration date of <strong>{{ formatDate(savedLot?.expiration_date || savedLot?.expiryDate) }}</strong>, which is today.</p>
              <p class="mb-0 small text-muted">This stock will be treated as expired by the system after today (or when the expiry check runs). You may use it only if local policy allows same-day use before end of day.</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-primary" @click="showExpiresTodayModal = false">OK</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Add / Edit Vaccine Type Modal -->
      <div class="modal fade" :class="{ show: showAddVaccineModal }" :style="{ display: showAddVaccineModal ? 'block' : 'none' }" tabindex="-1">
        <div class="modal-dialog modal-dialog-scrollable" style="max-width: 75vw; width: 75vw;">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i v-if="!isEditingVaccineType" class="bi bi-plus-square me-2"></i>
                <i v-else class="bi bi-pencil-square me-2"></i>
                {{ isEditingVaccineType ? 'Edit Vaccine Type' : 'Add New Vaccine Type' }}
              </h5>
              <button type="button" class="btn-close" @click="closeVaccineModal"></button>
            </div>
            <div class="modal-body px-4">
              <div v-if="!isEditingVaccineType" class="alert alert-info mb-4">
                <i class="bi bi-info-circle me-2"></i>
                <strong>Note:</strong> This creates a new vaccine type. Each combination of Antigen Name + Brand Name must be unique.
              </div>
              <form id="vaccine-form" @submit.prevent="saveVaccineType">
                <!-- Vaccine Information -->
                <div class="row mb-4">
                  <div class="col-12">
                    <h6 class="text-primary fw-bold mb-3">
                      <i class="bi bi-shield-check me-2"></i>Vaccine Information
                    </h6>
                    <div class="row g-4">
                      <div class="col-xl-6 col-lg-6 col-md-6">
                        <label for="newAntigenName" class="form-label">Antigen Name: <span class="text-danger">*</span></label>
                        <div class="input-group">
                          <select
                            class="form-select"
                            id="antigenDropdown"
                            v-model="selectedAntigen"
                            @change="onAntigenSelect"
                            :disabled="isEditingVaccineType"
                          >
                            <option value="">-- Select or type antigen --</option>
                            <option v-for="antigen in antigenOptions" :key="antigen" :value="antigen">
                              {{ antigen }}
                            </option>
                          </select>
                          <input
                            type="text"
                            class="form-control"
                            id="newAntigenName"
                            v-model="vaccineForm.antigen_name"
                            @input="onAntigenInput"
                            placeholder="e.g., COVID-19, Rotavirus, Measles"
                            required
                            :readonly="isEditingVaccineType"
                          >
                        </div>
                        <small class="text-muted">Select from dropdown or type manually to add new antigen</small>
                      </div>
                      <div class="col-xl-6 col-lg-6 col-md-6">
                        <label for="newBrandName" class="form-label">Brand Name: <span class="text-danger">*</span></label>
                        <div class="input-group">
                          <select
                            class="form-select"
                            id="brandDropdown"
                            v-model="selectedBrand"
                            @change="onBrandSelect"
                            :disabled="isEditingVaccineType"
                          >
                            <option value="">-- Select or type brand --</option>
                            <option v-for="brand in brandOptions" :key="brand" :value="brand">
                              {{ brand }}
                            </option>
                          </select>
                          <input
                            type="text"
                            class="form-control"
                            id="newBrandName"
                            v-model="vaccineForm.brand_name"
                            @input="onBrandInput"
                            placeholder="e.g., Pfizer, Moderna, Sinovac"
                            required
                            :readonly="isEditingVaccineType"
                          >
                        </div>
                        <small class="text-muted">Select from dropdown or type manually to add new brand</small>
                      </div>
                      <div class="col-xl-6 col-lg-6 col-md-6">
                        <label for="newManufacturer" class="form-label">Manufacturer: <span class="text-danger">*</span></label>
                        <div class="input-group">
                          <select
                            class="form-select"
                            id="manufacturerDropdown"
                            v-model="selectedManufacturer"
                            @change="onManufacturerSelect"
                          >
                            <option value="">-- Select or type manufacturer --</option>
                            <option v-for="manufacturer in manufacturerOptions" :key="manufacturer" :value="manufacturer">
                              {{ manufacturer }}
                            </option>
                          </select>
                          <input
                            type="text"
                            class="form-control"
                            id="newManufacturer"
                            v-model="vaccineForm.manufacturer"
                            @input="onManufacturerInput"
                            placeholder="e.g., Pfizer Inc., Moderna Inc."
                            required
                          >
                        </div>
                        <small class="text-muted">Select from dropdown or type manually to add new manufacturer</small>
                      </div>
                      <div class="col-xl-6 col-lg-6 col-md-6">
                        <label for="newDiseasePrevented" class="form-label">Disease Prevented: <span class="text-danger">*</span></label>
                        <div class="input-group">
                          <select
                            class="form-select"
                            id="diseaseDropdown"
                            v-model="selectedDisease"
                            @change="onDiseaseSelect"
                          >
                            <option value="">-- Select or type disease --</option>
                            <option v-for="disease in diseaseOptions" :key="disease" :value="disease">
                              {{ disease }}
                            </option>
                          </select>
                          <input
                            type="text"
                            class="form-control"
                            id="newDiseasePrevented"
                            v-model="vaccineForm.disease_prevented"
                            @input="onDiseaseInput"
                            placeholder="e.g., Tuberculosis, Measles, COVID-19"
                            required
                          >
                        </div>
                        <small class="text-muted">Select from dropdown or type manually to add new disease</small>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Classification & Category -->
                <div class="row mb-4">
                  <div class="col-12">
                    <h6 class="text-primary fw-bold mb-3">
                      <i class="bi bi-tags me-2"></i>Classification & Category
                    </h6>
                    <div class="row g-4">
                      <div class="col-xl-6 col-lg-6 col-md-6">
                        <label for="newCategory" class="form-label">Category: <span class="text-danger">*</span></label>
                        <select
                          class="form-select"
                          id="newCategory"
                          v-model="vaccineForm.category"
                          @change="onCategoryChange"
                          required
                        >
                          <option value="">-- Select Category --</option>
                          <option value="VACCINE">Vaccine</option>
                          <option value="DEWORMING">Deworming</option>
                          <option value="VITAMIN_A">Vitamin A Supplement</option>
                        </select>
                      </div>
                        <div class="col-xl-6 col-lg-6 col-md-6">
                        <label for="newVaccineType" class="form-label">Vaccine Type: <span class="text-danger" v-if="vaccineForm.category === 'VACCINE'">*</span></label>
                        <select 
                          class="form-select" 
                          id="newVaccineType"
                          v-model="vaccineForm.vaccine_type"
                          :required="vaccineForm.category === 'VACCINE'"
                          :disabled="vaccineForm.category !== 'VACCINE'"
                        >
                          <option value="">-- Select Type --</option>
                          <option value="live">Live Attenuated</option>
                          <option value="inactivated">Inactivated/Killed</option>
                        </select>
                        <small v-if="vaccineForm.category !== 'VACCINE'" class="text-muted">Not applicable for this category</small>
                      </div>
                      <div class="col-xl-6 col-lg-6 col-md-6 d-flex align-items-center">
                        <div class="form-check mt-3">
                          <input class="form-check-input" type="checkbox" id="isNipCheckbox" v-model="vaccineForm.is_nip">
                          <label class="form-check-label" for="isNipCheckbox">Part of NIP (National Immunization Program)</label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Initial Stock Information (only when creating new type) -->
                <div v-if="!isEditingVaccineType" class="row mb-4">
                  <div class="col-12">
                    <h6 class="text-primary fw-bold mb-3">
                      <i class="bi bi-archive me-2"></i>Initial Stock Information
                    </h6>
                    <div class="row g-4">
                      <div class="col-xl-4 col-lg-4 col-md-6">
                        <label for="newLotNumber" class="form-label">Lot Number: <span class="text-danger">*</span></label>
                        <input 
                          type="text" 
                          class="form-control" 
                          id="newLotNumber"
                          v-model="vaccineForm.lot_number" 
                          required
                          placeholder="e.g., LOT123456"
                        >
                      </div>
                      <div class="col-xl-4 col-lg-4 col-md-6">
                        <label for="newExpirationDate" class="form-label">Expiration Date: <span class="text-danger">*</span></label>
                        <DateInput v-model="vaccineForm.expiration_date" />
                      </div>
                      <div class="col-xl-4 col-lg-4 col-md-6">
                        <label for="newStockLevel" class="form-label">Initial Stock Level: <span class="text-danger">*</span></label>
                        <input 
                          type="number" 
                          class="form-control" 
                          id="newStockLevel"
                          v-model="vaccineForm.stock_level" 
                          min="0"
                          required
                          placeholder="Number of doses"
                        >
                      </div>
                      <div class="col-12">
                        <label for="newStorageLocation" class="form-label">Storage Location:</label>
                        <input
                          type="text"
                          class="form-control"
                          id="newStorageLocation"
                          v-model="vaccineForm.storage_location"
                          placeholder="e.g., Cold Room A, Refrigerator 1, Freezer Section B"
                        >
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeVaccineModal">
                <i class="bi bi-x-circle me-2"></i>Cancel
              </button>
              <button type="submit" class="btn btn-success" :disabled="saving" form="vaccine-form">
                <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
                <i v-else class="bi bi-check-circle me-2"></i>
                {{ isEditingVaccineType ? 'Save Changes' : 'Add Vaccine Type' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Adjust Stock Modal -->
      <div class="modal fade" :class="{ show: showAdjustModal }" :style="{ display: showAdjustModal ? 'block' : 'none' }" tabindex="-1">
        <div class="modal-dialog" style="max-width: 520px; width: 520px;">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="bi bi-arrow-left-right me-2"></i>
                Adjust Stock
              </h5>
              <button type="button" class="btn-close" @click="closeAdjustModal"></button>
            </div>
            <div class="modal-body px-4">
              <form id="adjust-form" @submit.prevent="submitAdjust">
                <div class="mb-3">
                  <label class="form-label">Transaction Type</label>
                  <select class="form-select" v-model="adjustForm.type" required>
                    <option v-for="t in adjustTypes" :key="t" :value="t">{{ t }}</option>
                  </select>
                  <div class="form-text" v-if="adjustForm.type==='ADJUST'">ADJUST sets the stock to the exact quantity you enter.</div>
                </div>
                <div class="mb-3">
                  <label class="form-label">Quantity</label>
                  <input type="number" min="0" class="form-control" v-model.number="adjustForm.quantity" required />
                </div>
                <div class="mb-3">
                  <label class="form-label">Note (optional)</label>
                  <textarea class="form-control" rows="2" v-model="adjustForm.note" placeholder="Reason or remarks"></textarea>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeAdjustModal">Cancel</button>
              <button type="submit" class="btn btn-primary" :disabled="submittingAdjust" form="adjust-form">
                <span v-if="submittingAdjust" class="spinner-border spinner-border-sm me-2"></span>
                <i v-else class="bi bi-check-circle me-2"></i>
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Inventory History Modal -->
      <div class="modal fade" :class="{ show: showHistoryModal }" :style="{ display: showHistoryModal ? 'block' : 'none' }" tabindex="-1">
        <div class="modal-dialog modal-dialog-scrollable" style="max-width: 900px; width: 900px;">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="bi bi-clock-history me-2"></i>
                Inventory Transaction History
              </h5>
              <button type="button" class="btn-close" @click="closeHistoryModal"></button>
            </div>
            <div class="modal-body px-4">
              <div v-if="inventoryHistory.length === 0" class="text-center py-4">
                <i class="bi bi-info-circle text-muted" style="font-size: 3rem;"></i>
                <p class="text-muted mt-2">No transaction history found for this inventory item.</p>
              </div>
              <div v-else class="table-responsive">
                <table class="table table-hover">
                  <thead class="table-light">
                    <tr>
                      <th>Date</th>
                      <th>Transaction Type</th>
                      <th>Quantity Change</th>
                      <th>Balance After</th>
                      <th>Note</th>
                      <th>Performed By</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="transaction in inventoryHistory" :key="transaction.transaction_id">
                      <td>{{ formatDate(transaction.created_at) }}</td>
                      <td>
                        <span class="badge" :class="getTransactionTypeClass(transaction.transaction_type)">
                          {{ transaction.transaction_type }}
                        </span>
                      </td>
                      <td>
                        <span :class="getQuantityChangeClass(transaction.quantity_delta)">
                          {{ transaction.quantity_delta > 0 ? '+' : '' }}{{ transaction.quantity_delta }}
                        </span>
                      </td>
                      <td class="fw-bold">{{ transaction.balance_after }}</td>
                      <td>{{ transaction.note || transaction.remarks || '-' }}</td>
                      <td>{{ transaction.performed_by || 'SYSTEM' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeHistoryModal">
                <i class="bi bi-x-circle me-2"></i>Close
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Scheduling Modal -->
      <div v-if="showScheduleModal" class="modal fade show d-block" tabindex="-1" style="background:rgba(0,0,0,0.3);">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Manage Vaccine Scheduling</h5>
              <button type="button" class="btn-close" @click="showScheduleModal = false"></button>
            </div>
            <div class="modal-body">
              <form @submit.prevent="submitSchedule">
                <div class="mb-3">
                  <label class="form-label">Select Vaccine Type *</label>
                  <select v-model="selectedVaccine" class="form-select" :disabled="scheduleReadOnly" required>
                    <option value="">-- Select Vaccine --</option>
                    <option v-for="v in (scheduleReadOnly ? existingVaccines : unscheduledVaccines)" :key="v.id" :value="v.id">
                      {{ v.antigen_name }} ({{ v.brand_name }})
                    </option>
                  </select>
                </div>
                <div v-if="selectedVaccine">
                  <div class="row g-3">
                    <div class="col-md-6">
                      <label class="form-label">Schedule Name *</label>
                      <input type="text" class="form-control" v-model="schedulingFields.name" :disabled="scheduleReadOnly" required placeholder="e.g. NIP BCG Schedule" />
                      <small class="text-muted">A descriptive name for this schedule.</small>
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">Schedule Code</label>
                      <input type="text" class="form-control" v-model="schedulingFields.code" :disabled="scheduleReadOnly" placeholder="e.g. NIP-BCG-2025" />
                      <small class="text-muted">Optional code for reference.</small>
                    </div>
                  </div>
                  <div class="row g-3 mt-1">
                    <div class="col-md-4">
                      <label class="form-label">Total Doses *</label>
                      <input type="number" class="form-control" v-model.number="schedulingFields.total_doses" :disabled="scheduleReadOnly" min="1" required placeholder="e.g. 3" />
                      <small class="text-muted">How many doses in this series? This creates per-dose panels automatically.</small>
                    </div>
                    <div class="col-md-4">
                      <label class="form-label">Concurrent Allowed</label>
                      <select class="form-select" v-model="schedulingFields.concurrent_allowed" :disabled="scheduleReadOnly">
                        <option :value="true">Yes</option>
                        <option :value="false">No</option>
                      </select>
                      <small class="text-muted">Can this vaccine be given with others?</small>
                    </div>
                    <div class="col-md-4">
                      <label class="form-label">Catch-up Strategy</label>
                      <input type="text" class="form-control" v-model="schedulingFields.catchup_strategy" :disabled="scheduleReadOnly" placeholder="e.g. Give ASAP if missed" />
                      <small class="text-muted">Instructions if a dose is missed.</small>
                    </div>
                  </div>
                  <div class="row g-3 mt-1">
                    <div class="col-md-6">
                      <label class="form-label">Minimum Age (days) *</label>
                      <input type="number" class="form-control" v-model.number="schedulingFields.min_age_days" :disabled="scheduleReadOnly" min="0" required placeholder="e.g. 0 for birth" />
                      <small class="text-muted">Earliest age (in days) for first dose. Use days for precision (e.g., 0 = birth).</small>
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">Maximum Age (days)</label>
                      <input type="number" class="form-control" v-model.number="schedulingFields.max_age_days" :disabled="scheduleReadOnly" min="0" placeholder="e.g. 365 for 1 year" />
                      <small class="text-muted">Latest age (in days) for last dose (optional). Leave empty if not applicable.</small>
                    </div>
                  </div>
                    <div class="mb-3 mt-2">
                    <label class="form-label">Notes</label>
                    <textarea class="form-control" v-model="schedulingFields.notes" :disabled="scheduleReadOnly" placeholder="Any extra info or instructions"></textarea>
                  </div>
                  <hr />
                  <h6>Dose Schedule <span class="text-muted">(Configure each dose)</span></h6>
                  <div v-if="(schedulingFields.doses || []).length === 0" class="alert alert-info">Enter a value in <strong>Total Doses</strong> to create per-dose panels.</div>
                  <div v-else class="border rounded p-3 mb-3 bg-light-subtle">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <strong>Dose {{ (currentDoseIndex || 0) + 1 }} of {{ schedulingFields.total_doses }}</strong>
                        <div class="text-muted">Use Prev/Next or pick a dose below to navigate</div>
                      </div>
                      <div>
                        <button class="btn btn-sm btn-outline-secondary me-2" @click="prevDose" :disabled="currentDoseIndex === 0">&laquo; Prev</button>
                        <button class="btn btn-sm btn-outline-secondary" @click="nextDose" :disabled="currentDoseIndex >= (Number(schedulingFields.total_doses) - 1)">Next &raquo;</button>
                      </div>
                    </div>
                    <div class="mb-2">
                      <div class="btn-group" role="group" aria-label="Dose picker">
                        <button v-for="n in Number(schedulingFields.total_doses || 0)" :key="n" type="button" class="btn btn-sm" :class="{'btn-outline-secondary': currentDoseIndex !== (n-1), 'btn-primary': currentDoseIndex === (n-1)}" @click="goToDose(n-1)">Dose {{ n }}</button>
                      </div>
                    </div>
                    <div class="row g-3">
                      <div class="col-md-2">
                        <label class="form-label">Dose # *</label>
                        <input type="number" class="form-control" v-model.number="schedulingFields.doses[currentDoseIndex].dose_number" :disabled="scheduleReadOnly" min="1" required />
                        <small class="text-muted">e.g. 1, 2, 3</small>
                      </div>
                      <div class="col-md-2">
                        <label class="form-label">Due After Days *</label>
                        <input type="number" class="form-control" v-model.number="schedulingFields.doses[currentDoseIndex].due_after_days" :disabled="scheduleReadOnly" min="0" required placeholder="e.g. 0, 42, 75" />
                        <small class="text-muted">Child's age in days for this dose.</small>
                      </div>
                      <div class="col-md-2">
                        <label class="form-label">Min Interval (days)</label>
                        <input type="number" class="form-control" v-model.number="schedulingFields.doses[currentDoseIndex].min_interval_days" :disabled="scheduleReadOnly" min="0" placeholder="e.g. 28" />
                        <small class="text-muted">Min days after previous dose.</small>
                      </div>
                      <div class="col-md-2">
                        <label class="form-label">Max Interval (days)</label>
                        <input type="number" class="form-control" v-model.number="schedulingFields.doses[currentDoseIndex].max_interval_days" :disabled="scheduleReadOnly" min="0" placeholder="e.g. 90" />
                        <small class="text-muted">Max days after previous dose.</small>
                      </div>
                      <div class="col-md-2">
                        <label class="form-label">Min Interval Other Vax</label>
                        <input type="number" class="form-control" v-model.number="schedulingFields.doses[currentDoseIndex].min_interval_other_vax" :disabled="scheduleReadOnly" min="0" placeholder="e.g. 14" />
                        <small class="text-muted">Min days after other vaccines.</small>
                      </div>
                      <div class="col-md-2">
                        <label class="form-label">Requires Previous</label>
                        <select class="form-select" v-model="schedulingFields.doses[currentDoseIndex].requires_previous" :disabled="scheduleReadOnly">
                          <option :value="true">Yes</option>
                          <option :value="false">No</option>
                        </select>
                        <small class="text-muted">Must follow previous dose?</small>
                      </div>
                    </div>
                    <div class="mt-2">
                      <div v-if="errors.doses && errors.doses[currentDoseIndex]" class="text-danger small">
                        <div v-for="(msg, key) in errors.doses[currentDoseIndex]" :key="key">{{ msg }}</div>
                      </div>
                    </div>
                    <div class="row g-3 mt-1">
                      <div class="col-md-2">
                        <label class="form-label">Skippable</label>
                        <select class="form-select" v-model="schedulingFields.doses[currentDoseIndex].skippable" :disabled="scheduleReadOnly">
                          <option :value="true">Yes</option>
                          <option :value="false">No</option>
                        </select>
                        <small class="text-muted">Can this dose be skipped?</small>
                      </div>
                      <div class="col-md-2">
                        <label class="form-label">Grace Period (days)</label>
                        <input type="number" class="form-control" v-model.number="schedulingFields.doses[currentDoseIndex].grace_period_days" :disabled="scheduleReadOnly" min="0" placeholder="e.g. 7" />
                        <small class="text-muted">Days after due date still on time.</small>
                      </div>
                      <div class="col-md-2">
                        <label class="form-label">Absolute Latest (days)</label>
                        <input type="number" class="form-control" v-model.number="schedulingFields.doses[currentDoseIndex].absolute_latest_days" :disabled="scheduleReadOnly" min="0" placeholder="e.g. 180" />
                        <small class="text-muted">Last possible day for this dose.</small>
                      </div>
                      <div class="col-md-6">
                        <label class="form-label">Notes</label>
                        <input type="text" class="form-control" v-model="schedulingFields.doses[currentDoseIndex].notes" :disabled="scheduleReadOnly" placeholder="Any special instructions" />
                      </div>
                    </div>
                  </div>
                  <div v-if="submitMessage" :class="{'alert': true, 'alert-success': submitMessage.includes('success'), 'alert-danger': !submitMessage.includes('success')}" >{{ submitMessage }}</div>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" @click="showScheduleModal = false" :disabled="isSubmitting">Close</button>
              <button v-if="!scheduleReadOnly" class="btn btn-outline-secondary me-2" type="button" @click="openPreview">Preview Payload</button>
              <button v-if="!scheduleReadOnly" class="btn btn-primary" :disabled="!selectedVaccine || isSubmitting" @click="submitSchedule">
                <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2"></span>
                Save Schedule
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Preview Modal -->
      <div v-if="showPreviewModal" class="modal fade show d-block" tabindex="-1" style="background:rgba(0,0,0,0.3);">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Preview Schedule Payload</h5>
              <button type="button" class="btn-close" @click="closePreview"></button>
            </div>
            <div class="modal-body">
              <pre style="max-height:60vh; overflow:auto; background:#f8f9fa; padding:1rem; border-radius:.25rem">{{ JSON.stringify(previewPayload, null, 2) }}</pre>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" @click="closePreview">Close</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Edit Vaccine Modal (two-phase inline like New Schedule) -->
      <div v-if="showEditVaccineWizard" class="modal fade show d-block" tabindex="-1" style="background:rgba(0,0,0,0.3);">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Edit Vaccine</h5>
              <button type="button" class="btn-close" @click="closeEditVaccineWizard"></button>
            </div>
            <div class="modal-body">
              <form @submit.prevent="submitEditVaccineWizard">
                <div class="mb-3">
                  <label class="form-label">Select Vaccine Type *</label>
                  <select v-model="editWizard.selectedVaccineId" class="form-select" @change="onEditVaccineSelect" required>
                    <option value="">-- Select Vaccine --</option>
                    <option v-for="v in existingVaccines" :key="v.id" :value="v.id">
                      {{ v.antigen_name }} ({{ v.brand_name }})
                    </option>
                  </select>
                </div>
                <div v-if="editWizard.selectedVaccineId">
                  <!-- Reuse vaccine type form fields -->
                  <div class="row mb-3">
                    <div class="col-md-6">
                      <label class="form-label">Antigen Name *</label>
                      <input class="form-control" v-model="vaccineForm.antigen_name" required />
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">Brand Name *</label>
                      <input class="form-control" v-model="vaccineForm.brand_name" required />
                    </div>
                  </div>
                  <div class="row mb-3">
                    <div class="col-md-6">
                      <label class="form-label">Manufacturer *</label>
                      <input class="form-control" v-model="vaccineForm.manufacturer" required />
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">Disease Prevented *</label>
                      <input class="form-control" v-model="vaccineForm.disease_prevented" required />
                    </div>
                  </div>
                  <div class="row mb-3">
                    <div class="col-md-6 d-flex align-items-center">
                      <div class="form-check mt-2">
                        <input class="form-check-input" type="checkbox" id="editIsNip" v-model="vaccineForm.is_nip">
                        <label class="form-check-label" for="editIsNip">Part of NIP (National Immunization Program)</label>
                      </div>
                    </div>
                  </div>
                  <div class="row mb-3">
                    <div class="col-md-6">
                      <label class="form-label">Category *</label>
                      <select class="form-select" v-model="vaccineForm.category" @change="onCategoryChange" required>
                        <option value="">-- Select Category --</option>
                        <option value="VACCINE">Vaccine</option>
                        <option value="DEWORMING">Deworming</option>
                        <option value="VITAMIN_A">Vitamin A Supplement</option>
                      </select>
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">Vaccine Type</label>
                      <select class="form-select" v-model="vaccineForm.vaccine_type" :disabled="vaccineForm.category !== 'VACCINE'">
                        <option value="">-- Select Type --</option>
                        <option value="live">Live Attenuated</option>
                        <option value="inactivated">Inactivated/Killed</option>
                      </select>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" @click="closeEditVaccineWizard" :disabled="saving">Close</button>
              <button class="btn btn-success" :disabled="saving || !editWizard.selectedVaccineId" @click="submitEditVaccineWizard">
                <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Backdrop -->
  <div v-if="showAddModal || showAddStockModal || showAddVaccineModal || showScheduleModal || showEditVaccineWizard" class="modal-backdrop fade show"></div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import DateInput from '@/components/common/DateInput.vue'
import VaccineScheduleSection from './components/VaccineScheduleSection.vue'
import api from '@/services/api'
import { usePagination } from '@/composables/usePagination'
import { useToast } from '@/composables/useToast'

const { addToast } = useToast()

// Reactive data
const loading = ref(true)
const saving = ref(false)
const vaccines = ref([])
const existingVaccines = ref([])
const schedules = ref([])
const stats = ref({
  totalTypes: 0,
  totalDoses: 0,
  available: 0,
  lowStock: 0,
  outOfStock: 0,
  expiringSoon: 0
})
const searchTerm = ref('')
// Filter dropdown state
const currentFilter = ref('All')

const setFilter = (filter) => {
  currentFilter.value = filter
  fetchVaccines()
}

// Show only NIP vaccines in inventory view
const showNipOnly = ref(false)

const toggleNipFilter = (val) => {
  showNipOnly.value = Boolean(val)
  fetchVaccines()
}
const showAddModal = ref(false)
const showAddStockModal = ref(false)
const showAdjustModal = ref(false)
const submittingAdjust = ref(false)
const showAddVaccineModal = ref(false)
// Hide legacy add flows by default; Receiving Reports is the canonical path
const showLegacyInventoryActions = ref(false)
const showScheduleModal = ref(false)
const scheduleReadOnly = ref(false)
const isEditing = ref(false)
const isEditingVaccineType = ref(false)
const selectedVaccine = ref('')
const showHistoryModal = ref(false)
const inventoryHistory = ref([])
// New UI state
const showDetailsModal = ref(false)
const selectedInventory = ref(null)
const showExpiresTodayModal = ref(false)
const savedLot = ref(null)
const storageLocationOptions = ref([
  'Cold Room A', 'Cold Room B', 'Refrigerator 1', 'Refrigerator 2', 'Freezer -20C', 'Freezer -80C'
])

// Receiving Reports state
const receivingLoading = ref(false)
const receivingList = ref({ items: [], totalCount: 0, totalPages: 0 })
const receivingStatus = ref('')
const receivingSearch = ref('')
const router = useRouter()
const schedulingFields = ref({
  // schedule_master fields
  name: '',
  code: '',
  total_doses: 1,
  concurrent_allowed: false,
  catchup_strategy: '',
  min_age_days: 0,
  max_age_days: null,
  created_by: null,
  notes: '',
  // doses array (schedule_doses entries)
  doses: []
})
const currentDoseIndex = ref(0)

// Disease management
const diseaseOptions = ref([])
const selectedDisease = ref('')
const antigenOptions = ref([])
const selectedAntigen = ref('')
const brandOptions = ref([])
const selectedBrand = ref('')
const manufacturerOptions = ref([])
const selectedManufacturer = ref('')

// Ensure schedulingFields.doses length matches schedulingFields.total_doses
function ensureDosesCount(count) {
  const n = Number(count) || 0
  const doses = schedulingFields.value.doses || []
  if (doses.length < n) {
    for (let i = doses.length; i < n; i++) {
      doses.push({
        dose_number: i + 1,
        due_after_days: '',
        min_interval_days: '',
        max_interval_days: '',
        min_interval_other_vax: '',
        requires_previous: false,
        skippable: false,
        grace_period_days: '',
        absolute_latest_days: '',
        notes: ''
      })
    }
  } else if (doses.length > n) {
    doses.splice(n)
    if (currentDoseIndex.value >= n) currentDoseIndex.value = Math.max(0, n - 1)
  }
  schedulingFields.value.doses = doses
}

// Watch total_doses so dose panels are created/removed automatically
watch(() => schedulingFields.value.total_doses, (newVal) => {
  ensureDosesCount(newVal)
})

// Reset schedulingFields to defaults
function resetSchedulingFields() {
  schedulingFields.value = {
    name: '',
    code: '',
    total_doses: 1,
    concurrent_allowed: false,
    catchup_strategy: '',
    min_age_days: 0,
    max_age_days: null,
    created_by: null,
    notes: '',
    doses: []
  }
}

// Fetch existing schedule for a vaccine (if any) and populate schedulingFields
async function fetchSchedule(vaccineId) {
  if (!vaccineId) return resetSchedulingFields()
  try {
    const res = await api.get(`/vaccines/${vaccineId}/schedule`)
    const payload = res.data?.data || res.data || null
    if (!payload) {
      resetSchedulingFields()
      return
    }

    // Prefer schedule_doses (API shape) but support doses[] as fallback
    const rawDoses = Array.isArray(payload.schedule_doses)
      ? payload.schedule_doses
      : (Array.isArray(payload.doses) ? payload.doses : [])

    const mappedDoses = rawDoses
      .map((d, i) => ({
        dose_number: d?.dose_number != null ? Number(d.dose_number) : (i + 1),
        due_after_days: d?.due_after_days == null ? '' : Number(d.due_after_days),
        min_interval_days: d?.min_interval_days == null ? '' : Number(d.min_interval_days),
        max_interval_days: d?.max_interval_days == null ? '' : Number(d.max_interval_days),
        min_interval_other_vax: d?.min_interval_other_vax == null ? '' : Number(d.min_interval_other_vax),
        requires_previous: !!d?.requires_previous,
        skippable: !!d?.skippable,
        grace_period_days: d?.grace_period_days == null ? '' : Number(d.grace_period_days),
        // absolute_latest_days may not exist in newer schema; keep for backward compat
        absolute_latest_days: d?.absolute_latest_days == null ? '' : Number(d.absolute_latest_days),
        notes: d?.notes || ''
      }))
      .sort((a, b) => (a.dose_number || 0) - (b.dose_number || 0))

    schedulingFields.value = {
      name: payload.name || '',
      code: payload.code || '',
      total_doses: Number(payload.total_doses) || mappedDoses.length || 1,
      concurrent_allowed: !!payload.concurrent_allowed,
      catchup_strategy: payload.catchup_strategy || '',
      min_age_days: payload.min_age_days != null ? Number(payload.min_age_days) : 0,
      max_age_days: payload.max_age_days != null ? Number(payload.max_age_days) : null,
      created_by: payload.created_by || null,
      notes: payload.notes || '',
      doses: mappedDoses
    }

    currentDoseIndex.value = 0

    ensureDosesCount(schedulingFields.value.total_doses)
  } catch (e) {
    console.error('Error fetching schedule for vaccine', vaccineId, e)
    resetSchedulingFields()
  }
}

// When user selects a vaccine, try to load its schedule for editing
watch(selectedVaccine, (val) => {
  if (val) fetchSchedule(val)
  else resetSchedulingFields()
})

function nextDose() {
  const total = Number(schedulingFields.value.total_doses) || schedulingFields.value.doses.length
  if (currentDoseIndex.value < total - 1) currentDoseIndex.value++
}

function prevDose() {
  if (currentDoseIndex.value > 0) currentDoseIndex.value--
}

function goToDose(i) {
  const total = Number(schedulingFields.value.total_doses) || schedulingFields.value.doses.length
  if (i >= 0 && i < total) currentDoseIndex.value = i
}
const isSubmitting = ref(false)
const submitMessage = ref('')
// Validation errors structure: { general: '', doses: [ { due_after_days: '...', ... } ] }
const errors = ref({ general: '', doses: [] })

function clearErrors() {
  errors.value = { general: '', doses: [] }
}

function validateSchedule() {
  clearErrors()
  const sf = schedulingFields.value
  if (!sf.name || String(sf.name).trim() === '') {
    errors.value.general = 'Schedule name is required.'
    return false
  }
  const total = Number(sf.total_doses) || 0
  if (total < 1) {
    errors.value.general = 'Total doses must be at least 1.'
    return false
  }
  if (!Array.isArray(sf.doses) || sf.doses.length < total) {
    errors.value.general = 'Dose count does not match Total Doses.'
    return false
  }
  // per-dose checks
  for (let i = 0; i < total; i++) {
    const d = sf.doses[i] || {}
    const dErr = {}
    if (d.dose_number == null) dErr.dose_number = 'Dose number required.'
    if (d.due_after_days === '' || d.due_after_days == null) dErr.due_after_days = 'Due After Days required.'
    if (Object.keys(dErr).length > 0) {
      errors.value.doses[i] = dErr
    }
  }
  // if any dose errors exist, block submit
  if (errors.value.doses.some(x => x && Object.keys(x).length > 0)) {
    errors.value.general = errors.value.general || 'Please fix per-dose errors.'
    return false
  }
  return true
}

const showPreviewModal = ref(false)
const previewPayload = ref(null)

// Edit Vaccine Wizard State
const showEditVaccineWizard = ref(false)
const editWizard = ref({ selectedVaccineId: '' })

function openEditVaccineWizard() {
  editWizard.value = { selectedVaccineId: '' }
  showEditVaccineWizard.value = true
}

function closeEditVaccineWizard() {
  showEditVaccineWizard.value = false
  editWizard.value = { selectedVaccineId: '' }
}

async function onEditVaccineSelect() {
  try {
    const vid = editWizard.value.selectedVaccineId
    if (!vid) return
    const res = await api.get(`/vaccines/${vid}`)
    const d = res.data?.data || res.data
    isEditingVaccineType.value = true
    vaccineForm.value = {
      id: d.vaccine_id || d.id,
      antigen_name: d.antigen_name || '',
      brand_name: d.brand_name || '',
      manufacturer: d.manufacturer || '',
      disease_prevented: d.disease_prevented || '',
      vaccine_type: d.vaccine_type || '',
      category: d.category || 'VACCINE',
      is_nip: d.is_nip === true || d.is_nip === 'true' || false,
      lot_number: '',
      expiration_date: '',
      stock_level: 0,
      storage_location: ''
    }
  } catch (e) {
    console.error('Error loading vaccine for edit', e)
    addToast({ title: 'Error', message: 'Failed to load vaccine type', type: 'error' })
  }
}

async function submitEditVaccineWizard() {
  try {
    saving.value = true
    const vaccineId = vaccineForm.value.id
    const vaccinePayload = {
      antigen_name: vaccineForm.value.antigen_name,
      brand_name: vaccineForm.value.brand_name,
      is_nip: !!vaccineForm.value.is_nip,
      disease_prevented: vaccineForm.value.disease_prevented,
      manufacturer: vaccineForm.value.manufacturer,
      vaccine_type: (vaccineForm.value.category === 'DEWORMING' || vaccineForm.value.category === 'VITAMIN_A')
        ? null
        : vaccineForm.value.vaccine_type,
      category: vaccineForm.value.category
    }
    await api.put(`/vaccines/${vaccineId}`, vaccinePayload)
    addToast({ title: 'Saved', message: 'Vaccine type updated.', type: 'success' })
    closeEditVaccineWizard()
    await fetchVaccines()
    await fetchExistingVaccines()
    await fetchStats()
  } catch (error) {
    console.error('Error updating vaccine:', error)
    addToast({ title: 'Error', message: 'Error saving vaccine type.', type: 'error' })
  } finally {
    saving.value = false
  }
}

function buildPayload() {
  const sf = schedulingFields.value
  const payload = {
    name: String(sf.name || ''),
    code: sf.code || null,
    total_doses: Number(sf.total_doses) || 0,
    concurrent_allowed: !!sf.concurrent_allowed,
    catchup_strategy: sf.catchup_strategy || null,
    min_age_days: sf.min_age_days != null ? Number(sf.min_age_days) : null,
    max_age_days: sf.max_age_days != null ? Number(sf.max_age_days) : null,
    notes: sf.notes || null,
    doses: (sf.doses || []).map(d => ({
      dose_number: Number(d.dose_number) || null,
      due_after_days: d.due_after_days === '' || d.due_after_days == null ? null : Number(d.due_after_days),
      min_interval_days: d.min_interval_days === '' || d.min_interval_days == null ? null : Number(d.min_interval_days),
      max_interval_days: d.max_interval_days === '' || d.max_interval_days == null ? null : Number(d.max_interval_days),
      min_interval_other_vax: d.min_interval_other_vax === '' || d.min_interval_other_vax == null ? null : Number(d.min_interval_other_vax),
      requires_previous: !!d.requires_previous,
      skippable: !!d.skippable,
      grace_period_days: d.grace_period_days === '' || d.grace_period_days == null ? null : Number(d.grace_period_days),
      absolute_latest_days: d.absolute_latest_days === '' || d.absolute_latest_days == null ? null : Number(d.absolute_latest_days),
      notes: d.notes || null
    }))
  }
  return payload
}

function openPreview() {
  if (!validateSchedule()) {
    submitMessage.value = errors.value.general || 'Validation failed.'
    return
  }
  previewPayload.value = buildPayload()
  showPreviewModal.value = true
}

function closePreview() {
  showPreviewModal.value = false
  previewPayload.value = null
}

// Reset pagination when search term changes
const resetPagination = () => {
  goToPage(1)
}

// Watch for search term changes
const watchSearchTerm = () => {
  if (searchTerm.value !== undefined) {
    resetPagination()
  }
}

// Form data for inventory stock
const form = ref({
  id: null,
  vaccine_id: '',
  antigenName: '',
  brandName: '',
  manufacturer: '',
  category: '',
  quantity: 0,
  lotNumber: '',
  expirationDate: '',
  storageLocation: ''
})

// Form data for new vaccine
const vaccineForm = ref({
  id: null,
  antigen_name: '',
  brand_name: '',
  manufacturer: '',
  disease_prevented: '',
  vaccine_type: '',
  category: '',
  is_nip: false,
  lot_number: '',
  expiration_date: '',
  stock_level: 0,
  storage_location: ''
})

// Computed properties
const filteredVaccines = computed(() => {
  if (!searchTerm.value) return vaccines.value
  return vaccines.value.filter(vaccine => 
    vaccine.vaccineName.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
    vaccine.manufacturer.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
    vaccine.batchNo.toLowerCase().includes(searchTerm.value.toLowerCase())
  )
})

// Pagination
const itemsPerPage = ref(5)
const {
  currentPage,
  totalPages,
  paginatedItems: paginatedVaccines,
  nextPage,
  prevPage,
  goToPage,
  pageNumbers
} = usePagination(filteredVaccines, itemsPerPage.value)

// Methods
const fetchVaccines = async () => {
  try {
    loading.value = true
    const params = {}
    
    // Apply filter based on currentFilter value
    if (currentFilter.value === 'NIP') {
      params.is_nip = true
    } else if (currentFilter.value === 'Others') {
      params.is_nip = false
    }
    // 'All' means no filter parameter
    
    const response = await api.get('/vaccines/inventory', { params })
    const items = response.data?.data || response.data || []
    // Defensive: filter out any soft-deleted items if backend ever returns them
    const filteredItems = Array.isArray(items) ? items.filter(v => v && v.is_deleted !== true) : []
  vaccines.value = filteredItems.map(v => {
      const qty = (v.current_stock_level ?? v.quantity ?? 0)
      // Derive status considering expiry first, then quantity
      const exp = v.expiration_date || v.expiry_date || null
      const now = new Date()
      let status = v.status || null
      if (exp) {
        const d = new Date(exp)
        if (!isNaN(d)) {
          const in30 = new Date(now.getTime() + 30*24*60*60*1000)
          if (d < now) status = 'Expired'
          else if (d >= now && d <= in30) status = 'Expiring Soon'
        }
      }
      if (!status) status = (qty > 0 ? (qty < 10 ? 'Low Stock' : 'Available') : 'Out of Stock')
      return {
        id: v.inventory_id || v.id,
        vaccine_id: v.vaccinemaster?.vaccine_id || v.vaccine_id || v.vaccine?.vaccine_id,
        vaccineName: v.vaccinemaster?.antigen_name || v.vaccine?.antigen_name || v.antigen_name || '',
        brandName: v.vaccinemaster?.brand_name || v.vaccine?.brand_name || v.brand_name || '',
        manufacturer: v.vaccinemaster?.manufacturer || v.vaccine?.manufacturer || v.manufacturer || '',
        category: v.vaccinemaster?.category || v.category || '',
        batchNo: v.lot_number || v.batch_number || '',
        expiryDate: v.expiration_date || v.expiry_date || '',
        storageLocation: v.storage_location || v.storageLocation || '',
        quantity: qty,
        status
      }
    })
    console.debug('[fetchVaccines] fetched', items.length, 'inventory items, mapped', vaccines.value.length, 'for table')
  } catch (error) {
    console.error('Error fetching vaccines:', error)
    addToast({ title: 'Error', message: 'Error loading vaccine data', type: 'error' })
  } finally {
    loading.value = false
  }
}

// Update stats calculation to use vaccines.value for all stats except totalTypes
const fetchStats = async () => {
  try {
    // Use existingVaccines for unique vaccine types
    const activeVaccines = vaccines.value.filter(v => !v.is_deleted)
    const totalTypes = new Set(existingVaccines.value.map(v => v.antigen_name + '|' + v.brand_name)).size;
    // Use activeVaccines for inventory-based stats
    const totalDoses = activeVaccines.reduce((sum, v) => sum + (v.quantity || 0), 0);
    const lowStock = activeVaccines.filter(v => (v.quantity || 0) > 0 && (v.quantity || 0) < 10).length;
    const expiringSoon = activeVaccines.filter(v => {
      if (!v.expiryDate) return false;
      const d = new Date(v.expiryDate);
      const now = new Date();
      const in30 = new Date(now.getTime() + 30*24*60*60*1000);
      return d >= now && d <= in30;
    }).length;
    stats.value = { totalTypes, totalDoses, lowStock, expiringSoon };
  } catch (error) {
    console.error('Error calculating stats:', error);
    stats.value = { totalTypes: 0, totalDoses: 0, lowStock: 0, expiringSoon: 0 };
  }
};

const fetchExistingVaccines = async () => {
  try {
    const response = await api.get('/vaccines')
    let raw = response.data?.data || response.data || []
    // If backend returns { vaccines: [...] }, extract the array
    if (raw && typeof raw === 'object' && Array.isArray(raw.vaccines)) {
      raw = raw.vaccines
    }
    console.debug('[fetchExistingVaccines] normalized:', raw)
    if (Array.isArray(raw)) {
      existingVaccines.value = raw.map(v => ({
        ...v,
        id: v.vaccine_id || v.id // alias for selection
      }))
    } else if (raw && typeof raw === 'object') {
      // If API returns a single object, wrap in array
      existingVaccines.value = [{
        ...raw,
        id: raw.vaccine_id || raw.id
      }]
    } else {
      existingVaccines.value = []
    }
  } catch (error) {
    console.error('Error fetching existing vaccines:', error)
    // Fallback to empty array if API fails
    existingVaccines.value = []
  }
}

const saveVaccine = async () => {
  try {
    saving.value = true
    
    const payload = {
      vaccine_id: form.value.vaccine_id,
      lot_number: form.value.lotNumber,
      expiration_date: convertToISODate(form.value.expirationDate) || form.value.expirationDate,
      storage_location: form.value.storageLocation || null
    }
    // Prefill safety (ensure edit modal shows existing lot/storage)
    if (isEditing.value) {
      // No-op: form is already populated by editVaccine(); just ensure storage/lot are mapped
      if (!form.value.lotNumber && form.value.batchNo) form.value.lotNumber = form.value.batchNo
      if (!form.value.storageLocation && form.value.storageLocation == null && typeof form.value.storage_location !== 'undefined') {
        form.value.storageLocation = form.value.storage_location
      }
    } else {
      // Only on create do we set initial quantity; on edit, use Adjust Stock modal
      payload.current_stock_level = form.value.quantity
    }

    // Validate expiry rules
    const expDate = new Date(payload.expiration_date || form.value.expirationDate)
    const today = new Date()
    today.setHours(0,0,0,0)
    const in30 = new Date(today.getTime() + 30*24*60*60*1000)
    if (!isNaN(expDate)) {
      if (expDate < today) {
        addToast({ title: 'Invalid Expiration', message: 'The selected expiration date is in the past. Expired stock cannot be added.', type: 'error' })
        return
      }
      if (expDate >= today && expDate <= in30) {
        addToast({ title: 'Near Expiry', message: 'This lot is expiring within 30 days. It will be added but flagged as Expiring Soon.', type: 'warning' })
      }
    }
    if (!payload.vaccine_id) {
      addToast({ title: 'Validation', message: 'Please select a vaccine type first.', type: 'warning' })
      return
    }
    
    let resp
    if (isEditing.value) {
      resp = await api.put(`/vaccines/inventory/${form.value.id}`, payload)
      // Apply stock adjustment if quantity > 0
      if (adjustForm.value.quantity > 0) {
        await api.post(`/vaccines/inventory/${form.value.id}/adjust`, {
          type: adjustForm.value.type,
          quantity: adjustForm.value.quantity,
          note: adjustForm.value.note || 'Manual adjustment during edit'
        })
      }
    } else {
      resp = await api.post('/vaccines/inventory', payload)
    }
    // Show expires-today notice after successful save
    try {
      const exp = new Date(payload.expiration_date || form.value.expirationDate)
      const today = new Date(); today.setHours(0,0,0,0)
      const expD = new Date(exp); expD.setHours(0,0,0,0)
      if (!isNaN(expD) && expD.getTime() === today.getTime()) {
        savedLot.value = {
          ...(resp?.data?.data || {}),
          expiration_date: payload.expiration_date || form.value.expirationDate
        }
        showExpiresTodayModal.value = true
      }
    } catch {}
    
    closeModal()
    await fetchVaccines()
    await fetchStats()
    await fetchExistingVaccines()
  } catch (error) {
    console.error('Error saving vaccine:', error)
    addToast({ title: 'Error', message: 'Error saving vaccine data', type: 'error' })
  } finally {
    saving.value = false
  }
}

const editVaccine = (vaccine) => {
  form.value = { 
    ...vaccine,
    // Prefill all fields, including lot and storage
    expirationDate: formatForInput(vaccine.expiryDate || vaccine.expirationDate),
    lotNumber: vaccine.batchNo || vaccine.lotNumber || '',
    storageLocation: vaccine.storageLocation || ''
  }
  isEditing.value = true
  showAddStockModal.value = true
}

const deleteVaccine = async (vaccine) => {
  if (confirm(`Are you sure you want to delete ${vaccine.vaccineName}?`)) {
    try {
      await api.delete(`/vaccines/inventory/${vaccine.id}`)
      await fetchVaccines()
      await fetchStats()
    } catch (error) {
      console.error('Error deleting vaccine:', error)
      addToast({ title: 'Error', message: 'Error deleting vaccine', type: 'error' })
    }
  }
}

const closeModal = () => {
  showAddModal.value = false
  showAddStockModal.value = false
  isEditing.value = false
  form.value = {
    id: null,
    vaccine_id: '',
    antigenName: '',
    brandName: '',
    manufacturer: '',
    category: '',
    quantity: 0,
    lotNumber: '',
    expirationDate: '',
    storageLocation: ''
  }
  adjustForm.value = { id: null, type: 'ADJUST', quantity: 0, note: '' }
}

// Adjust Stock handlers
const adjustTypes = ['ADJUST','RETURN','EXPIRED']
const adjustForm = ref({ id: null, type: 'ADJUST', quantity: 0, note: '' })

function openAdjustModal(vaccine) {
  adjustForm.value = { id: vaccine.id, type: 'ADJUST', quantity: 0, note: '' }
  showAdjustModal.value = true
}

async function submitAdjust() {
  try {
    submittingAdjust.value = true
    const { id, type, quantity, note } = adjustForm.value
    if (!id) return
    await api.post(`/vaccines/inventory/${id}/adjust`, { type, quantity, note })
    showAdjustModal.value = false
    await fetchVaccines()
    await fetchStats()
  } catch (e) {
    console.error('[submitAdjust] error', e)
    addToast({ title: 'Error', message: 'Failed to apply stock adjustment', type: 'error' })
  } finally {
    submittingAdjust.value = false
  }
}

function closeAdjustModal() { showAdjustModal.value = false }

async function viewInventoryHistory(vaccine) {
  try {
    const response = await api.get(`/vaccines/transactions?inventory_id=${vaccine.id}`)
    // Normalize: backend returns { success, transactions, ... }
    inventoryHistory.value = response.data?.transactions || response.data?.data?.transactions || []
    showHistoryModal.value = true
  } catch (error) {
    console.error('Error fetching inventory history:', error)
    addToast({ title: 'Error', message: 'Failed to load inventory history', type: 'error' })
  }
}

function closeHistoryModal() { showHistoryModal.value = false }

// Inventory details modal handlers
function openInventoryDetails(vaccine) {
  selectedInventory.value = vaccine
  showDetailsModal.value = true
}
function closeDetailsModal() {
  showDetailsModal.value = false
  selectedInventory.value = null
}

// Edit Vaccine Type handlers (reuse New Vaccine modal in edit mode)
async function editVaccineType(v) {
  try {
    isEditingVaccineType.value = true
    showAddVaccineModal.value = true
    // Load vaccine type details
    const vid = v.vaccine_id
    if (!vid) return
    const res = await api.get(`/vaccines/${vid}`)
    const d = res.data?.data || res.data
    vaccineForm.value = {
      id: d.vaccine_id || d.id,
      antigen_name: d.antigen_name || '',
      brand_name: d.brand_name || '',
      manufacturer: d.manufacturer || '',
      disease_prevented: d.disease_prevented || '',
      vaccine_type: d.vaccine_type || 'inactivated',
      category: d.category || 'VACCINE',
      lot_number: '',
      expiration_date: '',
      stock_level: 0,
      storage_location: ''
    }
  } catch (e) {
    console.error('Error loading vaccine type for edit', e)
    addToast({ title: 'Error', message: 'Failed to load vaccine type', type: 'error' })
  }
}

const onVaccineSelect = () => {
  if (form.value.vaccine_id) {
    const selectedVaccine = existingVaccines.value.find(v => v.id === form.value.vaccine_id)
    if (selectedVaccine) {
      form.value.antigenName = selectedVaccine.antigen_name
      form.value.brandName = selectedVaccine.brand_name
      form.value.manufacturer = selectedVaccine.manufacturer
    }
  }
}

const closeVaccineModal = () => {
  showAddVaccineModal.value = false
  isEditingVaccineType.value = false
  vaccineForm.value = {
    id: null,
    antigen_name: '',
    brand_name: '',
    manufacturer: '',
    disease_prevented: '',
    vaccine_type: '',
    category: '',
    is_nip: false,
    lot_number: '',
    expiration_date: '',
    stock_level: 0,
    storage_location: ''
  }
}

const saveVaccineType = async () => {
  try {
    saving.value = true
    
    // Build payload for vaccine type
    const vaccinePayload = {
      antigen_name: vaccineForm.value.antigen_name,
      brand_name: vaccineForm.value.brand_name,
      disease_prevented: vaccineForm.value.disease_prevented,
      manufacturer: vaccineForm.value.manufacturer,
      vaccine_type: (vaccineForm.value.category === 'DEWORMING' || vaccineForm.value.category === 'VITAMIN_A') 
        ? null 
        : vaccineForm.value.vaccine_type,
      category: vaccineForm.value.category
      ,is_nip: vaccineForm.value.is_nip === true
    }

    let vaccineId = vaccineForm.value.id
    if (isEditingVaccineType.value && vaccineId) {
      await api.put(`/vaccines/${vaccineId}`, vaccinePayload)
      addToast({ title: 'Saved', message: 'Vaccine type updated.', type: 'success' })
    } else {
      const vaccineResponse = await api.post('/vaccines', vaccinePayload)
      vaccineId = vaccineResponse.data?.data?.vaccine_id || vaccineResponse.data?.vaccine_id || vaccineResponse.data?.id
      // Then create the initial inventory (optional)
      if (vaccineId && vaccineForm.value.stock_level > 0) {
        const inventoryPayload = {
          vaccine_id: vaccineId,
          lot_number: vaccineForm.value.lot_number,
          expiration_date: convertToISODate(vaccineForm.value.expiration_date) || vaccineForm.value.expiration_date,
          current_stock_level: vaccineForm.value.stock_level,
          storage_location: vaccineForm.value.storage_location || null
        }
        await api.post('/vaccines/inventory', inventoryPayload)
      }
      addToast({ title: 'Success', message: 'Vaccine type added successfully!', type: 'success' })
    }

    closeVaccineModal()
    // Refresh inventory and vaccine type lists. Refresh existing types first so stats.totalTypes updates correctly.
    await fetchVaccines()
    await fetchExistingVaccines()
    await fetchStats()
  } catch (error) {
    console.error('Error saving vaccine:', error)
    
    // Handle specific error types
    if (error.response?.status === 400 && error.response?.data?.error?.code === '23505') {
      addToast({ title: 'Duplicate', message: 'This vaccine already exists! A vaccine with this Antigen Name and Brand Name combination is already in the system.', type: 'warning' })
    } else if (error.response?.status === 400 && error.response?.data?.error?.code === '23514') {
      addToast({ title: 'Invalid Input', message: 'Invalid vaccine type selected. Please choose either "Live" or "Inactivated".', type: 'warning' })
    } else {
      addToast({ title: 'Error', message: 'Error saving vaccine type. Please check your input and try again.', type: 'error' })
    }
  } finally {
    saving.value = false
  }
}

async function submitSchedule() {
  if (!selectedVaccine.value) return
  isSubmitting.value = true
  submitMessage.value = ''
  // Client-side validation
  if (!validateSchedule()) {
    submitMessage.value = errors.value.general || 'Validation failed.'
    isSubmitting.value = false
    return
  }
  // Build payload using helper
  const payload = buildPayload()
  try {
    const res = await api.post(`/vaccines/${selectedVaccine.value}/schedule`, payload)
    const data = res.data
    if (data && (data.success || res.status === 200 || res.status === 201)) {
      submitMessage.value = 'Scheduling updated successfully.'
      // Refresh schedule list so user sees the saved record
      await fetchSchedules()
      setTimeout(() => {
        showScheduleModal.value = false
        submitMessage.value = ''
      }, 800)
    } else {
      submitMessage.value = data?.message || 'Failed to update scheduling.'
    }
  } catch (e) {
    console.error('Error posting schedule', e)
    submitMessage.value = 'Error connecting to server.'
  } finally {
    isSubmitting.value = false
  }
}

// Format date to short locale string
const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-PH', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Date formatting and validation methods
const formatForInput = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${mm}/${dd}/${yyyy}`
}

const validateAndFormatDate = (fieldName) => {
  let dateValue
  if (fieldName === 'expirationDate') {
    dateValue = form.value.expirationDate
  } else if (fieldName === 'expiration_date') {
    dateValue = vaccineForm.value.expiration_date
  }
  
  if (!dateValue) return
  
  // Handle various input formats and convert to MM/DD/YYYY
  let dateStr = dateValue.trim()
  let date = null
  
  // Try parsing MM/DD/YYYY format
  if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
    const [month, day, year] = dateStr.split('/')
    date = new Date(year, month - 1, day)
  }
  // Try parsing DD/MM/YYYY format (convert to MM/DD/YYYY)
  else if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
    const parts = dateStr.split('/')
    // Assume DD/MM/YYYY if day > 12 or month <= 12
    if (parseInt(parts[0]) > 12 || parseInt(parts[1]) <= 12) {
      const [day, month, year] = parts
      date = new Date(year, month - 1, day)
    }
  }
  // Try parsing YYYY-MM-DD format
  else if (dateStr.match(/^\d{4}-\d{1,2}-\d{1,2}$/)) {
    date = new Date(dateStr)
  }
  
  if (date && !isNaN(date.getTime())) {
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    const yyyy = date.getFullYear()
    const formattedDate = `${mm}/${dd}/${yyyy}`
    
    if (fieldName === 'expirationDate') {
      form.value.expirationDate = formattedDate
    } else if (fieldName === 'expiration_date') {
      vaccineForm.value.expiration_date = formattedDate
    }
  }
}

const openDatePicker = (fieldName) => {
  const refMap = {
    'expirationDate': datePickerStock,
    'expiration_date': datePickerVaccine
  }
  
  const datePickerEl = refMap[fieldName].value
  if (datePickerEl) {
    // Set the current value in ISO format for the date picker
    const currentValue = fieldName === 'expirationDate' ? form.value.expirationDate : vaccineForm.value.expiration_date
    const isoDate = convertToISODate(currentValue)
    if (isoDate) {
      datePickerEl.value = isoDate
    }
    // Trigger the date picker
    datePickerEl.showPicker()
  }
}

const onDatePickerChange = (fieldName, event) => {
  const isoDate = event.target.value
  if (isoDate) {
    // Convert from ISO (YYYY-MM-DD) to MM/DD/YYYY for display
    const date = new Date(isoDate)
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    const yyyy = date.getFullYear()
    const formattedDate = `${mm}/${dd}/${yyyy}`
    
    if (fieldName === 'expirationDate') {
      form.value.expirationDate = formattedDate
    } else if (fieldName === 'expiration_date') {
      vaccineForm.value.expiration_date = formattedDate
    }
  }
}

const convertToISODate = (mmddyyyy) => {
  if (!mmddyyyy) return null
  const [month, day, year] = mmddyyyy.split('/')
  if (!month || !day || !year) return null
  const mm = String(month).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${year}-${mm}-${dd}`
}

const getQuantityClass = (quantity) => {
  if (quantity === 0) return 'text-danger';
  if (quantity <= 50) return 'text-warning';
  return 'text-success';
};

const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'Available': return 'bg-success';
    case 'Low Stock': return 'bg-warning text-dark';
    case 'Out of Stock': return 'bg-danger';
    case 'Expiring Soon': return 'bg-danger';
    default: return 'bg-secondary';
  }
};

const getTransactionTypeClass = (type) => {
  switch (type) {
    case 'RECEIVE': return 'bg-success';
    case 'ADJUST': return 'bg-primary';
    case 'RETURN': return 'bg-warning text-dark';
    case 'EXPIRED': return 'bg-danger';
    default: return 'bg-secondary';
  }
};

const getQuantityChangeClass = (delta) => {
  if (delta > 0) return 'text-success fw-bold';
  if (delta < 0) return 'text-danger fw-bold';
  return 'text-muted';
};

// Edit vaccine type from dropdown
const editVaccineTypeFromDropdown = (vaccine) => {
  isEditingVaccineType.value = true
  vaccineForm.value = {
    id: vaccine.vaccine_id || vaccine.id,
    antigen_name: vaccine.antigen_name || '',
    brand_name: vaccine.brand_name || '',
    manufacturer: vaccine.manufacturer || '',
    disease_prevented: vaccine.disease_prevented || '',
    vaccine_type: vaccine.vaccine_type || '',
    category: vaccine.category || '',
    lot_number: '',
    expiration_date: '',
    stock_level: 0,
    storage_location: ''
  }
  showAddVaccineModal.value = true
}

// Lifecycle
onMounted(async () => {
  await fetchVaccines();
  await fetchExistingVaccines();
  await fetchStats();
  await fetchSchedules();
  await fetchDiseaseOptions(); // Add this line
  await fetchReceivingList();
})

// Category change handler - set vaccine_type to null for Deworming/Vitamin A
const onCategoryChange = () => {
  if (vaccineForm.value.category === 'DEWORMING' || vaccineForm.value.category === 'VITAMIN_A') {
    vaccineForm.value.vaccine_type = null
  }
}

// Disease management methods
const fetchDiseaseOptions = async () => {
  try {
    // Get unique values from existing vaccines
    const response = await api.get('/vaccines')
    
    // Handle different response structures
    let vaccines = []
    if (response.data?.data && Array.isArray(response.data.data)) {
      vaccines = response.data.data
    } else if (Array.isArray(response.data)) {
      vaccines = response.data
    } else if (response.data?.vaccines && Array.isArray(response.data.vaccines)) {
      vaccines = response.data.vaccines
    }
    
    console.log('Vaccines for options:', vaccines)
    
    // Extract unique values for each field
    diseaseOptions.value = [...new Set(vaccines.map(v => v.disease_prevented).filter(d => d && d.trim()))].sort()
    antigenOptions.value = [...new Set(vaccines.map(v => v.antigen_name).filter(d => d && d.trim()))].sort()
    brandOptions.value = [...new Set(vaccines.map(v => v.brand_name).filter(d => d && d.trim()))].sort()
    manufacturerOptions.value = [...new Set(vaccines.map(v => v.manufacturer).filter(d => d && d.trim()))].sort()
  } catch (error) {
    console.error('Error fetching options:', error)
    diseaseOptions.value = []
    antigenOptions.value = []
    brandOptions.value = []
    manufacturerOptions.value = []
  }
}

const onDiseaseSelect = () => {
  if (selectedDisease.value) {
    vaccineForm.value.disease_prevented = selectedDisease.value
  }
}

const onDiseaseInput = () => {
  // Clear dropdown selection when user types manually
  selectedDisease.value = ''
}

const onAntigenSelect = () => {
  if (selectedAntigen.value) {
    vaccineForm.value.antigen_name = selectedAntigen.value
  }
}

const onAntigenInput = () => {
  selectedAntigen.value = ''
}

const onBrandSelect = () => {
  if (selectedBrand.value) {
    vaccineForm.value.brand_name = selectedBrand.value
  }
}

const onBrandInput = () => {
  selectedBrand.value = ''
}

const onManufacturerSelect = () => {
  if (selectedManufacturer.value) {
    vaccineForm.value.manufacturer = selectedManufacturer.value
  }
}

const onManufacturerInput = () => {
  selectedManufacturer.value = ''
}

const fetchSchedules = async () => {
  try {
    const res = await api.get('/vaccines/schedules')
    const data = res.data?.data || res.data || []
    schedules.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error('Error fetching schedules', e)
    schedules.value = []
  }
}

const editSchedule = (s) => {
  // Open modal for editing
  scheduleReadOnly.value = false
  const vaccineId = s.vaccine?.vaccine_id || s.vaccine_id || null
  if (vaccineId) {
    selectedVaccine.value = vaccineId
    fetchSchedule(vaccineId)
  } else {
    schedulingFields.value = { ...s }
  }
  showScheduleModal.value = true
}

const viewSchedule = (s) => {
  // Open modal in read-only/view mode and load schedule for the vaccine
  scheduleReadOnly.value = true
  const vaccineId = s.vaccine?.vaccine_id || s.vaccine_id || null
  if (vaccineId) {
    selectedVaccine.value = vaccineId
    fetchSchedule(vaccineId)
  } else {
    schedulingFields.value = { ...s }
    currentDoseIndex.value = 0
  }
  showScheduleModal.value = true
}

function openScheduleModal() {
  // open modal with defaults; selectedVaccine remains empty until user selects
  resetSchedulingFields()
  selectedVaccine.value = ''
  // ensure modal is in editable mode when opened from the toolbar
  scheduleReadOnly.value = false
  // reset dose navigator
  currentDoseIndex.value = 0
  showScheduleModal.value = true
}

// Vaccines that don't have a schedule yet (for creating new schedules)
const unscheduledVaccines = computed(() => {
  const list = Array.isArray(existingVaccines.value) ? existingVaccines.value : []
  const scheduledIds = new Set((schedules.value || []).map(s => s.vaccine_id || s.vaccine?.vaccine_id || s.vaccineId).filter(Boolean))
  return list.map(v => ({ ...v, id: v.vaccine_id || v.id })).filter(v => !scheduledIds.has(v.id))
})

// Receiving Reports Methods
const fetchReceivingList = async () => {
  console.log('Fetching receiving reports...', { status: receivingStatus.value, search: receivingSearch.value })
  receivingLoading.value = true
  try {
    const { data } = await api.get('/receiving-reports', { 
      params: { 
        status: receivingStatus.value, 
        search: receivingSearch.value, 
        page: 1, 
        limit: 20 
      } 
    })
    console.log('Receiving reports API response:', data)
    receivingList.value = data.data || data
    console.log('Receiving list after assignment:', receivingList.value)
  } catch (e) {
    console.error('Failed to load receiving reports', e)
    console.error('Error response:', e.response?.data)
    receivingList.value = { items: [], totalCount: 0, totalPages: 0 }
  } finally {
    receivingLoading.value = false
  }
}

// Navigation helpers for Receiving Reports page-based flows
const goToCreateReceiving = () => router.push({ name: 'ReceivingReportNew' })
const goToViewReceiving = (r) => router.push({ name: 'ReceivingReportView', params: { id: r.report_id } })
const goToCompleteReceiving = (r) => router.push({ name: 'ReceivingReportView', params: { id: r.report_id }, query: { action: 'complete' } })
const goToCancelReceiving = (r) => router.push({ name: 'ReceivingReportView', params: { id: r.report_id }, query: { action: 'cancel' } })

const getReceivingBadgeClass = (status) => {
  const classes = {
    'DRAFT': 'bg-secondary',
    'COMPLETED': 'bg-success',
    'CANCELLED': 'bg-danger'
  }
  return classes[status] || 'bg-secondary'
}
</script>

<style scoped>
.border-start {
  border-left: 0.25rem solid !important;
}

.text-gray-800 {
  color: #5a5c69 !important;
}

.modal.show {
  background-color: rgba(0, 0, 0, 0.5);
}
</style>
