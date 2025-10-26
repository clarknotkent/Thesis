const axios = require('axios');

class SMSService {
  constructor() {
    this.apiKey = process.env.PHILSMS_API_KEY;
    this.senderId = process.env.PHILSMS_SENDER_ID || 'Eulap';
    this.apiEndpoint = 'https://app.philsms.com/api/v3/sms/send';
  }

  /**
   * Format phone number to PhilSMS format (+63XXXXXXXXXX)
   */
  formatPhoneNumber(phoneNumber) {
    let formatted = phoneNumber.replace(/\s+/g, '').replace(/-/g, '');
    
    // If starts with 0, replace with +63
    if (formatted.startsWith('0')) {
      formatted = '+63' + formatted.substring(1);
    }
    // If starts with 63, add +
    else if (formatted.startsWith('63')) {
      formatted = '+' + formatted;
    }
    // If doesn't start with +63, assume it's missing country code
    else if (!formatted.startsWith('+63')) {
      formatted = '+63' + formatted;
    }
    
    return formatted;
  }

  /**
   * Send a single SMS message
   */
  async sendSMS(recipient, message) {
    if (!this.apiKey) {
      throw new Error('PhilSMS API key not configured');
    }

    const formattedRecipient = this.formatPhoneNumber(recipient);

    try {
      const response = await axios.post(
        this.apiEndpoint,
        {
          sender_id: this.senderId,
          recipient: formattedRecipient,
          message: message
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 second timeout
        }
      );

      return {
        success: true,
        data: response.data,
        recipient: formattedRecipient
      };
    } catch (error) {
      console.error('SMS sending error:', error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        recipient: formattedRecipient
      };
    }
  }

  /**
   * Send bulk SMS messages
   */
  async sendBulkSMS(recipients) {
    const results = [];
    
    for (const recipient of recipients) {
      const result = await this.sendSMS(recipient.phone, recipient.message);
      results.push({
        ...result,
        guardianId: recipient.guardianId,
        patientId: recipient.patientId
      });
      
      // Add small delay between messages to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return results;
  }

  /**
   * Replace template variables with actual values
   */
  replaceTemplateVariables(template, variables) {
    let message = template;
    
    // Determine greeting time based on current hour or provided time
    let greetingTime = 'Day';
    if (variables.currentHour !== undefined) {
      // If hour is provided, use it
      greetingTime = (variables.currentHour >= 6 && variables.currentHour < 18) ? 'Day' : 'Evening';
    } else {
      // Use current time
      const currentHour = new Date().getHours();
      greetingTime = (currentHour >= 6 && currentHour < 18) ? 'Day' : 'Evening';
    }
    
    // Determine guardian title based on gender
    let guardianTitle = 'Mr.';
    if (variables.guardianGender) {
      guardianTitle = variables.guardianGender.toLowerCase() === 'female' ? 'Ms.' : 'Mr.';
    }
    
    // Replace common variables
    const replacements = {
      '{greeting_time}': greetingTime,
      '{guardian_title}': guardianTitle,
      '{guardian_name}': variables.guardianName || '',
      '{guardian_first_name}': variables.guardianFirstName || '',
      '{guardian_last_name}': variables.guardianLastName || '',
      '{patient_name}': variables.patientName || '',
      '{patient_first_name}': variables.patientFirstName || '',
      '{vaccine_name}': variables.vaccineName || '',
      '{dose_number}': variables.doseNumber || '1',
      '{appointment_date}': variables.appointmentDate || '',
      '{appointment_time}': variables.appointmentTime || '',
      '{scheduled_date}': variables.scheduledDate || variables.appointmentDate || '',
      '{health_center}': variables.healthCenter || 'Barangay Health Center',
      '{days_until}': variables.daysUntil || ''
    };
    
    for (const [key, value] of Object.entries(replacements)) {
      message = message.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
    }
    
    return message;
  }
}

module.exports = new SMSService();
