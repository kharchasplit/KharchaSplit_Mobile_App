import AsyncStorage from '@react-native-async-storage/async-storage';

interface CachedContact {
  phoneNumber: string;
  isRegistered: boolean;
  userProfile?: any;
  timestamp: number;
}

interface ContactsCache {
  [phoneNumber: string]: CachedContact;
}

const CACHE_KEY = '@contacts_cache';
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

class ContactsCacheService {
  private memoryCache: ContactsCache = {};
  private isInitialized = false;

  /**
   * Initialize cache from AsyncStorage
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        this.memoryCache = JSON.parse(cached);
        // Clean expired entries
        this.cleanExpired();
      }
      this.isInitialized = true;
    } catch (error) {
      console.error('[ContactsCache] Init error:', error);
      this.memoryCache = {};
      this.isInitialized = true;
    }
  }

  /**
   * Normalize phone number to 10-digit format
   */
  private normalizePhone(phoneNumber: string): string {
    const cleaned = phoneNumber.replace(/\D/g, '');

    // Remove country code
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      return cleaned.substring(2);
    }
    if (cleaned.startsWith('0') && cleaned.length === 11) {
      return cleaned.substring(1);
    }

    return cleaned;
  }

  /**
   * Get cached contact info
   */
  get(phoneNumber: string): CachedContact | null {
    const normalized = this.normalizePhone(phoneNumber);
    const cached = this.memoryCache[normalized];

    if (!cached) return null;

    // Check if expired
    if (Date.now() - cached.timestamp > CACHE_DURATION) {
      delete this.memoryCache[normalized];
      return null;
    }

    return cached;
  }

  /**
   * Get multiple cached contacts
   */
  getMultiple(phoneNumbers: string[]): Map<string, CachedContact> {
    const result = new Map<string, CachedContact>();

    for (const phone of phoneNumbers) {
      const cached = this.get(phone);
      if (cached) {
        result.set(this.normalizePhone(phone), cached);
      }
    }

    return result;
  }

  /**
   * Set cached contact info
   */
  async set(phoneNumber: string, isRegistered: boolean, userProfile?: any): Promise<void> {
    const normalized = this.normalizePhone(phoneNumber);

    this.memoryCache[normalized] = {
      phoneNumber: normalized,
      isRegistered,
      userProfile,
      timestamp: Date.now(),
    };

    // Debounced save to AsyncStorage (don't await to avoid blocking)
    this.saveToStorage();
  }

  /**
   * Set multiple contacts at once
   */
  async setMultiple(contacts: Array<{ phoneNumber: string; isRegistered: boolean; userProfile?: any }>): Promise<void> {
    for (const contact of contacts) {
      const normalized = this.normalizePhone(contact.phoneNumber);
      this.memoryCache[normalized] = {
        phoneNumber: normalized,
        isRegistered: contact.isRegistered,
        userProfile: contact.userProfile,
        timestamp: Date.now(),
      };
    }

    await this.saveToStorage();
  }

  /**
   * Clean expired entries
   */
  private cleanExpired(): void {
    const now = Date.now();
    let cleaned = false;

    for (const [key, value] of Object.entries(this.memoryCache)) {
      if (now - value.timestamp > CACHE_DURATION) {
        delete this.memoryCache[key];
        cleaned = true;
      }
    }

    if (cleaned) {
      this.saveToStorage();
    }
  }

  /**
   * Save cache to AsyncStorage
   */
  private saveTimer: NodeJS.Timeout | null = null;
  private saveToStorage(): void {
    // Debounce saves
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }

    this.saveTimer = setTimeout(async () => {
      try {
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(this.memoryCache));
      } catch (error) {
        console.error('[ContactsCache] Save error:', error);
      }
    }, 1000);
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    this.memoryCache = {};
    try {
      await AsyncStorage.removeItem(CACHE_KEY);
    } catch (error) {
      console.error('[ContactsCache] Clear error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { total: number; registered: number; unregistered: number } {
    const total = Object.keys(this.memoryCache).length;
    let registered = 0;
    let unregistered = 0;

    for (const cached of Object.values(this.memoryCache)) {
      if (cached.isRegistered) {
        registered++;
      } else {
        unregistered++;
      }
    }

    return { total, registered, unregistered };
  }
}

export const contactsCacheService = new ContactsCacheService();
