# Suggested GitHub Issues for Current Development

This document lists suggested issues to create on GitHub based on the project's current state and future scope.

## 🚀 Priority: High - Planned Features

### 1. Push Notifications System
```
Title: [TASK] Implement push notifications for expense and settlement updates
Type: Development Task
Component: Notifications
Priority: High
Effort: XL (More than 3 days)

Description:
Implement Firebase Cloud Messaging (FCM) based push notification system for real-time updates.

Acceptance Criteria:
- [ ] Notifications when new expense is added to group
- [ ] Notifications when settlement payment is marked pending
- [ ] Notifications when settlement is confirmed
- [ ] Notifications for group invitations
- [ ] User preference settings for notification types
- [ ] Background notification handling
- [ ] Notification action buttons (Quick reply, View, etc.)
- [ ] Tested on both iOS and Android

Technical Details:
- Use existing FCMService.ts
- Update firebase_functions_template.js for cloud functions
- Add notification preferences in ProfileScreen
- Implement notification listeners in App.tsx

Related: Future Scope from README.md
```

### 2. In-App Payment Integration
```
Title: [FEATURE] Add in-app payment integration for settlements
Type: Feature Request
Category: Payments & Settlements
Priority: High

Description:
Allow users to settle balances directly within the app using popular payment methods (UPI, Card, etc.)

Problem Statement:
Currently, users must use external payment apps and manually mark settlements. This creates friction and delays in settlement confirmation.

Proposed Solution:
Integrate with payment gateways (Razorpay/Stripe) to enable:
- One-tap settlement payments
- Automatic settlement confirmation after payment
- Payment history tracking
- Transaction receipts

Alternative Solutions:
- Deep link to UPI apps with pre-filled amount
- Payment request links

Related: Future Scope - In-App Payments
```

### 3. Receipt OCR Scanning
```
Title: [FEATURE] Implement OCR scanning for automatic expense detection
Type: Feature Request
Category: Expense Management
Priority: Medium

Description:
Automatically extract expense details (amount, date, merchant) from receipt images using OCR

Problem Statement:
Users have to manually type all expense details even when they have a receipt image

Proposed Solution:
- Use ML Kit or Google Vision API for OCR
- Extract: Amount, Date, Merchant Name, Category (smart detection)
- Pre-fill Add Expense form with extracted data
- Allow user to review and edit before saving
- Show confidence scores for extracted fields

Technical Details:
- React Native ML Kit integration
- Image preprocessing for better OCR accuracy
- Fallback to manual entry if OCR fails

Related: Future Scope - Receipt Scanning (OCR)
```

## 📊 Priority: Medium - Analytics & Reporting

### 4. Advanced Expense Reports
```
Title: [FEATURE] Add expense export and advanced reporting
Type: Feature Request
Category: Analytics & Reports
Priority: Medium

Description:
Export expense data to CSV/PDF and provide detailed analytics

Features:
- Export group expenses to CSV
- Generate PDF expense reports
- Monthly/Yearly expense summaries
- Category-wise spending breakdown
- Visual charts and graphs
- Customizable date ranges

Use Cases:
- Tax filing
- Expense reimbursement
- Business accounting
- Personal finance tracking

Related: Future Scope - Advanced Reporting
```

### 5. Expense Analytics Dashboard
```
Title: [FEATURE] Create expense analytics and insights dashboard
Type: Feature Request
Category: Analytics & Reports
Priority: Medium

Description:
Provide visual analytics and AI-assisted spending insights

Features:
- Spending trends over time
- Category-wise breakdown (pie charts)
- Group comparison analytics
- Budget vs. actual spending
- Spending patterns and predictions
- Smart suggestions for budget optimization

Related: Future Scope - AI-Assisted Insights
```

## 🔧 Priority: Medium - UX Improvements

### 6. Offline Mode Support
```
Title: [TASK] Implement offline mode with local caching
Type: Development Task
Component: Firebase Services
Priority: Medium
Effort: L (1-3 days)

Description:
Add offline functionality so users can view and add expenses without internet

Acceptance Criteria:
- [ ] Cache group and expense data locally
- [ ] Show offline indicator in UI
- [ ] Allow viewing cached data offline
- [ ] Queue expense additions for sync
- [ ] Sync pending changes when online
- [ ] Handle conflict resolution
- [ ] Unit tests for offline logic

Technical Details:
- Use AsyncStorage for local cache
- Implement pending operations queue
- Add sync service in firebaseService.ts
- Network status monitoring
```

### 7. Dark Mode Enhancements
```
Title: [TASK] Improve dark mode theme consistency
Type: Development Task
Component: UI Components
Priority: Low
Effort: S (1-4 hours)

Description:
Ensure all screens and components properly support dark mode

Acceptance Criteria:
- [ ] Audit all screens for dark mode support
- [ ] Fix any color contrast issues
- [ ] Ensure consistent theme usage
- [ ] Update theme colors if needed
- [ ] Test on both platforms

Files to Check:
- All screens in src/screens/
- All components in src/components/
- ThemeContext.tsx
```

