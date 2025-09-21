import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

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

export interface GroupMember {
  userId: string;
  name: string;
  phoneNumber: string;
  joinedAt: string;
  role: 'admin' | 'member';
  profileImage?: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  coverImageBase64?: string; // Base64 encoded cover image
  members: GroupMember[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  isCompleted?: boolean; // Whether group is completed
  completedAt?: string; // When group was completed
  completedBy?: string; // Who completed the group
  totalExpenses: number;
  currency: string;
}

export interface CreateGroup {
  name: string;
  description?: string;
  coverImageBase64?: string; // Base64 encoded cover image
  memberPhoneNumbers: string[]; // Phone numbers of members to add
  currency?: string;
}

export interface ExpenseParticipant {
  id: string;
  name: string;
  amount: number;
  isYou?: boolean;
}

export interface GroupExpense {
  id?: string;
  groupId: string;
  description: string;
  amount: number;
  category: {
    id: number;
    name: string;
    emoji: string;
    color: string;
  };
  paidBy: {
    id: string;
    name: string;
    isYou?: boolean;
  };
  splitType: string;
  participants: ExpenseParticipant[];
  receiptBase64?: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  isActive: boolean;
}

export interface Settlement {
  id?: string;
  groupId: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: number;
  status: 'unpaid' | 'pending' | 'paid';
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  confirmedAt?: string;
  paymentNote?: string;
}

class FirebaseService {
  private _usersCollection = firestore().collection('users');
  private _referralsCollection = firestore().collection('referrals');
  private _groupsCollection = firestore().collection('groups');

  // Expose usersCollection for direct queries when needed
  get usersCollection() {
    return this._usersCollection;
  }

  get referralsCollection() {
    return this._referralsCollection;
  }

