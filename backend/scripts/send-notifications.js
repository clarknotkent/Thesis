
import * as notificationModel from '../models/notificationModel.js';

/**
 * This script fetches and processes pending notifications.
 * In a real-world scenario, this would integrate with email, SMS, and push notification services.
 * For this simulation, it will mark 'Queued' notifications as 'Sent' or 'Failed' randomly.
 */
async function processNotificationQueue() {
  console.log('Starting notification queue processing...');
  let successCount = 0;
  let failedCount = 0;

  try {
    const pendingNotifications = await notificationModel.getPendingNotifications();

    if (pendingNotifications.length === 0) {
      console.log('No pending notifications to process.');
      return;
    }

    console.log(`Found ${pendingNotifications.length} pending notifications.`);

    for (const notif of pendingNotifications) {
      try {
        // Simulate sending the notification
        console.log(`Processing notification ID: ${notif.notification_id} to ${notif.recipient_email || notif.recipient_phone || `User ${notif.recipient_user_id}`}`);

        // Randomly succeed or fail for demonstration
        const isSuccess = Math.random() > 0.2; // 80% success rate

        if (isSuccess) {
          await notificationModel.updateStatus(notif.notification_id, 'sent');
          successCount++;
        } else {
          await notificationModel.updateStatus(notif.notification_id, 'failed', 'Simulated sending failure');
          failedCount++;
        }
      } catch (error) {
        console.error(`Error processing notification ${notif.notification_id}:`, error);
        failedCount++;
        await notificationModel.updateStatus(notif.notification_id, 'failed', error.message);
      }
    }

    console.log('--- Notification Queue Processing Complete ---');
    console.log(`Successfully sent: ${successCount}`);
    console.log(`Failed to send: ${failedCount}`);

  } catch (error) {
    console.error('An error occurred while fetching the notification queue:', error);
  }
}

// Self-invoking function to run the script from the command line
(async () => {
  // A delay to ensure DB is ready if run at startup, not strictly needed for manual runs
  await new Promise(resolve => setTimeout(resolve, 2000));
  await processNotificationQueue();
  process.exit(0); // Exit after running
})();