## 🐛 Known Issues to Track

### 8. Version Check Service Status
```
Title: [BUG] Version check service marked as modified
Type: Bug Report
Platform: Both
Severity: Low

Description:
The versionCheckService.ts file shows as modified in git status but no actual changes are visible

Steps to Reproduce:
1. Run `git status`
2. See versionCheckService.ts listed as modified

Expected: Clean git status
Actual: File shows as modified

Context: This might be line ending issues or permission changes
```

## 🎨 UI/UX Enhancements

### 9. Expense Categories Management
```
Title: [FEATURE] Allow users to create custom expense categories
Type: Feature Request
Category: Expense Management
Priority: Low

Description:
Let users create and manage their own expense categories beyond the default ones

Current State:
- Fixed set of categories with emojis
- No way to add custom categories

Proposed:
- "Manage Categories" in settings
- Add custom categories with emoji picker
- Edit/delete custom categories
- Per-group or global categories
```

### 10. Multi-Currency Support
```
Title: [FEATURE] Add multi-currency support for international groups
Type: Feature Request
Category: Expense Management
Priority: Low

Description:
Support expenses in different currencies with automatic conversion

Features:
- Select currency per expense
- Automatic currency conversion
- Exchange rate API integration
- Display in user's preferred currency
- Historical exchange rates for old expenses
```

## 📱 Performance Optimizations

### 11. Image Optimization
```
Title: [TASK] Optimize receipt image compression and storage
Type: Development Task
Component: Expense Management
Priority: Medium
Effort: M (4-8 hours)

Description:
Improve receipt image handling for better performance and storage

Current Issues:
- Large images may cause memory issues
- Base64 encoding increases storage size

Proposed Improvements:
- Progressive image compression
- Move to Firebase Storage instead of Firestore
- Lazy load receipt images
- Add image resolution limits
- Implement image caching

Technical Details:
- Update AddExpenseScreen.tsx
- Modify firebaseService.ts
- Add Firebase Storage integration
```

## 🔐 Security Enhancements

### 12. Enhanced Authentication
```
Title: [FEATURE] Add social login options (Google, Apple)
Type: Feature Request
Category: Authentication & Security
Priority: Medium

Description:
Provide additional authentication methods for easier onboarding

Options:
- Google Sign-In
- Apple Sign-In (iOS)
- Email/Password (current)
- Phone OTP (current)

Benefits:
- Faster onboarding
- Better user experience
- Reduced friction
```

### 13. Biometric Authentication Enhancements
```
Title: [TASK] Improve biometric authentication reliability
Type: Development Task
Component: Authentication & Security
Priority: Low
Effort: S (1-4 hours)

Description:
Enhance the existing biometric authentication system

Improvements:
- Better error handling
- Fallback mechanisms
- Settings to enable/disable
- Authentication timeout settings

Files:
- BiometricContext.tsx
- BiometricAuthScreen.tsx
```

## 📝 Documentation

### 14. API Documentation
```
Title: [TASK] Create comprehensive API documentation for Firebase services
Type: Documentation
Priority: Medium
Effort: M (4-8 hours)

Description:
Document all Firebase service methods and data structures

Sections Needed:
- All firebaseService.ts methods
- Request/response types
- Error handling
- Code examples
- Best practices

Location: docs/API_REFERENCE.md
```

### 15. Contributing Guide
```
Title: [TASK] Create detailed contributing guidelines
Type: Documentation
Priority: Medium
Effort: S (1-4 hours)

Description:
Write comprehensive contributing guide for new collaborators

Should Include:
- Code style guide
- Commit message conventions
- Branch naming conventions
- PR template
- Code review process
- Testing requirements

Location: docs/CONTRIBUTING.md
```

---

## 📌 How to Use This Document

1. **Review the suggestions** above
2. **Create issues on GitHub** for items you want to work on
3. **Use the provided templates** in `.github/ISSUE_TEMPLATE/`
4. **Assign priorities and labels** appropriately
5. **Link related issues** together
6. **Update this document** as issues are created and completed

## 🔗 Creating These Issues

To create these issues on GitHub:

1. Go to: https://github.com/kharchasplit/KharchaSplit_Mobile_App/issues/new/choose
2. Select appropriate template (Bug Report, Feature Request, or Task)
3. Fill in details from the suggestions above
4. Add labels and milestones
5. Assign to yourself if you plan to work on it

---

**Remember**: These are suggestions based on the current project state. Feel free to modify, combine, or skip any based on actual priorities! 🚀

Last Updated: 2025-10-28
