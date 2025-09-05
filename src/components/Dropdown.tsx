import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface DropdownOption {
  label?: string;
  value?: any;
  name?: string;
  emoji?: string;
  icon?: string;
  code?: string;
}

interface DropdownProps {
  label?: string;
  placeholder?: string;
  value?: any;
  onSelect: (item: any) => void;
  options?: DropdownOption[];
  style?: ViewStyle;
  error?: string;
  renderItem?: (props: {
    item: DropdownOption;
    index: number;
    onSelect: (item: DropdownOption) => void;
  }) => React.ReactElement | null;
  keyExtractor?: (item: DropdownOption, index: number) => string;
  displayKey?: keyof DropdownOption;
  valueKey?: keyof DropdownOption;
}

export const Dropdown: React.FC<DropdownProps> = ({
  label,
  placeholder,
  value,
  onSelect,
  options = [],
  style,
  error,
  renderItem,
  keyExtractor,
  displayKey = 'label' as keyof DropdownOption,
  valueKey = 'value' as keyof DropdownOption,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const { colors } = useTheme();

  const handleSelect = (item: DropdownOption) => {
    onSelect(item);
    setIsVisible(false);
  };

  const getDisplayValue = () => {
    if (!value) return placeholder;
    if (typeof value === 'string') return value;
    const val = value as any;
    return val[displayKey] ?? val.name ?? val.label ?? String(val);
  };

  const styles = createStyles(colors);

  const defaultRenderItem = ({ item }: { item: DropdownOption }): React.ReactElement | null => (
    <TouchableOpacity
      style={styles.optionItem}
      onPress={() => handleSelect(item)}
    >
      <View style={styles.optionContent}>
        {item.emoji && <Text style={styles.optionEmoji}>{item.emoji}</Text>}
        {item.icon && <Text style={styles.optionIcon}>{item.icon}</Text>}
        <Text style={styles.optionText}>
          {((item as any)[displayKey] ?? item.name ?? item.label ?? String(item))}
        </Text>
        {item.code && <Text style={styles.optionCode}>{item.code}</Text>}
      </View>
      {value && (((value as any)[valueKey] ?? value) === ((item as any)[valueKey] ?? item)) && (
        <Text style={styles.checkmark}>✓</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TouchableOpacity
        style={[styles.dropdown, error && styles.dropdownError]}
        onPress={() => setIsVisible(true)}
      >
        <Text style={[styles.dropdownText, !value && styles.placeholderText]}>
          {getDisplayValue()}
        </Text>
        <Text style={styles.dropdownArrow}>▼</Text>
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={isVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setIsVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label || 'Select Option'}</Text>
              <TouchableOpacity onPress={() => setIsVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={options}
              renderItem={
                renderItem
                  ? ({ item, index }) =>
                      renderItem({ item, index, onSelect: handleSelect })
                  : defaultRenderItem
              }
              keyExtractor={
                keyExtractor ||
                  ((item, index) =>
                    String((item as any)[valueKey] ?? item.value ?? item.label ?? index))
              }
              style={styles.optionsList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.primaryText,
      marginBottom: 8,
    },
    dropdown: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: colors.cardBackground,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.cardBackground,
      minHeight: 48,
    },
    dropdownError: {
      borderColor: colors.error,
    },
    dropdownText: {
      fontSize: 16,
      color: colors.primaryText,
      flex: 1,
    },
    placeholderText: {
      color: colors.secondaryText,
    },
    dropdownArrow: {
      fontSize: 12,
      color: colors.secondaryText,
      marginLeft: 8,
    },
    errorText: {
      fontSize: 12,
      color: colors.error,
      marginTop: 4,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      width: '80%',
      maxHeight: '60%',
      elevation: 8,
      shadowColor: colors.primaryText,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.backgroundGradient[0],
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.primaryText,
    },
    closeButton: {
      fontSize: 18,
      color: colors.secondaryText,
      fontWeight: 'bold',
    },
    optionsList: {
      maxHeight: 300,
    },
    optionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBackground,
    },
    optionContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    optionEmoji: {
      fontSize: 20,
      marginRight: 12,
    },
    optionIcon: {
      fontSize: 16,
      marginRight: 12,
    },
    optionText: {
      fontSize: 16,
      color: colors.primaryText,
      flex: 1,
    },
    optionCode: {
      fontSize: 14,
      color: colors.secondaryText,
      marginLeft: 8,
    },
    checkmark: {
      fontSize: 16,
      color: colors.success,
      fontWeight: 'bold',
    },
  });

