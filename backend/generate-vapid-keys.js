/**
 * Quick VAPID Key Generator
 *
 * This script generates VAPID keys for Web Push notifications.
 * Run this once to get your keys, then add them to your .env files.
 *
 * Usage:
 *   node generate-vapid-keys.js
 *
 * IMPORTANT: Keep private key secret! Never commit to version control.
 */

import webpush from 'web-push';

console.log('\n🔐 Generating VAPID Keys for Web Push Notifications...\n');

try {
  const vapidKeys = webpush.generateVAPIDKeys();

  console.log('✅ Keys Generated Successfully!\n');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📋 VAPID Keys (copy these to your .env files):');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('📁 Backend .env (backend/.env):');
  console.log('───────────────────────────────────────────────────────────');
  console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
  console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
  console.log('VAPID_SUBJECT=mailto:your-email@example.com');
  console.log('');

  console.log('📁 Frontend .env (frontend/.env):');
  console.log('───────────────────────────────────────────────────────────');
  console.log(`VITE_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
  console.log('');

  console.log('⚠️  SECURITY WARNINGS:');
  console.log('───────────────────────────────────────────────────────────');
  console.log('1. ❌ NEVER commit these keys to version control');
  console.log('2. ❌ NEVER share your PRIVATE key publicly');
  console.log('3. ✅ ADD .env to .gitignore');
  console.log('4. ✅ UPDATE VAPID_SUBJECT with your real contact email');
  console.log('5. ✅ USE different keys for dev/staging/production');
  console.log('');

  console.log('📝 Next Steps:');
  console.log('───────────────────────────────────────────────────────────');
  console.log('1. Copy the VAPID keys above to backend/.env');
  console.log('2. Copy the VITE_VAPID_PUBLIC_KEY to frontend/.env');
  console.log('3. Update VAPID_SUBJECT with your email');
  console.log('4. Run database migration: 002_create_push_subscriptions_table.sql');
  console.log('5. Restart both backend and frontend servers');
  console.log('6. Test push notifications in browser');
  console.log('');

  console.log('📚 Documentation:');
  console.log('───────────────────────────────────────────────────────────');
  console.log('Setup Guide: docs/PUSH_NOTIFICATION_SETUP.md');
  console.log('Summary: docs/IMPLEMENTATION_SUMMARY_PUSH_NOTIFICATIONS.md');
  console.log('');

} catch (error) {
  console.error('❌ Error generating VAPID keys:', error.message);
  console.error('\nMake sure web-push is installed:');
  console.error('  npm install web-push');
  process.exit(1);
}
