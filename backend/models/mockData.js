const patientDetails = [
  {
    id: "1",
    childInfo: {
      name: "Maria Isabella Santos",
      sex: "Female",
      birthDate: "2023-03-15",
      birthWeightKg: 3.2,
      birthLengthCm: 49,
      address: {
        street: "123 Sampaguita Street",
        barangay: "San Antonio",
        municipality: "Quezon City",
        province: "Metro Manila",
        zipCode: "1105"
      },
      phoneNumber: "+63 917 123 4567",
      placeOfBirth: "Philippine General Hospital, Manila"
    },
    motherInfo: {
      name: "Ana Maria Santos",
      age: 28,
      educationLevel: "College Graduate",
      occupation: "Elementary School Teacher",
      phoneNumber: "+63 917 123 4567",
      emergencyContact: "+63 918 765 4321"
    },
    fatherInfo: {
      name: "Roberto C. Santos",
      age: 32,
      educationLevel: "College Graduate", 
      occupation: "Software Engineer",
      phoneNumber: "+63 919 876 5432",
      emergencyContact: "+63 920 111 2222"
    },
    vaccinationHistory: [
      {
        vaccineName: "BCG",
        diseasePrevented: "Tuberculosis",
        dateAdministered: "2023-03-16",
        ageAtAdministration: "1 day",
        vaccineManufacturer: "Serum Institute of India",
        lotNumber: "BCG2023001",
        siteOfAdministration: "Right arm (deltoid)",
        healthWorker: "Nurse Jane Dela Cruz",
        facilityName: "Quezon City Health Center",
        remarks: "No adverse reactions observed"
      },
      {
        vaccineName: "Hepatitis B",
        diseasePrevented: "Hepatitis B",
        dateAdministered: "2023-03-16",
        ageAtAdministration: "1 day",
        vaccineManufacturer: "GSK",
        lotNumber: "HEPB2023005",
        siteOfAdministration: "Left thigh (anterolateral)",
        healthWorker: "Nurse Jane Dela Cruz",
        facilityName: "Quezon City Health Center",
        remarks: "Birth dose administered"
      },
      {
        vaccineName: "Pentavalent (DPT-HepB-Hib)",
        diseasePrevented: "Diphtheria, Pertussis, Tetanus, Hepatitis B, Haemophilus influenzae type b",
        dateAdministered: "2023-05-15",
        ageAtAdministration: "2 months",
        vaccineManufacturer: "Biological E",
        lotNumber: "PENTA2023012",
        siteOfAdministration: "Right thigh (anterolateral)",
        healthWorker: "Nurse Mark Rodriguez",
        facilityName: "Quezon City Health Center",
        remarks: "1st dose - mild irritability noted"
      },
      {
        vaccineName: "OPV (Oral Polio Vaccine)",
        diseasePrevented: "Poliomyelitis",
        dateAdministered: "2023-05-15",
        ageAtAdministration: "2 months",
        vaccineManufacturer: "Bio Farma",
        lotNumber: "OPV2023008",
        siteOfAdministration: "Oral",
        healthWorker: "Nurse Mark Rodriguez",
        facilityName: "Quezon City Health Center",
        remarks: "1st dose - well tolerated"
      },
      {
        vaccineName: "PCV (Pneumococcal Conjugate Vaccine)",
        diseasePrevented: "Pneumococcal Disease",
        dateAdministered: "2023-05-15",
        ageAtAdministration: "2 months",
        vaccineManufacturer: "Pfizer",
        lotNumber: "PCV2023003",
        siteOfAdministration: "Left thigh (anterolateral)",
        healthWorker: "Nurse Mark Rodriguez",
        facilityName: "Quezon City Health Center",
        remarks: "1st dose - no adverse reactions"
      },
      {
        vaccineName: "Pentavalent (DPT-HepB-Hib)",
        diseasePrevented: "Diphtheria, Pertussis, Tetanus, Hepatitis B, Haemophilus influenzae type b",
        dateAdministered: "2023-07-15",
        ageAtAdministration: "4 months",
        vaccineManufacturer: "Biological E",
        lotNumber: "PENTA2023025",
        siteOfAdministration: "Right thigh (anterolateral)",
        healthWorker: "Nurse Sarah Lopez",
        facilityName: "Quezon City Health Center",
        remarks: "2nd dose - no adverse reactions observed"
      },
      {
        vaccineName: "OPV (Oral Polio Vaccine)",
        diseasePrevented: "Poliomyelitis",
        dateAdministered: "2023-07-15",
        ageAtAdministration: "4 months",
        vaccineManufacturer: "Bio Farma",
        lotNumber: "OPV2023018",
        siteOfAdministration: "Oral",
        healthWorker: "Nurse Sarah Lopez",
        facilityName: "Quezon City Health Center",
        remarks: "2nd dose - well tolerated"
      },
      {
        vaccineName: "PCV (Pneumococcal Conjugate Vaccine)",
        diseasePrevented: "Pneumococcal Disease",
        dateAdministered: "2023-07-15",
        ageAtAdministration: "4 months",
        vaccineManufacturer: "Pfizer",
        lotNumber: "PCV2023015",
        siteOfAdministration: "Left thigh (anterolateral)",
        healthWorker: "Nurse Sarah Lopez",
        facilityName: "Quezon City Health Center",
        remarks: "2nd dose - mild redness at injection site"
      }
    ],
    medicalHistory: {
      birthComplications: "None",
      allergies: "No known allergies",
      chronicConditions: "None",
      previousHospitalizations: "None",
      nutritionalStatus: "Normal",
      developmentalMilestones: {
        sittingWithoutSupport: "6 months (expected)",
        walkingAlone: "12 months (expected)",
        firstWords: "10 months (expected)"
      }
    },
    nextScheduledVaccinations: [
      {
        vaccineName: "Pentavalent (DPT-HepB-Hib)",
        scheduledDate: "2023-09-15",
        ageAtSchedule: "6 months",
        doseNumber: "3rd dose",
        status: "Due"
      },
      {
        vaccineName: "OPV (Oral Polio Vaccine)",
        scheduledDate: "2023-09-15",
        ageAtSchedule: "6 months", 
        doseNumber: "3rd dose",
        status: "Due"
      },
      {
        vaccineName: "PCV (Pneumococcal Conjugate Vaccine)",
        scheduledDate: "2023-09-15",
        ageAtSchedule: "6 months",
        doseNumber: "3rd dose",
        status: "Due"
      }
    ]
  },
  {
    id: "2",
    childInfo: {
      name: "Juan Carlos Reyes",
      sex: "Male",
      birthDate: "2022-11-20",
      birthWeightKg: 3.5,
      birthLengthCm: 51,
      address: {
        street: "456 Rose Avenue",
        barangay: "Bagumbayan",
        municipality: "Marikina City",
        province: "Metro Manila",
        zipCode: "1800"
      },
      phoneNumber: "+63 916 555 7777",
      placeOfBirth: "Marikina Valley Medical Center"
    },
    motherInfo: {
      name: "Carmen L. Reyes",
      age: 25,
      educationLevel: "High School Graduate",
      occupation: "Store Clerk",
      phoneNumber: "+63 916 555 7777",
      emergencyContact: "+63 917 444 3333"
    },
    fatherInfo: {
      name: "Miguel A. Reyes",
      age: 29,
      educationLevel: "Vocational Graduate",
      occupation: "Construction Worker",
      phoneNumber: "+63 918 222 1111",
      emergencyContact: "+63 919 333 4444"
    },
    vaccinationHistory: [
      {
        vaccineName: "BCG",
        diseasePrevented: "Tuberculosis",
        dateAdministered: "2022-11-21",
        ageAtAdministration: "1 day",
        vaccineManufacturer: "Serum Institute of India",
        lotNumber: "BCG2022098",
        siteOfAdministration: "Right arm (deltoid)",
        healthWorker: "Nurse Lisa Fernandez",
        facilityName: "Marikina Health Center",
        remarks: "No adverse reactions observed"
      },
      {
        vaccineName: "Hepatitis B",
        diseasePrevented: "Hepatitis B",
        dateAdministered: "2022-11-21",
        ageAtAdministration: "1 day",
        vaccineManufacturer: "GSK",
        lotNumber: "HEPB2022087",
        siteOfAdministration: "Left thigh (anterolateral)",
        healthWorker: "Nurse Lisa Fernandez",
        facilityName: "Marikina Health Center",
        remarks: "Birth dose administered successfully"
      }
    ],
    medicalHistory: {
      birthComplications: "None",
      allergies: "No known allergies",
      chronicConditions: "None",
      previousHospitalizations: "None",
      nutritionalStatus: "Normal",
      developmentalMilestones: {
        sittingWithoutSupport: "Achieved at 6 months",
        walkingAlone: "Achieved at 11 months",
        firstWords: "Achieved at 9 months"
      }
    },
    nextScheduledVaccinations: [
      {
        vaccineName: "MMR (Measles, Mumps, Rubella)",
        scheduledDate: "2023-11-20",
        ageAtSchedule: "12 months",
        doseNumber: "1st dose",
        status: "Due"
      }
    ]
  }
];

