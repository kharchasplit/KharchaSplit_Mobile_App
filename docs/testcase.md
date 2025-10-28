# KharchaSplit - Test Cases & User Guide

## 📱 App Overview
KharchaSplit is a React Native expense splitting application that allows users to create groups, add expenses, track balances, and settle debts with friends and family.

### Tech Stack
- **Frontend**: React Native with TypeScript
- **Backend**: Firebase Firestore
- **Authentication**: Firebase Auth + OTP Verification
- **Push Notifications**: Firebase Cloud Messaging (FCM)
- **State Management**: React Context API

---

## 🚀 Getting Started

### Prerequisites
- Node.js installed
- React Native development environment setup
- Android/iOS simulator or physical device
- Firebase project configured

### Installation & Setup
```bash
# Install dependencies
npm install

# For iOS (if testing on iOS)
cd ios && pod install && cd ..

# Start Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

---

## 🔐 Authentication Flow Test Cases

### Test Case 1: Phone Number Login
**Objective**: Verify phone number authentication works correctly

**Steps**:
1. Open the app
2. Enter a valid phone number (Indian format: +91XXXXXXXXXX)
3. Tap "Send OTP"
4. Check WhatsApp for OTP message
5. Enter the 6-digit OTP
6. Verify successful login

**Expected Results**:
- OTP sent successfully to WhatsApp
- OTP verification works correctly
- User is navigated to Home screen
- FCM token is registered for notifications

**Edge Cases to Test**:
- Invalid phone number format
- Wrong OTP entry (should show error with shake animation)
- OTP paste functionality (copy OTP from WhatsApp and paste)
- Resend OTP after 60 seconds
- Auto-fill OTP support (iOS/Android)

### Test Case 2: Profile Setup (New Users)
**Objective**: Verify new user profile creation

**Steps**:
1. Complete phone verification for new number
2. App should navigate to Profile Setup screen
3. Enter name, email (optional)
4. Upload profile picture (optional)
5. Complete setup

**Expected Results**:
- Profile data saved to Firebase
- User navigated to Home screen
- Profile information visible in Profile tab

---

## 🏠 Home Screen Test Cases

### Test Case 3: Skeleton Loader & Data Loading
**Objective**: Verify skeleton loaders and data loading work properly

**Steps**:
1. Open Home screen (fresh app launch)
2. Observe skeleton loader animation
3. Wait for data to load
4. Verify smooth fade-in transition

**Expected Results**:
- Skeleton loader shows for minimum 1 second
- Shimmer animation works smoothly
- Data loads and fades in smoothly
- No jarring transitions

### Test Case 4: Group Management
**Objective**: Test group creation and management

**Steps**:
1. Tap "+" button to create new group
2. Enter group name and description
3. Add cover image (optional)
4. Add members by phone number
5. Save group
6. Verify group appears on Home screen

**Expected Results**:
- Group created successfully in Firebase
- Group visible on Home screen
- Member invitations sent via Firebase
- Cover image uploaded and displayed

---

## 👥 Group Detail Screen Test Cases

### Test Case 5: Tab Navigation & Skeleton Loaders
**Objective**: Verify all tabs work with proper skeleton loading

**Steps**:
1. Open any group from Home screen
2. Test each tab: Expenses, Balances, Settlement
3. Verify skeleton loaders appear during data loading
4. Check data display after loading

**Expected Results**:
- All tabs load correctly
- Skeleton loaders match actual content layout
- Data displays properly after loading
- Tab switching works smoothly

**Tabs to Test**:
- **Expenses Tab**: Shows expense skeleton → expense list
- **Balances Tab**: Shows balance skeleton → user balances
- **Settlement Tab**: Shows settlement skeleton → settlement suggestions

### Test Case 6: Add Expense Functionality
**Objective**: Test expense creation with different split types

**Steps**:
1. Go to Expenses tab in any group
2. Tap "+" button to add expense
3. Fill expense details:
   - Description
   - Amount
   - Category selection
   - Receipt image (optional)
   - Notes (optional)
4. Select participants
5. Choose split type:
   - Equal split
   - Unequal split
   - Percentage split
   - Shares split
6. Save expense

**Expected Results**:
- Expense saved to Firebase
- Real-time balance calculations
- Receipt uploaded as base64
- All participants see the expense
- Balances updated correctly

### Test Case 7: Settlement System (2-Way Confirmation)
**Objective**: Test the 2-step settlement process

**Steps**:
1. Go to Settlement tab
2. Find a settlement suggestion
3. **Step 1** (Payer): Tap "Settle" button
4. Verify status changes to "Pending"
5. **Step 2** (Receiver): Open same group, tap "Confirm"
6. Verify status changes to "Paid"

**Expected Results**:
- Settlement marked as "pending" after step 1
- Firebase updated with settlement record
- Receiver sees "Confirm" button
- Settlement marked as "paid" after confirmation
- Both users see updated status

---

## 📱 Activity Screen Test Cases

### Test Case 8: Activity Feed & Skeleton Loading
**Objective**: Verify activity tracking and loading

**Steps**:
1. Navigate to Activity tab
2. Observe skeleton loader
3. Verify activities load correctly
4. Test swipe-to-delete functionality

**Expected Results**:
- Skeleton loader shows activity-like items
- Real activities load with proper icons and details
- Swipe gestures work for deleting activities
- Activities are sorted by most recent first

---

## 🔧 Technical Test Cases

### Test Case 9: Offline Behavior
**Objective**: Test app behavior without internet

**Steps**:
1. Disable internet connection
2. Try various operations
3. Verify error handling
4. Re-enable internet and test sync

**Expected Results**:
- Graceful error messages
- No app crashes
- Data syncs when connection restored

### Test Case 10: Push Notifications
**Objective**: Verify FCM notifications work

**Test Scenarios**:
1. Expense added to group → All members get notification
2. Settlement request → Receiver gets notification
3. Settlement confirmation → Payer gets notification
4. New member added → All members get notification

**Expected Results**:
- Notifications delivered reliably
- Proper notification content
- Deep linking works (tap notification opens relevant screen)

### Test Case 11: Performance & Memory
**Objective**: Check app performance

**Steps**:
1. Use app for extended period
2. Create multiple groups and expenses
3. Navigate between screens frequently
4. Monitor memory usage and performance

**Expected Results**:
- Smooth animations (60fps)
- No memory leaks
- Fast screen transitions
- Skeleton loaders improve perceived performance

---

## 🐛 Edge Cases & Error Handling

### Test Case 12: Network Error Scenarios
**Test Cases**:
- Slow internet connection
- Intermittent connectivity
- Firebase service unavailable
- Image upload failures

### Test Case 13: Data Validation
**Test Cases**:
- Invalid phone numbers
- Empty expense amounts
- Special characters in names
- Large image files
- Very long group names/descriptions

### Test Case 14: Multi-User Scenarios
**Test Cases**:
- Same user on multiple devices
- Concurrent expense additions
- Group member management conflicts
- Settlement race conditions

---

## 📊 Responsive Design Testing

### Test Case 15: Different Screen Sizes
**Devices to Test**:
- Small screens (iPhone SE, smaller Android phones)
- Medium screens (iPhone 12, standard Android phones)
- Large screens (iPhone 12 Pro Max, Android tablets)
- Different aspect ratios

**Expected Results**:
- All UI elements scale properly
- Text remains readable
- Buttons are easily tappable
- Images maintain aspect ratios
- Skeleton loaders match layouts

---

## ✅ Acceptance Criteria Checklist

### Core Functionality
- [ ] Phone authentication works
- [ ] OTP verification with paste support
- [ ] Profile setup for new users
- [ ] Group creation and management
- [ ] Expense creation with all split types
- [ ] Real-time balance calculations
- [ ] 2-way settlement confirmation
- [ ] Activity feed with proper filtering

### UI/UX Requirements
- [ ] Skeleton loaders on all dynamic data screens
- [ ] Smooth animations and transitions
- [ ] Responsive design on all screen sizes
- [ ] Proper error messages and loading states
- [ ] Intuitive navigation flow
- [ ] Professional visual design

### Performance Requirements
- [ ] App loads within 3 seconds
- [ ] Skeleton loaders show within 100ms
- [ ] Smooth scrolling in all lists
- [ ] Images load and display properly
- [ ] No memory leaks or crashes
- [ ] Proper offline behavior

### Technical Requirements
- [ ] Firebase integration working
- [ ] Push notifications functional
- [ ] Data persistence across app restarts
- [ ] Proper error handling
- [ ] Clean console (no errors/warnings)
- [ ] TypeScript compilation without errors

---

## 🚨 Critical Bugs to Report

### Priority 1 (Blocking)
- App crashes or becomes unresponsive
- Authentication failures
- Data loss or corruption
- Firebase connection issues

### Priority 2 (High)
- Incorrect balance calculations
- Settlement system not working
- Push notifications not delivered
- Major UI layout issues

### Priority 3 (Medium)
- Skeleton loader issues
- Minor UI inconsistencies
- Performance degradation
- Non-critical error messages

---

## 📝 Bug Reporting Format

When reporting bugs, please include:

```
**Bug Title**: Brief description
**Severity**: Critical/High/Medium/Low
**Device**: iPhone 12 Pro / Samsung Galaxy S21, etc.
**OS Version**: iOS 15.1 / Android 11
**App Version**: v1.0.0
**Steps to Reproduce**:
1. Step 1
2. Step 2
3. Step 3
**Expected Result**: What should happen
**Actual Result**: What actually happened
**Screenshots/Videos**: If applicable
**Console Logs**: If available
```

---

## 📞 Support & Contact

For any questions or issues during testing:
- **Developer**: [Your Contact Information]
- **Project Repository**: [GitHub/GitLab Link]
- **Firebase Console**: [Access if needed]

---

## 🎯 Testing Priorities

### Phase 1 (Core Features) - Day 1-2
1. Authentication flow
2. Basic group and expense creation
3. Home screen functionality
4. Skeleton loaders

### Phase 2 (Advanced Features) - Day 3-4
1. Settlement system
2. Activity feed
3. Push notifications
4. Multi-user scenarios

### Phase 3 (Polish & Performance) - Day 5
1. Edge cases and error handling
2. Performance testing
3. UI/UX refinements
4. Final acceptance testing

---

**Happy Testing! 🧪**

*Remember: The goal is to ensure a smooth, professional user experience with reliable functionality.*