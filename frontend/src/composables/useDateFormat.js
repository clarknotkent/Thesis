/**
 * Date and Time Formatting Utilities
 * Shared across all parent module components
 */

/**
 * Format a date string to readable format
 * @param {string|Date} dateString - Date to format
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export function formatDate(dateString, options = { month: 'short', day: 'numeric', year: 'numeric' }) {
  if (!dateString) return 'N/A'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'N/A'
    return date.toLocaleDateString('en-US', options)
  } catch (error) {
    console.error('Error formatting date:', error)
    return 'N/A'
  }
}

/**
 * Calculate age from date of birth
 * @param {string|Date} dateOfBirth - Date of birth
 * @returns {string} Age string (e.g., "2y 3m", "5 months", "1 year")
 */
export function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return 'N/A'
  
  try {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    
    if (isNaN(birthDate.getTime())) return 'N/A'
    
    let years = today.getFullYear() - birthDate.getFullYear()
    let months = today.getMonth() - birthDate.getMonth()
    
    if (months < 0) {
      years--
      months += 12
    }
    
    // Adjust if the day hasn't occurred yet this month
    if (today.getDate() < birthDate.getDate()) {
      months--
      if (months < 0) {
        years--
        months += 12
      }
    }
    
    // Format based on age
    if (years === 0 && months === 0) {
      const days = Math.floor((today - birthDate) / (1000 * 60 * 60 * 24))
      return days === 1 ? '1 day' : `${days} days`
    } else if (years === 0) {
      return months === 1 ? '1 month' : `${months} months`
    } else if (months === 0) {
      return years === 1 ? '1 year' : `${years} years`
    } else {
      return `${years}y ${months}m`
    }
  } catch (error) {
    console.error('Error calculating age:', error)
    return 'N/A'
  }
}

/**
 * Format timestamp to relative time
 * @param {string|Date} timestamp - Timestamp to format
 * @returns {string} Relative time string (e.g., "2h ago", "3d ago")
 */
export function formatTime(timestamp) {
  if (!timestamp) return ''
  
  try {
    const date = new Date(timestamp)
    if (isNaN(date.getTime())) return ''
    
    const now = new Date()
    const diff = now - date
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    const weeks = Math.floor(days / 7)
    const months = Math.floor(days / 30)
    const years = Math.floor(days / 365)
    
    if (seconds < 60) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    if (weeks < 4) return `${weeks}w ago`
    if (months < 12) return `${months}mo ago`
    return `${years}y ago`
  } catch (error) {
    console.error('Error formatting time:', error)
    return ''
  }
}

/**
 * Format timestamp to full date and time
 * @param {string|Date} timestamp - Timestamp to format
 * @returns {string} Full date and time string
 */
export function formatDateTime(timestamp) {
  if (!timestamp) return 'N/A'
  
  try {
    const date = new Date(timestamp)
    if (isNaN(date.getTime())) return 'N/A'
    
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  } catch (error) {
    console.error('Error formatting datetime:', error)
    return 'N/A'
  }
}

/**
 * Get short date format (MMM DD)
 * @param {string|Date} dateString - Date to format
 * @returns {string} Short date string
 */
export function formatShortDate(dateString) {
  return formatDate(dateString, { month: 'short', day: 'numeric' })
}

/**
 * Get long date format (Month DD, YYYY)
 * @param {string|Date} dateString - Date to format
 * @returns {string} Long date string
 */
export function formatLongDate(dateString) {
  return formatDate(dateString, { month: 'long', day: 'numeric', year: 'numeric' })
}

/**
 * Check if a date is in the past
 * @param {string|Date} dateString - Date to check
 * @returns {boolean} True if date is in the past
 */
export function isPast(dateString) {
  if (!dateString) return false
  try {
    const date = new Date(dateString)
    return date < new Date()
  } catch {
    return false
  }
}

/**
 * Check if a date is today
 * @param {string|Date} dateString - Date to check
 * @returns {boolean} True if date is today
 */
export function isToday(dateString) {
  if (!dateString) return false
  try {
    const date = new Date(dateString)
    const today = new Date()
    return date.toDateString() === today.toDateString()
  } catch {
    return false
  }
}