// Vaccine Stock Data
const vaccineStock = [
  {
    id: "1",
    vaccineName: "BCG",
    manufacturer: "Serum Institute of India",
    batchNo: "BCG2025001",
    expiryDate: "2025-12-31",
    quantity: 150
  },
  {
    id: "2", 
    vaccineName: "Hepatitis B",
    manufacturer: "GSK",
    batchNo: "HEPB2025003",
    expiryDate: "2025-11-15",
    quantity: 75
  },
  {
    id: "3",
    vaccineName: "Pentavalent (DPT-HepB-Hib)",
    manufacturer: "Biological E",
    batchNo: "PENTA2025012",
    expiryDate: "2025-09-20",
    quantity: 25
  },
  {
    id: "4",
    vaccineName: "OPV (Oral Polio Vaccine)",
    manufacturer: "Bio Farma",
    batchNo: "OPV2025008",
    expiryDate: "2025-10-30",
    quantity: 200
  },
  {
    id: "5",
    vaccineName: "PCV (Pneumococcal Conjugate Vaccine)",
    manufacturer: "Pfizer",
    batchNo: "PCV2025015",
    expiryDate: "2026-03-15",
    quantity: 0
  },
  {
    id: "6",
    vaccineName: "MMR (Measles, Mumps, Rubella)",
    manufacturer: "Merck & Co",
    batchNo: "MMR2025007",
    expiryDate: "2025-09-10",
    quantity: 45
  },
  {
    id: "7",
    vaccineName: "Rotavirus",
    manufacturer: "GSK",
    batchNo: "ROTA2025002",
    expiryDate: "2025-08-30",
    quantity: 30
  },
  {
    id: "8",
    vaccineName: "Japanese Encephalitis",
    manufacturer: "Valneva",
    batchNo: "JE2025004",
    expiryDate: "2025-12-20",
    quantity: 80
  },
  {
    id: "9",
    vaccineName: "Measles",
    manufacturer: "Serum Institute of India",
    batchNo: "MEAS2025009",
    expiryDate: "2025-09-05",
    quantity: 15
  },
  {
    id: "10",
    vaccineName: "Tetanus Toxoid",
    manufacturer: "Biological E",
    batchNo: "TT2025011",
    expiryDate: "2026-01-25",
    quantity: 120
  }
];

