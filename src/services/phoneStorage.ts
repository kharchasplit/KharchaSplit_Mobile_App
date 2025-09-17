import AsyncStorage from '@react-native-async-storage/async-storage';

const PHONE_NUMBER_KEY = 'lastUsedPhoneNumber';

export class PhoneStorage {
  /**
   * Save the last successfully used phone number
   */
  static async saveLastPhoneNumber(phoneNumber: string): Promise<void> {
    try {
      if (phoneNumber && phoneNumber.length === 10) {
        await AsyncStorage.setItem(PHONE_NUMBER_KEY, phoneNumber);
      }
    } catch (error) {
      console.log('Failed to save phone number:', error);
    }
  }

  /**
   * Get the last successfully used phone number
   */
  static async getLastPhoneNumber(): Promise<string | null> {
    try {
      const phoneNumber = await AsyncStorage.getItem(PHONE_NUMBER_KEY);
      return phoneNumber;
    } catch (error) {
      console.log('Failed to get last phone number:', error);
      return null;
    }
  }

  /**
   * Clear saved phone number
   */
  static async clearLastPhoneNumber(): Promise<void> {
    try {
      await AsyncStorage.removeItem(PHONE_NUMBER_KEY);
    } catch (error) {
      console.log('Failed to clear phone number:', error);
    }
  }

  /**
   * Get common Indian phone number suggestions
   * This is just for UX improvement
   */
  static getCommonPrefixes(): string[] {
    return [
      '98', '97', '96', '95', '94', '93', '92', '91', '90',
      '89', '88', '87', '86', '85', '84', '83', '82', '81', '80',
      '79', '78', '77', '76', '75', '74', '73', '72', '70'
    ];
  }
}