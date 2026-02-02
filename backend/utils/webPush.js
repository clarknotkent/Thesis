/**
 * Web Push Utilities
 *
 * Handles Web Push notifications using the web-push library.
 * Manages VAPID keys and push notification delivery.
 */

import webpush from 'web-push';
import dotenv from 'dotenv';

dotenv.config();

// VAPID keys from environment variables
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDSKidBgAXI62NU1T0Y9eQCaWkGp3ZYFGBkJJbC5FO-o';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'UUxEUExDSDlCNXM1c2FsWnBYZjVnaXhzZXVKVlhkRzM';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@immunizeme.com';

// Set VAPID details
webpush.setVapidDetails(
  VAPID_SUBJECT,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

console.log('✅ Web Push configured with VAPID keys');

/**
 * Generate VAPID keys (one-time setup)
 * Run this function once to generate keys, then add them to .env
 */
export function generateVapidKeys() {
  const vapidKeys = webpush.generateVAPIDKeys();
  console.log('VAPID Keys Generated:');
  console.log('Public Key:', vapidKeys.publicKey);
  console.log('Private Key:', vapidKeys.privateKey);
  console.log('\nAdd these to your .env file:');
  console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
  console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
  console.log('VAPID_SUBJECT=mailto:your-email@example.com');
  return vapidKeys;
}

/**
 * Send push notification to a subscriber
 *
 * @param {Object} subscription - Push subscription object from frontend
 * @param {Object} payload - Notification payload
 * @param {Object} options - Additional options
 * @returns {Promise} Push send result
 */
export async function sendPushNotification(subscription, payload, options = {}) {
  try {
    // Validate subscription
    if (!subscription || !subscription.endpoint) {
      throw new Error('Invalid subscription object');
    }

    // Prepare notification payload
    const notificationPayload = JSON.stringify({
      title: payload.title || 'ImmunizeMe',
      body: payload.body || '',
      icon: payload.icon || '/icons/icon-192x192.png',
      badge: payload.badge || '/icons/icon-96x96.png',
      tag: payload.tag || `notification-${Date.now()}`,
      data: payload.data || {},
      requireInteraction: payload.requireInteraction || false,
      actions: payload.actions || [],
      timestamp: Date.now(),
      ...payload
    });

    // Send push notification
    const result = await webpush.sendNotification(
      subscription,
      notificationPayload,
      options
    );

    return { success: true, result };
  } catch (error) {
    console.error('❌ Failed to send push notification:', error);

    // Handle specific errors
    if (error.statusCode === 410 || error.statusCode === 404) {
      // Subscription expired or not found
      return { success: false, expired: true, error: error.message };
    }

    return { success: false, expired: false, error: error.message };
  }
}

/**
 * Send push to multiple subscribers
 *
 * @param {Array} subscriptions - Array of subscription objects
 * @param {Object} payload - Notification payload
 * @returns {Promise} Results array
 */
export async function sendPushToMultiple(subscriptions, payload) {
  const results = [];

  for (const subscription of subscriptions) {
    const result = await sendPushNotification(subscription, payload);
    results.push({
      subscription,
      ...result
    });

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const successCount = results.filter(r => r.success).length;
  const expiredCount = results.filter(r => r.expired).length;

  console.log(`📊 Push results: ${successCount} sent, ${expiredCount} expired`);

  return {
    total: subscriptions.length,
    sent: successCount,
    expired: expiredCount,
    results
  };
}

/**
 * Get VAPID public key
 */
export function getVapidPublicKey() {
  return VAPID_PUBLIC_KEY;
}

export default {
  generateVapidKeys,
  sendPushNotification,
  sendPushToMultiple,
  getVapidPublicKey
};
