import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  useWindowDimensions,
  UIManager,
  LayoutAnimation,
  Platform,
} from "react-native";

import { useTheme } from '../context/ThemeContext';
import { SafeAreaView } from "react-native-safe-area-context";
import { typography } from '../utils/typography';
import { firebaseService, PersonalExpense } from '../services/firebaseService';
import { useAuth } from '../context/AuthContext';
import { pickReceiptImage, formatFileSize, validateReceiptImage } from '../utils/imageUtils';
import { PhotoLibraryPermissionHelper } from '../utils/PhotoLibraryPermissionHelper';
import DateTimePicker from '@react-native-community/datetimepicker';
import Ionicons from "react-native-vector-icons/Ionicons";

// Enable LayoutAnimation for Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface AddPersonalExpenseScreenProps {
  route?: {
    params?: {
      onReturn?: () => void;
    }
  };
  navigation: any;
}

export const AddPersonalExpenseScreen: React.FC<AddPersonalExpenseScreenProps> = ({ route, navigation }) => {
  const { colors } = useTheme();
  const { user } = useAuth();

  // Responsive setup
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

  // State declarations
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [selectedCurrency, setSelectedCurrency] = useState({ code: "INR", symbol: "₹" });
  const [loading, setLoading] = useState(false);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [expenseDate, setExpenseDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [receiptSize, setReceiptSize] = useState<number>(0);
  const [notes, setNotes] = useState("");

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [otherCategoryName, setOtherCategoryName] = useState("");

  const categories = [
    { id: 1, name: "Food", emoji: "🍽️", color: "#FEF3C7" },
    { id: 2, name: "Transportation", emoji: "🚗", color: "#FECACA" },
    { id: 3, name: "Shopping", emoji: "🛍️", color: "#E0E7FF" },
    { id: 4, name: "Drinks", emoji: "🍺", color: "#FED7AA" },
    { id: 5, name: "Entertainment", emoji: "🎬", color: "#F3E8FF" },
    { id: 6, name: "Health", emoji: "🏥", color: "#FECACA" },
    { id: 7, name: "Other", emoji: "📝", color: "#F3F4F6" },
  ];

  const currencies = [
    { code: "INR", symbol: "₹", name: "Indian Rupee" },
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "EUR", symbol: "€", name: "Euro" },
  ];

  const handleUploadReceipt = () => {
    PhotoLibraryPermissionHelper.handlePhotoLibraryPermission(
      () => {
        pickReceiptImage(
          (image) => {
            setReceiptImage(image.base64);
            setReceiptSize(image.size);
          },
          (error) => {
            Alert.alert('Error', error);
          }
        );
      },
      () => {
        // Permission denied - do nothing
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

    if (!user?.id) {
      return Alert.alert("Error", "User information is missing");
    }

    // Validate receipt if present
    if (receiptImage) {
      const validation = validateReceiptImage(receiptImage);
      if (!validation.valid) {
        return Alert.alert('Error', validation.error || 'Invalid receipt image');
      }
    }

    setLoading(true);
    try {
      const totalAmount = parseFloat(amount);

      const expense: Omit<PersonalExpense, 'id'> = {
        userId: user.id,
        description: description,
        amount: totalAmount,
        category: {
          ...selectedCategory,
          name: selectedCategory.name === 'Other' ? (otherCategoryName || 'Other') : selectedCategory.name,
        },
        ...(receiptImage?.startsWith('data:') && { receiptBase64: receiptImage }),
        date: expenseDate.toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
        ...(notes.trim() && { notes: notes.trim() }),
      };

      // Create expense in Firebase
      await firebaseService.createPersonalExpense(expense);

      Alert.alert("Success", "Personal expense saved successfully", [
        {
          text: "OK",
          onPress: () => {
            // Call onReturn callback if provided
            if (route?.params?.onReturn) {
              route.params.onReturn();
            }
            navigation.goBack();
          }
        },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save expense");
    } finally {
      setLoading(false);
    }
  };

  const handleSetCategory = (category: any) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedCategory(category);
    setShowCategoryModal(false);

    if (category.name !== 'Other') {
      setOtherCategoryName("");
    }
  };

  const styles = createStyles(colors, scale, scaledFontSize);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={scaledFontSize.xl} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Personal Expense</Text>
        <View style={{ width: scaledFontSize.xl }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: scale(100) }}>

        {/* Description/Category Row */}
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
              autoFocus={true}
            />
          </View>
        )}

        {/* Amount + Currency */}
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

        {/* Date Picker */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Date</Text>
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={scaledFontSize.lg} color={colors.primaryText} />
            <Text style={styles.datePickerText}>
              {expenseDate.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </Text>
            <Ionicons name="chevron-down" size={scaledFontSize.lg} style={styles.dropdownIcon} />
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={expenseDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (selectedDate) {
                setExpenseDate(selectedDate);
              }
            }}
            maximumDate={new Date()}
          />
        )}

        {/* Notes */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Notes (Optional)</Text>
          <TextInput
            style={[styles.textInput, styles.notesInput]}
            placeholder="Add any additional notes..."
            placeholderTextColor={colors.secondaryText}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
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
                <Ionicons name="close-circle" size={scaledFontSize.xl} color={colors.error} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.button} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.primaryButtonText} /> : <Text style={styles.buttonText}>Save Expense</Text>}
        </TouchableOpacity>
      </ScrollView>

      {/* Category Modal */}
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

const createStyles = (
  colors: ReturnType<typeof useTheme>['colors'],
  scale: (size: number) => number,
  fonts: { [key: string]: number }
) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(16),
    paddingVertical: scale(12),
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 0,
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
  notesInput: {
    height: scale(80),
    textAlignVertical: 'top',
    paddingTop: scale(10),
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
  },
  descriptionInputContainer: {
    flex: 2,
    marginRight: scale(8),
    marginBottom: scale(16),
  },
  categoryInputContainer: {
    flex: 1,
    marginBottom: scale(16),
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
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBackground,
    borderRadius: scale(8),
    backgroundColor: colors.cardBackground,
    paddingHorizontal: scale(12),
    paddingVertical: scale(12),
    height: scale(48),
    gap: scale(8),
  },
  datePickerText: {
    flex: 1,
    fontSize: fonts.body,
    color: colors.primaryText,
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
});
