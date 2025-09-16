// Database field mappings and data models for ImmunizeMe frontend
// Based on backend Supabase schema

export const DatabaseModels = {
  // Users table fields
  User: {
    id: 'id',
    username: 'username',
    email: 'email',
    password: 'password', // Never sent to frontend
    role: 'role', // 'admin', 'health_worker', 'parent'
    first_name: 'first_name',
    last_name: 'last_name',
    phone_number: 'phone_number',
    barangay: 'barangay',
    address: 'address',
    status: 'status', // 'active', 'inactive', 'pending'
    is_active: 'is_active',
    created_at: 'created_at',
    updated_at: 'updated_at',
    last_login: 'last_login',
    license_number: 'license_number', // For health workers
    health_facility: 'health_facility' // For health workers
  },

  // Children table fields
  Child: {
    id: 'id',
    parent_id: 'parent_id',
    first_name: 'first_name',
    last_name: 'last_name',
    birthdate: 'birthdate',
    gender: 'gender',
    birth_weight: 'birth_weight',
    birth_height: 'birth_height',
    place_of_birth: 'place_of_birth',
    status: 'status', // 'active', 'inactive'
    created_at: 'created_at',
    updated_at: 'updated_at'
  },

  // Vaccines table fields
  Vaccine: {
    id: 'id',
    vaccine_name: 'vaccine_name',
    vaccine_type: 'vaccine_type',
    manufacturer: 'manufacturer',
    dosage: 'dosage',
    storage_temperature: 'storage_temperature',
    age_group: 'age_group',
    recommended_schedule: 'recommended_schedule',
    side_effects: 'side_effects',
    contraindications: 'contraindications',
    is_active: 'is_active',
    created_at: 'created_at',
    updated_at: 'updated_at',
    deleted_at: 'deleted_at'
  },

  // Vaccine Inventory table fields
  VaccineInventory: {
    id: 'id',
    vaccine_id: 'vaccine_id',
    batch_number: 'batch_number',
    expiry_date: 'expiry_date',
    quantity: 'quantity',
    location: 'location',
    status: 'status', // 'available', 'expired', 'used', 'damaged'
    supplier: 'supplier',
    received_date: 'received_date',
    created_at: 'created_at',
    updated_at: 'updated_at'
  },

  // Immunization Records table fields
  ImmunizationRecord: {
    id: 'id',
    child_id: 'child_id',
    vaccine_id: 'vaccine_id',
    administered_by: 'administered_by', // health worker user ID
    administered_date: 'administered_date',
    dose_number: 'dose_number',
    batch_number: 'batch_number',
    site_of_injection: 'site_of_injection',
    reactions: 'reactions',
    notes: 'notes',
    next_due_date: 'next_due_date',
    status: 'status', // 'completed', 'scheduled', 'missed'
    created_at: 'created_at',
    updated_at: 'updated_at'
  },

  // Inventory Requests table fields
  InventoryRequest: {
    id: 'id',
    vaccine_id: 'vaccine_id',
    requested_quantity: 'requested_quantity',
    approved_quantity: 'approved_quantity',
    priority: 'priority', // 'low', 'medium', 'high', 'urgent'
    reason: 'reason',
    requested_by: 'requested_by', // user ID
    facility_id: 'facility_id',
    urgency_date: 'urgency_date',
    notes: 'notes',
    status: 'status', // 'pending', 'approved', 'rejected', 'fulfilled'
    approver_notes: 'approver_notes',
    approved_by: 'approved_by',
    approved_at: 'approved_at',
    created_at: 'created_at',
    updated_at: 'updated_at'
  },

  // Inventory Transactions table fields
  InventoryTransaction: {
    id: 'id',
    inventory_id: 'inventory_id',
    transaction_type: 'transaction_type', // 'in', 'out', 'adjustment', 'transfer'
    quantity: 'quantity',
    reference_id: 'reference_id', // immunization_id, transfer_id, etc.
    notes: 'notes',
    created_by: 'created_by', // user ID
    created_at: 'created_at'
  },

  // SMS Logs table fields
  SMSLog: {
    id: 'id',
    recipient_id: 'recipient_id', // user ID (parent)
    phone_number: 'phone_number',
    message: 'message',
    message_type: 'message_type', // 'reminder', 'appointment', 'notification'
    status: 'status', // 'sent', 'delivered', 'failed'
    sent_at: 'sent_at',
    delivered_at: 'delivered_at',
    error_message: 'error_message',
    created_at: 'created_at'
  },

  // SMS Templates table fields
  SMSTemplate: {
    id: 'id',
    name: 'name',
    template_type: 'template_type', // 'reminder', 'appointment', 'welcome'
    message_template: 'message_template',
    variables: 'variables', // JSON array of placeholder variables
    is_active: 'is_active',
    created_at: 'created_at',
    updated_at: 'updated_at'
  },

  // Notifications table fields
  Notification: {
    id: 'id',
    user_id: 'user_id',
    title: 'title',
    message: 'message',
    type: 'type', // 'info', 'warning', 'error', 'success'
    is_read: 'is_read',
    created_at: 'created_at',
    read_at: 'read_at'
  }
}

