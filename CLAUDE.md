# KharchaSplit - Project Memory

## 🎯 Project Overview
KharchaSplit is a React Native expense splitting application with Firebase backend integration. The app allows users to create groups, add expenses, track balances, and settle debts.

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React Native with TypeScript
- **Backend**: Firebase Firestore
- **Authentication**: Firebase Auth
- **State Management**: React Context API
- **Navigation**: React Navigation
- **UI Components**: Custom components with theme support
- **Image Handling**: Base64 encoding for receipts

### Key Services
- `firebaseService.ts` - Centralized Firebase operations
- `AuthContext` - User authentication state
- `ThemeContext` - Dark/Light theme support

## 📱 Implemented Features

### 1. **Dynamic Add Expense Feature** ✅
- **Location**: `src/screens/AddExpenseScreen.tsx`
- **Key Features**:
  - Create expenses with Firebase integration
  - Base64 receipt upload with compression
  - Dynamic participant selection
  - Split types: Equal, Unequal, Percentage, Shares
  - Real-time validation
  - Category selection with emojis
- **Firebase Methods**:
  - `firebaseService.createGroupExpense()`
  - Automatic group totalExpenses update

### 2. **Group Details Dynamic Tabs** ✅
- **Location**: `src/screens/GroupDetailScreen.tsx`
- **Dynamic Tab System**:
  ```typescript
  const TAB_CONFIG = [
    { id: 'expenses', label: 'Expenses', icon: 'receipt-outline' },
    { id: 'balances', label: 'Balances', icon: 'wallet-outline' },
    { id: 'settlement', label: 'Settlement', icon: 'swap-horizontal-outline' },
  ];
  ```
- **Features**:
  - Real-time expense loading
  - Balance calculations
  - Settlement optimization (greedy algorithm)
  - Pull-to-refresh
  - Focus effect for data refresh

### 3. **Expense Participant Fix** ✅
- **Issue**: "Unknown user" and missing email in expense details
- **Solution**: 
  - Enhanced participant data mapping
  - Support for both `userId` and `id` fields
  - Member data enrichment from group members
  - Fallback handling for missing data

### 4. **Home Screen Dynamic Groups** ✅
- **Location**: `src/screens/HomeScreen.tsx`
- **Features**:
  - Real-time group expense calculations
  - Overall balance aggregation
  - Dynamic member balance details
  - Group expense totals from Firebase
- **Helper Functions**:
  - `calculateUserGroupBalance()` - Per-group balance calculation
  - `calculateOverallBalance()` - Total balance across all groups

### 5. **Group Management Screen** ✅
- **Location**: `src/screens/ManageGroupScreen.tsx`
- **Navigation**: Bottom sheet → "Group Details"
- **Features**:
  - Dynamic Firebase data loading
  - Group information display:
    - Total members
    - Total expenses
    - Creation date
  - Member management:
    - Role display (Creator/Admin/Member)
    - Remove members (admin only)
  - Admin controls:
    - Edit group name/description
    - Update cover image
    - Save changes to Firebase

### 6. **GroupDetailsScreen Setup** ✅
- **Location**: `src/screens/GroupDetailsScreen.tsx`
- **Fixed Issues**:
  - Circular dependency in `useFocusEffect`
  - Removed unused modal system
  - Clean navigation to ExpenseDetailScreen
  - Removed unused imports and functions

### 7. **Settlement 2-Way Confirmation System** ✅
- **Location**: `src/screens/GroupDetailScreen.tsx` + `firebaseService.ts`
- **Features**:
  - **Step 1**: User A (payer) clicks "Settle" button → Status becomes "Pending"
  - **Step 2**: User B (receiver) clicks "Confirm" button → Status becomes "Paid"
  - Real-time status tracking in Firebase
  - Visual status indicators:
    - "Settle" button for unpaid settlements
    - "Pending" status for waiting confirmation
    - "Confirm" button for receivers
    - "Paid" badge with checkmark icon
