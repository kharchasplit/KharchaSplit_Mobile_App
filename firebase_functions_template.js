// Firebase Cloud Function template for handling push notifications
// This should be deployed to Firebase Functions

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.sendPushNotifications = functions.firestore
  .document('notificationQueue/{notificationId}')
  .onCreate(async (snap, context) => {
    const notificationData = snap.data();
    
    if (notificationData.status !== 'pending') {
      return null;
    }

    const { title, body, data, tokens } = notificationData;

    if (!tokens || tokens.length === 0) {
      console.log('No tokens to send to');
      return snap.ref.update({ status: 'failed', error: 'No tokens provided' });
    }

    // Create the message
    const message = {
      notification: {
        title: title,
        body: body,
      },
      data: data || {},
      tokens: tokens,
    };

    try {
      // Send to multiple devices
      const response = await admin.messaging().sendMulticast(message);
      
      console.log(`Successfully sent message: ${response.successCount} successes, ${response.failureCount} failures`);

      // Handle failed tokens
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
          console.error('Failed to send to token', tokens[idx], resp.error);
        }
      });

      // Update notification status
      await snap.ref.update({
        status: 'sent',
        successCount: response.successCount,
        failureCount: response.failureCount,
        failedTokens: failedTokens,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return null;
    } catch (error) {
      console.error('Error sending message:', error);
      return snap.ref.update({
        status: 'failed',
        error: error.message,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  });

// Clean up old notifications (optional)
exports.cleanupNotifications = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    const oneWeekAgo = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );

    const oldNotifications = await admin
      .firestore()
      .collection('notificationQueue')
      .where('createdAt', '<=', oneWeekAgo)
      .get();

    const batch = admin.firestore().batch();
    oldNotifications.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Cleaned up ${oldNotifications.size} old notifications`);
    return null;
  });