// API Response structures
export const ApiResponses = {
  // Standard success response
  Success: {
    success: true,
    message: 'string',
    data: {} // varies by endpoint
  },

  // Standard error response
  Error: {
    success: false,
    message: 'string',
    error: 'string' // optional detailed error
  },

  // Paginated response
  Paginated: {
    success: true,
    data: [],
    totalCount: 0,
    page: 1,
    limit: 10,
    totalPages: 1
  },

  // Authentication response
  Auth: {
    success: true,
    token: 'string',
    user: {
      id: 'number',
      username: 'string',
      email: 'string',
      role: 'string',
      first_name: 'string',
      last_name: 'string'
    }
  }
}

// Form field mappings (frontend form fields to database fields)
export const FormFieldMappings = {
  // Login form
  LoginForm: {
    username: 'username', // Can be username or email
    password: 'password'
  },

  // User creation form (admin creating users)
  UserForm: {
    firstName: 'first_name',
    lastName: 'last_name',
    username: 'username',
    email: 'email',
    password: 'password',
    phoneNumber: 'phone_number',
    role: 'role',
    barangay: 'barangay',
    address: 'address',
    licenseNumber: 'license_number', // For health workers
    healthFacility: 'health_facility' // For health workers
  },

  // Child registration form
  ChildForm: {
    firstName: 'first_name',
    lastName: 'last_name',
    birthdate: 'birthdate',
    gender: 'gender',
    birthWeight: 'birth_weight',
    birthHeight: 'birth_height',
    placeOfBirth: 'place_of_birth',
    parentId: 'parent_id'
  },

  // Vaccine form
  VaccineForm: {
    vaccineName: 'vaccine_name',
    vaccineType: 'vaccine_type',
    manufacturer: 'manufacturer',
    dosage: 'dosage',
    storageTemperature: 'storage_temperature',
    ageGroup: 'age_group',
    recommendedSchedule: 'recommended_schedule',
    sideEffects: 'side_effects',
    contraindications: 'contraindications'
  },

  // Inventory form
  InventoryForm: {
    vaccineId: 'vaccine_id',
    batchNumber: 'batch_number',
    expiryDate: 'expiry_date',
    quantity: 'quantity',
    location: 'location',
    supplier: 'supplier',
    receivedDate: 'received_date'
  },

  // Immunization record form
  ImmunizationForm: {
    childId: 'child_id',
    vaccineId: 'vaccine_id',
    administeredBy: 'administered_by',
    administeredDate: 'administered_date',
    doseNumber: 'dose_number',
    batchNumber: 'batch_number',
    siteOfInjection: 'site_of_injection',
    reactions: 'reactions',
    notes: 'notes',
    nextDueDate: 'next_due_date'
  }
}

// Validation rules
export const ValidationRules = {
  required: (fieldName) => `${fieldName} is required`,
  email: 'Please enter a valid email address',
  phone: 'Please enter a valid phone number',
  minLength: (min) => `Must be at least ${min} characters`,
  maxLength: (max) => `Must be no more than ${max} characters`,
  password: 'Password must contain uppercase, lowercase, number and special character',
  date: 'Please enter a valid date',
  number: 'Please enter a valid number'
}

// Status options for different entities
export const StatusOptions = {
  User: [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'pending', label: 'Pending Approval' }
  ],

  Child: [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ],

  Inventory: [
    { value: 'available', label: 'Available' },
    { value: 'expired', label: 'Expired' },
    { value: 'used', label: 'Used' },
    { value: 'damaged', label: 'Damaged' }
  ],

  ImmunizationRecord: [
    { value: 'completed', label: 'Completed' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'missed', label: 'Missed' }
  ],

  InventoryRequest: [
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'fulfilled', label: 'Fulfilled' }
  ]
}

// Role options
export const RoleOptions = [
  { value: 'admin', label: 'Administrator' },
  { value: 'health_worker', label: 'Health Worker' },
  { value: 'parent', label: 'Parent/Guardian' }
]

// Gender options
export const GenderOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' }
]

// Age group options
export const AgeGroupOptions = [
  { value: 'newborn', label: 'Newborn (0-28 days)' },
  { value: 'infant', label: 'Infant (1-12 months)' },
  { value: 'toddler', label: 'Toddler (1-3 years)' },
  { value: 'preschool', label: 'Preschool (3-5 years)' },
  { value: 'school_age', label: 'School Age (6-12 years)' },
  { value: 'adolescent', label: 'Adolescent (13-18 years)' }
]

export default DatabaseModels