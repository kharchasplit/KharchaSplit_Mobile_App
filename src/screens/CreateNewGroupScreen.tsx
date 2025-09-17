import React, { useState, useEffect, useRef } from 'react';
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
  AppState,
  AppStateStatus,
} from 'react-native';
import { launchImageLibrary, ImageLibraryOptions, Asset } from 'react-native-image-picker';
import { request, PERMISSIONS, RESULTS, check, openSettings } from 'react-native-permissions';
import Contacts, { Contact } from 'react-native-contacts';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { firebaseService, CreateGroup } from '../services/firebaseService';
import { SafeAreaView } from 'react-native-safe-area-context';

interface GroupData {
  name: string;
  description: string;
  coverImage: string | null;
  coverImageBase64: string | null;
}

interface CreateNewGroupScreenProps {
  onClose?: () => void;
  onSave?: (group: any) => void;
}

interface FilteredContact extends Contact {
  isRegistered: boolean;
  userProfile?: any;
}

export const CreateNewGroupScreen: React.FC<CreateNewGroupScreenProps> = ({ onClose, onSave }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [groupData, setGroupData] = useState<GroupData>({
    name: '',
    description: '',
    coverImage: null,
    coverImageBase64: null,
  });

  const [selectedMembers, setSelectedMembers] = useState<FilteredContact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<FilteredContact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsFilterLoading, setContactsFilterLoading] = useState(false);
  const [permissionState, setPermissionState] = useState<{
    status: 'checking' | 'granted' | 'denied' | 'blocked' | 'unavailable';
    hasRequested: boolean;
  }>({ status: 'checking', hasRequested: false });

  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    checkContactsPermission();

    // Listen for app state changes to re-check permissions when returning from settings
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appStateRef.current.match(/inactive|background/) && 
        nextAppState === 'active' &&
        (permissionState.status === 'blocked' || permissionState.status === 'denied')
      ) {
        console.log('App came to foreground, re-checking contacts permission...');
        checkContactsPermission();
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [permissionState.status]);

  const getContactsPermission = () => {
    return Platform.OS === 'android' 
      ? PERMISSIONS.ANDROID.READ_CONTACTS 
      : PERMISSIONS.IOS.CONTACTS;
  };

  const checkContactsPermission = async () => {
    try {
      setPermissionState(prev => ({ ...prev, status: 'checking' }));
      
      const permission = getContactsPermission();
      const result = await check(permission);
      
      console.log('Contacts permission check result:', result);
      
      switch (result) {
        case RESULTS.GRANTED:
          setPermissionState({ status: 'granted', hasRequested: true });
          loadContacts();
          break;
        case RESULTS.DENIED:
          setPermissionState({ status: 'denied', hasRequested: false });
          break;
        case RESULTS.BLOCKED:
          setPermissionState({ status: 'blocked', hasRequested: true });
          break;
        case RESULTS.UNAVAILABLE:
          setPermissionState({ status: 'unavailable', hasRequested: true });
          break;
        default:
          setPermissionState({ status: 'denied', hasRequested: false });
      }
    } catch (error) {
      console.error('Error checking contacts permission:', error);
      setPermissionState({ status: 'denied', hasRequested: false });
    }
  };

  const requestContactsPermission = async () => {
    try {
      console.log('Requesting contacts permission...');
      
      const permission = getContactsPermission();
      const result = await request(permission);
      
      console.log('Contacts permission request result:', result);
      
      setPermissionState(prev => ({ ...prev, hasRequested: true }));
      
      switch (result) {
        case RESULTS.GRANTED:
          setPermissionState({ status: 'granted', hasRequested: true });
          loadContacts();
          break;
        case RESULTS.DENIED:
          setPermissionState({ status: 'denied', hasRequested: true });
          showPermissionDeniedAlert();
          break;
        case RESULTS.BLOCKED:
          setPermissionState({ status: 'blocked', hasRequested: true });
          showPermissionBlockedAlert();
          break;
        case RESULTS.UNAVAILABLE:
          setPermissionState({ status: 'unavailable', hasRequested: true });
          showPermissionUnavailableAlert();
          break;
        default:
          setPermissionState({ status: 'denied', hasRequested: true });
          showPermissionDeniedAlert();
      }
    } catch (error) {
      console.error('Error requesting contacts permission:', error);
      setPermissionState({ status: 'denied', hasRequested: true });
      Alert.alert('Error', 'Failed to request contacts permission. Please try again.');
    }
  };

  const showPermissionDeniedAlert = () => {
    Alert.alert(
      'Contacts Access Required',
      'To add members to your group, we need access to your contacts. This helps you find friends who are already using KharchaSplit.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Grant Access', onPress: requestContactsPermission },
      ]
    );
  };

  const showPermissionBlockedAlert = () => {
    Alert.alert(
      'Contacts Access Blocked',
      'Contacts access has been permanently denied. To add members, please enable contacts access in your device settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => openSettings() },
      ]
    );
  };

  const showPermissionUnavailableAlert = () => {
    Alert.alert(
      'Contacts Unavailable',
      'Contacts are not available on this device. You can still create groups, but you\'ll need to add members manually.',
      [{ text: 'OK' }]
    );
  };

  const normalizePhoneNumber = (phoneNumber: string): string => {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Handle Indian phone numbers
    if (cleaned.length === 10 && !cleaned.startsWith('91')) {
      cleaned = '91' + cleaned;
    } else if (cleaned.startsWith('0') && cleaned.length === 11) {
      // Remove leading 0 and add 91
      cleaned = '91' + cleaned.substring(1);
    } else if (cleaned.startsWith('+91')) {
      cleaned = cleaned.substring(3);
    } else if (cleaned.startsWith('91') && cleaned.length === 12) {
      // Already in correct format
    }
    
    return cleaned;
  };

  const loadContacts = async () => {
    setContactsLoading(true);
    try {
      const contactsList = await Contacts.getAll();
      setContacts(contactsList);
      
      // After loading contacts, filter them based on Firebase users
      await filterContactsByFirebaseUsers(contactsList);
    } catch (error) {
      console.error('Error loading contacts:', error);
      Alert.alert('Error', 'Failed to load contacts.');
    } finally {
      setContactsLoading(false);
    }
  };

  const filterContactsByFirebaseUsers = async (contactsList: Contact[]) => {
    setContactsFilterLoading(true);
    try {
      console.log('Filtering contacts against Firebase users...');
      
      // Extract all phone numbers from contacts
      const phoneNumbers: string[] = [];
      const contactPhoneMap: { [key: string]: Contact } = {};
      
      contactsList.forEach(contact => {
        if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
          contact.phoneNumbers.forEach(phone => {
            const normalizedPhone = normalizePhoneNumber(phone.number);
            if (normalizedPhone.length >= 10) {
              phoneNumbers.push(normalizedPhone);
              contactPhoneMap[normalizedPhone] = contact;
            }
          });
        }
      });

      console.log(`Extracted ${phoneNumbers.length} phone numbers from ${contactsList.length} contacts`);

      // Check which phone numbers exist in Firebase
      const existingPhoneNumbers = await firebaseService.getExistingPhoneNumbers(phoneNumbers);
      const registeredUsers = await firebaseService.getUsersByPhoneNumbers(existingPhoneNumbers);
      
      // Create user profile map
      const userProfileMap: { [key: string]: any } = {};
      registeredUsers.forEach(userProfile => {
        userProfileMap[userProfile.phoneNumber] = userProfile;
      });

      // Create filtered contacts with registration status
      const filtered: FilteredContact[] = [];
      const processedContactIds = new Set<string>();

      existingPhoneNumbers.forEach(phoneNumber => {
        const contact = contactPhoneMap[phoneNumber];
        if (contact && !processedContactIds.has(contact.recordID)) {
          processedContactIds.add(contact.recordID);
          
          // Skip current user
          if (user && userProfileMap[phoneNumber] && userProfileMap[phoneNumber].id === user.id) {
            return;
          }

          filtered.push({
            ...contact,
            isRegistered: true,
            userProfile: userProfileMap[phoneNumber],
          });
        }
      });

      console.log(`Found ${filtered.length} registered contacts out of ${contactsList.length} total contacts`);
      setFilteredContacts(filtered);
    } catch (error) {
      console.error('Error filtering contacts:', error);
      // If filtering fails, show all contacts with isRegistered: false
      const fallbackFiltered: FilteredContact[] = contactsList.map(contact => ({
        ...contact,
        isRegistered: false,
      }));
      setFilteredContacts(fallbackFiltered);
    } finally {
      setContactsFilterLoading(false);
    }
  };

  const handleInputChange = (field: keyof GroupData, value: string) => {
    setGroupData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSelectMember = (contact: FilteredContact) => {
    const isSelected = selectedMembers.find(member => member.recordID === contact.recordID);

    if (isSelected) {
      setSelectedMembers(prev => prev.filter(member => member.recordID !== contact.recordID));
    } else {
      setSelectedMembers(prev => [...prev, contact]);
    }
  };

  const openImagePicker = () => {
    const options: ImageLibraryOptions = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1000,
      maxHeight: 1000,
      includeBase64: true, // This will include base64 in the response
    };

    launchImageLibrary(options, response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorMessage) {
        Alert.alert('Error', 'Failed to select image');
      } else if (response.assets && response.assets[0]) {
        const asset: Asset = response.assets[0];
        if (asset.uri && asset.base64) {
          const base64Image = `data:${asset.type || 'image/jpeg'};base64,${asset.base64}`;
          setGroupData(prev => ({
            ...prev,
            coverImage: asset.uri || null,
            coverImageBase64: base64Image,
          }));
        }
      }
    });
  };

  const handleSave = async () => {
    if (!groupData.name.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      setLoading(true);

      // Extract phone numbers from selected contacts
      const memberPhoneNumbers: string[] = [];
      selectedMembers.forEach(contact => {
        if (contact.userProfile) {
          // Use the phone number from Firebase user profile for accuracy
          memberPhoneNumbers.push(contact.userProfile.phoneNumber);
        } else if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
          // Fallback to normalized phone number from contact
          const normalizedPhone = normalizePhoneNumber(contact.phoneNumbers[0].number);
          if (normalizedPhone.length >= 10) {
            memberPhoneNumbers.push(normalizedPhone);
          }
        }
      });

      // Prepare group data for Firebase
      const createGroupData: CreateGroup = {
        name: groupData.name.trim(),
        description: groupData.description.trim() || undefined,
        coverImageBase64: groupData.coverImageBase64 || undefined,
        memberPhoneNumbers,
        currency: 'INR',
      };

      console.log('Creating group with data:', {
        ...createGroupData,
        memberPhoneNumbers: memberPhoneNumbers.length,
        createdBy: user.id
      });

      // Create group in Firebase
      const newGroup = await firebaseService.createGroup(createGroupData, user.id);

      console.log('Group created successfully:', newGroup.id);

      Alert.alert(
        'Success', 
        `Group "${newGroup.name}" created successfully with ${newGroup.members.length} member(s)!`, 
        [
          {
            text: 'OK',
            onPress: () => {
              if (onSave) onSave(newGroup);
              if (onClose) onClose();
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Error creating group:', error);
      Alert.alert('Error', error.message || 'Failed to create group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter contacts based on search query (only registered contacts)
  const searchFilteredContacts = filteredContacts.filter(contact =>
    contact.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (contact.userProfile?.name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
    contact.phoneNumbers?.some(phone => 
      phone.number.replace(/\D/g, '').includes(searchQuery.replace(/\D/g, ''))
    )
  );

  const styles = createStyles(colors);
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create New Group</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Cover Image Upload */}
        <View style={styles.coverImageSection}>
          <TouchableOpacity style={styles.coverImageContainer} onPress={openImagePicker}>
            {groupData.coverImage ? (
              <Image source={{ uri: groupData.coverImage }} style={styles.coverImage} />
            ) : (
              <>
                <View style={styles.uploadIcon}>
                  <Ionicons name="camera" size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.uploadText}>Upload cover image</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Group Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Group Name</Text>
          <TextInput
            style={styles.input}
            value={groupData.name}
            onChangeText={value => handleInputChange('name', value)}
            placeholder="Trip to Busan 🚗"
            placeholderTextColor={colors.secondaryText}
          />
        </View>

        {/* Group Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Group Description</Text>
          <TextInput
            style={[styles.input, styles.descriptionInput]}
            value={groupData.description}
            onChangeText={value => handleInputChange('description', value)}
            placeholder="Add short description"
            placeholderTextColor={colors.secondaryText}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Add Members Section */}
        <View style={styles.membersSection}>
          <Text style={styles.sectionTitle}>
            Add Members {selectedMembers.length > 0 && `(${selectedMembers.length} selected)`}
          </Text>
          
          {permissionState.status === 'granted' && (
            <Text style={styles.sectionSubtitle}>
              Select from your contacts who are already using KharchaSplit
            </Text>
          )}

          {/* Search Bar - only show when permission is granted */}
          {permissionState.status === 'granted' && (
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={colors.secondaryText} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search Person or Phone Number"
                placeholderTextColor={colors.secondaryText}
              />
            </View>
          )}

          {permissionState.status === 'checking' ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primaryButton} />
              <Text style={styles.loadingText}>Checking permissions...</Text>
            </View>
          ) : permissionState.status !== 'granted' ? (
            <View style={styles.permissionContainer}>
              {permissionState.status === 'denied' && !permissionState.hasRequested ? (
                <>
                  <Ionicons name="contacts" size={48} color={colors.secondaryText} />
                  <Text style={styles.permissionTitle}>Access Your Contacts</Text>
                  <Text style={styles.permissionMessage}>
                    Find friends who are already using KharchaSplit and add them to your group easily.
                  </Text>
                  <TouchableOpacity style={styles.permissionButton} onPress={requestContactsPermission}>
                    <Text style={styles.permissionButtonText}>Allow Access</Text>
                  </TouchableOpacity>
                </>
              ) : permissionState.status === 'denied' && permissionState.hasRequested ? (
                <>
                  <Ionicons name="contacts" size={48} color={colors.secondaryText} />
                  <Text style={styles.permissionTitle}>Contacts Access Denied</Text>
                  <Text style={styles.permissionMessage}>
                    You can still create groups, but you'll need to add members manually using phone numbers.
                  </Text>
                  <TouchableOpacity style={styles.permissionButton} onPress={requestContactsPermission}>
                    <Text style={styles.permissionButtonText}>Try Again</Text>
                  </TouchableOpacity>
                </>
              ) : permissionState.status === 'blocked' ? (
                <>
                  <Ionicons name="settings" size={48} color={colors.secondaryText} />
                  <Text style={styles.permissionTitle}>Enable in Settings</Text>
                  <Text style={styles.permissionMessage}>
                    Contacts access is blocked. Please enable it in your device settings to add members from contacts.
                  </Text>
                  <TouchableOpacity style={styles.permissionButton} onPress={() => openSettings()}>
                    <Text style={styles.permissionButtonText}>Open Settings</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Ionicons name="alert-circle" size={48} color={colors.secondaryText} />
                  <Text style={styles.permissionTitle}>Contacts Unavailable</Text>
                  <Text style={styles.permissionMessage}>
                    Contacts are not available on this device. You can still create groups without selecting from contacts.
                  </Text>
                </>
              )}
            </View>
          ) : contactsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primaryButton} />
              <Text style={styles.loadingText}>Loading contacts...</Text>
            </View>
          ) : contactsFilterLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primaryButton} />
              <Text style={styles.loadingText}>Finding registered users...</Text>
            </View>
          ) : searchFilteredContacts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.noContactsText}>
                {filteredContacts.length === 0 
                  ? "No registered contacts found" 
                  : "No matching contacts"}
              </Text>
              <Text style={styles.noContactsSubtext}>
                {filteredContacts.length === 0 
                  ? "Invite your friends to join KharchaSplit!"
                  : "Try a different search term"}
              </Text>
            </View>
          ) : (
            searchFilteredContacts.map(contact => (
              <TouchableOpacity
                key={contact.recordID}
                style={styles.contactItem}
                onPress={() => handleSelectMember(contact)}>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>
                    {contact.userProfile?.name || contact.displayName}
                  </Text>
                  {contact.phoneNumbers && contact.phoneNumbers[0] && (
                    <Text style={styles.contactPhone}>
                      {contact.phoneNumbers[0].number}
                    </Text>
                  )}
                </View>
                <View style={styles.contactStatus}>
                  <View style={styles.registeredBadge}>
                    <Text style={styles.registeredText}>✓ Registered</Text>
                  </View>
                  {selectedMembers.find(m => m.recordID === contact.recordID) && (
                    <View style={{ marginLeft: 8 }}>
                      <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}>
          {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveButtonText}>Save</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.cardBackground,
      borderBottomWidth: 0,
      borderBottomColor: colors.secondaryText,
    },
    backButton: { padding: 8, borderRadius: 8 },
    headerTitle: { fontSize: 18, fontWeight: '600', color: colors.primaryText },
    placeholder: { width: 40 },
    scrollView: { flex: 1 },
    coverImageSection: { alignItems: 'center', paddingVertical: 32 },
    coverImageContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.cardBackground,
      justifyContent: 'center',
      alignItems: 'center',
    },
    uploadIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.secondaryText,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    uploadText: { fontSize: 14, color: colors.secondaryText, textAlign: 'center' },
    coverImage: { width: 120, height: 120, borderRadius: 60 },
    inputGroup: { paddingHorizontal: 16, marginBottom: 20 },
    label: { fontSize: 14, color: colors.secondaryText, marginBottom: 8, fontWeight: '500' },
    input: {
      borderWidth: 1,
      borderColor: colors.cardBackground,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.primaryText,
      backgroundColor: colors.cardBackground,
    },
    descriptionInput: { height: 100, textAlignVertical: 'top' },
    membersSection: { paddingHorizontal: 16, marginBottom: 24 },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.primaryText, marginBottom: 8 },
    sectionSubtitle: { 
      fontSize: 14, 
      color: colors.secondaryText, 
      marginBottom: 16,
      lineHeight: 18,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.cardBackground,
      borderRadius: 25,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginBottom: 16,
    },
    searchInput: { flex: 1, fontSize: 16, color: colors.primaryText, marginLeft: 8 },
    searchIcon: { marginRight: 8 },
    contactItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBackground,
    },
    contactInfo: {
      flex: 1,
    },
    contactName: { 
      fontSize: 16, 
      fontWeight: '600', 
      color: colors.primaryText 
    },
    contactPhone: {
      fontSize: 14,
      color: colors.secondaryText,
      marginTop: 2,
    },
    contactStatus: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    registeredBadge: {
      backgroundColor: colors.success,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
    },
    registeredText: {
      fontSize: 12,
      color: '#FFFFFF',
      fontWeight: '500',
    },
    loadingContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
    },
    loadingText: {
      fontSize: 14,
      color: colors.secondaryText,
      marginTop: 8,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
      paddingHorizontal: 20,
    },
    noContactsSubtext: {
      fontSize: 14,
      color: colors.secondaryText,
      textAlign: 'center',
      marginTop: 8,
      lineHeight: 20,
    },
    permissionContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
      paddingHorizontal: 20,
    },
    permissionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.primaryText,
      marginTop: 16,
      marginBottom: 8,
      textAlign: 'center',
    },
    permissionMessage: {
      fontSize: 14,
      color: colors.secondaryText,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 20,
    },
    permissionButton: {
      backgroundColor: colors.primaryButton,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      minWidth: 120,
    },
    permissionButtonText: {
      color: colors.primaryButtonText,
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
    },
    saveButton: {
      backgroundColor: colors.primaryButton,
      marginHorizontal: 16,
      marginVertical: 24,
      paddingVertical: 16,
      borderRadius: 8,
      alignItems: 'center',
    },
    saveButtonText: { color: colors.primaryButtonText, fontSize: 16, fontWeight: '600' },
    saveButtonDisabled: { opacity: 0.6 },
    permissionText: { textAlign: 'center', color: colors.secondaryText, marginTop: 16 },
    noContactsText: { textAlign: 'center', color: colors.secondaryText, marginTop: 16 },
  });
