// Lightweight debugging helper: prints an sms_log row and the sanitized final message
// Usage: node backend/scripts/print_sms_log.js <id>

import supabase from '../db.js';
import smsService from '../services/smsService.js';

const id = process.argv[2];
if (!id) {
  console.error('Usage: node backend/scripts/print_sms_log.js <id>');
  process.exit(1);
}

async function main() {
  const { data, error } = await supabase
    .from('sms_logs')
    .select('*')
    .eq('id', Number(id))
    .maybeSingle();

  if (error) {
    console.error('DB error:', error);
    process.exit(2);
  }
  if (!data) {
    console.log('No sms_log found with id=', id);
    process.exit(0);
  }

  console.log('--- sms_log row ---');
  console.log(JSON.stringify(data, null, 2));

  const raw = data.message || '';
  const sanitized = typeof smsService.sanitizeMessage === 'function' ? smsService.sanitizeMessage(raw) : raw;

  console.log('\n--- message summary ---');
  console.log('raw length:', raw.length);
  console.log('sanitized length:', sanitized.length);
  console.log('\n--- raw (DB) ---\n');
  console.log(raw);
  console.log('\n--- sanitized (what will be sent) ---\n');
  console.log(sanitized);

  // optionally show first 100 code points for quick character-set inspection
  const codePoints = Array.from(sanitized).slice(0, 200).map(ch => ch.codePointAt(0));
  console.log('\n--- sanitized codepoints (first 200 chars) ---\n', codePoints.join(', '));
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(3);
});
