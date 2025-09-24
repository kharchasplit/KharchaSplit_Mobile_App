import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { typography } from '../utils/typography';
import { ensureDataUri } from '../utils/imageUtils';

interface Props {
  route: {
    params: {
      receiptBase64: string;
      expenseDescription?: string;
    };
  };
  navigation: any;
}

export const ViewReceiptScreen: React.FC<Props> = ({ route, navigation }) => {
  const { colors } = useTheme();
  const { receiptBase64, expenseDescription } = route.params;
  
  // Responsive setup
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const baseWidth = 375;
  const scale = (size: number) => (screenWidth / baseWidth) * size;
  
  const scaledFontSize = {
    header: scale(typography.text.header.fontSize),
    body: scale(typography.text.body.fontSize),
    xl: scale(typography.fontSize.xl),
  };

  const [imageLoading, setImageLoading] = React.useState(true);
  const [imageError, setImageError] = React.useState(false);

  // Debug logging for receipt data
  React.useEffect(() => {
    // Receipt image validation and processing
  }, [receiptBase64, expenseDescription]);

  // Ensure proper data URI format
  const validReceiptUri = React.useMemo(() => {
    return ensureDataUri(receiptBase64);
  }, [receiptBase64]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: scale(16),
      backgroundColor: colors.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderColor,
    },
    headerTitle: {
      fontSize: scaledFontSize.header,
      fontWeight: '600',
      color: colors.primaryText,
      flex: 1,
      textAlign: 'center',
    },
    backButton: {
      padding: scale(4),
    },
    placeholder: {
      width: scale(28),
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: scale(16),
    },
    imageContainer: {
      backgroundColor: colors.cardBackground,
      borderRadius: scale(12),
      overflow: 'hidden',
      minHeight: screenHeight * 0.6,
      justifyContent: 'center',
      alignItems: 'center',
    },
    receiptImage: {
      width: '100%',
      height: screenHeight * 0.7,
      resizeMode: 'contain',
    },
    loadingContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.cardBackground,
    },
    errorContainer: {
      padding: scale(40),
      alignItems: 'center',
    },
    errorIcon: {
      marginBottom: scale(16),
    },
    errorText: {
      fontSize: scaledFontSize.body,
      color: colors.secondaryText,
      textAlign: 'center',
    },
    description: {
      fontSize: scaledFontSize.body,
      color: colors.secondaryText,
      textAlign: 'center',
      marginTop: scale(16),
      fontStyle: 'italic',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons 
            name="arrow-back" 
            size={scaledFontSize.xl} 
            color={colors.primaryText} 
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Receipt</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.imageContainer}>
          {imageLoading && !imageError && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primaryButton} />
            </View>
          )}
          
          {imageError ? (
            <View style={styles.errorContainer}>
              <Ionicons 
                name="image-outline" 
                size={scale(64)} 
                color={colors.secondaryText}
                style={styles.errorIcon}
              />
              <Text style={styles.errorText}>
                Unable to load receipt image
              </Text>
            </View>
          ) : (
            <Image
              source={{ uri: validReceiptUri || '' }}
              style={styles.receiptImage}
              onLoadStart={() => {
                setImageLoading(true);
              }}
              onLoadEnd={() => {
                setImageLoading(false);
              }}
              onError={(error) => {
                console.error('Receipt image failed to load:', error.nativeEvent.error);
                // Image failed to load
                setImageError(true);
                setImageLoading(false);
              }}
            />
          )}
        </View>
        
        {expenseDescription && (
          <Text style={styles.description}>
            {expenseDescription}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};