- **Firebase Methods**:
  - `createSettlement()` - Mark payment as pending
  - `confirmSettlement()` - Confirm payment received
  - `getGroupSettlements()` - Load settlement history

## 🔧 Common Patterns & Solutions

### Firebase Data Loading Pattern
```typescript
const loadData = async () => {
  setLoading(true);
  try {
    const data = await firebaseService.getMethod();
    setState(data);
  } catch (error) {
    console.error('Error:', error);
    Alert.alert('Error', 'Failed to load data');
  } finally {
    setLoading(false);
  }
};
```

### Firebase Safe Data Pattern
```typescript
// ❌ Wrong - undefined values cause Firebase errors
const expense = {
  receiptBase64: receiptImage || undefined, // Don't do this!
  notes: notes || undefined, // Don't do this!
};

// ✅ Correct - conditional inclusion
const expense = {
  ...(receiptImage && { receiptBase64: receiptImage }),
  ...(notes && { notes }),
};

// ✅ Alternative - filter undefined values
const cleanData = Object.fromEntries(
  Object.entries(expenseData).filter(([_, value]) => value !== undefined)
);
```

### Member Data Enrichment Pattern
```typescript
const enrichedParticipants = expense.participants.map(participant => {
  const member = group.members.find(m => 
    m.userId === participant.id || m.userId === participant.userId
  );
  return {
    ...participant,
    name: participant.name || member?.name || 'Unknown User',
    email: member?.phoneNumber || member?.email || '',
  };
});
```

### Balance Calculation Pattern
```typescript
expenses.forEach(expense => {
  const payerId = expense.paidBy.id;
  expense.participants.forEach(participant => {
    if (participant.id !== payerId) {
      memberBalances[participant.id] -= participant.amount;
      memberBalances[payerId] += participant.amount;
    }
  });
});
```

### Settlement 2-Way Confirmation Pattern
```typescript
// Step 1: User A marks payment as done
const handleSettlePayment = async (settlement) => {
  await firebaseService.createSettlement({
    groupId, fromUserId, toUserId, amount,
    status: 'pending', // Waiting for receiver confirmation
  });
};

// Step 2: User B confirms payment received
const handleConfirmPayment = async (settlement) => {
  await firebaseService.confirmSettlement(groupId, settlement.id);
  // Status changes from 'pending' to 'paid'
};

// UI shows different buttons based on status and user role
{!firebaseSettlement && isCurrentUserPayer && (
  <Button title="Settle" onPress={handleSettlePayment} />
)}
{firebaseSettlement?.status === 'pending' && isCurrentUserReceiver && (
  <Button title="Confirm" onPress={handleConfirmPayment} />
)}
```

## 🐛 Known Issues & Solutions

### 1. TypeScript Errors
- **Issue**: `isDarkMode` not available in theme context
- **Solution**: Removed references, use default theme

### 2. Firebase FieldValue Error
- **Issue**: `Cannot read property 'increment' of undefined` - FieldValue not available
- **Solution**: 
  - Import: `import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore'`
  - Use: `firestore.FieldValue.increment(amount)` (without parentheses)

### 3. Participant ID Mismatch
- **Issue**: Different ID field names (`id` vs `userId`)
- **Solution**: Support both fields in lookups

### 4. Navigation Refresh
- **Issue**: Data not refreshing when returning to screen
- **Solution**: Use `useFocusEffect` hook

### 5. Firebase Undefined Values Error
- **Issue**: `Error: Unsupported field value: undefined` when creating groups/expenses
- **Solution**: 
  - **createGroup**: Use conditional spread operator: `...(groupData.description && { description: groupData.description })`
  - **updateUser/updateGroup**: Filter undefined values: `Object.fromEntries(Object.entries(updateData).filter(([_, value]) => value !== undefined))`
  - **createGroupExpense**: Already implemented undefined value filtering
  - Add proper validation for required fields
  - Use fallback values: `field: value || defaultValue`

