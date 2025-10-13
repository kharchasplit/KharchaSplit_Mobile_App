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
  Share,
  Animated,
} from 'react-native';
import { launchImageLibrary, ImageLibraryOptions, Asset } from 'react-native-image-picker';
import { request, check, PERMISSIONS, RESULTS, openSettings } from 'react-native-permissions';
import Contacts, { Contact } from 'react-native-contacts';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { firebaseService, CreateGroup } from '../services/firebaseService';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ensureDataUri } from '../utils/imageUtils';
import { contactsCacheService } from '../services/contactsCacheService';

interface GroupData {
  name: string;
  description: string;
  numberOfMembers: string;
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
    numberOfMembers: '',
    coverImage: null,
    coverImageBase64: null,
  });

  const [selectedMembers, setSelectedMembers] = useState<FilteredContact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [filteredContacts, setFilteredContacts] = useState<FilteredContact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [permissionState, setPermissionState] = useState<{
    status: 'checking' | 'granted' | 'denied' | 'blocked' | 'unavailable';
    hasRequested: boolean;
    initialized: boolean;
  }>({ status: 'checking', hasRequested: false, initialized: false });

  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const permissionCheckRef = useRef<boolean>(false);
  const shimmerAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Initialize cache and check permissions once on mount
    if (!permissionState.initialized) {
      contactsCacheService.init();
      checkContactsPermission();
    }
  }, []); // Remove dependencies to prevent re-runs

  // Shimmer animation effect
  useEffect(() => {
    if (contactsLoading) {
      const shimmer = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnimation, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      shimmer.start();
      return () => shimmer.stop();
    }
  }, [contactsLoading, shimmerAnimation]);

  useEffect(() => {
    // Listen for app state changes to re-check permissions when returning from settings
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        permissionState.initialized &&
        (permissionState.status === 'blocked' || permissionState.status === 'denied')
      ) {
        setTimeout(() => {
          checkContactsPermission();
        }, 500); // Small delay to prevent rapid state changes
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [permissionState.initialized, permissionState.status]);

  const getContactsPermission = () => {
    return Platform.OS === 'android'
      ? PERMISSIONS.ANDROID.READ_CONTACTS
      : PERMISSIONS.IOS.CONTACTS;
  };

  const checkContactsPermission = async () => {
    // Prevent multiple simultaneous permission checks
    if (permissionCheckRef.current) {
      return;
    }

    try {
      permissionCheckRef.current = true;

      // Don't show checking state if already initialized to prevent blinking
      if (!permissionState.initialized) {
        setPermissionState(prev => ({ ...prev, status: 'checking' }));
      }

      const permission = getContactsPermission();
      const result = await check(permission);

      switch (result) {
        case RESULTS.GRANTED:
          setPermissionState({ status: 'granted', hasRequested: true, initialized: true });
          loadContacts();
          break;
        case RESULTS.BLOCKED:
          setPermissionState({ status: 'blocked', hasRequested: true, initialized: true });
          break;
        case RESULTS.UNAVAILABLE:
          setPermissionState({ status: 'unavailable', hasRequested: true, initialized: true });
          break;
        case RESULTS.DENIED:
        default:
          setPermissionState({ status: 'denied', hasRequested: false, initialized: true });
          break;
      }
    } catch (error) {
      setPermissionState({ status: 'denied', hasRequested: false, initialized: true });
    } finally {
      permissionCheckRef.current = false;
    }
  };

  const requestContactsPermission = async () => {
    try {
      const permission = getContactsPermission();
      const result = await request(permission);

      switch (result) {
        case RESULTS.GRANTED:
          setPermissionState({ status: 'granted', hasRequested: true, initialized: true });
          loadContacts();
          break;
        case RESULTS.DENIED:
          setPermissionState({ status: 'denied', hasRequested: true, initialized: true });
          showPermissionDeniedAlert();
          break;
        case RESULTS.BLOCKED:
          setPermissionState({ status: 'blocked', hasRequested: true, initialized: true });
          showPermissionBlockedAlert();
          break;
        case RESULTS.UNAVAILABLE:
          setPermissionState({ status: 'unavailable', hasRequested: true, initialized: true });
          showPermissionUnavailableAlert();
          break;
        default:
          setPermissionState({ status: 'denied', hasRequested: true, initialized: true });
          showPermissionDeniedAlert();
      }
    } catch (error) {
      setPermissionState({ status: 'denied', hasRequested: true, initialized: true });
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

  /**
   * Direct contacts permission request handler - triggers permission dialog immediately
   */
  const handleRequestContacts = async () => {
    try {
      setContactsLoading(true);
      // First request permission directly
      const permission = getContactsPermission();
      const result = await request(permission);

      if (result === RESULTS.GRANTED) {
        // Permission granted! Now fetch contacts
        setPermissionState({ status: 'granted', hasRequested: true, initialized: true });

        try {
          const contacts = await Contacts.getAll();

          // Process contacts with registration status together
          await processContactsWithRegistration(contacts);
        } catch (contactError: any) {
          Alert.alert('Error', 'Failed to load contacts. Please try again.');
        }
      } else if (result === RESULTS.BLOCKED) {
        // Permission permanently blocked
        setPermissionState({ status: 'blocked', hasRequested: true, initialized: true });

        Alert.alert(
          'Contacts Access Required',
          'Contacts access has been blocked. To add friends from your contacts, please enable contacts access in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => openSettings().catch(err => { })
            },
          ]
        );
      } else if (result === RESULTS.UNAVAILABLE) {
        // Contacts unavailable
        setPermissionState({ status: 'unavailable', hasRequested: true, initialized: true });

        Alert.alert(
          'Contacts Unavailable',
          'Contacts are not available on this device. You can still create groups by entering phone numbers manually.',
          [{ text: 'OK' }]
        );
      } else {
        // Permission denied
        setPermissionState({ status: 'denied', hasRequested: true, initialized: true });

        Alert.alert(
          'Contacts Access Denied',
          'You can still create groups, but you\'ll need to add members manually using phone numbers.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Try Again', onPress: handleRequestContacts }
          ]
        );
      }
    } catch (error: any) {
      setPermissionState({ status: 'denied', hasRequested: true, initialized: true });
      Alert.alert('Error', error.message || 'Failed to request contacts permission. Please try again.');
    } finally {
      setContactsLoading(false);
    }
  };

  const normalizePhoneNumber = (phoneNumber: string): string => {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');

    // Handle Indian phone numbers - normalize to 10-digit format without country code
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      // Remove country code 91
      cleaned = cleaned.substring(2);
    } else if (cleaned.startsWith('0') && cleaned.length === 11) {
      // Remove leading 0
      cleaned = cleaned.substring(1);
    } else if (cleaned.length === 10) {
      // Already in correct 10-digit format
    }

    return cleaned;
  };

  const loadContacts = async () => {
    setContactsLoading(true);
    try {
      // Get contacts from device
      const contactsList = await Contacts.getAll();

      // Process contacts and get Firebase data simultaneously
      await processContactsWithRegistration(contactsList);

      setContactsLoading(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to load contacts.');
      setContactsLoading(false);
    }
  };

  const processContactsWithRegistration = async (contactsList: Contact[]) => {
    try {
      console.log('[CreateGroup] Processing', contactsList.length, 'contacts with cache optimization');

      // Process contacts and separate cached from uncached
      const allContacts: FilteredContact[] = [];
      const uncachedPhones: string[] = [];
      const processedContactIds = new Set<string>();

      contactsList.forEach(contact => {
        if (contact.phoneNumbers?.length > 0 && !processedContactIds.has(contact.recordID)) {
          processedContactIds.add(contact.recordID);

          const primaryPhone = normalizePhoneNumber(contact.phoneNumbers[0].number);

          if (primaryPhone.length === 10) {
            // Check cache first
            const cached = contactsCacheService.get(primaryPhone);

            if (cached) {
              // Use cached data
              if (cached.userProfile?.id !== user?.id) {
                allContacts.push({
                  ...contact,
                  isRegistered: cached.isRegistered,
                  userProfile: cached.userProfile,
                });
              }
            } else {
              // Need to fetch from Firebase
              allContacts.push({
                ...contact,
                isRegistered: false,
                userProfile: undefined,
              });
              uncachedPhones.push(`+91${primaryPhone}`);
            }
          }
        }
      });

      console.log('[CreateGroup] Cached:', allContacts.filter(c => c.isRegistered).length, 'Uncached:', uncachedPhones.length);

      // Fetch only uncached contacts from Firebase
      if (uncachedPhones.length > 0) {
        console.log('[CreateGroup] Fetching', uncachedPhones.length, 'uncached from Firebase');

        const registeredUsers = await firebaseService.getUsersByPhoneNumbers(uncachedPhones);
        console.log('[CreateGroup] Found', registeredUsers.length, 'registered users');

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
        allContacts.forEach(contact => {
          const primaryPhone = normalizePhoneNumber(contact.phoneNumbers[0].number);
          if (registeredPhones.has(primaryPhone)) {
            contact.isRegistered = true;
            contact.userProfile = userProfileMap[primaryPhone];
          }
        });
      }

      // Filter out current user
      const finalContacts = allContacts.filter(contact => {
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

      console.log('[CreateGroup] Final:', sortedContacts.length, 'contacts,', sortedContacts.filter(c => c.isRegistered).length, 'registered');
      setFilteredContacts(sortedContacts);
    } catch (error) {
      console.error('[CreateGroup] Error processing contacts:', error);

      // Fallback: show all contacts without registration status
      const basicContacts: FilteredContact[] = contactsList
        .filter(contact => contact.phoneNumbers?.length > 0)
        .map(contact => ({
          ...contact,
          isRegistered: false,
          userProfile: undefined,
        }));

      setFilteredContacts(basicContacts);
    }
  };



  const handleInputChange = (field: keyof GroupData, value: string) => {
    setGroupData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSelectMember = (contact: FilteredContact) => {
    // Only allow adding registered members to group
    if (!contact.isRegistered) {
      return;
    }

    const isSelected = selectedMembers.find(member => member.recordID === contact.recordID);

    if (isSelected) {
      setSelectedMembers(prev => prev.filter(member => member.recordID !== contact.recordID));
    } else {
      setSelectedMembers(prev => [...prev, contact]);
    }
  };

  const handleInviteContact = async (contact: FilteredContact) => {
    try {
      const contactName = contact.displayName || 'Friend';
      const userReferralCode = user?.referralCode || user?.id || 'KHARCHASPLIT';

      // Create invitation message with referral code
      const inviteMessage = `Hi ${contactName}! 👋\n\nI'm using KharchaSplit to split expenses with friends and family. It's super easy to track shared costs and settle payments!\n\n🎁 Join using my referral code: ${userReferralCode}\n\nDownload KharchaSplit now:\n📱 Android: https://play.google.com/store/apps/details?id=com.kharchasplit\n🍎 iOS: https://apps.apple.com/app/kharchasplit\n\nLet's split smarter together! 💰`;

      // Share the invitation
      await Share.share({
        message: inviteMessage,
        title: 'Join KharchaSplit with my referral code!',
      });

    } catch (error) {
      Alert.alert('Error', 'Failed to share invitation. Please try again.');
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


      // Create group in Firebase
      const newGroup = await firebaseService.createGroup(createGroupData, user.id);


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
      Alert.alert('Error', error.message || 'Failed to create group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter contacts based on search query (all contacts - registered and unregistered)
  const searchFilteredContacts = filteredContacts.filter(contact => {
    // If no search query, show all contacts
    if (!searchQuery.trim()) {
      return true;
    }

    const searchLower = searchQuery.toLowerCase().trim();

    // Search by display name
    if (contact.displayName?.toLowerCase().includes(searchLower)) {
      return true;
    }

    // Search by registered user profile name
    if (contact.userProfile?.name?.toLowerCase().includes(searchLower)) {
      return true;
    }

    // Search by phone number (digits only)
    if (contact.phoneNumbers?.some(phone =>
      phone.number.replace(/\D/g, '').includes(searchQuery.replace(/\D/g, ''))
    )) {
      return true;
    }

    return false;
  });

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

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Cover Image Upload */}
        <View style={styles.coverImageSection}>
          <TouchableOpacity style={styles.coverImageContainer} onPress={openImagePicker}>
            {groupData.coverImageBase64 ? (
              <Image source={{ uri: ensureDataUri(groupData.coverImageBase64) || '' }} style={styles.coverImage} />
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

        {/* Number of Members */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Number of Members (Optional)</Text>
          <TextInput
            style={styles.input}
            value={groupData.numberOfMembers}
            onChangeText={value => {
              // Only allow numbers
              const numericValue = value.replace(/[^0-9]/g, '');
              handleInputChange('numberOfMembers', numericValue);
            }}
            placeholder="e.g., 4"
            placeholderTextColor={colors.secondaryText}
            keyboardType="numeric"
            maxLength={3}
          />
          <Text style={styles.helperText}>
            This helps you plan how many people you'll split expenses with
          </Text>
        </View>

        {/* Add Members Section */}
        <View style={styles.membersSection}>
          <Text style={styles.sectionTitle}>
            Add Members {selectedMembers.length > 0 && `(${selectedMembers.length} selected)`}
          </Text>

          {permissionState.status === 'granted' && (
            <Text style={styles.sectionSubtitle}>
              {groupData.numberOfMembers && parseInt(groupData.numberOfMembers) > 0 ? (
                selectedMembers.length >= parseInt(groupData.numberOfMembers) ? (
                  `✓ You've added ${selectedMembers.length}/${groupData.numberOfMembers} members`
                ) : (
                  `Add ${parseInt(groupData.numberOfMembers) - selectedMembers.length} more to reach your planned ${groupData.numberOfMembers} members`
                )
              ) : filteredContacts.length > 0 ? (
                `${filteredContacts.filter(c => c.isRegistered).length} registered • ${filteredContacts.filter(c => !c.isRegistered).length} can be invited`
              ) : (
                'Select registered contacts or invite friends to join KharchaSplit'
              )}
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
                autoCorrect={false}
                autoCapitalize="none"
              />
            </View>
          )}


          {permissionState.status === 'checking' && !permissionState.initialized ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primaryButton} />
              <Text style={styles.loadingText}>Checking permissions...</Text>
            </View>
          ) : permissionState.status === 'granted' ? (
            // Permission granted - show contacts or loading
            contactsLoading ? (
              // Skeleton loader for contacts
              <View>
                {[...Array(8)].map((_, index) => (
                  <View key={index} style={styles.skeletonContactItem}>
                    <Animated.View
                      style={[
                        styles.skeletonAvatar,
                        {
                          opacity: shimmerAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.3, 0.7],
                          }),
                        },
                      ]}
                    />
                    <View style={styles.skeletonContent}>
                      <Animated.View
                        style={[
                          styles.skeletonName,
                          {
                            opacity: shimmerAnimation.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.3, 0.7],
                            }),
                          },
                        ]}
                      />
                      <Animated.View
                        style={[
                          styles.skeletonPhone,
                          {
                            opacity: shimmerAnimation.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.3, 0.7],
                            }),
                          },
                        ]}
                      />
                    </View>
                    <Animated.View
                      style={[
                        styles.skeletonButton,
                        {
                          opacity: shimmerAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.3, 0.7],
                          }),
                        },
                      ]}
                    />
                  </View>
                ))}
              </View>
            ) : searchFilteredContacts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.noContactsText}>
                  {filteredContacts.length === 0
                    ? "No contacts found"
                    : "No matching contacts"}
                </Text>
                <Text style={styles.noContactsSubtext}>
                  {filteredContacts.length === 0
                    ? "Make sure you have contacts with phone numbers"
                    : "Try a different search term"}
                </Text>
              </View>
            ) : (
              searchFilteredContacts.map(contact => (
                <View key={contact.recordID} style={styles.contactItem}>
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
                  <View style={styles.contactActions}>
                    {contact.isRegistered ? (
                      // Registered user - show Add/Remove button
                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          selectedMembers.find(m => m.recordID === contact.recordID)
                            ? styles.removeButton
                            : styles.addButton
                        ]}
                        onPress={() => handleSelectMember(contact)}
                      >
                        <Ionicons
                          name={selectedMembers.find(m => m.recordID === contact.recordID) ? "checkmark" : "add"}
                          size={16}
                          color="white"
                        />
                        <Text style={styles.actionButtonText}>
                          {selectedMembers.find(m => m.recordID === contact.recordID) ? 'Added' : 'Add'}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      // Unregistered user - show Invite button
                      <TouchableOpacity
                        style={[styles.actionButton, styles.inviteButton]}
                        onPress={() => handleInviteContact(contact)}
                      >
                        <Ionicons name="share-outline" size={16} color="white" />
                        <Text style={styles.actionButtonText}>Invite</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            )
          ) : (
            // Permission not granted - show permission UI
            <View style={styles.permissionContainer}>
              {permissionState.status === 'denied' && !permissionState.hasRequested ? (
                <>
                  <Ionicons name="contacts" size={48} color={colors.secondaryText} />
                  <Text style={styles.permissionTitle}>Access Your Contacts</Text>
                  <Text style={styles.permissionMessage}>
                    Find friends who are already using KharchaSplit and add them to your group easily.
                  </Text>
                  <TouchableOpacity
                    style={[styles.permissionButton, contactsLoading && styles.saveButtonDisabled]}
                    onPress={handleRequestContacts}
                    disabled={contactsLoading}
                  >
                    {contactsLoading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.permissionButtonText}>Allow Access</Text>
                    )}
                  </TouchableOpacity>
                </>
              ) : permissionState.status === 'denied' && permissionState.hasRequested ? (
                <>
                  <Ionicons name="contacts" size={48} color={colors.secondaryText} />
                  <Text style={styles.permissionTitle}>Contacts Access Denied</Text>
                  <Text style={styles.permissionMessage}>
                    You can still create groups, but you'll need to add members manually using phone numbers.
                  </Text>
                  <TouchableOpacity style={styles.permissionButton} onPress={handleRequestContacts}>
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
          )}
        </View>

      </ScrollView>

      {/* Fixed Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, loading && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={loading}>
        {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveButtonText}>Create Group</Text>}
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { paddingBottom: 100 }, // Add padding to prevent content from being hidden behind fixed button
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
    helperText: {
      fontSize: 12,
      color: colors.secondaryText,
      marginTop: 6,
      fontStyle: 'italic',
    },
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
      paddingHorizontal: 4,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBackground,
    },
    contactInfo: {
      flex: 1,
    },
    contactName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primaryText,
      marginBottom: 4,
    },
    contactPhone: {
      fontSize: 14,
      color: colors.secondaryText,
    },
    contactActions: {
      marginLeft: 12,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 16,
      minWidth: 70,
      justifyContent: 'center',
    },
    addButton: {
      backgroundColor: colors.success,
    },
    removeButton: {
      backgroundColor: colors.secondaryText,
    },
    inviteButton: {
      backgroundColor: colors.primaryButton,
    },
    actionButtonText: {
      color: 'white',
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 4,
    },
    contactStatus: {
      flexDirection: 'row',
      alignItems: 'center',
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
    loadingSubtext: {
      fontSize: 12,
      color: colors.secondaryText,
      marginTop: 4,
      textAlign: 'center',
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
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.primaryButton,
      marginHorizontal: 16,
      marginBottom: 34, // Safe area padding for bottom
      paddingVertical: 16,
      borderRadius: 8,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 8,
    },
    saveButtonText: { color: colors.primaryButtonText, fontSize: 16, fontWeight: '600' },
    saveButtonDisabled: { opacity: 0.6 },
    permissionText: { textAlign: 'center', color: colors.secondaryText, marginTop: 16 },
    noContactsText: { textAlign: 'center', color: colors.secondaryText, marginTop: 16 },
    // Skeleton loader styles
    skeletonContactItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 4,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBackground,
    },
    skeletonAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.cardBackground,
      marginRight: 12,
    },
    skeletonContent: {
      flex: 1,
    },
    skeletonName: {
      height: 16,
      backgroundColor: colors.cardBackground,
      borderRadius: 4,
      marginBottom: 8,
      width: '70%',
    },
    skeletonPhone: {
      height: 14,
      backgroundColor: colors.cardBackground,
      borderRadius: 4,
      width: '50%',
    },
    skeletonButton: {
      width: 70,
      height: 32,
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      marginLeft: 12,
    },
  });
