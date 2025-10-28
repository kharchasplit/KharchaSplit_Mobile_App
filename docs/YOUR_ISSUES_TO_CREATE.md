# Your Personalized Issues List - KharchaSplit

Based on deep analysis of your codebase, here are **specific bugs, tasks, and improvements** you should create as GitHub Issues.

---

## 🚨 CRITICAL PRIORITY - Fix Immediately

### 1. [BUG] Empty catch blocks silently swallowing errors (4 locations)

**Title**: `[BUG] Empty catch blocks causing silent failures in storage and Firebase operations`

**Description**:
Found 4 empty catch blocks that silently ignore errors, potentially causing data loss or confusing user experiences.

**Locations**:
1. `src/services/phoneStorage.ts:14-15` - saveLastPhoneNumber()
2. `src/services/phoneStorage.ts:36-37` - clearLastPhoneNumber()
3. `src/screens/LoginScreen.tsx:67-69` - loadLastUsedNumber()
4. `src/screens/GroupDetailScreen.tsx:239-240` - Settlement loading

**Steps to Reproduce**:
- Trigger any of these operations when AsyncStorage or Firebase fails
- Error is completely hidden from user and logs

**Expected**: Error should be logged and user notified
**Actual**: Silently fails with no indication

**Platform**: Both Android & iOS
**Severity**: High - Can cause data loss and difficult debugging

**Fix Required**:
Add proper error logging to all 4 locations:
```typescript
catch (error) {
  console.error('Error in [operation]:', error);
  // Optionally show user-friendly message
}
```

---

### 2. [BUG] OTP verification is simulated, not real (Security Issue)

**Title**: `[BUG] Account deletion OTP is simulated - accepts any 6-digit code`

**Description**:
The delete account screen simulates OTP sending with a 2-second timeout and accepts ANY 6-digit code without verification.

**Location**: `src/screens/DeleteAccount.tsx`
- Line 113: `setTimeout(resolve, 2000)` - simulates OTP send
- Line 150: Comment says "In a real app, you would verify the OTP"

**Security Risk**: Anyone can delete any account by entering any 6-digit number

**Platform**: Both
**Severity**: Critical - Security vulnerability

**Fix Required**:
1. Integrate real OTP service (Twilio, AWS SNS, Firebase Auth)
2. Send actual SMS to user's phone
3. Verify OTP on backend before allowing account deletion
4. Add rate limiting to prevent abuse

---

### 3. [TASK] Remove 40+ debug console.log statements from production code

**Title**: `[TASK] Clean up excessive debug console.log statements`

**Description**:
Found 40+ debug console.log statements throughout the codebase that expose sensitive data and clutter production logs.

**Affected Files**:
- `src/screens/AddMemberScreen.tsx` (26 statements)
- `src/screens/CreateNewGroupScreen.tsx` (5 statements)
- `src/services/firebaseService.ts` (10 statements)

**Issues**:
- Sensitive data exposure (phone numbers, user names, registration status)
- Performance impact from excessive logging
- Cluttered production logs

**Examples**:
- Line 422-431 in AddMemberScreen.tsx: Logs full user profile data
- Line 526-527 in firebaseService.ts: Logs phone numbers

**Task Type**: Code Refactoring
**Component**: Multiple
**Priority**: High
**Effort**: M (4-8 hours)

**Acceptance Criteria**:
- [ ] Remove all debug-only console.log statements
- [ ] Keep essential error/warning logs
- [ ] Consider implementing conditional logging (dev vs production)
- [ ] Add logging utility with log levels
- [ ] Test on both platforms

**Files to Modify**:
- src/screens/AddMemberScreen.tsx
- src/screens/CreateNewGroupScreen.tsx
- src/services/firebaseService.ts

---

## 🔥 HIGH PRIORITY - Should Fix Soon

### 4. [FEATURE] Implement real referral tracking system

**Title**: `[FEATURE] Replace referral fallback implementation with proper tracking`

**Description**:
Current referral system is a fallback implementation that doesn't actually track referrals.

**Current Issues** (`src/screens/ReferralSystemScreen.tsx`):
- Uses fallback approach (lines 50-51)
- No dedicated Firebase referrals collection
- Queries users collection instead
- All referrals hardcoded as "completed" (line 94)
- No real referral tracking or rewards

