import firestore from '@react-native-firebase/firestore';

export interface UserProfile {
  id: string;
  phoneNumber: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  alternatePhone?: string;
  address?: string;
  profileImage?: string; // Base64 encoded image (legacy)
  profileImageBase64?: string; // Base64 encoded image (current)
  referralCode?: string; // User's unique referral code
  referredBy?: string; // ID of user who referred this user
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface CreateUserProfile {
  phoneNumber: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  alternatePhone?: string;
  address?: string;
  profileImage?: string; // Base64 encoded image (legacy)
  profileImageBase64?: string; // Base64 encoded image (current)
  referralCode?: string; // User's unique referral code
  referredBy?: string; // ID of user who referred this user
}

export interface UpdateUserProfile {
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  alternatePhone?: string;
  address?: string;
  profileImage?: string; // Base64 encoded image (legacy)
  profileImageBase64?: string; // Base64 encoded image (current)
  referralCode?: string; // User's unique referral code
  referredBy?: string; // ID of user who referred this user
}

export interface ReferralHistoryItem {
  id: string;
  referredUserId: string;
  referredUserName: string;
  referredUserPhone: string;
  createdAt: string;
  status: 'completed' | 'pending' | 'failed';
  updatedAt: string;
}

export interface ReferralData {
  userId: string;
  referralCode: string;
  totalReferrals: number;
  successfulReferrals: number;
  pendingReferrals: number;
  referralHistory: ReferralHistoryItem[];
  createdAt: string;
  updatedAt: string;
}

class FirebaseService {
  private _usersCollection = firestore().collection('users');
  private _referralsCollection = firestore().collection('referrals');

  // Expose usersCollection for direct queries when needed
  get usersCollection() {
    return this._usersCollection;
  }

  get referralsCollection() {
    return this._referralsCollection;
  }

  async createUser(userData: CreateUserProfile): Promise<UserProfile> {
    try {
      const timestamp = new Date().toISOString();

      // Filter out undefined values to avoid Firestore errors
      const cleanUserData = Object.fromEntries(
        Object.entries(userData).filter(([_, value]) => value !== undefined)
      );

      const userDoc = {
        ...cleanUserData,
        createdAt: timestamp,
        updatedAt: timestamp,
        isActive: true,
      };

      const docRef = await this._usersCollection.add(userDoc);
      
      const userProfile: UserProfile = {
        id: docRef.id,
        ...userDoc,
      };

      console.log('User created successfully:', userProfile.id);
      return userProfile;
    } catch (error: any) {
      console.error('Error creating user:', error);
      if (error.code === 'firestore/permission-denied') {
        throw new Error('Permission denied. Please check Firestore security rules.');
      }
      throw new Error('Failed to create user profile');
    }
  }

