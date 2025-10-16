import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Dimensions, Animated, Text } from 'react-native';
import { wp, hp } from '../utils/deviceDimensions';

interface SplashScreenProps {
  onAnimationEnd: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onAnimationEnd }) => {
  // Panel animation values
  const leftPanelX = useRef(new Animated.Value(0)).current;
  const rightPanelX = useRef(new Animated.Value(0)).current;
  const leftPanelY = useRef(new Animated.Value(0)).current;
  const rightPanelY = useRef(new Animated.Value(0)).current;

  // Logo and text animation values
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textSlide = useRef(new Animated.Value(20)).current;

  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Step 1: Light green slides left, dark green slides right (horizontal) - FASTER
    Animated.parallel([
      Animated.timing(leftPanelX, {
        toValue: -screenWidth / 2,
        duration: 300, // Reduced from 500ms to 300ms
        useNativeDriver: true,
      }),
      Animated.timing(rightPanelX, {
        toValue: screenWidth / 2,
        duration: 300, // Reduced from 500ms to 300ms
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Step 2: Light green slides up, dark green slides down (vertical) - FASTER
      Animated.parallel([
        Animated.timing(leftPanelY, {
          toValue: -screenHeight / 2,
          duration: 300, // Reduced from 500ms to 300ms
          useNativeDriver: true,
        }),
        Animated.timing(rightPanelY, {
          toValue: screenHeight / 2,
          duration: 300, // Reduced from 500ms to 300ms
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Step 3: Show logo with scale animation - FASTER
        Animated.parallel([
          Animated.timing(logoOpacity, {
            toValue: 1,
            duration: 250, // Reduced from 400ms to 250ms
            useNativeDriver: true,
          }),
          Animated.spring(logoScale, {
            toValue: 1,
            tension: 30, // Increased tension for faster animation
            friction: 6, // Reduced friction for faster animation
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Step 4: Show app name - FASTER
          Animated.parallel([
            Animated.timing(textOpacity, {
              toValue: 1,
              duration: 250, // Reduced from 400ms to 250ms
              useNativeDriver: true,
            }),
            Animated.timing(textSlide, {
              toValue: 0,
              duration: 250, // Reduced from 400ms to 250ms
              useNativeDriver: true,
            }),
          ]).start();
        });
      });
    });

    // End splash screen after all animations - FASTER
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300, // Reduced from 400ms to 300ms
        useNativeDriver: true,
      }).start(() => onAnimationEnd());
    }, 2000); // Reduced from 3000ms to 2000ms (2 seconds total)

    return () => {
      clearTimeout(timer);
    };
  }, [onAnimationEnd]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Left Panel - Light green/mint - animates left then up */}
      <Animated.View
        style={[
          styles.leftPanel,
          {
            transform: [
              { translateX: leftPanelX },
              { translateY: leftPanelY },
            ],
          },
        ]}
      />

      {/* Right Panel - Dark teal - animates right then down */}
      <Animated.View
        style={[
          styles.rightPanel,
          {
            transform: [
              { translateX: rightPanelX },
              { translateY: rightPanelY },
            ],
          },
        ]}
      />

      {/* Logo - appears after panels animate */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <Image
          source={require('../../asset/Images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {/* App Name - appears after logo */}
      <Animated.View
        style={[
          styles.textContainer,
          {
            opacity: textOpacity,
            transform: [{ translateY: textSlide }],
          },
        ]}
      >
        <Text style={styles.appName}>KharchaSplit</Text>
      </Animated.View>
    </Animated.View>
  );
};

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // White background behind panels
  },
  leftPanel: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: screenWidth / 2,
    backgroundColor: '#8FD5C2', // Light mint/green color from Figma
  },
  rightPanel: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: screenWidth / 2,
    backgroundColor: '#1A5F5F', // Dark teal color from Figma
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  logo: {
    width: wp ? wp(30) : 120,
    height: wp ? wp(30) : 120,
  },
  textContainer: {
    position: 'absolute',
    bottom: hp ? hp(20) : 160,
    alignItems: 'center',
    zIndex: 10,
  },
  appName: {
    fontSize: wp ? wp(7) : 28,
    fontWeight: 'bold',
    color: '#1A5F5F', // Dark teal to match the design
    letterSpacing: 1,
  },
});