**Proposed Solution**:
1. Create dedicated `referrals` collection in Firebase
2. Track referral status (pending/completed/failed)
3. Implement referral rewards system
4. Add analytics for referral performance
5. Proper referral code generation and validation

**Why**: Referral programs are key for growth but current implementation is non-functional

**Priority**: High
**Category**: Expense Management / User Growth
**Effort**: L (1-3 days)

---

### 5. [TASK] Implement real push notification Cloud Function

**Title**: `[TASK] Replace notification queue placeholder with working Cloud Function`

**Description**:
Notification service is a placeholder that queues notifications but never sends them.

**Location**: `src/services/notificationService.ts`
- Line 151: Comment says "This is a placeholder"
- Lines 156-162: Only stores in `notificationQueue` collection
- No actual push notifications sent

**Task Type**: New Feature Implementation
**Component**: Notifications
**Priority**: High
**Effort**: XL (More than 3 days)

**Acceptance Criteria**:
- [ ] Implement Firebase Cloud Function to process notification queue
- [ ] Integrate FCM HTTP API for push notifications
- [ ] Add notification delivery verification
- [ ] Implement retry logic for failed sends
- [ ] Add notification templates
- [ ] Support notification types (expense, settlement, group invite)
- [ ] Test on both Android and iOS
- [ ] Handle notification permissions properly

**Technical Details**:
- Use Firebase Cloud Functions (Node.js)
- Integrate with existing FCMService.ts
- Use template from firebase_functions_template.js
- Add error handling and logging

**Related**: Future Scope - Push Notifications from README

---

### 6. [BUG] Currency preference selection has no effect

**Title**: `[BUG] Currency preference not saved or applied anywhere in app`

**Description**:
Users can select currency preference (INR/USD) but selection is never saved or used.

**Location**: `src/screens/CurrencyPreference.tsx`
- Lines 32-37: Only updates local state
- No persistence to Firebase or AsyncStorage
- App hardcodes INR everywhere
- Selection lost on screen navigation

**Steps to Reproduce**:
1. Go to Settings → Currency Preference
2. Select USD
3. Navigate away and come back
4. Currency resets to INR

**Expected**: Selected currency should persist and apply throughout app
**Actual**: Selection is ignored

**Platform**: Both
**Severity**: Medium - Feature doesn't work

**Fix Required**:
1. Save currency preference to user profile in Firebase
2. Load preference on app start
3. Apply selected currency throughout app
4. Consider multi-currency support for expenses
5. Add currency conversion if needed

---

### 7. [BUG] Device permissions screen does nothing

**Title**: `[BUG] Device permission toggles don't request actual permissions`

**Description**:
The Device Permission screen has toggles for Camera, Photos, Location, and Notifications but they only update UI state without requesting actual permissions.

**Location**: `src/screens/DevicePermission.tsx`
- Lines 36-41: toggleSwitch only updates local state
- No integration with react-native-permissions
- Existing permission helpers not used
- All permissions hardcoded as disabled

**Steps to Reproduce**:
1. Go to Settings → Device Permissions
2. Toggle any permission on
3. Try to use that feature (e.g., upload photo)
4. Permission prompt still appears

**Expected**: Toggling should request/manage system permissions
**Actual**: Only updates UI state, no actual permission handling

**Platform**: Both
**Severity**: Medium

**Fix Required**:
1. Integrate with react-native-permissions library
2. Use existing helpers (PhotoLibraryPermissionHelper, NotificationPermissionHelper)
3. Request actual system permissions on toggle
4. Show current permission status from system
5. Link to system settings if permission denied

---

## ⚠️ MEDIUM PRIORITY - Should Improve

### 8. [TASK] Expand FAQ content

**Title**: `[TASK] Add comprehensive FAQ content or load from backend`

**Description**:
FAQ screen only has 3 hardcoded questions with minimal answers.

**Location**: `src/screens/FAQs.tsx` (lines 37-61)

**Current State**: Only 3 Q&A items

**Proposed Improvements**:
- Add 20-30 comprehensive FAQs
- Organize by category (Groups, Expenses, Settlements, Account)
- Load from Firebase/backend for easy updates
- Add search functionality
- Add "Was this helpful?" feedback

**Task Type**: Documentation + Feature
**Priority**: Medium
**Effort**: M (4-8 hours)

