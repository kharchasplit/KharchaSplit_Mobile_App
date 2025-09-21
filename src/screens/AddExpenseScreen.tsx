import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
  Modal,
  FlatList,
  useWindowDimensions,
  // --- NEW IMPORT ---
  UIManager,
  LayoutAnimation,
  Platform, // <-- ADD THIS LINE
} from "react-native";

import { useTheme } from '../context/ThemeContext';
import { launchImageLibrary } from "react-native-image-picker";
import Ionicons from "react-native-vector-icons/Ionicons";
import { SafeAreaView } from "react-native-safe-area-context";
import { typography } from '../utils/typography';
import { firebaseService, GroupExpense } from '../services/firebaseService';
import { useAuth } from '../context/AuthContext';
import { pickReceiptImage, formatFileSize, validateReceiptImage } from '../utils/imageUtils';

// Enable LayoutAnimation for Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// (Interfaces remain the same)
interface Member {
  id: string;
  name: string;
  avatar?: string;
  isYou?: boolean;
  isSelected?: boolean;
  amount?: number;
  percentage?: number;
  shares?: number;
}



interface AddExpenseScreenProps {
  route: { 
    params?: { 
      group?: { id: string; name: string };
      onReturn?: () => void;
    } 
  };
  navigation: any;
}

export const AddExpenseScreen: React.FC<AddExpenseScreenProps> = ({ route, navigation }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { group } = route.params || {};

  // (Responsive setup remains the same)
  const { width: screenWidth } = useWindowDimensions();
  const baseWidth = 375;
  const scale = (size: number) => (screenWidth / baseWidth) * size;

  const scaledFontSize = {
    xs: scale(typography.fontSize.xs),
    sm: scale(typography.fontSize.sm),
    base: scale(typography.fontSize.base),
    lg: scale(typography.fontSize.lg),
    xl: scale(typography.fontSize.xl),
    '2xl': scale(typography.fontSize['2xl']),
    header: scale(typography.text.header.fontSize),
    headerLarge: scale(typography.text.headerLarge.fontSize),
    title: scale(typography.text.title.fontSize),
    subtitle: scale(typography.text.subtitle.fontSize),
    body: scale(typography.text.body.fontSize),
    caption: scale(typography.text.caption.fontSize),
    button: scale(typography.text.button.fontSize),
  };

  // (State declarations)
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [selectedCurrency, setSelectedCurrency] = useState({ code: "INR", symbol: "₹" });
  const [paidBy, setPaidBy] = useState<Member | null>(null);
  const [splitType, setSplitType] = useState("Equal");
  const [members, setMembers] = useState<Member[]>([]);
  const [groupMembers, setGroupMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState(true);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [receiptSize, setReceiptSize] = useState<number>(0);

  const [showPayerModal, setShowPayerModal] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  
  // --- NEW STATE ---
  // For the "Specify Other" text input
  const [otherCategoryName, setOtherCategoryName] = useState("");
  // --- END NEW STATE ---
  
  // (categories, currencies, splitTypes definitions remain the same)
  const categories = [
    { id: 1, name: "Food", emoji: "🍽️", color: "#FEF3C7" },
    { id: 2, name: "Transportation", emoji: "🚗", color: "#FECACA" },
    { id: 3, name: "Shopping", emoji: "🛍️", color: "#E0E7FF" },
    { id: 4, name: "Drinks", emoji: "🍺", color: "#FED7AA" },
    { id: 5, name: "Entertainment", emoji: "🎬", color: "#F3E8FF" },
    { id: 6, name: "Health", emoji: "🏥", color: "#FECACA" },
    { id: 7, name: "Other", emoji: "📝", color: "#F3F4F6" }, // This one triggers the new field
  ];

  const currencies = [
    { code: "INR", symbol: "₹", name: "Indian Rupee" },
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "EUR", symbol: "€", name: "Euro" },
  ];
  
  const splitTypes = ["Equal", "Unequal", "By Percentage", "By Share"];
  
  const getInitials = (name: string) => {
    // ... (unchanged)
    const names = name.split(' ');
    if (names.length === 1) return name.substring(0, 2).toUpperCase();
    const initials = names.map(n => n[0]).join('');
    return initials.toUpperCase().substring(0, 2);
  };

  // (loadGroupMembers, useEffect, calculateSplit, handleUploadReceipt remain the same)
  // ... (unchanged logic functions)
  useEffect(() => {
    loadGroupMembers();
  }, [group]);

  const loadGroupMembers = async () => {
    if (!group?.id) return;
    
    setMembersLoading(true);
    try {
      // Load actual group data from Firebase
      const groupData = await firebaseService.getGroupById(group.id);
      if (!groupData) {
        throw new Error('Group not found');
      }

      const formattedMembers: Member[] = groupData.members.map((member) => ({
        id: member.userId,
        name: member.userId === user?.id ? 'You' : member.name,
        avatar: member.profileImage,
        isYou: member.userId === user?.id,
      }));
      
      setGroupMembers(formattedMembers);

      const initialMembers = formattedMembers.map((m) => ({
        ...m,
        isSelected: true,
        amount: 0,
        percentage: 0,
        shares: 1,
      }));
      setMembers(initialMembers);
      
      // Set current user as default payer
      const currentUserMember = initialMembers.find(m => m.isYou);
      if (currentUserMember) {
        setPaidBy(currentUserMember);
      } else {
        setPaidBy(initialMembers[0]);
      }
    } catch (error) {
      console.error('Error loading group members:', error);
      Alert.alert("Error", "Failed to load group members");
    } finally {
      setMembersLoading(false);
    }
  };

  useEffect(() => {
    calculateSplit();
  }, [amount, splitType, members.map((m) => m.isSelected).join(","), members.map((m) => m.amount).join(","), members.map((m) => m.percentage).join(","), members.map((m) => m.shares).join(",")]);


  const calculateSplit = () => {
    const totalAmount = parseFloat(amount) || 0;
    const selectedMembers = members.filter((m) => m.isSelected);
    if (!selectedMembers.length) return;

    let updatedMembers = [...members];
    switch (splitType) {
      case "Equal":
        const equalAmount = totalAmount / selectedMembers.length;
        updatedMembers = updatedMembers.map((m) => ({
          ...m,
          amount: m.isSelected ? Number(equalAmount.toFixed(2)) : 0,
        }));
        break;
      case "Unequal":
        // For unequal split, verify total matches
        const currentTotal = updatedMembers
          .filter(m => m.isSelected)
          .reduce((sum, m) => sum + (m.amount || 0), 0);
        
        if (Math.abs(currentTotal - totalAmount) > 0.01) {
          // Adjust last member's amount to match total
          let lastSelectedIndex = -1;
          for (let i = updatedMembers.length - 1; i >= 0; i--) {
            if (updatedMembers[i].isSelected) {
              lastSelectedIndex = i;
              break;
            }
          }
          if (lastSelectedIndex !== -1) {
            const adjustment = totalAmount - currentTotal;
            updatedMembers[lastSelectedIndex].amount = 
              Number(((updatedMembers[lastSelectedIndex].amount || 0) + adjustment).toFixed(2));
          }
        }
        break;
      case "By Percentage":
        const totalPercentage = selectedMembers.reduce((sum, m) => sum + (m.percentage || 0), 0);
        if (totalPercentage > 100.01) {
          Alert.alert("Warning", "Total percentage exceeds 100%");
        }
        updatedMembers = updatedMembers.map((m) => {
          if (m.isSelected) {
            const percentage = m.percentage || 0;
            return { ...m, percentage, amount: Number(((totalAmount * percentage) / 100).toFixed(2)) };
          }
          return { ...m, amount: 0, percentage: 0 };
        });
        break;
      case "By Share":
        const totalShares = selectedMembers.reduce((sum, m) => sum + (m.shares || 0), 0);
         if (totalShares === 0) {
           const equalShare = totalAmount / selectedMembers.length;
           updatedMembers = updatedMembers.map((m) => ({
             ...m, 
             amount: m.isSelected ? Number(equalShare.toFixed(2)) : 0
           }));
         } else {
           updatedMembers = updatedMembers.map((m) => ({
            ...m,
            amount: m.isSelected ? Number(((totalAmount * (m.shares || 0)) / totalShares).toFixed(2)) : 0,
          }));
         }
        break;
    }
    setMembers(updatedMembers);
  };
  
  const handleUploadReceipt = () => {
    pickReceiptImage(
      (image) => {
        setReceiptImage(image.base64);
        setReceiptSize(image.size);
      },
      (error) => {
        Alert.alert('Error', error);
      }
    );
  };

  const handleRemoveReceipt = () => {
    Alert.alert(
      'Remove Receipt',
      'Are you sure you want to remove the receipt?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            setReceiptImage(null);
            setReceiptSize(0);
          }
        },
      ]
    );
  };

  const handleSave = async () => {
    // Validations
    if (!description.trim()) return Alert.alert("Error", "Please enter a description");
    if (!amount.trim() || parseFloat(amount) <= 0) return Alert.alert("Error", "Please enter a valid amount");
    if (!selectedCategory) return Alert.alert("Error", "Please select a category");
    
    if (selectedCategory?.name === 'Other' && !otherCategoryName.trim()) {
      return Alert.alert("Error", "Please specify a name for the 'Other' category");
    }
    
    if (!paidBy) return Alert.alert("Error", "Please select who paid");
    if (!group?.id) {
      console.error('Group ID missing:', group);
      return Alert.alert("Error", "Group information is missing");
    }
    if (!user?.id) {
      console.error('User ID missing:', user);
      return Alert.alert("Error", "User information is missing");
    }
    
    console.log('Creating expense for group:', group.id, 'by user:', user.id);
    
    const selectedMembers = members.filter((m) => m.isSelected);
    if (!selectedMembers.length) return Alert.alert("Error", "Please select members to split");

    // Validate split amounts
    const totalAmount = parseFloat(amount);
    const totalSplit = selectedMembers.reduce((sum, m) => sum + (m.amount || 0), 0);
    const difference = Math.abs(totalAmount - totalSplit);
    
    if (difference > 0.01) {
      return Alert.alert(
        "Error", 
        `Split amounts (${selectedCurrency.symbol}${totalSplit.toFixed(2)}) don't match total (${selectedCurrency.symbol}${totalAmount.toFixed(2)})`
      );
    }

    // Validate receipt if present
    if (receiptImage) {
      const validation = validateReceiptImage(receiptImage);
      if (!validation.valid) {
        return Alert.alert('Error', validation.error || 'Invalid receipt image');
      }
    }

    // Additional validation
    if (!group?.id) {
      return Alert.alert('Error', 'Group information is missing');
    }
    
    if (!user?.id) {
      return Alert.alert('Error', 'User information is missing');
    }
    
    if (!description.trim()) {
      return Alert.alert('Error', 'Please enter expense description');
    }
    
    if (selectedMembers.length === 0) {
      return Alert.alert('Error', 'Please select at least one participant');
    }

    setLoading(true);
    try {
      const expense: Omit<GroupExpense, 'id'> = {
        groupId: group?.id || '',
        description: description || '',
        amount: totalAmount,
        category: selectedCategory ? {
          ...selectedCategory,
          name: selectedCategory.name === 'Other' ? (otherCategoryName || 'Other') : selectedCategory.name,
        } : {
          id: 7,
          name: 'General',
          emoji: '📌',
          color: '#F3F4F6'
        },
        paidBy: {
          id: paidBy?.id || user?.id || '',
          name: paidBy?.name || user?.name || 'Unknown',
          isYou: paidBy?.isYou || false
        },
        splitType: splitType || 'Equal',
        participants: selectedMembers.map(m => ({
          id: m.id || '',
          name: m.name || 'Unknown',
          amount: m.amount || 0,
          isYou: m.isYou || false
        })),
        ...(receiptImage?.startsWith('data:') && { receiptBase64: receiptImage }),
        createdAt: new Date().toISOString(),
        createdBy: user?.id || '',
        updatedAt: new Date().toISOString(),
        isActive: true,
      };

      // Create expense in Firebase
      console.log('Creating expense with data:', expense);
      const createdExpense = await firebaseService.createGroupExpense(group.id, expense);
      console.log('Expense created successfully:', createdExpense);
      
      Alert.alert("Success", "Expense saved successfully", [
        { 
          text: "OK", 
          onPress: () => {
            // Call onReturn callback if provided
            if (route.params?.onReturn) {
              route.params.onReturn();
            }
            navigation.goBack();
          }
        },
      ]);
    } catch (error: any) {
      console.error('Error saving expense:', error);
      Alert.alert("Error", error.message || "Failed to save expense");
    } finally {
      setLoading(false);
    }
  };
  
  const handleToggleMember = (memberId: string) => {
    // ... (unchanged)
    setMembers(
      members.map((m) =>
        m.id === memberId ? { ...m, isSelected: !m.isSelected } : m
      )
    );
  };
  
  const handleMemberChange = (memberId: string, value: string, field: 'amount' | 'percentage' | 'shares') => {
    // ... (unchanged autofill logic)
    let numericValue = parseFloat(value) || 0;
    let newMembers = [...members];
    const selectedMembers = members.filter(m => m.isSelected);

    if (splitType === "By Percentage" && field === "percentage") {
      if (numericValue > 100) numericValue = 100;
      if (numericValue < 0) numericValue = 0;

      newMembers = members.map((m) =>
        m.id === memberId ? { ...m, [field]: numericValue } : m
      );

      if (selectedMembers.length === 2) {
        const otherMember = selectedMembers.find(m => m.id !== memberId);
        if (otherMember) {
          const otherMemberId = otherMember.id;
          const remainingPercentage = Math.max(0, 100 - numericValue); 
          newMembers = newMembers.map((m) =>
            m.id === otherMemberId ? { ...m, percentage: remainingPercentage } : m
          );
        }
      }
    } 
    else if (splitType === "Unequal" && field === "amount") {
      const totalAmount = parseFloat(amount) || 0;

      if (totalAmount > 0 && numericValue > totalAmount) {
        numericValue = totalAmount;
      }
      if (numericValue < 0) numericValue = 0;

      newMembers = members.map((m) =>
        m.id === memberId ? { ...m, [field]: numericValue } : m
      );

      if (selectedMembers.length === 2 && totalAmount > 0) {
        const otherMember = selectedMembers.find(m => m.id !== memberId);
        if (otherMember) {
          const otherMemberId = otherMember.id;
          const remainingAmount = Math.max(0, totalAmount - numericValue); 
          newMembers = newMembers.map((m) =>
            m.id === otherMemberId ? { ...m, amount: remainingAmount } : m
          );
        }
      }
    } 
    else {
      newMembers = members.map((m) =>
        m.id === memberId ? { ...m, [field]: numericValue } : m
      );
    }

    setMembers(newMembers);
  };

  const handleSetPayer = (member: Member) => {
    // ... (unchanged)
    setPaidBy(member);
    setShowPayerModal(false);
  };
  
  const handleSetSplitType = (type: string) => {
    // ... (unchanged)
    setSplitType(type);
    setShowSplitModal(false);
  };
  
  // --- LOGIC MODIFICATION ---
  const handleSetCategory = (category: any) => {
    // Animate the layout change
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedCategory(category);
    setShowCategoryModal(false);
    
    // Clear the "other" name if switching away from "Other"
    if (category.name !== 'Other') {
      setOtherCategoryName(""); 
    }
  };
  // --- END LOGIC MODIFICATION ---

  const styles = createStyles(colors, scale, scaledFontSize);
  
  if (membersLoading) {
    // ... (unchanged loading state)
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primaryButton} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {/* ... (header JSX unchanged) ... */}
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={scaledFontSize.xl} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Expense</Text>
        <View style={{ width: scaledFontSize.xl }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: scale(100) }}>
        
        {/* (Description/Category Row unchanged) */}
        <View style={styles.rowInputContainer}>
          <View style={styles.descriptionInputContainer}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter description"
              placeholderTextColor={colors.secondaryText}
              value={description}
              onChangeText={setDescription}
            />
          </View>

          <View style={styles.categoryInputContainer}>
            <Text style={styles.inputLabel}>Category</Text>
            <TouchableOpacity 
              style={styles.categoryDropdown} 
              onPress={() => setShowCategoryModal(true)}
            >
              <View style={styles.dropdownContent}>
                {selectedCategory ? (
                  <Text style={styles.categoryDropdownText} numberOfLines={1}>
                    {selectedCategory.emoji} {selectedCategory.name}
                  </Text>
                ) : (
                  <Text style={styles.categoryDropdownPlaceholder}>Select...</Text>
                )}
                <Ionicons name="chevron-down" size={scaledFontSize.lg} style={styles.dropdownIcon} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* --- NEW UI --- */}
        {/* Conditional "Specify Other" TextInput */}
        {selectedCategory?.name === 'Other' && (
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Specify "Other"</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Utilities, Rent, etc."
              placeholderTextColor={colors.secondaryText}
              value={otherCategoryName}
              onChangeText={setOtherCategoryName}
              autoFocus={true} // Focus the box when it appears
            />
          </View>
        )}
        {/* --- END NEW UI --- */}


        {/* (Amount + Currency unchanged) */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Amount</Text>
          <View style={styles.amountContainer}>
            <Text style={styles.currencySymbol}>{selectedCurrency.symbol}</Text>
            <TextInput
              style={[styles.textInput, styles.amountInput]}
              placeholder="0.00"
              placeholderTextColor={colors.secondaryText}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
            <Text style={styles.currencyCode}>{selectedCurrency.code}</Text>
          </View>
        </View>
        
        {/* (Payer and Split Buttons unchanged) */}
        <View style={styles.rowButtonsContainer}>
          <TouchableOpacity style={styles.rowButton} onPress={() => setShowPayerModal(true)}>
            <View>
              <Text style={styles.rowButtonLabel}>Paid by</Text>
              <Text style={styles.rowButtonValue}>{paidBy?.name || 'Select'}</Text>
            </View>
            <Ionicons name="chevron-down" size={scaledFontSize.lg} style={styles.dropdownIcon} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.rowButton} onPress={() => setShowSplitModal(true)}>
            <View>
              <Text style={styles.rowButtonLabel}>Split</Text>
              <Text style={styles.rowButtonValue}>{splitType}</Text>
            </View>
            <Ionicons name="chevron-down" size={scaledFontSize.lg} style={styles.dropdownIcon} />
          </TouchableOpacity>
        </View>

        {/* (Split Among Members List unchanged) */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Split Among</Text>
          <View style={styles.membersContainer}>
            {members.map((member) => (
              <View 
                key={member.id} 
                style={[
                  styles.memberRow, 
                  { opacity: member.isSelected ? 1 : 0.6 }
                ]}
              >
                <TouchableOpacity
                  style={styles.memberInfoContainer}
                  onPress={() => handleToggleMember(member.id)}
                >
                  <View style={styles.avatarContainer}>
                    {member.avatar ? (
                      <Image source={{ uri: member.avatar }} style={styles.avatarImage} />
                    ) : (
                      <View style={styles.avatarCircle}>
                        <Text style={styles.avatarInitials}>{getInitials(member.name)}</Text>
                      </View>
                    )}
                    
                    {member.isSelected && (
                      <View style={styles.checkmarkOverlay}>
                        <Ionicons name="checkmark-circle" size={scaledFontSize.lg} color={colors.primaryButton} />
                      </View>
                    )}
                  </View>
                  <Text style={styles.memberName}>{member.name}</Text>
                </TouchableOpacity>
                
                {member.isSelected && (
                  <View style={styles.splitInputContainer}>
                    {splitType === "Unequal" && (
                      <TextInput
                        style={styles.splitInput}
                        placeholder="0.00"
                        placeholderTextColor={colors.secondaryText}
                        keyboardType="numeric"
                        value={(member.amount || 0) > 0 ? (member.amount || 0).toString() : ""}
                        onChangeText={(val) => handleMemberChange(member.id, val, "amount")}
                      />
                    )}
                    {splitType === "By Percentage" && (
                      <TextInput
                        style={styles.splitInput}
                        placeholder="%"
                        placeholderTextColor={colors.secondaryText}
                        keyboardType="numeric"
                        value={(member.percentage || 0) > 0 ? (member.percentage || 0).toString() : ""}
                        onChangeText={(val) => handleMemberChange(member.id, val, "percentage")}
                      />
                    )}
                    {splitType === "By Share" && (
                      <TextInput
                        style={styles.splitInput}
                        placeholder="shares"
                        placeholderTextColor={colors.secondaryText}
                        keyboardType="numeric"
                        value={(member.shares || 0) > 0 ? (member.shares || 0).toString() : ""}
                        onChangeText={(val) => handleMemberChange(member.id, val, "shares")}
                      />
                    )}
                    {splitType === "Equal" && (
                       <Text style={styles.splitAmountText}>
                         {selectedCurrency.symbol}{member.amount?.toFixed(2) || '0.00'}
                       </Text>
                    )}
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Receipt Upload Section */}
        <View style={styles.receiptContainer}>
          {!receiptImage ? (
            <TouchableOpacity style={styles.uploadButton} onPress={handleUploadReceipt}>
              <Ionicons name="receipt-outline" size={scaledFontSize.lg} color={colors.primaryText} />
              <Text style={styles.uploadText}>Upload Receipt</Text>
              <Text style={styles.uploadHint}>Max 3MB • JPEG, PNG</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.receiptPreview}>
              <View style={styles.receiptInfo}>
                <Ionicons name="receipt" size={scaledFontSize.lg} color={colors.primaryButton} />
                <View style={styles.receiptDetails}>
                  <Text style={styles.receiptText}>Receipt Uploaded</Text>
                  <Text style={styles.receiptSize}>{formatFileSize(receiptSize)}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={handleRemoveReceipt}>
                <Ionicons name="close-circle" size={scaledFontSize.xl} color={colors.errorText} />
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {/* (Save Button unchanged) */}
        <TouchableOpacity style={styles.button} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.primaryButtonText} /> : <Text style={styles.buttonText}>Save Expense</Text>}
        </TouchableOpacity>
      </ScrollView>
      
      {/* (All Modals JSX unchanged) */}
      {/* ... (Payer, Split, Category Modals) ... */}
            <Modal
        visible={showPayerModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPayerModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Who Paid?</Text>
            <FlatList
              data={groupMembers}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => handleSetPayer(item)}>
                  <Text style={styles.modalItemText}>{item.name}</Text>
                  {paidBy?.id === item.id && <Ionicons name="checkmark" size={scaledFontSize.xl} color={colors.primaryButton} />}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowPayerModal(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showSplitModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSplitModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select Split Method</Text>
            <FlatList
              data={splitTypes}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => handleSetSplitType(item)}>
                  <Text style={styles.modalItemText}>{item}</Text>
                  {splitType === item && <Ionicons name="checkmark" size={scaledFontSize.xl} color={colors.primaryButton} />}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowSplitModal(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select Category</Text>
            <FlatList
              data={categories}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => handleSetCategory(item)}>
                  <Text style={styles.modalItemText}>
                    {item.emoji}  {item.name}
                  </Text>
                  {selectedCategory?.id === item.id && (
                    <Ionicons name="checkmark" size={scaledFontSize.xl} color={colors.primaryButton} />
                  )}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowCategoryModal(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

// (createStyles function is unchanged from the previous step)
const createStyles = (
  colors: ReturnType<typeof useTheme>['colors'],
  scale: (size: number) => number,
  fonts: { [key: string]: number }
) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(16),
    paddingVertical: scale(12),
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 0,
    borderBottomColor: colors.secondaryText,
  },
  headerTitle: { fontSize: fonts.header, fontWeight: "600", color: colors.primaryText },
  scrollView: { padding: scale(16) },
  inputContainer: { marginBottom: scale(16) },
  inputLabel: { fontSize: fonts.caption, fontWeight: "500", color: colors.secondaryText, marginBottom: scale(8) },
  textInput: {
    borderWidth: 1,
    borderColor: colors.cardBackground,
    borderRadius: scale(8),
    paddingHorizontal: scale(12),
    paddingVertical: scale(10),
    fontSize: fonts.body,
    color: colors.primaryText,
    backgroundColor: colors.cardBackground,
    height: scale(48), 
  },
  button: {
    backgroundColor: colors.primaryButton,
    paddingVertical: scale(14),
    borderRadius: scale(8),
    alignItems: "center",
    marginVertical: scale(12),
  },
  buttonText: { color: colors.primaryButtonText, fontSize: fonts.button, fontWeight: "600" },
  uploadButton: {
    flexDirection: 'row',
    gap: scale(10),
    borderWidth: 1,
    borderColor: colors.cardBackground,
    borderRadius: scale(8),
    paddingVertical: scale(12),
    alignItems: "center",
    justifyContent: 'center',
    marginTop: scale(8),
    backgroundColor: colors.cardBackground,
  },
  uploadText: { fontSize: fonts.caption, color: colors.primaryText, fontWeight: '500' },
  
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBackground,
    borderRadius: scale(8),
    backgroundColor: colors.cardBackground,
    paddingHorizontal: scale(12),
    height: scale(48), 
  },
  currencySymbol: {
    fontSize: fonts.body,
    color: colors.secondaryText,
    marginRight: scale(8),
  },
  amountInput: {
    flex: 1,
    borderWidth: 0, 
    paddingHorizontal: 0,
    height: '100%', 
  },
  currencyCode: {
    fontSize: fonts.caption,
    color: colors.secondaryText,
    marginLeft: scale(8),
  },
  
  rowInputContainer: {
    flexDirection: 'row',
    // --- MODIFICATION ---
    // The "Specify" box will have its own margin, so remove from here
    // marginBottom: scale(16), 
  },
  descriptionInputContainer: {
    flex: 2, 
    marginRight: scale(8),
    marginBottom: scale(16), // Add margin here
  },
  categoryInputContainer: {
    flex: 1, 
    marginBottom: scale(16), // Add margin here
  },
  categoryDropdown: {
    borderWidth: 1,
    borderColor: colors.cardBackground,
    borderRadius: scale(8),
    paddingHorizontal: scale(12),
    backgroundColor: colors.cardBackground,
    height: scale(48), 
    justifyContent: 'center', 
  },
  dropdownContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryDropdownText: {
    fontSize: fonts.body,
    color: colors.primaryText,
    flex: 1, 
  },
  categoryDropdownPlaceholder: {
    fontSize: fonts.body,
    color: colors.secondaryText,
    flex: 1,
  },
  dropdownIcon: {
    color: colors.secondaryText,
    marginLeft: scale(4), 
  },

  rowButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scale(16),
    gap: scale(8), 
  },
  rowButton: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    paddingHorizontal: scale(12),
    paddingVertical: scale(8), 
    borderRadius: scale(8),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: scale(56), 
  },
  rowButtonLabel: {
    fontSize: fonts.caption,
    color: colors.secondaryText,
    marginBottom: scale(4),
  },
  rowButtonValue: {
    fontSize: fonts.body,
    color: colors.primaryText,
    fontWeight: '600',
  },
  
  membersContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: scale(8),
    padding: scale(8),
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: scale(8),
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  memberInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1.5,
    marginRight: scale(8),
  },
  avatarContainer: {
    width: scale(40),
    height: scale(40),
    position: 'relative', 
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: scale(20),
  },
  avatarCircle: {
    width: '100%',
    height: '100%',
    borderRadius: scale(20),
    backgroundColor: colors.inputBackground, 
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: colors.primaryText,
    fontSize: fonts.caption,
    fontWeight: '600',
  },
  checkmarkOverlay: {
    position: 'absolute',
    bottom: -scale(2),
    right: -scale(2),
    backgroundColor: colors.cardBackground, 
    borderRadius: scale(10), 
  },
  memberName: {
    fontSize: fonts.body,
    color: colors.primaryText,
    marginLeft: scale(12), 
    flexShrink: 1, 
  },
  splitInputContainer: {
    flex: 1, 
    alignItems: 'flex-end',
  },
  splitInput: {
    borderWidth: 1,
    borderColor: colors.inputBackground, 
    backgroundColor: colors.inputBackground,
    borderRadius: scale(6),
    paddingHorizontal: scale(8),
    paddingVertical: scale(6),
    fontSize: fonts.body,
    color: colors.primaryText,
    width: '100%',
    textAlign: 'right',
  },
  splitAmountText: {
    fontSize: fonts.body,
    color: colors.secondaryText,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.cardBackground,
    borderTopLeftRadius: scale(16),
    borderTopRightRadius: scale(16),
    padding: scale(16),
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: fonts.header,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: scale(16),
    textAlign: 'center',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scale(14),
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  modalItemText: {
    fontSize: fonts.body,
    color: colors.primaryText,
  },
  modalCloseButton: {
    backgroundColor: colors.primaryButton,
    padding: scale(14),
    borderRadius: scale(8),
    alignItems: 'center',
    marginTop: scale(16),
  },
  modalCloseText: {
    color: colors.primaryButtonText,
    fontSize: fonts.button,
    fontWeight: '600',
  },
  receiptContainer: {
    marginTop: scale(8),
    marginBottom: scale(12),
  },
  receiptPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardBackground,
    borderRadius: scale(8),
    padding: scale(12),
    borderWidth: 1,
    borderColor: colors.primaryButton + '30',
  },
  receiptInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  receiptDetails: {
    marginLeft: scale(10),
  },
  receiptText: {
    fontSize: fonts.body,
    color: colors.primaryText,
    fontWeight: '500',
  },
  receiptSize: {
    fontSize: fonts.caption,
    color: colors.secondaryText,
    marginTop: scale(2),
  },
  uploadHint: {
    fontSize: fonts.caption,
    color: colors.secondaryText,
    marginTop: scale(4),
  },
  errorText: {
    color: colors.errorText || '#FF3B30',
  },
});