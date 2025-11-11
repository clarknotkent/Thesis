import { ref } from 'vue'
import api from '@/services/api'
import { getCurrentPHDate } from '@/utils/dateUtils'

export function useImmunizationDateBounds() {
  const immunizationDateMin = ref('')
  const immunizationDateMax = ref(getCurrentPHDate())

  const updateImmunizationDateConstraints = async (patientId, vaccineId, doseNumber) => {
    console.log('[DEBUG] updateImmunizationDateConstraints called with:', { patientId, vaccineId, doseNumber })

    if (!patientId || !vaccineId || !doseNumber) {
      // Reset to defaults if missing required params
      immunizationDateMin.value = ''
      immunizationDateMax.value = getCurrentPHDate()
      console.log('[DEBUG] Missing params, resetting to defaults:', { min: '', max: getCurrentPHDate() })
      return
    }

    try {
      // Step 1: Fetch patient data (DOB and schedules)
      let dob = null
      let patientSchedules = []
      try {
        const { data: patientData } = await api.get(`/patients/${patientId}`)
        const patient = patientData?.data || patientData
        dob = patient?.date_of_birth
        patientSchedules = patient?.nextScheduledVaccinations || []
        console.log('[DEBUG] Fetched patient DOB:', dob)
        console.log('[DEBUG] Fetched patient schedules:', patientSchedules.length, 'items')
      } catch (patientErr) {
        console.warn('Failed to fetch patient data:', patientErr.message || patientErr)
      }

      if (!dob) {
        // Cannot calculate without DOB
        immunizationDateMin.value = ''
        immunizationDateMax.value = getCurrentPHDate()
        console.log('[DEBUG] No DOB, resetting to defaults:', { min: '', max: getCurrentPHDate() })
        return
      }

      // Step 2: Find scheduled date for this vaccine and dose
      let scheduledDate = null
      const matchingSchedule = patientSchedules.find(s => {
        const sVaccineId = s.vaccineId || s.vaccine_id
        const sDoseNumber = s.doseNumber || s.dose_number || s.dose
        return String(sVaccineId) === String(vaccineId) && Number(sDoseNumber) === Number(doseNumber)
      })
      if (matchingSchedule) {
        scheduledDate = matchingSchedule.scheduledDate || matchingSchedule.scheduled_date || matchingSchedule.eligible_date
        console.log('[DEBUG] Found matching schedule:', matchingSchedule, 'scheduledDate:', scheduledDate)
      } else {
        console.log('[DEBUG] No matching schedule found for vaccine', vaccineId, 'dose', doseNumber)
      }

      // Step 3: Query vaccine schedule for due_after_days and absolute_latest_days
      let minDate = ''
      let maxDate = getCurrentPHDate() // Default to today
      try {
        const { data: vaccineSchedule } = await api.get(`/vaccines/${vaccineId}/schedule`)
        console.log('[DEBUG] Fetched vaccine schedule:', vaccineSchedule)
        if (vaccineSchedule && vaccineSchedule.data && vaccineSchedule.data.schedule_doses) {
          const doseInfo = vaccineSchedule.data.schedule_doses.find(d => d.dose_number === Number(doseNumber))
          console.log('[DEBUG] Found dose info:', doseInfo)
          if (doseInfo) {
            // Calculate min date: scheduled_date (primary), DOB + due_after_days (fallback)
            if (scheduledDate) {
              minDate = new Date(scheduledDate).toISOString().split('T')[0]
              console.log('[DEBUG] Using scheduled date as min:', minDate, 'from schedule')
            } else if (doseInfo.due_after_days !== undefined && doseInfo.due_after_days !== null) {
              const minDateObj = new Date(dob)
              minDateObj.setDate(minDateObj.getDate() + doseInfo.due_after_days)
              minDate = minDateObj.toISOString().split('T')[0]
              console.log('[DEBUG] Calculated min date:', minDate, 'from DOB + due_after_days:', dob, '+', doseInfo.due_after_days)
            }

            // Calculate max date: DOB + absolute_latest_days (primary), today only as fallback when absolute is null
            if (doseInfo.absolute_latest_days !== undefined && doseInfo.absolute_latest_days !== null) {
              const absoluteDateObj = new Date(dob)
              absoluteDateObj.setDate(absoluteDateObj.getDate() + doseInfo.absolute_latest_days)
              const today = new Date()
              today.setHours(23, 59, 59, 999) // End of today
              maxDate = absoluteDateObj < today ? absoluteDateObj.toISOString().split('T')[0] : today.toISOString().split('T')[0]
              console.log('[DEBUG] Calculated max date:', maxDate, 'from min(DOB + absolute_latest_days, today):', dob, '+', doseInfo.absolute_latest_days, 'vs today')
            }
          }
        }
      } catch (vaccineErr) {
        console.warn('Failed to fetch vaccine schedule for date constraints:', vaccineErr.message || vaccineErr)
      }

      // Set the reactive values
      immunizationDateMin.value = minDate
      immunizationDateMax.value = maxDate

      console.log('[DEBUG] Final date constraints set:', { min: minDate, max: maxDate })

      return {
        min: minDate,
        max: maxDate
      }

    } catch (error) {
      console.warn('Failed to update immunization date constraints:', error.message || error)
      // Reset to safe defaults
      immunizationDateMin.value = ''
      immunizationDateMax.value = getCurrentPHDate()
      console.log('[DEBUG] Error occurred, resetting to defaults:', { min: '', max: getCurrentPHDate() })
    }
  }

  return {
    immunizationDateMin,
    immunizationDateMax,
    updateImmunizationDateConstraints
  }
}