---

### 9. [TASK] Create proper bug reporting system

**Title**: `[TASK] Replace email-based bug reporting with in-app system`

**Description**:
Current bug reporting only opens email client with pre-filled template.

**Location**: `src/screens/Reportaproblem.tsx` (lines 23-26)

**Proposed Solution**:
1. In-app bug report form
2. Automatic device info collection
3. Screenshot/video attachment capability
4. Crash log collection
5. Bug tracking system (Firebase or external)
6. Status updates for reported bugs

**Task Type**: New Feature Implementation
**Component**: Settings
**Priority**: Medium
**Effort**: L (1-3 days)

**Benefits**:
- Better user experience
- More bug reports collected
- Easier to track and respond
- Automatic context capture

---

### 10. [TASK] Improve error Alert messages with specific error types

**Title**: `[TASK] Add error type differentiation to Alert.alert() messages`

**Description**:
Many error messages are generic "Failed to..." without distinguishing error types.

**Example**: `src/screens/CreateNewGroupScreen.tsx:591` - Generic error doesn't distinguish network, permission, or validation errors

**Proposed Solution**:
1. Categorize errors (Network, Validation, Permission, Server, Unknown)
2. Show specific error messages based on type
3. Add helpful actions (Retry, Check Network, etc.)
4. Consider toast notifications for non-critical errors

**Task Type**: Code Refactoring
**Component**: UI Components
**Priority**: Medium
**Effort**: M (4-8 hours)

**Acceptance Criteria**:
- [ ] Audit all Alert.alert() calls
- [ ] Implement error type detection
- [ ] Add specific error messages
- [ ] Add actionable error recovery options
- [ ] Test all error scenarios

---

### 11. [DOCS] Add Terms & Conditions content

**Title**: `[TASK] Write and add Terms & Conditions content`

**Location**: `src/screens/TermsAndConditions.tsx`

**Current State**: Screen exists but likely has placeholder content

**Task Type**: Documentation
**Priority**: Medium
**Effort**: S (1-4 hours)

**Acceptance Criteria**:
- [ ] Write complete Terms & Conditions
- [ ] Cover user responsibilities
- [ ] Cover data usage
- [ ] Cover liability limitations
- [ ] Get legal review if needed
- [ ] Add to screen with proper formatting

---

### 12. [DOCS] Add Privacy Policy content

**Title**: `[TASK] Write and add Privacy Policy content`

**Location**: `src/screens/PrivacyPolicy.tsx`

**Current State**: Screen exists but likely has placeholder content

**Task Type**: Documentation
**Priority**: Medium (Required for app store submission)
**Effort**: S (1-4 hours)

**Acceptance Criteria**:
- [ ] Write complete Privacy Policy
- [ ] Detail data collection practices
- [ ] Explain data usage
- [ ] Cover Firebase data handling
- [ ] Address user rights (GDPR, CCPA)
- [ ] Get legal review if needed
- [ ] Add to screen with proper formatting

---

### 13. [TASK] Enhance support system

**Title**: `[FEATURE] Implement in-app support system beyond email`

**Description**:
Contact support currently only provides email link.

**Location**: `src/screens/ContactSupport.tsx` (lines 40-54)

**Proposed Enhancements**:
1. In-app support ticket system
2. Support chat integration (Intercom, Zendesk)
3. Help articles / Knowledge Base
4. Support form with issue type selection
5. FAQ integration
6. Response time expectations

**Task Type**: New Feature Implementation
**Priority**: Medium
**Effort**: L (1-3 days)

---

### 14. [TASK] Enhance app version screen

**Title**: `[TASK] Add release notes and build info to App Version screen`

**Description**:
App Version screen only shows version number "1.0.1".

**Location**: `src/screens/AppVersion.tsx` (line 35)

**Issues**:
- Unused StyleSheet definitions (lines 77-112)
- No release notes
- No build date or number

**Proposed Additions**:
1. Release notes / changelog
2. Build number
3. Build date
4. "What's new" section
5. Link to full changelog
6. Check for updates button

**Task Type**: UI/UX Improvement
**Priority**: Low
**Effort**: S (1-4 hours)

---

## 🧹 LOW PRIORITY - Code Quality

### 15. [TASK] Remove commented-out code

**Title**: `[TASK] Clean up commented code in HomeScreen.tsx`

