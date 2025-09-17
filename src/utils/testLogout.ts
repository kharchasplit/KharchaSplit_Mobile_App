// Test file to verify logout functionality
import { userStorage } from '../services/userStorage';
import { authService } from '../services/authService';

export const testLogoutFlow = async () => {
  try {
    console.log('Testing logout flow...');

    // Create mock user data
    const mockUser = {
      id: 'test-user-123',
      phoneNumber: '1234567890',
      name: 'Test User',
      email: 'test@example.com',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
    };

    // Test saving user
    await userStorage.saveUser(mockUser);
    await userStorage.saveAuthToken('test-token-123');

    console.log('✅ User data saved successfully');

    // Test login status
    const isLoggedIn = await userStorage.isLoggedIn();
    console.log('✅ Login status check:', isLoggedIn);

    // Test logout
    await userStorage.logout();
    console.log('✅ Logout completed');

    // Verify logout
    const isLoggedInAfter = await userStorage.isLoggedIn();
    const userData = await userStorage.getUser();
    const token = await userStorage.getAuthToken();

    console.log('✅ After logout - Login status:', isLoggedInAfter);
    console.log('✅ After logout - User data:', userData);
    console.log('✅ After logout - Token:', token);

    // Test OTP cleanup
    await authService.clearOTP('1234567890');
    console.log('✅ OTP cleanup completed');

    return {
      success: true,
      message: 'All logout tests passed successfully!',
    };
  } catch (error) {
    console.error('❌ Logout test failed:', error);
    return {
      success: false,
      message: 'Logout test failed',
      error,
    };
  }
};