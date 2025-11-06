import axios from 'axios';

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
    if (!phoneNumber) return phoneNumber;
    // Strip all non-digit characters
    const digits = String(phoneNumber).replace(/\D/g, '');

    // Common Philippine formats:
    // 09171234567 -> digits startsWith 0, length 11 -> +63 9171234567
    // 639171234567 -> digits startsWith 63, length 12 -> +639171234567
    // 9171234567 -> digits length 10 -> +639171234567

    if (digits.startsWith('0') && digits.length === 11) {
      return '+63' + digits.substring(1);
    }

    if (digits.startsWith('63') && digits.length === 12) {
      return '+' + digits;
    }

    if (digits.length === 10) {
      return '+63' + digits;
    }

    // Fallback: if it already looks like an international number without +, prefix +
    if (digits.length >= 11) {
      return '+' + digits;
    }

    // Otherwise return original cleaned and prefixed with +63 as a last resort
    return '+63' + digits;
  }

  /**
   * Return a sanitized/finalized message string that will be sent to the provider.
   * Exposed so callers (scheduler) can preview the final payload before sending.
   */
  sanitizeMessage(message) {
    // Preserve intentional newlines while normalizing whitespace.
    // - Normalize CRLF -> LF
    // - Trim each line and collapse multiple spaces/tabs inside a line to single space
    // - Collapse more than one consecutive blank line into a single blank line
    if (typeof message !== 'string') return message;

    // Normalize CRLF to LF
    const s = message.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Split into lines, trim each line and collapse internal whitespace to single spaces
    const lines = s.split('\n').map(line => line.replace(/\s+/g, ' ').trim());

    // Collapse consecutive blank lines into a single blank line
    const collapsed = [];
    let lastWasBlank = false;
    for (const ln of lines) {
      const isBlank = ln === '';
      if (isBlank && lastWasBlank) continue; // skip extra blank line
      collapsed.push(ln);
      lastWasBlank = isBlank;
    }

    // Ensure at least one empty line after lines ending with ':' (common in templates)
    const withParagraphs = [];
    for (let i = 0; i < collapsed.length; i++) {
      const ln = collapsed[i];
      withParagraphs.push(ln);
      try {
        if (ln && ln.trim().endsWith(':')) {
          // If next line exists and is not already blank, insert a blank line
          const next = collapsed[i + 1];
          if (typeof next !== 'undefined' && next !== '') {
            withParagraphs.push('');
          }
        }
      } catch (_) {}
    }

    // Ensure at least one empty line BEFORE a closing/signature line like "Thank you" or "Thanks"
    const withSignatures = [];
    for (let i = 0; i < withParagraphs.length; i++) {
      const ln = withParagraphs[i];
      const isSignature = typeof ln === 'string' && /^\s*(Thank you|Thanks)([.!]?|\b)/i.test(ln.trim());
      if (isSignature) {
        // if previous line exists and is not blank, insert a blank line before the signature
        const prev = withSignatures.length > 0 ? withSignatures[withSignatures.length - 1] : undefined;
        if (typeof prev !== 'undefined' && prev !== '') {
          withSignatures.push('');
        }
      }
      withSignatures.push(ln);
    }

    // Rejoin with LF — providers commonly accept \n; keep as-is so scheduler and logs show real newlines
    return withSignatures.join('\n').trim();
  }

  /**
   * Normalize message for telco (GSM-7 friendly):
   * - convert newlines to spaces
   * - collapse whitespace
   * - replace common Unicode punctuation with ASCII equivalents
   * - remove remaining non-ASCII characters
   */
  normalizeForTelco(message) {
    if (typeof message !== 'string') return message;

    let s = String(message);
    // Normalize CRLF and CR to LF
    s = s.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Collapse internal whitespace on each line but preserve newlines
    const lines = s.split('\n').map(line => line.replace(/\s+/g, ' ').trim());
    // Collapse multiple blank lines to a single blank line
    const collapsed = [];
    let lastBlank = false;
    for (const ln of lines) {
      const isBlank = ln === '';
      if (isBlank && lastBlank) continue;
      collapsed.push(ln);
      lastBlank = isBlank;
    }
    // Ensure at least one empty line after lines that end with ':'
    const withParagraphs = [];
    for (let i = 0; i < collapsed.length; i++) {
      const ln = collapsed[i];
      withParagraphs.push(ln);
      try {
        if (ln && ln.trim().endsWith(':')) {
          const next = collapsed[i + 1];
          if (typeof next !== 'undefined' && next !== '') {
            withParagraphs.push('');
          }
        }
      } catch (_) {}
    }
    // Ensure at least one empty line BEFORE a closing/signature line like "Thank you" or "Thanks"
    const withSignatures = [];
    for (let i = 0; i < withParagraphs.length; i++) {
      const ln = withParagraphs[i];
      const isSignature = typeof ln === 'string' && /^\s*(Thank you|Thanks)([.!]?|\b)/i.test(ln.trim());
      if (isSignature) {
        const prev = withSignatures.length > 0 ? withSignatures[withSignatures.length - 1] : undefined;
        if (typeof prev !== 'undefined' && prev !== '') {
          withSignatures.push('');
        }
      }
      withSignatures.push(ln);
    }
    s = withSignatures.join('\n');

    // common punctuation replacements
    s = s.replace(/[–—]/g, '-')      // en-dash / em-dash -> hyphen
      .replace(/[“”]/g, '"')     // curly double quotes -> "
      .replace(/[‘’]/g, "'")     // curly single quotes -> '
      .replace(/…/g, '...');      // ellipsis

    // Remove any remaining non-ASCII characters except newline
    s = s.replace(/[^\x00-\x7F\n]/g, '');

    return s.trim();
  }

  /**
   * Send a single SMS message
   */
  async sendSMS(recipient, message) {
    if (!this.apiKey) {
      throw new Error('PhilSMS API key not configured');
    }

    const formattedRecipient = this.formatPhoneNumber(recipient);

    // Optionally show the raw message as it arrived from the caller (frontend or scheduler)
    try {
      if (String(process.env.SHOW_SMS_MESSAGES || '').toLowerCase() === 'true') {
        console.log('[smsService][RAW_MESSAGE] recipient=' + formattedRecipient + ' incoming_raw="' + String(message) + '"');
      }
    } catch (_) {}

    // Sanitize message to avoid provider rejection due to newlines/smart-quotes/etc.
    const sanitizedMessage = this.sanitizeMessage(message);

    // Log a compact debug message (do not print API key)
    console.log(`[smsService] Sending SMS to ${formattedRecipient} (msgLen=${String(sanitizedMessage || '').length})`);

    // Optional verbose debug: print recipient and full message when SMS_DEBUG=true
    try {
      if (String(process.env.SMS_DEBUG || '').toLowerCase() === 'true') {
        const preview = typeof sanitizedMessage === 'string' && sanitizedMessage.length > 500
          ? sanitizedMessage.slice(0, 500) + '...[truncated]'
          : sanitizedMessage;
        console.log(`[smsService][DEBUG] recipient=${formattedRecipient} message="${preview}"`);
      }
    } catch (e) { /* ignore debug logging failure */ }

    // If SHOW_SMS_MESSAGES=true, print the full sanitized message for debugging (use only in dev/staging)
    try {
      if (String(process.env.SHOW_SMS_MESSAGES || '').toLowerCase() === 'true') {
        console.log('[smsService][SHOW_MESSAGE] recipient=' + formattedRecipient + ' message="' + String(sanitizedMessage) + '"');
      }
    } catch (e) { /* ignore */ }

    // If SMS_DEBUG_BREAK=true, print both raw and sanitized and pause (attach a debugger to inspect)
    try {
      if (String(process.env.SMS_DEBUG_BREAK || '').toLowerCase() === 'true') {
        console.log('[smsService][DBG_BREAK] recipient=' + formattedRecipient + ' raw="' + String(message) + '" sanitized="' + String(sanitizedMessage) + '"');
        // previously paused here for interactive debugging; removed automatic debugger statement
      }
    } catch (_) {}

    // Normalize for telco to avoid GSM issues (also covers scheduled messages)
    const normalizedMessage = this.normalizeForTelco(sanitizedMessage);
    try {
      try {
        console.log(`[smsService] normalized message length=${String(normalizedMessage || '').length} preview="${String(normalizedMessage || '').slice(0,100)}"`);
      } catch (_) {}

      const response = await axios.post(
        this.apiEndpoint,
        {
          sender_id: this.senderId,
          recipient: formattedRecipient,
          message: normalizedMessage
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
      const respData = error.response?.data;
      // If provider returned a known transient message, keep the original message but mark it so caller may retry
      if (respData && respData.message && String(respData.message).toLowerCase().includes('telco')) {
        console.warn('[smsService] Provider returned Telco issue for', formattedRecipient, '->', respData);
      } else {
        console.error('SMS sending error:', respData || error.message);
      }

      return {
        success: false,
        // Prefer provider message, but include fallback to error.message
        error: respData?.message || error.message,
        data: respData || null,
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
      '{vaccine_lines}': variables.vaccineLines || variables.vaccine_list || '',
      '{vaccine_list}': variables.vaccineLines || variables.vaccine_list || '',
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

export default new SMSService();
