# Debugging Contacts Loading Issues

## Issue Report
- **Problem 1**: Contacts not showing properly / can't find contacts
- **Problem 2**: Registered users showing "Invite" button instead of "Add" button

## Debugging Steps Added

### 1. Console Logs Added

**In `processContactsWithRegistration`:**
```
[AddMember] Processing X contacts with cache optimization
[AddMember] Cached: X Uncached: X
[AddMember] Sample uncached phones: ['+919876543210', ...]
[AddMember] Found X registered users
[AddMember] Sample registered: [{phone: '+919876543210', name: 'John'}]
[AddMember] Updated X contacts with registration status
[AddMember] Final: X contacts, X registered
```

**In `useEffect` (search/display):**
```
[AddMember] Search results: X of X
[AddMember] Loading first page of X contacts
```

**In `renderItem` (UI render):**
```
[AddMember] Contact render: {
  name: 'John Doe',
  phone: '9876543210',
  isRegistered: true/false,
  hasProfile: true/false
}
```

### 2. What to Check

**Run the app and open AddMemberScreen, then check logs for:**

1. **Are contacts being loaded?**
   - Look for: `[AddMember] Processing X contacts`
   - Expected: Should see your total contact count

2. **Are phone numbers formatted correctly?**
   - Look for: `[AddMember] Sample uncached phones`
   - Expected: Should be in `+91XXXXXXXXXX` format (12 digits)

3. **Is Firebase returning users?**
   - Look for: `[AddMember] Found X registered users`
   - Expected: Should match number of registered contacts

4. **Are phone numbers matching?**
   - Look for: `[AddMember] Sample registered`
   - Compare phone formats between what's sent and what's returned
   - Both should be `+91` format

5. **Are contacts being updated?**
   - Look for: `[AddMember] Updated X contacts with registration status`
   - Should match number found from Firebase

6. **Are contacts displaying correctly?**
   - Look for: `[AddMember] Contact render:` (first 5 contacts)
   - Check `isRegistered` and `hasProfile` values

### 3. Common Issues & Solutions

#### Issue: Phone numbers not matching

**Symptom:** Firebase returns users but contacts still show "Invite"

**Check:**
```
Firebase query: +919876543210
Firebase response: +919876543210
Normalized (for map): 9876543210
Contact phone: 9876543210
```

**Solution:** Ensure normalization is consistent everywhere

#### Issue: Contacts not showing at all

**Symptom:** `[AddMember] Final: 0 contacts`

**Possible causes:**
1. All contacts filtered out (no phone numbers)
2. All contacts are existing members
3. Contacts permission denied

**Check:**
- `[AddMember] Processing X contacts` - if 0, no contacts loaded
- Check contacts permission in app settings

#### Issue: Registered users showing as unregistered

**Symptom:** `isRegistered: false` even though user is in app

**Possible causes:**
1. Phone number format mismatch
2. Firebase query not finding user
3. Cache has stale data

**Solutions:**
1. Clear cache: Delete and reinstall app
2. Check Firebase console: Verify user's phone number format
3. Check logs: Compare phone formats in query vs response

### 4. Manual Testing Checklist

1. **Open AddMemberScreen**
   - [ ] Contacts load within 2-4 seconds
   - [ ] See loading indicator during load
   - [ ] Contacts appear after loading

2. **Check registered users**
   - [ ] Registered users show "Registered" badge
   - [ ] Registered users show "Add" button
   - [ ] Unregistered users show "Invite" button

3. **Test search**
   - [ ] Search by name works
   - [ ] Search by phone works
   - [ ] Results update as you type

4. **Test lazy loading**
   - [ ] First 50 contacts load immediately
   - [ ] Scroll to bottom shows "Load More" button
   - [ ] Clicking "Load More" loads next 50

5. **Test caching**
   - [ ] Close and reopen screen
   - [ ] Should load instantly (< 0.5s)
   - [ ] Registration status preserved

### 5. Debug Commands

**Clear cache:**
```javascript
// In AddMemberScreen, add temporary button:
import { contactsCacheService } from '../services/contactsCacheService';

// Add button:
<TouchableOpacity onPress={async () => {
  await contactsCacheService.clear();
  Alert.alert('Cache cleared', 'Reload contacts to fetch fresh data');
}}>
  <Text>Clear Cache</Text>
</TouchableOpacity>

// Then reload contacts
```

**Check cache stats:**
```javascript
// In console/logs:
const stats = contactsCacheService.getStats();
console.log('Cache stats:', stats);
// Output: { total: 250, registered: 50, unregistered: 200 }
```

### 6. Expected Log Flow (Normal Operation)

```
[AddMember] Screen mounted
[AddMember] Processing 487 contacts with cache optimization
[AddMember] Cached: 0 Uncached: 450  // First time - nothing cached
[AddMember] Fetching 450 uncached from Firebase
[AddMember] Sample uncached phones: ['+919876543210', '+919876543211', ...]
[Firebase] getUsersByPhoneNumbers called with 450 numbers
[Firebase] Querying batch: ['+919876543210', ...]
[Firebase] Batch query returned 8 users
[Firebase] Found user: +919876543210 John Doe
[Firebase] Total users found: 45
[AddMember] Found 45 registered users
[AddMember] Sample registered: [{phone: '+919876543210', name: 'John'}, ...]
[AddMember] Updated 45 contacts with registration status
[AddMember] Final: 450 contacts, 45 registered
[AddMember] Loading first page of 450 contacts
[AddMember] Contact render: { name: 'John Doe', phone: '9876543210', isRegistered: true, hasProfile: true }
```

### 7. Phone Number Format Reference

**Throughout the app:**
- **Storage (Firebase):** `+919876543210` (12 digits with +91)
- **Cache keys:** `9876543210` (10 digits, normalized)
- **Display:** Various formats from contact book
- **Queries:** `+919876543210` (12 digits with +91)

**Normalization function:**
```typescript
normalizePhoneNumber('+919876543210')  // Returns: '9876543210'
normalizePhoneNumber('09876543210')    // Returns: '9876543210'
normalizePhoneNumber('9876543210')     // Returns: '9876543210'
```

---

## Next Steps

1. Run the app and navigate to "Add Member" screen
2. Check console logs for the patterns above
3. Report back which step is failing
4. Share relevant log output for debugging

**If you're still seeing issues, share:**
- The full console log output
- Sample phone numbers (obfuscated) from logs
- Screenshot of the contacts screen
