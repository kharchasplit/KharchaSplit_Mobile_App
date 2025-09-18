import React, { useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { wp, hp } from '../utils/deviceDimensions';

interface SplashScreenProps {
  onAnimationEnd: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onAnimationEnd }) => {
  const { colors } = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => {
      onAnimationEnd();
    }, 2500); // Show splash for 2.5 seconds

    return () => clearTimeout(timer);
  }, [onAnimationEnd]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Image
        source={require('../../asset/Images/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: wp(60),     // 60% of screen width
    height: hp(25),    // 25% of screen height
    maxWidth: wp(80),  // Maximum 80% of screen width
    maxHeight: hp(30), // Maximum 30% of screen height
  },
});