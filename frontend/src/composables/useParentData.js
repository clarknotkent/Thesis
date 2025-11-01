/**
 * Parent Data Normalization Utilities
 * Handles inconsistent backend field names and data structures
 */

/**
 * Get child's full name from various backend formats
 * @param {object} child - Child data object
 * @returns {string} Child's full name
 */
export function getChildName(child) {
  if (!child) return 'Unknown'
  
  // Try different full name formats
  if (child.full_name) return child.full_name
  if (child.fullName) return child.fullName
  if (child.name) return child.name
  
  // Construct from parts
  const firstName = child.first_name || child.firstName || child.firstname || ''
  const middleName = child.middle_name || child.middleName || child.middlename || ''
  const lastName = child.last_name || child.lastName || child.lastname || child.surname || ''
  
  const parts = [firstName, middleName, lastName].filter(Boolean)
  return parts.length > 0 ? parts.join(' ') : 'Unknown'
}

/**
 * Get child's date of birth from various backend formats
 * @param {object} child - Child data object
 * @returns {string|null} Date of birth
 */
export function getChildDOB(child) {
  if (!child) return null
  return child.date_of_birth || child.dateOfBirth || child.dob || child.birthdate || child.birthDate || null
}

/**
 * Get child's ID from various backend formats
 * @param {object} child - Child data object
 * @returns {number|string|null} Child ID
 */
export function getChildId(child) {
  if (!child) return null
  return child.patient_id || child.patientId || child.id || child.child_id || child.childId || null
}

/**
 * Get completed vaccination count from various backend formats
 * @param {object} child - Child data object
 * @returns {number} Number of completed vaccinations
 */
export function getCompletedCount(child) {
  if (!child) return 0
  
  // Try vaccinationSummary formats
  if (child.vaccinationSummary?.completed !== undefined) {
    return child.vaccinationSummary.completed
  }
  if (child.vaccination_summary?.completed !== undefined) {
    return child.vaccination_summary.completed
  }
  if (child.immunization_summary?.completed !== undefined) {
    return child.immunization_summary.completed
  }
  
  // Count from schedule array
  if (child.patientschedule && Array.isArray(child.patientschedule)) {
    return child.patientschedule.filter(s => 
      s.status === 'Completed' || 
      s.status === 'completed' || 
      s.status === 'COMPLETED'
    ).length
  }
  
  if (child.schedules && Array.isArray(child.schedules)) {
    return child.schedules.filter(s => 
      s.status === 'Completed' || 
      s.status === 'completed' || 
      s.status === 'COMPLETED'
    ).length
  }
  
  return 0
}

/**
 * Get total vaccination count from various backend formats
 * @param {object} child - Child data object
 * @returns {number} Total number of vaccinations
 */
export function getTotalCount(child) {
  if (!child) return 0
  
  // Try vaccinationSummary formats
  if (child.vaccinationSummary?.total !== undefined) {
    return child.vaccinationSummary.total
  }
  if (child.vaccination_summary?.total !== undefined) {
    return child.vaccination_summary.total
  }
  if (child.immunization_summary?.total !== undefined) {
    return child.immunization_summary.total
  }
  
  // Count from schedule array
  if (child.patientschedule && Array.isArray(child.patientschedule)) {
    return child.patientschedule.length
  }
  
  if (child.schedules && Array.isArray(child.schedules)) {
    return child.schedules.length
  }
  
  return 0
}

/**
 * Get pending vaccination count
 * @param {object} child - Child data object
 * @returns {number} Number of pending vaccinations
 */
export function getPendingCount(child) {
  if (!child) return 0
  
  const total = getTotalCount(child)
  const completed = getCompletedCount(child)
  
  return Math.max(0, total - completed)
}

/**
 * Get child's age display string from various backend formats
 * @param {object} child - Child data object
 * @returns {string} Age display string
 */