## 📝 Firebase Service Methods

### Group Operations
- `getUserGroups(userId)` - Get user's groups
- `getGroupById(groupId)` - Get single group details
- `createGroup(groupData)` - Create new group
- `updateGroup(groupId, updates)` - Update group info
- `deleteGroup(groupId)` - Delete group

### Expense Operations
- `getGroupExpenses(groupId)` - Get group expenses
- `createGroupExpense(groupId, expenseData)` - Add expense
- `updateExpense(groupId, expenseId, updates)` - Update expense
- `deleteExpense(groupId, expenseId)` - Delete expense

### Member Operations
- `addMemberToGroup(groupId, memberData)` - Add member
- `removeMemberFromGroup(groupId, userId)` - Remove member
- `updateMemberRole(groupId, userId, role)` - Update role

### Settlement Operations
- `createSettlement(settlementData)` - Create pending settlement
- `confirmSettlement(groupId, settlementId)` - Confirm payment received
- `getGroupSettlements(groupId)` - Get all settlements for group
- `getActiveSettlementsForUser(groupId, userId)` - Get user's pending settlements

## 🎨 UI/UX Patterns

### Responsive Scaling
```typescript
const { width: screenWidth } = useWindowDimensions();
const baseWidth = 375;
const scale = (size: number) => (screenWidth / baseWidth) * size;
```

### Theme Colors
- Primary button/text
- Secondary text
- Background/Card background
- Error/Success states
- Active/Inactive icons

### Loading States
- Full screen loading with ActivityIndicator
- Inline loading for buttons
- Skeleton screens for better UX

## 🚀 Performance Optimizations

1. **useCallback** for function memoization
2. **useFocusEffect** for screen focus updates
3. **Batch Firebase operations** where possible
4. **Image compression** for receipts (base64)
5. **Lazy loading** for expensive operations
6. **Contacts Caching & Lazy Loading** ✅
   - AsyncStorage + in-memory cache (10-min expiration)
   - Load 50 contacts at a time with FlatList
   - Only query Firebase for uncached contacts
   - 85-98% faster (2-4s first load, 0.1-0.5s cached)
   - See [CONTACTS_OPTIMIZATION.md](./CONTACTS_OPTIMIZATION.md)

## 📱 Navigation Structure

```
AuthenticatedNavigator
├── HomeStackNavigator
│   ├── HomeScreen
│   ├── GroupDetailScreen (with tabs)
│   ├── GroupDetailsScreen (expenses/balance/settlement)
│   ├── ManageGroupScreen (group info)
│   ├── AddExpenseScreen
│   ├── AddMemberScreen
│   └── ExpenseDetailScreen
├── ActivityScreen
└── ProfileScreen
```

## 🔐 Security Considerations

1. **Admin checks** before destructive operations
2. **User ID validation** for expense operations
3. **Firebase rules** should validate on backend
4. **No sensitive data** in console logs
5. **Proper error handling** without exposing internals

## 📋 Testing Checklist

- [ ] Add expense with receipt
- [ ] View expense details with participants
- [ ] Calculate balances correctly
- [ ] Settlement suggestions work
- [ ] Group management by admin
- [ ] Member removal by admin
- [ ] Data refresh on navigation
- [ ] Pull-to-refresh works
- [ ] Error states handled gracefully

## 🔄 Common Development Commands

```bash
# Run the app
npm start
npm run android
npm run ios

# TypeScript check
npm run tsc

# Linting
npm run lint

# Clean build
cd android && ./gradlew clean
cd ios && pod install
```

## 📌 Important Notes

1. Always check user authentication before operations
2. Handle Firebase errors gracefully
3. Test on both iOS and Android
4. Check responsive design on different screen sizes
5. Validate data before Firebase operations
6. Use proper TypeScript types
7. Follow existing code patterns

---

Last Updated: 2025-10-13 - Optimized contacts loading performance with caching and lazy loading (85-98% faster)