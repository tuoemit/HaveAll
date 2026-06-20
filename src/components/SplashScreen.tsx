import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { DarkColors } from '../theme/colors';

interface Props {
  onFinished: () => void;
}

export default function SplashScreen({ onFinished }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.75)).current;
  const rotation = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, damping: 8, stiffness: 80, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.timing(rotation, { toValue: 1, duration: 3000, useNativeDriver: true })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.4, duration: 1400, useNativeDriver: true }),
      ])
    ).start();

    const timer = setTimeout(onFinished, 2200);
    return () => clearTimeout(timer);
  }, []);

  const rotate = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <Animated.View style={[styles.inner, { transform: [{ scale }] }]}>
        <View style={styles.logoWrap}>
          <Animated.View
            style={[styles.ring, { transform: [{ rotate }] }]}
          />
          <View style={[styles.glowCircle, { opacity: glow }]}>
            <Text style={styles.hubIcon}>⬡</Text>
          </View>
        </View>
        <Text style={styles.title}>HaveAll</Text>
        <Text style={styles.subtitle}>همه برای تو</Text>
        <View style={styles.progressBar}>
          <View style={styles.progressFill} />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DarkColors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inner: { alignItems: 'center' },
  logoWrap: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ring: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: DarkColors.primary,
    opacity: 0.6,
  },
  glowCircle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: `${DarkColors.primary}22`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hubIcon: {
    fontSize: 40,
    color: DarkColors.primary,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: DarkColors.text,
    letterSpacing: 2,
    marginTop: 28,
  },
  subtitle: {
    fontSize: 14,
    color: DarkColors.primary,
    fontWeight: '500',
    marginTop: 4,
  },
  progressBar: {
    width: 120,
    height: 2,
    borderRadius: 1,
    backgroundColor: `${DarkColors.primary}26`,
    marginTop: 48,
    overflow: 'hidden',
  },
  progressFill: {
    width: '60%',
    height: '100%',
    backgroundColor: DarkColors.primary,
    borderRadius: 1,
  },
});