export function getChildAge(child) {
  if (!child) return 'N/A'
  
  // Try pre-computed age fields
  if (child.age) return child.age
  if (child.ageDisplay) return child.ageDisplay
  if (child.age_display) return child.age_display
  
  // Calculate from DOB
  const dob = getChildDOB(child)
  if (!dob) return 'N/A'
  
  // Import calculateAge if needed, or handle inline
  const today = new Date()
  const birthDate = new Date(dob)
  
  if (isNaN(birthDate.getTime())) return 'N/A'
  
  let years = today.getFullYear() - birthDate.getFullYear()
  let months = today.getMonth() - birthDate.getMonth()
  
  if (months < 0) {
    years--
    months += 12
  }
  
  if (years === 0) {
    return months === 1 ? '1 month' : `${months} months`
  } else if (months === 0) {
    return years === 1 ? '1 year' : `${years} years`
  } else {
    return `${years}y ${months}m`
  }
}

/**
 * Get child's gender from various backend formats
 * @param {object} child - Child data object
 * @returns {string} Gender
 */
export function getChildGender(child) {
  if (!child) return 'N/A'
  return child.sex || child.gender || child.Sex || child.Gender || 'N/A'
}

/**
 * Get next vaccination info from various backend formats
 * @param {object} child - Child data object
 * @returns {object|null} Next vaccination info
 */
export function getNextVaccination(child) {
  if (!child) return null
  
  // Try different next vaccination formats
  if (child.nextVaccination) return child.nextVaccination
  if (child.next_vaccination) return child.next_vaccination
  if (child.nextVaccine) return child.nextVaccine
  if (child.next_vaccine) return child.next_vaccine
  
  // Try to find from schedule
  const schedules = child.patientschedule || child.schedules
  if (schedules && Array.isArray(schedules)) {
    const pending = schedules.find(s => 
      s.status === 'Pending' || 
      s.status === 'pending' || 
      s.status === 'PENDING' ||
      s.status === 'Scheduled' ||
      s.status === 'scheduled'
    )
    
    if (pending) {
      return {
        name: pending.vaccine_name || pending.vaccineName || pending.vaccine,
        date: pending.scheduled_date || pending.scheduledDate || pending.date
      }
    }
  }
  
  return null
}

/**
 * Normalize child data to consistent format
 * @param {object} child - Raw child data from backend
 * @returns {object} Normalized child data
 */
export function normalizeChildData(child) {
  if (!child) return null
  
  return {
    id: getChildId(child),
    name: getChildName(child),
    fullName: getChildName(child),
    dob: getChildDOB(child),
    age: getChildAge(child),
    gender: getChildGender(child),
    completed: getCompletedCount(child),
    total: getTotalCount(child),
    pending: getPendingCount(child),
    nextVaccination: getNextVaccination(child),
    raw: child // Keep original data for debugging
  }
}

/**
 * Get guardian name from various backend formats
 * @param {object} guardian - Guardian data object
 * @returns {string} Guardian name
 */
export function getGuardianName(guardian) {
  if (!guardian) return 'N/A'
  
  if (guardian.full_name) return guardian.full_name
  if (guardian.fullName) return guardian.fullName
  if (guardian.name) return guardian.name
  
  const firstName = guardian.first_name || guardian.firstName || guardian.firstname || ''
  const lastName = guardian.last_name || guardian.lastName || guardian.lastname || guardian.surname || ''
  
  const name = `${firstName} ${lastName}`.trim()
  return name || 'N/A'
}

/**
 * Get vaccination summary from child data
 * @param {object} child - Child data object
 * @returns {object} Vaccination summary
 */
export function getVaccinationSummary(child) {
  if (!child) {
    return { completed: 0, total: 0, pending: 0, percentage: 0 }
  }
  
  const completed = getCompletedCount(child)
  const total = getTotalCount(child)
  const pending = getPendingCount(child)
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
  
  return { completed, total, pending, percentage }
}
