interface OTPResponse {
  result: boolean;
  phone_number: string;
  template_name: string;
  parameteres: Array<{
    name: string;
    value: string;
  }>;
  contact: {
    id: string;
    phone: string;
    firstName: string;
    fullName: string;
    contactStatus: string;
    created: string;
  };
  validWhatsAppNumber: boolean;
}

interface SendOTPRequest {
  template_name: string;
  broadcast_name: string;
  parameters: Array<{
    name: string;
    value: string;
  }>;
}

const API_BASE_URL = 'https://live-mt-server.wati.io/427966/api/v1';
const BEARER_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI2MDg0MDgwNS04OGMxLTRlNjAtYTdiNC05ODg2NzMwMzdmYWMiLCJ1bmlxdWVfbmFtZSI6InN1cHBvcnRAdmlkdXNoaWluZm90ZWNoLmNvbSIsIm5hbWVpZCI6InN1cHBvcnRAdmlkdXNoaWluZm90ZWNoLmNvbSIsImVtYWlsIjoic3VwcG9ydEB2aWR1c2hpaW5mb3RlY2guY29tIiwiYXV0aF90aW1lIjoiMDgvMzAvMjAyNSAxOToxMzozMiIsInRlbmFudF9pZCI6IjQyNzk2NiIsImRiX25hbWUiOiJtdC1wcm9kLVRlbmFudHMiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOiJBRE1JTklTVFJBVE9SIiwiZXhwIjoyNTM0MDIzMDA4MDAsImlzcyI6IkNsYXJlX0FJIiwiYXVkIjoiQ2xhcmVfQUkifQ.BQ3Sdr8qMearTjWD8CGyI2i2b-Zz-yKs8f01-AQDgak';

export const authService = {
  async sendOTP(phoneNumber: string): Promise<OTPResponse> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const requestBody: SendOTPRequest = {
      template_name: 'kharchasplit_login',
      broadcast_name: 'Test OTP',
      parameters: [
        {
          name: '1',
          value: otp,
        },
      ],
    };

    try {
      const response = await fetch(
        `${API_BASE_URL}/sendTemplateMessage?whatsappNumber=${phoneNumber}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${BEARER_TOKEN}`,
          },
          body: JSON.stringify(requestBody),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: OTPResponse = await response.json();

      // Store OTP locally for verification (in production, this should be server-side)
      await this.storeOTP(phoneNumber, otp);

      return result;
    } catch (error) {
      console.error('Error sending OTP:', error);
      throw error;
    }
  },

  async verifyOTP(phoneNumber: string, enteredOTP: string): Promise<boolean> {
    try {
      const storedOTP = await this.getStoredOTP(phoneNumber);
      return storedOTP === enteredOTP;
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return false;
    }
  },

  async storeOTP(phoneNumber: string, otp: string): Promise<void> {
    // In production, use secure storage
    const AsyncStorage =
      require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.setItem(`otp_${phoneNumber}`, otp);

    // Set expiry (5 minutes)
    const expiry = Date.now() + 5 * 60 * 1000;
    await AsyncStorage.setItem(`otp_expiry_${phoneNumber}`, expiry.toString());
  },

  async getStoredOTP(phoneNumber: string): Promise<string | null> {
    const AsyncStorage =
      require('@react-native-async-storage/async-storage').default;

    const expiry = await AsyncStorage.getItem(`otp_expiry_${phoneNumber}`);
    if (!expiry || Date.now() > parseInt(expiry)) {
      await this.clearOTP(phoneNumber);
      return null;
    }

    return await AsyncStorage.getItem(`otp_${phoneNumber}`);
  },

  async clearOTP(phoneNumber: string): Promise<void> {
    const AsyncStorage =
      require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.removeItem(`otp_${phoneNumber}`);
    await AsyncStorage.removeItem(`otp_expiry_${phoneNumber}`);
  },

  async checkUserExists(phoneNumber: string): Promise<boolean> {
    const { firebaseService } = await import('./firebaseService');
    return await firebaseService.checkUserExists(phoneNumber);
  },
};