**Location**: `src/screens/HomeScreen.tsx` (lines 138-139)

**Issue**: Old theme context code left as comments

**Task Type**: Code Refactoring
**Priority**: Low
**Effort**: XS (Less than 1 hour)

**Acceptance Criteria**:
- [ ] Remove commented code from HomeScreen
- [ ] Search for other commented code blocks
- [ ] Remove all commented code or document why it's kept

---

### 16. [TASK] Clean up verbose error logging

**Title**: `[TASK] Audit and clean up console.error() usage`

**Description**:
100+ console.error() calls, some for expected conditions rather than actual errors.

**Examples**:
- `src/services/firebaseService.ts:1355` - Logs "No groupId provided" as error (should be validation)
- `src/services/firebaseService.ts:1172` - "User not found" is business logic, not error
- `src/services/firebaseService.ts:1407` - Logs same error twice

**Task Type**: Code Refactoring
**Priority**: Low
**Effort**: M (4-8 hours)

**Proposed Solution**:
1. Distinguish between errors and expected conditions
2. Use console.warn() for expected warnings
3. Use console.log() for normal business logic
4. Keep console.error() only for actual errors
5. Remove duplicate error logs

---

### 17. [TASK] Remove unused StyleSheet in AppVersion screen

**Title**: `[TASK] Remove unused styles from AppVersion.tsx`

**Location**: `src/screens/AppVersion.tsx` (lines 77-112)

**Issue**: Defines `option`, `optionLeft`, `optionTitle`, `currencyLogo` styles that are never used

**Task Type**: Code Cleanup
**Priority**: Low
**Effort**: XS (Less than 1 hour)

---

## 📊 SUMMARY BY PRIORITY

| Priority | Count | Issues |
|----------|-------|--------|
| **Critical** | 3 | Empty catch blocks, OTP security, Debug logs |
| **High** | 4 | Referral tracking, Push notifications, Currency preference, Device permissions |
| **Medium** | 7 | FAQ content, Bug reporting, Error messages, Terms, Privacy, Support, App version |
| **Low** | 3 | Commented code, Verbose logging, Unused styles |
| **TOTAL** | **17** | **Issues to create** |

---

## 🚀 QUICK START GUIDE

### How to Create These Issues:

1. **Go to**: https://github.com/kharchasplit/KharchaSplit_Mobile_App/issues/new/choose

2. **For Critical/High Priority**:
   - Use **"Bug Report"** template for issues #1, 2, 6, 7
   - Use **"Development Task"** template for issues #3, 4, 5

3. **For Medium/Low Priority**:
   - Use **"Development Task"** template for most
   - Use **"Feature Request"** template for #9, 13

4. **Copy the content** from above for each issue:
   - Title → Use the [TYPE] Title format
   - Description → Copy the full description
   - Add appropriate labels and priority
   - Assign to yourself if you'll work on it

5. **Start with Critical Priority** issues first!

---

## 📝 RECOMMENDED ORDER

**Week 1 - Critical Fixes**:
1. Issue #1: Fix empty catch blocks (2 hours)
2. Issue #3: Remove debug console.logs (4 hours)
3. Issue #2: Plan OTP service integration (research)

**Week 2 - High Priority Features**:
4. Issue #6: Implement currency preference (1 day)
5. Issue #7: Fix device permissions (1 day)
6. Issue #5: Implement push notifications (3+ days)

**Week 3 - Medium Priority**:
7. Issue #8: Expand FAQ content (4 hours)
8. Issue #11 & #12: Add Terms & Privacy (1 day)
9. Issue #10: Improve error messages (4 hours)

**Ongoing**:
- Issue #4: Referral system (large project)
- Issue #9: Bug reporting system
- Low priority cleanup tasks

---

## ✅ NEXT STEPS

1. **Review this list** and prioritize based on your roadmap
2. **Create issues** starting with Critical priority
3. **Assign yourself** to issues you'll work on
4. **Add to milestones** for release planning
5. **Start fixing!** Begin with empty catch blocks
6. **Close issues** as you complete them

---

**Generated**: 2025-10-28
**Based on**: Deep codebase analysis of KharchaSplit Mobile App
**Total Issues Identified**: 17 (3 Critical, 4 High, 7 Medium, 3 Low)

Good luck! 🚀
