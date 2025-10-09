import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<FilteredContact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [hasContactsPermission, setHasContactsPermission] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('[AddMember] Screen mounted');
    console.log('[AddMember] Group prop:', JSON.stringify(group));
    console.log('[AddMember] Has contacts permission:', hasContactsPermission);
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
      setContacts(mappedContacts);
      await processContactsWithRegistration(mappedContacts);
    } catch (error) {
      Alert.alert('Error', 'Failed to load contacts');
    } finally {
      setContactsLoading(false);
    }
  };

  const processContactsWithRegistration = async (contactsList: Contact[]) => {
    try {
      console.log('[AddMember] Starting processContactsWithRegistration with', contactsList.length, 'contacts');
      console.log('[AddMember] Group ID:', group.id);

      // Get current group members to exclude them
      const currentGroup = await firebaseService.getGroupById(group.id);
      if (!currentGroup) {
        console.error('[AddMember] Group not found for ID:', group.id);
        Alert.alert('Error', 'Group not found. Please go back and try again.');
        return;
      }

      console.log('[AddMember] Current group members:', currentGroup.members.length);

      const existingMemberPhones = new Set(currentGroup.members.map(member =>
        normalizePhoneNumber(member.phoneNumber)
      ));

      // Process all contacts first
      const allContacts: FilteredContact[] = [];
      const phoneNumbers: string[] = [];
      const processedContactIds = new Set<string>();

      contactsList.forEach(contact => {
        if (contact.phoneNumbers?.length > 0 && !processedContactIds.has(contact.recordID)) {
          processedContactIds.add(contact.recordID);

          const primaryPhone = normalizePhoneNumber(contact.phoneNumbers[0].number);

          // Skip if contact is already a member or is current user
          if (primaryPhone.length === 10 && !existingMemberPhones.has(primaryPhone)) {
            // Format phone number with country code for Firebase query
            const formattedPhone = `+91${primaryPhone}`;
            phoneNumbers.push(formattedPhone);
            allContacts.push({
              ...contact,
              isRegistered: false,
              userProfile: undefined,
            });
          }
        }
      });

      if (phoneNumbers.length > 0) {
        console.log('[AddMember] Querying Firebase for', phoneNumbers.length, 'phone numbers');
        console.log('[AddMember] Sample phone numbers:', phoneNumbers.slice(0, 3));

        // Get registered users from Firebase (with +91 format)
        const registeredUsers = await firebaseService.getUsersByPhoneNumbers(phoneNumbers);
        console.log('[AddMember] Found', registeredUsers.length, 'registered users');

        const registeredPhones = new Set<string>();
        const userProfileMap: { [key: string]: any } = {};

        // Process registered users - map by normalized phone for easy lookup
        registeredUsers.forEach(userProfile => {
          const normalizedPhone = normalizePhoneNumber(userProfile.phoneNumber);
          registeredPhones.add(normalizedPhone);
          userProfileMap[normalizedPhone] = userProfile;
        });

        // Update all contacts with registration status
        const finalContacts = allContacts
          .map(contact => {
            const primaryPhone = normalizePhoneNumber(contact.phoneNumbers[0].number);
            const isRegistered = registeredPhones.has(primaryPhone);

            // Skip current user
            if (user && userProfileMap[primaryPhone] && userProfileMap[primaryPhone].id === user.id) {
              return null;
            }

            return {
              ...contact,
              isRegistered,
              userProfile: isRegistered ? userProfileMap[primaryPhone] : undefined,
            };
          })
          .filter(Boolean) as FilteredContact[];

        // Sort: registered first, then unregistered
        const sortedContacts = finalContacts.sort((a, b) => {
          if (a.isRegistered && !b.isRegistered) return -1;
          if (!a.isRegistered && b.isRegistered) return 1;
          return 0;
        });

        console.log('[AddMember] Setting', sortedContacts.length, 'filtered contacts');
        console.log('[AddMember] Registered contacts:', sortedContacts.filter(c => c.isRegistered).length);
        setFilteredContacts(sortedContacts);
      } else {
        console.log('[AddMember] No valid phone numbers found, setting', allContacts.length, 'contacts');
        // No valid phone numbers, show all contacts
        setFilteredContacts(allContacts);
      }
    } catch (error) {
      console.error('[AddMember] Error processing contacts with registration:', error);
      // Show contacts without registration status as fallback
      const basicContacts: FilteredContact[] = [];
      contactsList.forEach(contact => {
        if (contact.phoneNumbers?.length > 0) {
          const primaryPhone = normalizePhoneNumber(contact.phoneNumbers[0].number);
          if (primaryPhone.length === 10) {
            basicContacts.push({
              ...contact,
              isRegistered: false,
              userProfile: undefined,
            });
          }
        }
      });
      setFilteredContacts(basicContacts);
    }
  };

  const formatPhoneNumber = (phoneNumber: string): string => {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');

    // If number starts with country code, keep it as is
    // If it's 10 digits, add +91 for India
    if (cleaned.length === 10) {
      return `+91${cleaned}`;
    } else if (cleaned.length > 10 && cleaned.startsWith('91')) {
      return `+${cleaned}`;
    } else if (cleaned.length > 10) {
      return `+${cleaned}`;
    }

    return cleaned;
  };

  const handleSelectMember = (contact: FilteredContact) => {
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
  };

  const handleInviteContact = async (contact: FilteredContact) => {
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

  const searchFilteredContacts = filteredContacts.filter(contact => {
    const name = (contact.userProfile?.name || contact.displayName).toLowerCase();
    const phone = contact.phoneNumbers?.[0]?.number || '';
    const query = searchQuery.toLowerCase();

    return name.includes(query) || phone.includes(query);
  });

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

      <ScrollView style={styles(colors).scrollView}>
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

        {/* Contacts */}
        {contactsLoading ? (
          <View style={styles(colors).loadingContainer}>
            <ActivityIndicator size="large" color={colors.primaryButton} />
            <Text style={styles(colors).loadingText}>Loading contacts...</Text>
          </View>
        ) : searchFilteredContacts.length === 0 ? (
          <View style={styles(colors).emptyContainer}>
            <Ionicons name="people-outline" size={64} color={colors.secondaryText} />
            <Text style={styles(colors).emptyTitle}>No contacts found</Text>
            <Text style={styles(colors).emptyDescription}>
              {searchQuery ? 'Try adjusting your search terms.' : 'Allow contacts permission to see your friends.'}
            </Text>
          </View>
        ) : (
          searchFilteredContacts.map(contact => {
            const isSelected = selectedMembers.find(m => m.recordID === contact.recordID);
            const phoneNumber = contact.phoneNumbers?.[0]?.number || 'No phone number';
            const displayName = contact.userProfile?.name || contact.displayName;

            return (
              <View key={contact.recordID} style={styles(colors).contactItem}>
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
                    // Registered user - show Add/Remove button
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
                    // Unregistered user - show Invite button
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
          })
        )}
      </ScrollView>

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
  });