// User Accounts Data
const users = [
  {
    id: "1",
    firstName: "Admin",
    lastName: "User",
    name: "Admin User",
    email: "admin@immunizeme.com",
    role: "admin",
    status: "active",
    lastLogin: "2025-08-26T09:45:00Z",
    createdAt: "2025-01-15T08:00:00Z",
    phone: "+63 917 123 4567",
    avatar: null
  },
  {
    id: "2", 
    firstName: "Jane",
    lastName: "Smith",
    name: "Dr. Jane Smith",
    email: "jane.smith@immunizeme.com",
    role: "health_worker",
    status: "active",
    lastLogin: "2025-08-26T08:30:00Z",
    createdAt: "2025-02-01T10:00:00Z",
    phone: "+63 918 234 5678",
    licenseNumber: "HW-12345",
    avatar: null
  },
  {
    id: "3",
    firstName: "Mark",
    lastName: "Rodriguez",
    name: "Dr. Mark Rodriguez",
    email: "mark.rodriguez@immunizeme.com",
    role: "health_worker", 
    status: "active",
    lastLogin: "2025-08-25T14:20:00Z",
    createdAt: "2025-02-15T09:30:00Z",
    phone: "+63 919 345 6789",
    licenseNumber: "HW-67890",
    avatar: null
  },
  {
    id: "4",
    firstName: "Ana Maria",
    lastName: "Santos",
    name: "Ana Maria Santos",
    email: "ana.santos@example.com",
    role: "parent",
    status: "active",
    lastLogin: "2025-08-24T16:15:00Z",
    createdAt: "2025-03-10T11:00:00Z",
    phone: "+63 917 123 4567",
    avatar: null
  },
  {
    id: "5",
    firstName: "Roberto",
    lastName: "Santos", 
    name: "Roberto C. Santos", 
    email: "roberto.santos@example.com",
    role: "parent",
    status: "active",
    lastLogin: "2025-08-23T12:45:00Z",
    createdAt: "2025-03-10T11:05:00Z",
    phone: "+63 919 876 5432",
    avatar: null
  },
  {
    id: "6",
    firstName: "Carmen",
    lastName: "Reyes",
    name: "Carmen L. Reyes",
    email: "carmen.reyes@example.com", 
    role: "parent",
    status: "inactive",
    lastLogin: "2025-08-05T15:15:00Z",
    createdAt: "2025-04-20T13:30:00Z",
    phone: "+63 916 555 7777",
    avatar: null
  },
  {
    id: "7",
    firstName: "Sarah",
    lastName: "Lopez",
    name: "Dr. Sarah Lopez",
    email: "sarah.lopez@immunizeme.com",
    role: "health_worker",
    status: "active",
    lastLogin: "2025-08-26T07:30:00Z",
    createdAt: "2025-03-01T08:45:00Z",
    phone: "+63 920 111 2222",
    licenseNumber: "HW-11111",
    avatar: null
  },
  {
    id: "8",
    firstName: "Lisa",
    lastName: "Fernandez",
    name: "Nurse Lisa Fernandez",
    email: "lisa.fernandez@immunizeme.com",
    role: "health_worker",
    status: "active",
    lastLogin: "2025-08-25T16:00:00Z",
    createdAt: "2025-03-15T14:20:00Z",
    phone: "+63 921 222 3333",
    licenseNumber: "HW-22222",
    avatar: null
  },
  {
    id: "9",
    firstName: "Miguel",
    lastName: "Reyes",
    name: "Miguel A. Reyes",
    email: "miguel.reyes@example.com",
    role: "parent",
    status: "active", 
    lastLogin: "2025-08-22T10:30:00Z",
    createdAt: "2025-04-20T13:35:00Z",
    phone: "+63 918 222 1111",
    avatar: null
  },
  {
    id: "10",
    name: "Super Admin",
    email: "superadmin@immunizeme.com",
    role: "admin",
    status: "active",
    lastLogin: "2025-08-26T10:00:00Z",
    createdAt: "2025-01-01T08:00:00Z",
    phone: "+63 915 000 0000",
    avatar: null
  }
];