  async getUserByPhone(phoneNumber: string): Promise<UserProfile | null> {
    try {
      const querySnapshot = await this._usersCollection
        .where('phoneNumber', '==', phoneNumber)
        .where('isActive', '==', true)
        .limit(1)
        .get();

      if (querySnapshot.empty) {
        return null;
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      
      return {
        id: userDoc.id,
        ...userData,
      } as UserProfile;
    } catch (error) {
      console.error('Error fetching user by phone:', error);
      throw new Error('Failed to fetch user data');
    }
  }

  async updateUser(userId: string, updateData: UpdateUserProfile): Promise<UserProfile> {
    try {
      const updateTimestamp = new Date().toISOString();
      await this._usersCollection.doc(userId).update({
        ...updateData,
        updatedAt: updateTimestamp,
      });

      console.log('User updated successfully:', userId);

      // Return updated user profile
      const updatedUser = await this.getUserById(userId);
      if (!updatedUser) {
        throw new Error('Failed to fetch updated user profile');
      }

      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('Failed to update user profile');
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      await this._usersCollection.doc(userId).update({
        isActive: false,
        updatedAt: new Date().toISOString(),
      });
      
      console.log('User deactivated successfully:', userId);
    } catch (error) {
      console.error('Error deactivating user:', error);
      throw new Error('Failed to deactivate user');
    }
  }

  async getUserById(userId: string): Promise<UserProfile | null> {
    try {
      const userDoc = await this._usersCollection.doc(userId).get();
      
      if (!userDoc.exists) {
        return null;
      }

      const userData = userDoc.data();
      if (!userData || !userData.isActive) {
        return null;
      }

      return {
        id: userDoc.id,
        ...userData,
      } as UserProfile;
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      throw new Error('Failed to fetch user data');
    }
  }

  async checkUserExists(phoneNumber: string): Promise<boolean> {
    try {
      const user = await this.getUserByPhone(phoneNumber);
      return user !== null;
    } catch (error) {
      console.error('Error checking user existence:', error);
      return false;
    }
  }

  // Referral System Methods

  /**
   * Generate a unique referral code for a user
   */
  private generateReferralCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'KS'; // Prefix for KharchaSplit
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Create or get referral data for a user
   */
  async getReferralData(userId: string): Promise<ReferralData> {
    try {
      console.log('Getting referral data for user:', userId);

      // Get user's referral code
      const userDoc = await this.getUserById(userId);
      if (!userDoc) {
        throw new Error('User not found');
      }

      let referralCode = userDoc.referralCode;

      // Generate referral code if user doesn't have one
      if (!referralCode) {
        referralCode = this.generateReferralCode();
        await this.updateUser(userId, { referralCode });
        console.log('Generated new referral code:', referralCode);
      }

      // Check if referral document exists
      const referralDoc = await this._referralsCollection.doc(userId).get();

      if (!referralDoc.exists) {
        // Create new referral document
        const newReferralData: ReferralData = {
          userId,
          referralCode,
          totalReferrals: 0,
          successfulReferrals: 0,
          pendingReferrals: 0,
          referralHistory: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await this._referralsCollection.doc(userId).set(newReferralData);
        console.log('Created new referral document for user:', userId);
        return newReferralData;
      }

      // Get existing referral data and refresh history
      const referralData = referralDoc.data() as ReferralData;
      const updatedData = await this.refreshReferralHistory(userId, referralData);

      return updatedData;
    } catch (error: any) {
      console.error('Error getting referral data:', error);

      // Provide more specific error information
      if (error.code === 'firestore/permission-denied') {
        console.error('Permission denied - Firebase rules may not be deployed yet');
        throw new Error('Permission denied: Please deploy Firebase Firestore rules');
      } else if (error.code === 'firestore/not-found') {
        console.error('Document not found - this is normal for new users');
        throw new Error('Referral document not found');
      } else {
        console.error('Unknown Firebase error:', error.message);
        throw new Error(`Failed to get referral data: ${error.message || 'Unknown error'}`);
      }
    }
  }

  /**
   * Refresh referral history by querying users who were referred by this user
   */
  private async refreshReferralHistory(userId: string, currentData: ReferralData): Promise<ReferralData> {
    try {
      console.log('Refreshing referral history for user:', userId);

      // Query users who were referred by this user
      const referredUsersSnapshot = await this._usersCollection
        .where('referredBy', '==', userId)
        .where('isActive', '==', true)
        .get();

      const referralHistory: ReferralHistoryItem[] = [];

      referredUsersSnapshot.docs.forEach((doc) => {
        const userData = doc.data() as UserProfile;
        referralHistory.push({
          id: doc.id,
          referredUserId: doc.id,
          referredUserName: userData.firstName || userData.name || 'New User',
          referredUserPhone: userData.phoneNumber,
          createdAt: userData.createdAt,
          status: 'completed', // All existing users are considered completed
          updatedAt: userData.updatedAt,
        });
      });

      // Calculate statistics
      const totalReferrals = referralHistory.length;
      const successfulReferrals = referralHistory.filter(r => r.status === 'completed').length;
      const pendingReferrals = referralHistory.filter(r => r.status === 'pending').length;

      // Update referral data
      const updatedData: ReferralData = {
        ...currentData,
        totalReferrals,
        successfulReferrals,
        pendingReferrals,
        referralHistory,
        updatedAt: new Date().toISOString(),
      };

      // Save updated data to Firestore
      await this._referralsCollection.doc(userId).update({
        totalReferrals,
        successfulReferrals,
        pendingReferrals,
        referralHistory,
        updatedAt: updatedData.updatedAt,
      });

      console.log('Referral history refreshed:', {
        totalReferrals,
        successfulReferrals,
        pendingReferrals
      });

      return updatedData;
    } catch (error) {
      console.error('Error refreshing referral history:', error);
      return currentData; // Return current data if refresh fails
    }
  }

  /**
   * Apply referral code when a new user signs up
   */
  async applyReferralCode(newUserId: string, referralCode: string): Promise<boolean> {
    try {
      console.log('Applying referral code:', referralCode, 'for user:', newUserId);

      // Find user with this referral code
      const referrerSnapshot = await this._usersCollection
        .where('referralCode', '==', referralCode)
        .where('isActive', '==', true)
        .limit(1)
        .get();

      if (referrerSnapshot.empty) {
        console.log('Invalid referral code:', referralCode);
        return false;
      }

      const referrerDoc = referrerSnapshot.docs[0];
      const referrerId = referrerDoc.id;

      // Update new user with referrer information
      await this.updateUser(newUserId, { referredBy: referrerId });

      // Update referrer's referral statistics will be handled by refreshReferralHistory
      console.log('Referral code applied successfully');
      return true;
    } catch (error) {
      console.error('Error applying referral code:', error);
      return false;
    }
  }

  /**
   * Validate if a referral code exists and is valid
   */
  async validateReferralCode(referralCode: string): Promise<boolean> {
    try {
      const snapshot = await this._usersCollection
        .where('referralCode', '==', referralCode)
        .where('isActive', '==', true)
        .limit(1)
        .get();

      return !snapshot.empty;
    } catch (error) {
      console.error('Error validating referral code:', error);
      return false;
    }
  }
}

export const firebaseService = new FirebaseService();