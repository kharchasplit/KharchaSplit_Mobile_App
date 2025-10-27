import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import Contacts from 'react-native-contacts';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { firebaseService } from '../services/firebaseService';
import { useAuth } from '../context/AuthContext';
import { Share } from 'react-native';
import { s, vs, ms } from '../utils/deviceDimensions';
import { contactsCacheService } from '../services/contactsCacheService';

interface Group {
  id: string;
  name: string;
}

interface Contact {
  recordID: string;
  displayName: string;
  phoneNumbers: { number: string }[];
  emailAddresses: { email: string }[];
  thumbnailPath?: string;
}

interface FilteredContact extends Contact {
  isRegistered: boolean;
  userProfile?: any;
}

interface Props {
  route: { params: { group: Group } };
  navigation: any;
}

export const AddMemberScreen: React.FC<Props> = ({ route, navigation }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { group } = route.params || {};

  const [selectedMembers, setSelectedMembers] = useState<FilteredContact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredContacts, setFilteredContacts] = useState<FilteredContact[]>([]);
  const [displayedContacts, setDisplayedContacts] = useState<FilteredContact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [hasContactsPermission, setHasContactsPermission] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const CONTACTS_PER_PAGE = 50;

  useEffect(() => {
    console.log('[AddMember] Screen mounted');
    console.log('[AddMember] Group prop:', JSON.stringify(group));
    console.log('[AddMember] Has contacts permission:', hasContactsPermission);

    // Initialize cache and clear it (temporary - for debugging)
    const initAndClearCache = async () => {
      await contactsCacheService.init();
      console.log('[AddMember] Cache stats before clear:', contactsCacheService.getStats());
      // TEMPORARY: Clear cache to force fresh Firebase lookup
      await contactsCacheService.clear();
      console.log('[AddMember] Cache cleared - forcing fresh Firebase lookup');
    };

    initAndClearCache();
    requestContactsPermission();
  }, []);

  const requestContactsPermission = async () => {
    try {
      let permissionResult;

      if (Platform.OS === 'android') {
        permissionResult = await request(PERMISSIONS.ANDROID.READ_CONTACTS);
      } else {
        permissionResult = await request(PERMISSIONS.IOS.CONTACTS);
      }

      if (permissionResult === RESULTS.GRANTED) {
        setHasContactsPermission(true);
        loadContacts();
      } else {
        setHasContactsPermission(false);
        Alert.alert(
          'Permission Required',
          'Please allow access to contacts to add members from your registered friends.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Allow Access', onPress: () => requestContactsPermission() },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to request contacts permission');
    }
  };

  const normalizePhoneNumber = (phoneNumber: string): string => {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');

    // If it starts with country code, remove it to get 10-digit number
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      return cleaned.substring(2);
    } else if (cleaned.startsWith('0') && cleaned.length === 11) {
      return cleaned.substring(1);
    }

    return cleaned;
  };

  const loadContacts = async () => {
    if (!Contacts || !Contacts.getAll) return;

    setContactsLoading(true);
    try {
      const contactsList = await Contacts.getAll();
      const mappedContacts: Contact[] = contactsList.map(contact => ({
        recordID: contact.recordID,
        displayName: contact.displayName || contact.givenName || 'Unknown',
        phoneNumbers: (contact.phoneNumbers || []).map(phone => ({ number: phone.number })),
        emailAddresses: (contact.emailAddresses || []).map(email => ({ email: email.email })),
        thumbnailPath: contact.thumbnailPath,
      }));

      await processContactsWithRegistration(mappedContacts);
    } catch (error) {
      Alert.alert('Error', 'Failed to load contacts');
    } finally {
      setContactsLoading(false);
    }
  };

  const processContactsWithRegistration = async (contactsList: Contact[]) => {
    try {
      console.log('[AddMember] Processing', contactsList.length, 'contacts with cache optimization');

      // Get current group members to exclude them
      const currentGroup = await firebaseService.getGroupById(group.id);
      if (!currentGroup) {
        console.error('[AddMember] Group not found for ID:', group.id);
        Alert.alert('Error', 'Group not found. Please go back and try again.');
        return;
      }

      const existingMemberPhones = new Set(currentGroup.members.map(member =>
        normalizePhoneNumber(member.phoneNumber)
      ));
      console.log('[AddMember] Existing members:', existingMemberPhones.size);

      // Process contacts and separate cached from uncached
      const validContacts: FilteredContact[] = [];
      const uncachedPhones: string[] = [];
      const processedContactIds = new Set<string>();
      let invalidPhoneCount = 0;
      let existingMemberCount = 0;

      contactsList.forEach((contact, index) => {
        if (contact.phoneNumbers?.length > 0 && !processedContactIds.has(contact.recordID)) {
          processedContactIds.add(contact.recordID);

          const rawPhone = contact.phoneNumbers[0].number;
          const primaryPhone = normalizePhoneNumber(rawPhone);

          // Debug first 5 contacts
          if (index < 5) {
            console.log('[AddMember] Contact:', {
              name: contact.displayName,
              rawPhone,
              normalized: primaryPhone,
              length: primaryPhone.length,
              isExistingMember: existingMemberPhones.has(primaryPhone),
            });
          }

          // Skip if already a member
          if (existingMemberPhones.has(primaryPhone)) {
            existingMemberCount++;
          } else if (primaryPhone.length !== 10) {
            invalidPhoneCount++;
          } else {
            // Check cache first
            const cached = contactsCacheService.get(primaryPhone);

            if (cached) {
              // Use cached data
              if (cached.userProfile?.id !== user?.id) {
                validContacts.push({
                  ...contact,
                  isRegistered: cached.isRegistered,
                  userProfile: cached.userProfile,
                });
              }
            } else {
              // Need to fetch from Firebase
              validContacts.push({
                ...contact,
                isRegistered: false,
                userProfile: undefined,
              });
              uncachedPhones.push(`+91${primaryPhone}`);
            }
          }
        }
      });

      console.log('[AddMember] Processing stats:', {
        total: contactsList.length,
        existingMembers: existingMemberCount,
        invalidPhone: invalidPhoneCount,
        valid: validContacts.length,
        cached: validContacts.filter(c => c.isRegistered).length,
        uncached: uncachedPhones.length,
      });

      // Fetch only uncached contacts from Firebase
      if (uncachedPhones.length > 0) {
        console.log('[AddMember] Fetching', uncachedPhones.length, 'uncached from Firebase');
        console.log('[AddMember] Sample uncached phones (format +91XXXXXXXXXX):', uncachedPhones.slice(0, 5));

        let registeredUsers = await firebaseService.getUsersByPhoneNumbers(uncachedPhones);
        console.log('[AddMember] Found', registeredUsers.length, 'registered users with +91 format');

        // If no results, try without +91 (just 10 digits)
        if (registeredUsers.length === 0 && uncachedPhones.length > 0) {
          console.log('[AddMember] Trying 10-digit format without +91...');
          const phonesWithout91 = uncachedPhones.map(p => p.replace('+91', ''));
          console.log('[AddMember] Sample 10-digit phones:', phonesWithout91.slice(0, 5));
          registeredUsers = await firebaseService.getUsersByPhoneNumbers(phonesWithout91);
          console.log('[AddMember] Found', registeredUsers.length, 'registered users with 10-digit format');
        }

        // If still no results, try with 91 prefix (no +)
        if (registeredUsers.length === 0 && uncachedPhones.length > 0) {
          console.log('[AddMember] Trying 91XXXXXXXXXX format (no +)...');
          const phonesWith91NoPlus = uncachedPhones.map(p => p.replace('+', ''));
          console.log('[AddMember] Sample 91XXXXXXXXXX phones:', phonesWith91NoPlus.slice(0, 5));
          registeredUsers = await firebaseService.getUsersByPhoneNumbers(phonesWith91NoPlus);
          console.log('[AddMember] Found', registeredUsers.length, 'registered users with 91XXXXXXXXXX format');
        }

        if (registeredUsers.length > 0) {
          console.log('[AddMember] Sample registered:', registeredUsers.slice(0, 3).map(u => ({ phone: u.phoneNumber, name: u.name })));
        } else {
          console.warn('[AddMember] ⚠️ NO REGISTERED USERS FOUND! Check Firebase phone number format.');
          console.warn('[AddMember] Expected one of: +91XXXXXXXXXX, XXXXXXXXXX, or 91XXXXXXXXXX');
        }

        const registeredPhones = new Set<string>();
        const userProfileMap: { [key: string]: any } = {};

        // Build cache entries
        const cacheEntries: Array<{ phoneNumber: string; isRegistered: boolean; userProfile?: any }> = [];

        registeredUsers.forEach(userProfile => {
          const normalizedPhone = normalizePhoneNumber(userProfile.phoneNumber);
          registeredPhones.add(normalizedPhone);
          userProfileMap[normalizedPhone] = userProfile;
          cacheEntries.push({
            phoneNumber: normalizedPhone,
            isRegistered: true,
            userProfile,
          });
        });

        // Mark unregistered numbers in cache
        uncachedPhones.forEach(phone => {
          const normalized = normalizePhoneNumber(phone);
          if (!registeredPhones.has(normalized)) {
            cacheEntries.push({
              phoneNumber: normalized,
              isRegistered: false,
            });
          }
        });

        // Update cache in bulk
        await contactsCacheService.setMultiple(cacheEntries);

        // Update contacts with Firebase results
        let updatedCount = 0;
        validContacts.forEach(contact => {
          const primaryPhone = normalizePhoneNumber(contact.phoneNumbers[0].number);
          if (registeredPhones.has(primaryPhone)) {
            contact.isRegistered = true;
            contact.userProfile = userProfileMap[primaryPhone];
            updatedCount++;
          }
        });
        console.log('[AddMember] Updated', updatedCount, 'contacts with registration status');
      }

      // Filter out current user
      const finalContacts = validContacts.filter(contact => {
        const primaryPhone = normalizePhoneNumber(contact.phoneNumbers[0].number);
        const cached = contactsCacheService.get(primaryPhone);
        return !cached?.userProfile || cached.userProfile.id !== user?.id;
      });

      // Sort: registered first
      const sortedContacts = finalContacts.sort((a, b) => {
        if (a.isRegistered && !b.isRegistered) return -1;
        if (!a.isRegistered && b.isRegistered) return 1;
        return 0;
      });

      console.log('[AddMember] Final:', sortedContacts.length, 'contacts,', sortedContacts.filter(c => c.isRegistered).length, 'registered');
      setFilteredContacts(sortedContacts);

      // Load first page
      loadMoreContacts(sortedContacts, 0);
    } catch (error) {
      console.error('[AddMember] Error processing contacts:', error);

      // Fallback: show all contacts without registration status
      const basicContacts: FilteredContact[] = contactsList
        .filter(contact => contact.phoneNumbers?.length > 0)
        .map(contact => ({
          ...contact,
          isRegistered: false,
          userProfile: undefined,
        }));

      setFilteredContacts(basicContacts);
      loadMoreContacts(basicContacts, 0);
    }
  };

  const loadMoreContacts = (contacts: FilteredContact[], startIndex: number) => {
    const endIndex = Math.min(startIndex + CONTACTS_PER_PAGE, contacts.length);
    const newContacts = contacts.slice(startIndex, endIndex);

    if (startIndex === 0) {
      setDisplayedContacts(newContacts);
    } else {
      setDisplayedContacts(prev => [...prev, ...newContacts]);
    }

    setHasMore(endIndex < contacts.length);
    setLoadingMore(false);
  };

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    setTimeout(() => {
      loadMoreContacts(searchFilteredContacts, displayedContacts.length);
    }, 100);
  };

  const handleSelectMember = useCallback((contact: FilteredContact) => {
    // Only allow adding registered members to group
    if (!contact.isRegistered) {
      return;
    }

    const exists = selectedMembers.find(m => m.recordID === contact.recordID);
    if (exists) {
      setSelectedMembers(prev => prev.filter(m => m.recordID !== contact.recordID));
    } else {
      setSelectedMembers(prev => [...prev, contact]);
    }
  }, [selectedMembers]);

  const handleInviteContact = async (_contact: FilteredContact) => {
    try {
      if (!user?.referralCode) {
        Alert.alert('Error', 'Unable to send invite. Please try again later.');
        return;
      }

      const message = `Hi! Join me on KharchaSplit to easily split expenses and manage group payments. Use my referral code: ${user.referralCode}\n\nDownload the app: [App Store/Play Store Link]`;

      await Share.share({
        message,
        title: 'Join KharchaSplit',
      });
    } catch (error) {
      console.error('Error sharing invite:', error);
      Alert.alert('Error', 'Failed to send invite. Please try again.');
    }
  };

  const handleAddMembers = async () => {
    if (selectedMembers.length === 0) {
      Alert.alert('Error', 'Please select at least one member to add');
      return;
    }

    if (!group?.id) {
      Alert.alert('Error', 'Group information not found');
      return;
    }

    setLoading(true);

    try {
      const results = [];

      for (const contact of selectedMembers) {
        // Only add registered members (already validated in handleSelectMember)
        if (contact.isRegistered && contact.phoneNumbers && contact.phoneNumbers.length > 0) {
          const phoneNumber = normalizePhoneNumber(contact.phoneNumbers[0].number);
          // Use the phone number from userProfile if available (more reliable)
          const formattedPhone = contact.userProfile?.phoneNumber ||
            (phoneNumber.length === 10 ? `+91${phoneNumber}` : `+${phoneNumber}`);

          console.log(`[AddMember] Attempting to add:`, {
            displayName: contact.displayName,
            userProfileName: contact.userProfile?.name,
            formattedPhone,
            groupId: group.id
          });

          try {
            const result = await firebaseService.addGroupMember(group.id, formattedPhone);
            console.log(`[AddMember] Successfully added ${contact.displayName}`);
            results.push({
              contact,
              success: true,
              result,
              name: contact.userProfile?.name || contact.displayName
            });
          } catch (error: any) {
            console.error(`[AddMember] Failed to add ${contact.displayName}:`, error);
            console.error(`[AddMember] Error details:`, {
              message: error.message,
              phone: formattedPhone,
              isRegistered: contact.isRegistered,
              hasUserProfile: !!contact.userProfile
            });
            results.push({
              contact,
              success: false,
              error: error.message || 'Failed to add member',
              name: contact.userProfile?.name || contact.displayName
            });
          }
        } else {
          console.warn(`[AddMember] Skipping ${contact.displayName}: not registered or no phone`);
          results.push({
            contact,
            success: false,
            error: 'Invalid contact or not registered',
            name: contact.displayName
          });
        }
      }

      // Show results summary
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      if (successful > 0 && failed === 0) {
        Alert.alert(
          '✅ Success',
          `Successfully added ${successful} member${successful > 1 ? 's' : ''} to the group!`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate back and refresh parent screen
                navigation.goBack();
              }
            }
          ]
        );
      } else if (successful > 0 && failed > 0) {
        const failedNames = results
          .filter(r => !r.success)
          .map(r => `${r.name} (${r.error})`)
          .join('\n');

        Alert.alert(
          '⚠️ Partial Success',
          `Added ${successful} member${successful > 1 ? 's' : ''} successfully.\n\nFailed to add:\n${failedNames}`,
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.goBack();
              }
            }
          ]
        );
      } else {
        const failedNames = results
          .filter(r => !r.success)
          .map(r => `${r.name} (${r.error})`)
          .join('\n');

        Alert.alert(
          '❌ Failed',
          `Failed to add members:\n${failedNames}`,
          [
            { text: 'OK', style: 'default' }
          ]
        );
      }

    } catch (error) {
      console.error('Error adding members:', error);
      Alert.alert(
        '❌ Error',
        'An unexpected error occurred while adding members. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Update displayed contacts when filteredContacts is set (only once)
  const hasLoadedContacts = useRef(false);

  useEffect(() => {
    if (filteredContacts.length > 0 && !hasLoadedContacts.current) {
      console.log('[AddMember] Loading first page of', filteredContacts.length, 'contacts');
      loadMoreContacts(filteredContacts, 0);
      hasLoadedContacts.current = true;
    }
  }, [filteredContacts]);

  // Handle search separately to avoid flickering
  useEffect(() => {
    if (!hasLoadedContacts.current) return; // Wait for initial load

    if (searchQuery.trim()) {
      // When searching, show all matching results (no pagination)
      const filtered = filteredContacts.filter(contact => {
        const name = (contact.userProfile?.name || contact.displayName).toLowerCase();
        const phone = contact.phoneNumbers?.[0]?.number || '';
        const query = searchQuery.toLowerCase();
        return name.includes(query) || phone.includes(query);
      });
      console.log('[AddMember] Search results:', filtered.length, 'of', filteredContacts.length);
      setDisplayedContacts(filtered);
      setHasMore(false);
    } else if (filteredContacts.length > 0) {
      // When clearing search, reload first page
      loadMoreContacts(filteredContacts, 0);
    }
  }, [searchQuery]);

  // Memoize the styles to prevent recreation on every render
  const flatListStyles = useMemo(() => styles(colors), [colors]);

  const searchFilteredContacts = displayedContacts;

  return (
    <SafeAreaView style={styles(colors).container}>
      {/* Header */}
      <View style={styles(colors).header}>
        <TouchableOpacity style={styles(colors).backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles(colors).headerTitle}>Add Members</Text>
        <View style={styles(colors).placeholder} />
      </View>

      <FlatList
        style={styles(colors).scrollView}
        ListHeaderComponent={
          <>
            {/* Group Info */}
            <View style={styles(colors).groupInfo}>
              <Text style={styles(colors).groupName}>{group?.name}</Text>
              <Text style={styles(colors).groupDescription}>Add new members to this group</Text>
            </View>

            {/* Search Bar */}
            <View style={styles(colors).searchContainer}>
              <Ionicons name="search" size={20} color={colors.secondaryText} />
              <TextInput
                style={styles(colors).searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search Person or Phone Number"
                placeholderTextColor={colors.inputPlaceholder}
              />
            </View>

            {/* Loading State */}
            {contactsLoading && (
              <View style={styles(colors).loadingContainer}>
                <ActivityIndicator size="large" color={colors.primaryButton} />
                <Text style={styles(colors).loadingText}>Loading contacts...</Text>
              </View>
            )}
          </>
        }
        data={contactsLoading ? [] : searchFilteredContacts}
        keyExtractor={(item) => item.recordID}
        renderItem={({ item: contact }) => {
          const isSelected = selectedMembers.find(m => m.recordID === contact.recordID);
          const phoneNumber = contact.phoneNumbers?.[0]?.number || 'No phone number';
          const displayName = contact.userProfile?.name || contact.displayName;
          const normalizedPhone = normalizePhoneNumber(phoneNumber);

          // Debug log for first 5 contacts to check registration status
          if (searchFilteredContacts.indexOf(contact) < 5) {
            console.log(`[AddMember] Contact render:`, {
              name: displayName,
              phone: normalizedPhone,
              isRegistered: contact.isRegistered,
              hasProfile: !!contact.userProfile,
            });
          }

          return (
            <View style={styles(colors).contactItem}>
              <View style={styles(colors).contactInfo}>
                {contact.thumbnailPath ? (
                  <Image source={{ uri: contact.thumbnailPath }} style={styles(colors).contactImage} />
                ) : (
                  <View style={styles(colors).contactImagePlaceholder}>
                    <Text style={styles(colors).contactImagePlaceholderText}>
                      {displayName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}

                <View style={styles(colors).contactDetails}>
                  <Text style={styles(colors).contactName}>
                    {displayName}
                  </Text>
                  <Text style={styles(colors).contactPhone}>
                    {phoneNumber}
                  </Text>
                  {contact.isRegistered && (
                    <View style={styles(colors).registeredBadge}>
                      <Ionicons name="checkmark-circle" size={14} color={colors.primaryButton} />
                      <Text style={styles(colors).registeredText}>Registered</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles(colors).contactActions}>
                {contact.isRegistered ? (
                  <TouchableOpacity
                    style={[
                      styles(colors).actionButton,
                      isSelected ? styles(colors).removeButton : styles(colors).addButton
                    ]}
                    onPress={() => handleSelectMember(contact)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={isSelected ? "checkmark" : "add"}
                      size={16}
                      color="white"
                    />
                    <Text style={styles(colors).actionButtonText}>
                      {isSelected ? 'Added' : 'Add'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles(colors).actionButton, styles(colors).inviteButton]}
                    onPress={() => handleInviteContact(contact)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="share-outline" size={16} color="white" />
                    <Text style={styles(colors).actionButtonText}>Invite</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          !contactsLoading ? (
            <View style={styles(colors).emptyContainer}>
              <Ionicons name="people-outline" size={64} color={colors.secondaryText} />
              <Text style={styles(colors).emptyTitle}>No contacts found</Text>
              <Text style={styles(colors).emptyDescription}>
                {searchQuery ? 'Try adjusting your search terms.' : 'Allow contacts permission to see your friends.'}
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles(colors).loadingMore}>
              <ActivityIndicator size="small" color={colors.primaryButton} />
              <Text style={styles(colors).loadingMoreText}>Loading more...</Text>
            </View>
          ) : !searchQuery && hasMore && searchFilteredContacts.length > 0 ? (
            <TouchableOpacity
              style={styles(colors).loadMoreButton}
              onPress={handleLoadMore}
            >
              <Text style={styles(colors).loadMoreText}>Load More</Text>
            </TouchableOpacity>
          ) : null
        }
        onEndReached={!searchQuery && hasMore ? handleLoadMore : undefined}
        onEndReachedThreshold={0.5}
      />

      {/* Add Button */}
      {selectedMembers.length > 0 && (
        <View style={styles(colors).bottomContainer}>
          <TouchableOpacity
            style={[styles(colors).addSelectedButton, loading && styles(colors).addSelectedButtonLoading]}
            onPress={handleAddMembers}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <View style={styles(colors).buttonContent}>
                <ActivityIndicator size="small" color={colors.primaryButtonText} />
                <Text style={[styles(colors).addSelectedButtonText, { marginLeft: 8 }]}>
                  Adding Members...
                </Text>
              </View>
            ) : (
              <Text style={styles(colors).addSelectedButtonText}>
                Add {selectedMembers.length} Member{selectedMembers.length > 1 ? 's' : ''}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: s(16),
      paddingVertical: vs(12),
      backgroundColor: colors.cardBackground,
      borderBottomWidth: s(0),
      borderBottomColor: colors.secondaryText,
    },
    backButton: { padding: s(8) },
    headerTitle: { fontSize: ms(18), fontWeight: '600', color: colors.primaryText },
    placeholder: { width: s(40) },
    scrollView: { flex: 1 },
    groupInfo: { padding: s(16), borderBottomWidth: s(1), borderBottomColor: colors.secondaryText },
    groupName: { fontSize: ms(20), fontWeight: '600', color: colors.primaryText },
    groupDescription: { fontSize: ms(14), color: colors.secondaryText },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.cardBackground,
      borderRadius: s(25),
      paddingHorizontal: s(16),
      paddingVertical: vs(12),
      margin: s(16),
    },
    searchInput: { flex: 1, fontSize: 16, color: colors.inputText, marginLeft: 8 },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
    },
    loadingText: {
      fontSize: 16,
      color: colors.secondaryText,
      marginTop: 12,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
      paddingVertical: 60,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.primaryText,
      marginTop: 16,
      marginBottom: 8,
    },
    emptyDescription: {
      fontSize: 14,
      color: colors.secondaryText,
      textAlign: 'center',
      lineHeight: 20,
    },
    contactItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      backgroundColor: colors.cardBackground,
      marginHorizontal: 16,
      marginVertical: 4,
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    contactInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    contactDetails: {
      flex: 1,
      marginLeft: 12,
    },
    registeredBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    registeredText: {
      fontSize: 12,
      color: colors.primaryButton,
      marginLeft: 4,
      fontWeight: '500',
    },
    contactActions: {
      marginLeft: 12,
    },
    contactImage: { width: 48, height: 48, borderRadius: 24 },
    contactImagePlaceholder: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primaryButton + '20',
      justifyContent: 'center',
      alignItems: 'center',
    },
    contactImagePlaceholderText: {
      color: colors.primaryButton,
      fontWeight: 'bold',
      fontSize: 18,
    },
    contactName: {
      color: colors.primaryText,
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 2,
    },
    contactPhone: {
      color: colors.secondaryText,
      fontSize: 14,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      minWidth: 70,
      justifyContent: 'center',
    },
    addButton: {
      backgroundColor: '#10B981', // Green
    },
    removeButton: {
      backgroundColor: '#EF4444', // Red
    },
    inviteButton: {
      backgroundColor: '#3B82F6', // Blue
    },
    actionButtonText: {
      color: 'white',
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 4,
    },
    bottomContainer: {
      padding: 16,
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.secondaryText + '20',
    },
    addSelectedButton: {
      backgroundColor: colors.primaryButton,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    addSelectedButtonLoading: {
      backgroundColor: colors.primaryButton + '80',
    },
    buttonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    addSelectedButtonText: {
      color: colors.primaryButtonText,
      fontWeight: '600',
      fontSize: 16,
    },
    loadingMore: {
      paddingVertical: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingMoreText: {
      fontSize: 14,
      color: colors.secondaryText,
      marginTop: 8,
    },
    loadMoreButton: {
      paddingVertical: 16,
      paddingHorizontal: 24,
      backgroundColor: colors.cardBackground,
      marginHorizontal: 16,
      marginVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.primaryButton,
    },
    loadMoreText: {
      fontSize: 14,
      color: colors.primaryButton,
      fontWeight: '600',
    },
  });
