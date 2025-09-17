import firestore from '@react-native-firebase/firestore';

export interface UserProfile {
  id: string;
  phoneNumber: string;
  name: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface CreateUserProfile {
  phoneNumber: string;
  name: string;
  email?: string;
}

class FirebaseService {
  private usersCollection = firestore().collection('users');

  async createUser(userData: CreateUserProfile): Promise<UserProfile> {
    try {
      const timestamp = new Date().toISOString();
      const userDoc = {
        ...userData,
        createdAt: timestamp,
        updatedAt: timestamp,
        isActive: true,
      };

      const docRef = await this.usersCollection.add(userDoc);
      
      const userProfile: UserProfile = {
        id: docRef.id,
        ...userDoc,
      };

      console.log('User created successfully:', userProfile.id);
      return userProfile;
    } catch (error) {
      console.error('Error creating user:', error);
      if (error.code === 'firestore/permission-denied') {
        throw new Error('Permission denied. Please check Firestore security rules.');
      }
      throw new Error('Failed to create user profile');
    }
  }

  async getUserByPhone(phoneNumber: string): Promise<UserProfile | null> {
    try {
      const querySnapshot = await this.usersCollection
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

  async updateUser(userId: string, updateData: Partial<CreateUserProfile>): Promise<void> {
    try {
      await this.usersCollection.doc(userId).update({
        ...updateData,
        updatedAt: new Date().toISOString(),
      });
      
      console.log('User updated successfully:', userId);
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('Failed to update user profile');
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      await this.usersCollection.doc(userId).update({
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
      const userDoc = await this.usersCollection.doc(userId).get();
      
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
}

export const firebaseService = new FirebaseService();