// Dashboard Statistics Data
const dashboardStats = {
  vaccinationsToday: 48,
  totalPatients: 1234,
  activeHealthWorkers: 12,
  pendingAppointments: 18,
  vaccineTypes: 10,
  totalDoses: 745,
  lowStockItems: 3,
  expiringSoon: 2
};

// Recent Vaccinations Data
const recentVaccinations = [
  {
    id: "1",
    patientName: "Maria Isabella Santos",
    parentName: "Ana Maria Santos", 
    vaccineName: "BCG",
    healthWorker: "Nurse Jane Dela Cruz",
    dateAdministered: "2025-08-26T08:00:00Z",
    status: "completed"
  },
  {
    id: "2",
    patientName: "Juan Carlos Reyes",
    parentName: "Carmen L. Reyes",
    vaccineName: "Hepatitis B", 
    healthWorker: "Dr. Jane Smith",
    dateAdministered: "2025-08-25T14:30:00Z",
    status: "completed"
  },
  {
    id: "3",
    patientName: "Baby Doe",
    parentName: "Jane Doe",
    vaccineName: "Pentavalent",
    healthWorker: "Dr. Mark Rodriguez",
    dateAdministered: "2025-08-25T11:15:00Z",
    status: "pending"
  },
  {
    id: "4",
    patientName: "Emily White",
    parentName: "Sarah White",
    vaccineName: "PCV",
    healthWorker: "Dr. Sarah Lopez",
    dateAdministered: "2025-08-24T16:45:00Z",
    status: "completed"
  },
  {
    id: "5",
    patientName: "Chris Green",
    parentName: "Laura Green", 
    vaccineName: "OPV",
    healthWorker: "Nurse Lisa Fernandez",
    dateAdministered: "2025-08-24T09:30:00Z",
    status: "completed"
  }
];

// User Activity Logs
const userActivityLogs = [
  {
    id: "1",
    userId: "1",
    userName: "Admin User",
    action: "Logged in",
    timestamp: "2025-08-26T09:45:00Z",
    ipAddress: "192.168.1.1",
    details: "Successful login"
  },
  {
    id: "2",
    userId: "2", 
    userName: "Dr. Jane Smith",
    action: "Updated patient record",
    timestamp: "2025-08-26T09:30:00Z",
    ipAddress: "192.168.1.5",
    details: "Updated vaccination record for Patient ID: 1"
  },
  {
    id: "3",
    userId: "3",
    userName: "Dr. Mark Rodriguez",
    action: "Registered new vaccination",
    timestamp: "2025-08-26T09:15:00Z", 
    ipAddress: "192.168.1.10",
    details: "Administered BCG vaccine to Patient ID: 2"
  },
  {
    id: "4",
    userId: "7",
    userName: "Dr. Sarah Lopez",
    action: "Added new patient",
    timestamp: "2025-08-26T08:45:00Z",
    ipAddress: "192.168.1.15",
    details: "Registered new patient: Baby Cruz"
  },
  {
    id: "5",
    userId: "4",
    userName: "Ana Maria Santos",
    action: "Viewed vaccination schedule",
    timestamp: "2025-08-25T16:30:00Z",
    ipAddress: "203.177.54.123",
    details: "Parent portal access"
  }
];

module.exports = { 
  patientDetails, 
  vaccineStock, 
  users, 
  dashboardStats, 
  recentVaccinations, 
  userActivityLogs 
};