// Test script to verify template variable replacement
import { renderTemplate } from './smsReminderService.js';

// Test data
const vars = {
  patientName: 'Juan Dela Cruz',
  scheduledDate: '2025-01-15',
  scheduleSummary: 'Scheduled Date: 2025-01-15\n- BCG (1st Dose)\n- Hep B (1st Dose)'
};

// Test templates
const templates = [
  'Hello {patient_name}, your appointment has been rescheduled to {scheduled_date}. {schedule_summary}',
  'Hi { patient_name }, rescheduled to { scheduled_date }. { schedule_summary }',
  'Dear {patient_name}, new date: {scheduled_date}. Summary: {schedule_summary}'
];

console.log('Testing template variable replacement:');
templates.forEach((template, i) => {
  console.log(`\nTemplate ${i+1}: ${template}`);
  const result = renderTemplate(template, vars);
  console.log(`Result: ${result}`);
});