  get groupsCollection() {
    return this._groupsCollection;
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

  /**
   * Check which phone numbers exist in the database
   * Returns array of existing phone numbers
   */
  async getExistingPhoneNumbers(phoneNumbers: string[]): Promise<string[]> {
    try {
      console.log('Checking existence for phone numbers:', phoneNumbers.length);
      
      if (phoneNumbers.length === 0) {
        return [];
      }

      // Firebase 'in' query can handle up to 10 items at a time
      const existingNumbers: string[] = [];
      const batchSize = 10;
      
      for (let i = 0; i < phoneNumbers.length; i += batchSize) {
        const batch = phoneNumbers.slice(i, i + batchSize);
        
        try {
          const querySnapshot = await this._usersCollection
            .where('phoneNumber', 'in', batch)
            .where('isActive', '==', true)
            .get();

          querySnapshot.docs.forEach(doc => {
            const userData = doc.data();
            if (userData.phoneNumber) {
              existingNumbers.push(userData.phoneNumber);
            }
          });
        } catch (batchError) {
          console.warn('Error in batch query, trying individual checks for batch:', batch);
          // Fallback: check each number individually
          for (const phoneNumber of batch) {
            try {
              const exists = await this.checkUserExists(phoneNumber);
              if (exists) {
                existingNumbers.push(phoneNumber);
              }
            } catch (individualError) {
              console.warn(`Error checking individual phone number ${phoneNumber}:`, individualError);
            }
          }
        }
      }

      console.log(`Found ${existingNumbers.length} existing users out of ${phoneNumbers.length} phone numbers`);
      return existingNumbers;
    } catch (error) {
      console.error('Error checking phone numbers existence:', error);
      // Return empty array instead of throwing to allow graceful fallback
      return [];
    }
  }

  /**
   * Get user profiles for existing phone numbers
   * Returns array of user profiles
   */
  async getUsersByPhoneNumbers(phoneNumbers: string[]): Promise<UserProfile[]> {
    try {
      console.log('Getting user profiles for phone numbers:', phoneNumbers.length);
      
      if (phoneNumbers.length === 0) {
        return [];
      }

      const users: UserProfile[] = [];
      const batchSize = 30; // Increased batch size for better performance
      
      // Process all batches in parallel for faster lookup
      const batchPromises: Promise<void>[] = [];
      
      for (let i = 0; i < phoneNumbers.length; i += batchSize) {
        const batch = phoneNumbers.slice(i, i + batchSize);
        
        const batchPromise = (async () => {
          try {
            const querySnapshot = await this._usersCollection
              .where('phoneNumber', 'in', batch)
              .where('isActive', '==', true)
              .get();

            querySnapshot.docs.forEach(doc => {
              const userData = doc.data();
              users.push({
                id: doc.id,
                ...userData,
              } as UserProfile);
            });
          } catch (batchError) {
            console.warn('Error in batch query for batch:', batch);
            // Skip this batch instead of individual lookups for performance
          }
        })();
        
        batchPromises.push(batchPromise);
      }
      
      // Wait for all batches to complete
      await Promise.all(batchPromises);

      console.log(`Found ${users.length} user profiles`);
      return users;
    } catch (error) {
      console.error('Error getting users by phone numbers:', error);
      return [];
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

  // Group Management Methods

  /**
   * Create a new group with members
   */
  async createGroup(groupData: CreateGroup, createdBy: string): Promise<Group> {
    try {
      console.log('Creating group:', groupData.name, 'by user:', createdBy);
      const timestamp = new Date().toISOString();

      // Get creator user data
      const creator = await this.getUserById(createdBy);
      if (!creator) {
        throw new Error('Creator user not found');
      }

      // Resolve members by phone numbers
      const members: GroupMember[] = [];
      
      // Add creator as admin
      members.push({
        userId: createdBy,
        name: creator.name,
        phoneNumber: creator.phoneNumber,
        joinedAt: timestamp,
        role: 'admin',
        profileImage: creator.profileImageBase64 || creator.profileImage,
      });

      // Add other members
      for (const phoneNumber of groupData.memberPhoneNumbers) {
        // Skip if it's the creator's phone number
        if (phoneNumber === creator.phoneNumber) continue;

        const user = await this.getUserByPhone(phoneNumber);
        if (user) {
          members.push({
            userId: user.id,
            name: user.name,
            phoneNumber: user.phoneNumber,
            joinedAt: timestamp,
            role: 'member',
            profileImage: user.profileImageBase64 || user.profileImage,
          });
        } else {
          console.warn(`User with phone ${phoneNumber} not found, skipping`);
        }
      }

      // Create group document
      const groupDoc: Omit<Group, 'id'> = {
        name: groupData.name,
        description: groupData.description,
        coverImageBase64: groupData.coverImageBase64,
        members,
        createdBy,
        createdAt: timestamp,
        updatedAt: timestamp,
        isActive: true,
        totalExpenses: 0,
        currency: groupData.currency || 'INR',
      };

      const docRef = await this._groupsCollection.add(groupDoc);
      
      const group: Group = {
        id: docRef.id,
        ...groupDoc,
      };

      console.log('Group created successfully:', group.id);
      return group;
    } catch (error: any) {
      console.error('Error creating group:', error);
      if (error.code === 'firestore/permission-denied') {
        throw new Error('Permission denied. Please check Firestore security rules.');
      }
      throw new Error('Failed to create group');
    }
  }

  /**
   * Get groups where user is a member
   */
  async getUserGroups(userId: string): Promise<Group[]> {
    try {
      console.log('Getting groups for user:', userId);
      
      // Try the simple query first
      let snapshot;
      try {
        snapshot = await this._groupsCollection
          .where('isActive', '==', true)
          .get();
      } catch (indexError: any) {
        console.log('Retrying with simpler query...');
        // If even this fails, try without any where clause
        snapshot = await this._groupsCollection.get();
      }

      const groups: Group[] = [];
      snapshot.docs.forEach(doc => {
        const groupData = doc.data();
        // Check if group is active and user is a member
        const isActive = groupData.isActive !== false; // Default to true if undefined
        const isMember = groupData.members && groupData.members.some((member: GroupMember) => member.userId === userId);
        
        if (isActive && isMember) {
          groups.push({
            id: doc.id,
            ...groupData,
          } as Group);
        }
      });

      // Enrich groups with current member profile images
      const enrichedGroups = await Promise.all(
        groups.map(async (group) => {
          try {
            const enrichedMembers = await Promise.all(
              group.members.map(async (member) => {
                try {
                  const currentUser = await this.getUserById(member.userId);
                  if (currentUser) {
                    return {
                      ...member,
                      profileImage: currentUser.profileImageBase64 || currentUser.profileImage || member.profileImage,
                      name: currentUser.name || member.name, // Also update name in case it changed
                    };
                  }
                } catch (memberError) {
                  console.log(`Failed to enrich member ${member.userId}:`, memberError);
                }
                return member; // Return original member if enrichment fails
              })
            );
            
            return {
              ...group,
              members: enrichedMembers,
            };
          } catch (groupError) {
            console.log(`Failed to enrich group ${group.id}:`, groupError);
            return group; // Return original group if enrichment fails
          }
        })
      );

      // Sort by updatedAt on client side
      enrichedGroups.sort((a, b) => {
        const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return bTime - aTime;
      });

      console.log(`Found and enriched ${enrichedGroups.length} groups for user:`, userId);
      return enrichedGroups.filter(group => !group.isCompleted); // Only return active groups
    } catch (error: any) {
      console.error('Error getting user groups:', error);
      
      // Provide more specific error information
      if (error.code === 'firestore/permission-denied') {
        throw new Error('Permission denied: Please check Firebase security rules');
      } else if (error.code === 'firestore/failed-precondition') {
        throw new Error('Database index required. Please contact support.');
      }
      
      throw new Error('Failed to get user groups');
    }
  }

  /**
   * Get completed groups where user is a member
   */
  async getCompletedGroups(userId: string): Promise<Group[]> {
    try {
      console.log('Getting completed groups for user:', userId);
      
      // Try the simple query first
      let snapshot;
      try {
        snapshot = await this._groupsCollection
          .where('isActive', '==', true)
          .get();
      } catch (indexError: any) {
        console.log('Retrying with simpler query...');
        // If even this fails, try without any where clause
        snapshot = await this._groupsCollection.get();
      }

      const groups: Group[] = [];
      snapshot.docs.forEach(doc => {
        const groupData = doc.data();
        // Check if group is active, completed, and user is a member
        const isActive = groupData.isActive !== false; // Default to true if undefined
        const isCompleted = groupData.isCompleted === true;
        const isMember = groupData.members && groupData.members.some((member: GroupMember) => member.userId === userId);
        
        if (isActive && isCompleted && isMember) {
          groups.push({
            id: doc.id,
            ...groupData,
          } as Group);
        }
      });

      // Enrich groups with current member profile images
      const enrichedGroups = await Promise.all(
        groups.map(async (group) => {
          try {
            const enrichedMembers = await Promise.all(
              group.members.map(async (member) => {
                try {
                  const currentUser = await this.getUserById(member.userId);
                  if (currentUser) {
                    return {
                      ...member,
                      profileImage: currentUser.profileImageBase64 || currentUser.profileImage || member.profileImage,
                      name: currentUser.name || member.name, // Also update name in case it changed
                    };
                  }
                } catch (memberError) {
                  console.log(`Failed to enrich member ${member.userId}:`, memberError);
                }
                return member; // Return original member if enrichment fails
              })
            );
            
            return {
              ...group,
              members: enrichedMembers,
            };
          } catch (groupError) {
            console.log(`Failed to enrich group ${group.id}:`, groupError);
            return group; // Return original group if enrichment fails
          }
        })
      );

      // Sort by completedAt on client side (most recently completed first)
      enrichedGroups.sort((a, b) => {
        const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
        const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
        return bTime - aTime;
      });

      console.log(`Found and enriched ${enrichedGroups.length} completed groups for user:`, userId);
      return enrichedGroups;
    } catch (error: any) {
      console.error('Error getting completed groups:', error);
      
      // Provide more specific error information
      if (error.code === 'firestore/permission-denied') {
        throw new Error('Permission denied: Please check Firebase security rules');
      } else if (error.code === 'firestore/failed-precondition') {
        throw new Error('Database index required. Please contact support.');
      }
      
      throw new Error('Failed to get completed groups');
    }
  }

  /**
   * Get group by ID
   */
  async getGroupById(groupId: string): Promise<Group | null> {
    try {
      const groupDoc = await this._groupsCollection.doc(groupId).get();
      
      if (!groupDoc.exists) {
        return null;
      }

      const groupData = groupDoc.data();
      if (!groupData || !groupData.isActive) {
        return null;
      }

      const group = {
        id: groupDoc.id,
        ...groupData,
      } as Group;

      // Enrich group with current member profile images
      try {
        const enrichedMembers = await Promise.all(
          group.members.map(async (member) => {
            try {
              const currentUser = await this.getUserById(member.userId);
              if (currentUser) {
                return {
                  ...member,
                  profileImage: currentUser.profileImageBase64 || currentUser.profileImage || member.profileImage,
                  name: currentUser.name || member.name, // Also update name in case it changed
                };
              }
            } catch (memberError) {
              console.log(`Failed to enrich member ${member.userId}:`, memberError);
            }
            return member; // Return original member if enrichment fails
          })
        );
        
        return {
          ...group,
          members: enrichedMembers,
        };
      } catch (enrichError) {
        console.log(`Failed to enrich group ${groupId}:`, enrichError);
        return group; // Return original group if enrichment fails
      }
    } catch (error) {
      console.error('Error fetching group by ID:', error);
      throw new Error('Failed to fetch group data');
    }
  }

  /**
   * Update group details
   */
  async updateGroup(groupId: string, updateData: Partial<CreateGroup>): Promise<Group> {
    try {
      const updateTimestamp = new Date().toISOString();
      await this._groupsCollection.doc(groupId).update({
        ...updateData,
        updatedAt: updateTimestamp,
      });

      console.log('Group updated successfully:', groupId);

      // Return updated group
      const updatedGroup = await this.getGroupById(groupId);
      if (!updatedGroup) {
        throw new Error('Failed to fetch updated group');
      }

      return updatedGroup;
    } catch (error) {
      console.error('Error updating group:', error);
      throw new Error('Failed to update group');
    }
  }

  /**
   * Complete group - marks group as completed and prevents new expenses
   */
  async completeGroup(groupId: string, completedBy?: string): Promise<Group> {
    try {
      const completedTimestamp = new Date().toISOString();
      
      // Update group to completed status
      await this._groupsCollection.doc(groupId).update({
        isCompleted: true,
        completedAt: completedTimestamp,
        completedBy: completedBy || null,
        updatedAt: completedTimestamp,
      });

      console.log('Group completed successfully:', groupId);

      // Return updated group
      const completedGroup = await this.getGroupById(groupId);
      if (!completedGroup) {
        throw new Error('Failed to fetch completed group');
      }

      return completedGroup;
    } catch (error) {
      console.error('Error completing group:', error);
      throw new Error('Failed to complete group');
    }
  }

  /**
   * Add member to group
   */
  async addGroupMember(groupId: string, phoneNumber: string): Promise<Group> {
    try {
      const group = await this.getGroupById(groupId);
      if (!group) {
        throw new Error('Group not found');
      }

      const user = await this.getUserByPhone(phoneNumber);
      if (!user) {
        throw new Error('User not found');
      }

      // Check if user is already a member
      const existingMember = group.members.find(member => member.userId === user.id);
      if (existingMember) {
        throw new Error('User is already a member of this group');
      }

      const newMember: GroupMember = {
        userId: user.id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        joinedAt: new Date().toISOString(),
        role: 'member',
        profileImage: user.profileImageBase64 || user.profileImage,
      };

      const updatedMembers = [...group.members, newMember];
      
      await this._groupsCollection.doc(groupId).update({
        members: updatedMembers,
        updatedAt: new Date().toISOString(),
      });

      console.log('Member added to group successfully');
      
      // Return updated group
      const updatedGroup = await this.getGroupById(groupId);
      if (!updatedGroup) {
        throw new Error('Failed to fetch updated group');
      }

      return updatedGroup;
    } catch (error) {
      console.error('Error adding group member:', error);
      throw new Error('Failed to add member to group');
    }
  }

  /**
   * Remove member from group
   */
  async removeGroupMember(groupId: string, userId: string): Promise<Group> {
    try {
      const group = await this.getGroupById(groupId);
      if (!group) {
        throw new Error('Group not found');
      }

      // Cannot remove creator
      if (group.createdBy === userId) {
        throw new Error('Cannot remove group creator');
      }

      const updatedMembers = group.members.filter(member => member.userId !== userId);
      
      await this._groupsCollection.doc(groupId).update({
        members: updatedMembers,
        updatedAt: new Date().toISOString(),
      });

      console.log('Member removed from group successfully');
      
      // Return updated group
      const updatedGroup = await this.getGroupById(groupId);
      if (!updatedGroup) {
        throw new Error('Failed to fetch updated group');
      }

      return updatedGroup;
    } catch (error) {
      console.error('Error removing group member:', error);
      throw new Error('Failed to remove member from group');
    }
  }

  /**
   * Delete/deactivate group
   */
  async deleteGroup(groupId: string): Promise<void> {
    try {
      await this._groupsCollection.doc(groupId).update({
        isActive: false,
        updatedAt: new Date().toISOString(),
      });
      
      console.log('Group deactivated successfully:', groupId);
    } catch (error) {
      console.error('Error deactivating group:', error);
      throw new Error('Failed to deactivate group');
    }
  }

  // Expense Management Methods

  /**
   * Create a new expense in a group
   */
  async createGroupExpense(groupId: string, expenseData: Omit<GroupExpense, 'id'>): Promise<GroupExpense> {
    try {
      console.log('Creating expense for group:', groupId);
      
      // Verify group exists
      const group = await this.getGroupById(groupId);
      if (!group) {
        throw new Error('Group not found');
      }

      // Verify all participants are members of the group
      const groupMemberIds = group.members.map(m => m.userId);
      const invalidParticipants = expenseData.participants.filter(
        p => !groupMemberIds.includes(p.id)
      );
      
      if (invalidParticipants.length > 0) {
        throw new Error('Some participants are not members of this group');
      }

      // Create expense document
      const timestamp = new Date().toISOString();
      
      // Filter out undefined values to prevent Firebase errors
      const cleanExpenseData = Object.fromEntries(
        Object.entries(expenseData).filter(([_, value]) => value !== undefined)
      );
      
      const expenseDoc = {
        ...cleanExpenseData,
        updatedAt: timestamp,
      };

      // Store expense in group's subcollection
      const docRef = await this._groupsCollection
        .doc(groupId)
        .collection('expenses')
        .add(expenseDoc);
      
      // Update group's total expenses
      await this._groupsCollection.doc(groupId).update({
        totalExpenses: firestore.FieldValue.increment(expenseData.amount),
        updatedAt: timestamp,
      });

      const expense: GroupExpense = {
        id: docRef.id,
        ...expenseDoc,
      };

      console.log('Expense created successfully:', expense.id);
      return expense;
    } catch (error: any) {
      console.error('Error creating expense:', error);
      if (error.code === 'firestore/permission-denied') {
        throw new Error('Permission denied. Please check Firestore security rules.');
      }
      throw new Error(error.message || 'Failed to create expense');
    }
  }

  /**
   * Get all expenses for a group
   */
  async getGroupExpenses(groupId: string): Promise<GroupExpense[]> {
    try {
      console.log('Getting expenses for group:', groupId);
      
      if (!groupId) {
        console.error('No groupId provided');
        return [];
      }
      
      let snapshot;
      try {
        // Try with orderBy first
        snapshot = await this._groupsCollection
          .doc(groupId)
          .collection('expenses')
          .where('isActive', '==', true)
          .orderBy('createdAt', 'desc')
          .get();
      } catch (indexError: any) {
        console.log('OrderBy index not available, trying without orderBy...');
        // Fallback: try without orderBy
        try {
          snapshot = await this._groupsCollection
            .doc(groupId)
            .collection('expenses')
            .where('isActive', '==', true)
            .get();
        } catch (whereError: any) {
          console.log('Where clause failed, trying simple query...');
          // Final fallback: get all expenses and filter client-side
          snapshot = await this._groupsCollection
            .doc(groupId)
            .collection('expenses')
            .get();
        }
      }

      const expenses: GroupExpense[] = [];
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        // Filter out inactive expenses if we couldn't use where clause
        if (data.isActive !== false) {
          expenses.push({
            id: doc.id,
            ...data,
          } as GroupExpense);
        }
      });

      // Sort on client side if we couldn't use orderBy
      expenses.sort((a, b) => {
        const aTime = new Date(a.createdAt).getTime();
        const bTime = new Date(b.createdAt).getTime();
        return bTime - aTime; // desc order
      });

      console.log(`Found ${expenses.length} expenses for group:`, groupId);
      console.log('Expenses data:', expenses);
      return expenses;
    } catch (error: any) {
      console.error('Error getting group expenses:', error);
      console.error('Error details:', error.message, error.code);
      // Return empty array instead of throwing to prevent app crashes
      return [];
    }
  }

  /**
   * Update an expense
   */
  async updateExpense(groupId: string, expenseId: string, updateData: Partial<GroupExpense>): Promise<GroupExpense> {
    try {
      const updateTimestamp = new Date().toISOString();
      await this._groupsCollection
        .doc(groupId)
        .collection('expenses')
        .doc(expenseId)
        .update({
          ...updateData,
          updatedAt: updateTimestamp,
        });

      console.log('Expense updated successfully:', expenseId);

      // Return updated expense
      const expenseDoc = await this._groupsCollection
        .doc(groupId)
        .collection('expenses')
        .doc(expenseId)
        .get();

      if (!expenseDoc.exists) {
        throw new Error('Expense not found after update');
      }

      return {
        id: expenseDoc.id,
        ...expenseDoc.data(),
      } as GroupExpense;
    } catch (error) {
      console.error('Error updating expense:', error);
      throw new Error('Failed to update expense');
    }
  }

  /**
   * Delete/deactivate an expense
   */
  async deleteExpense(groupId: string, expenseId: string): Promise<void> {
    try {
      // Get expense data first to update group total
      const expenseDoc = await this._groupsCollection
        .doc(groupId)
        .collection('expenses')
        .doc(expenseId)
        .get();

      if (!expenseDoc.exists) {
        throw new Error('Expense not found');
      }

      const expenseData = expenseDoc.data() as GroupExpense;
      const timestamp = new Date().toISOString();

      // Deactivate expense
      await this._groupsCollection
        .doc(groupId)
        .collection('expenses')
        .doc(expenseId)
        .update({
          isActive: false,
          updatedAt: timestamp,
        });
      
      // Update group's total expenses
      await this._groupsCollection.doc(groupId).update({
        totalExpenses: firestore.FieldValue.increment(-expenseData.amount),
        updatedAt: timestamp,
      });

      console.log('Expense deactivated successfully:', expenseId);
    } catch (error) {
      console.error('Error deactivating expense:', error);
      throw new Error('Failed to deactivate expense');
    }
  }

  /**
   * Calculate balances for a group
   */
  async calculateGroupBalances(groupId: string): Promise<Map<string, Map<string, number>>> {
    try {
      const expenses = await this.getGroupExpenses(groupId);
      const balances = new Map<string, Map<string, number>>();

      // Initialize balances for all members
      const group = await this.getGroupById(groupId);
      if (!group) throw new Error('Group not found');

      group.members.forEach(member => {
        balances.set(member.userId, new Map());
      });

      // Process each expense
      expenses.forEach(expense => {
        const payerId = expense.paidBy.id;
        
        expense.participants.forEach(participant => {
          if (participant.id !== payerId) {
            // Participant owes payer
            const currentBalance = balances.get(participant.id)?.get(payerId) || 0;
            balances.get(participant.id)?.set(payerId, currentBalance + participant.amount);
          }
        });
      });

      return balances;
    } catch (error) {
      console.error('Error calculating balances:', error);
      throw new Error('Failed to calculate balances');
    }
  }

  // Settlement Management
  async createSettlement(settlement: Omit<Settlement, 'id'>): Promise<Settlement> {
    try {
      console.log('Creating settlement:', settlement);
      const timestamp = new Date().toISOString();
      const settlementData = {
        ...settlement,
        status: 'pending' as const,
        createdAt: timestamp,
        updatedAt: timestamp,
        paidAt: timestamp, // When user clicks "Settle", they're claiming they paid
      };

      const docRef = await this._groupsCollection
        .doc(settlement.groupId)
        .collection('settlements')
        .add(settlementData);

      const createdSettlement: Settlement = {
        ...settlementData,
        id: docRef.id,
      };

      console.log('Settlement created successfully:', docRef.id);
      return createdSettlement;
    } catch (error) {
      console.error('Error creating settlement:', error);
      throw new Error('Failed to create settlement');
    }
  }

  async getGroupSettlements(groupId: string): Promise<Settlement[]> {
    try {
      const snapshot = await this._groupsCollection
        .doc(groupId)
        .collection('settlements')
        .orderBy('createdAt', 'desc')
        .get();

      const settlements = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Settlement));

      return settlements;
    } catch (error) {
      console.error('Error fetching settlements:', error);
      throw new Error('Failed to fetch settlements');
    }
  }

