import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { Activity } from './firebaseService';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  tokens: string[];
}

export class NotificationService {
  /**
   * Send push notification for activity
   */
  static async sendActivityNotification(activity: Activity) {
    try {
      // Get tokens for users who should receive this notification
      const tokens = await this.getTokensForActivity(activity);
      
      if (tokens.length === 0) {
        return;
      }

      // Create notification payload based on activity type
      const payload = this.createNotificationPayload(activity, tokens);

      // Send to Firebase Cloud Function
      await this.triggerCloudFunction(payload);
    } catch (error) {
      console.error('❌ Error sending activity notification:', error);
    }
  }

  /**
   * Get FCM tokens for users who should receive the notification
   */
  static async getTokensForActivity(activity: Activity): Promise<string[]> {
    const tokens: string[] = [];

    try {
      if (activity.groupId) {
        // Get group members
        const groupDoc = await firestore()
          .collection('groups')
          .doc(activity.groupId)
          .get();

        if (groupDoc.exists) {
          const groupData = groupDoc.data();
          const memberUserIds = groupData?.members?.map((m: any) => m.userId) || [];

          // Get FCM tokens for all members except the user who created the activity
          const filteredMemberIds = memberUserIds.filter(id => id !== activity.userId);

          // Get user documents one by one to avoid Firestore array limit issues
          for (const userId of filteredMemberIds) {
            try {
              const userDoc = await firestore()
                .collection('users')
                .doc(userId)
                .get();

              if (userDoc.exists) {
                const userData = userDoc.data();
                
                if (userData?.fcmToken) {
                  tokens.push(userData.fcmToken);
                }
              }
            } catch (error) {
              console.error('❌ Error fetching user:', userId, error);
            }
          }
        }
      } else {
        // For non-group activities, get token for specific user
        const userDoc = await firestore()
          .collection('users')
          .doc(activity.userId)
          .get();

        if (userDoc.exists) {
          const userData = userDoc.data();
          if (userData?.fcmToken && userData.id !== activity.userId) {
            tokens.push(userData.fcmToken);
          }
        }
      }
    } catch (error) {
      console.error('Error getting tokens for activity:', error);
    }

    return tokens;
  }

  /**
   * Create notification payload based on activity type
   */
  static createNotificationPayload(activity: Activity, tokens: string[]): NotificationPayload {
    let title = 'KharchaSplit';
    let body = activity.title;

    // Customize notification based on activity type
    switch (activity.type) {
      case 'expense_added':
        title = '💸 New Expense';
        body = activity.title;
        break;
      case 'payment_made':
        title = '💰 Payment Made';
        body = activity.title;
        break;
      case 'settlement_created':
        title = '📝 Settlement Pending';
        body = activity.title;
        break;
      case 'settlement_confirmed':
        title = '✅ Settlement Confirmed';
        body = activity.title;
        break;
      case 'group_created':
        title = '👥 New Group';
        body = activity.title;
        break;
      case 'group_joined':
        title = '🎉 Member Joined';
        body = activity.title;
        break;
      default:
        title = '🔔 KharchaSplit';
        body = activity.title;
    }

    return {
      title,
      body,
      data: {
        activityType: activity.type,
        activityId: activity.id || '',
        groupId: activity.groupId || '',
        groupName: activity.groupName || '',
        userId: activity.userId,
        amount: activity.amount?.toString() || '',
      },
      tokens,
    };
  }

  /**
   * Trigger Cloud Function to send notification
   * Note: This is a placeholder - you'll need to implement the actual Cloud Function
   */
  static async triggerCloudFunction(payload: NotificationPayload) {
    // For now, we'll store the notification request in Firestore
    // A Cloud Function will listen to this collection and send the actual notifications
    await firestore()
      .collection('notificationQueue')
      .add({
        ...payload,
        createdAt: firestore.FieldValue.serverTimestamp(),
        status: 'pending',
      });
  }
}