  async confirmSettlement(groupId: string, settlementId: string): Promise<void> {
    try {
      const timestamp = new Date().toISOString();
      
      await this._groupsCollection
        .doc(groupId)
        .collection('settlements')
        .doc(settlementId)
        .update({
          status: 'paid',
          confirmedAt: timestamp,
          updatedAt: timestamp,
        });

      console.log('Settlement confirmed successfully:', settlementId);
    } catch (error) {
      console.error('Error confirming settlement:', error);
      throw new Error('Failed to confirm settlement');
    }
  }

  async getActiveSettlementsForUser(groupId: string, userId: string): Promise<Settlement[]> {
    try {
      // Get settlements where user needs to pay
      const payerSnapshot = await this._groupsCollection
        .doc(groupId)
        .collection('settlements')
        .where('fromUserId', '==', userId)
        .where('status', 'in', ['unpaid', 'pending'])
        .get();

      // Get settlements where user needs to confirm receipt
      const receiverSnapshot = await this._groupsCollection
        .doc(groupId)
        .collection('settlements')
        .where('toUserId', '==', userId)
        .where('status', '==', 'pending')
        .get();

      const settlements = [
        ...payerSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as Settlement)),
        ...receiverSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as Settlement)),
      ];

      return settlements;
    } catch (error) {
      console.error('Error fetching active settlements:', error);
      throw new Error('Failed to fetch active settlements');
    }
  }
}

export const firebaseService = new FirebaseService();