import React, { useCallback, useEffect, useRef } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { CelestialOrbit, ORBIT_SIZE } from './CelestialOrbit';
import { FluidBackground } from './FluidBackground';
import { SplashTypography } from './SplashTypography';

const OFFICIAL_ICON_WHITE = require('../../../assets/e-Istiwaain-Logo/png/icon-white_512.png');

// Official icon PNG natural dimensions are 512x385; preserve exact aspect ratio.
const LOGO_WIDTH = 132;
const LOGO_HEIGHT = Math.round((LOGO_WIDTH * 385) / 512);

export interface FluidSplashProps {
  onReady?: () => void;
  onFinish: () => void;
}

/**
 * 2,500 ms Celestial Fluid Motion animated splash screen orchestrating
 * organic fluid layers, concentric orbital geometry, icon reveal, and typography.
 */
export function FluidSplash({ onReady, onFinish }: FluidSplashProps) {
  const reducedMotion = useReducedMotion();
  const isMountedRef = useRef(true);
  const hasCalledReadyRef = useRef(false);
  const hasFinishedRef = useRef(false);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  const bgProgress = useSharedValue(reducedMotion ? 1 : 0);
  const ambientProgress = useSharedValue(0);
  const orbitReveal = useSharedValue(reducedMotion ? 1 : 0);
  const orbitSpin = useSharedValue(0);
  const logoOpacity = useSharedValue(reducedMotion ? 1 : 0);
  const logoScale = useSharedValue(reducedMotion ? 1 : 0.8);
  const haloGlow = useSharedValue(reducedMotion ? 0.85 : 0);
  const titleProgress = useSharedValue(reducedMotion ? 1 : 0);
  const taglineProgress = useSharedValue(reducedMotion ? 1 : 0);
  const supportProgress = useSharedValue(reducedMotion ? 1 : 0);
  const outroProgress = useSharedValue(0);

  const notifyFinished = useCallback(() => {
    if (!isMountedRef.current || hasFinishedRef.current) {
      return;
    }
    hasFinishedRef.current = true;
    onFinishRef.current();
  }, []);

  const handleLayout = useCallback(() => {
    if (hasCalledReadyRef.current) {
      return;
    }
    hasCalledReadyRef.current = true;
    onReady?.();
  }, [onReady]);

  useEffect(() => {
    isMountedRef.current = true;

    if (reducedMotion) {
      bgProgress.value = 1;
      ambientProgress.value = 0;
      orbitReveal.value = 1;
      orbitSpin.value = 0;
      logoOpacity.value = 1;
      logoScale.value = 1;
      haloGlow.value = 0.85;
      titleProgress.value = 1;
      taglineProgress.value = 1;
      supportProgress.value = 1;
      outroProgress.value = withDelay(
        650,
        withTiming(
          1,
          { duration: 250, easing: Easing.out(Easing.quad) },
          (finished) => {
            'worklet';
            if (finished) {
              scheduleOnRN(notifyFinished);
            }
          }
        )
      );
    } else {
      // Phase 1 (0 - 400 ms): Immediate concurrent fluid bloom, logo reveal start, and orbital formation
      bgProgress.value = withTiming(1, {
        duration: 450,
        easing: Easing.out(Easing.cubic),
      });
      ambientProgress.value = withTiming(1, {
        duration: 2250,
        easing: Easing.inOut(Easing.sin),
      });

      // Phase 1 -> 2 (0 - 1,000 ms): Orbit, solar marker, halo, and logo reveal concurrently without dead hold
      orbitReveal.value = withTiming(1, {
        duration: 900,
        easing: Easing.out(Easing.cubic),
      });
      orbitSpin.value = withTiming(1, {
        duration: 2400,
        easing: Easing.inOut(Easing.quad),
      });
      logoOpacity.value = withTiming(1, {
        duration: 820,
        easing: Easing.out(Easing.cubic),
      });
      logoScale.value = withSpring(1, {
        duration: 900,
        dampingRatio: 0.86,
      });
      haloGlow.value = withSequence(
        withTiming(1, { duration: 920, easing: Easing.out(Easing.quad) }),
        withTiming(0.84, { duration: 1280, easing: Easing.inOut(Easing.sin) })
      );

      // Phase 3 (950 - 1,750 ms): Progressive typography reveal
      titleProgress.value = withDelay(
        950,
        withTiming(1, {
          duration: 480,
          easing: Easing.out(Easing.cubic),
        })
      );
      taglineProgress.value = withDelay(
        1120,
        withTiming(1, {
          duration: 440,
          easing: Easing.out(Easing.cubic),
        })
      );
      supportProgress.value = withDelay(
        1280,
        withTiming(1, {
          duration: 450,
          easing: Easing.out(Easing.cubic),
        })
      );

      // Phase 4 (1,750 - 2,200 ms): Hold composed brand state
      // Phase 5 (2,200 - 2,500 ms): Smooth scale & opacity exit, trigger navigation handoff at 2,500 ms
      outroProgress.value = withDelay(
        2200,
        withTiming(
          1,
          { duration: 300, easing: Easing.inOut(Easing.cubic) },
          (finished) => {
            'worklet';
            if (finished) {
              scheduleOnRN(notifyFinished);
            }
          }
        )
      );
    }

    return () => {
      isMountedRef.current = false;
      cancelAnimation(bgProgress);
      cancelAnimation(ambientProgress);
      cancelAnimation(orbitReveal);
      cancelAnimation(orbitSpin);
      cancelAnimation(logoOpacity);
      cancelAnimation(logoScale);
      cancelAnimation(haloGlow);
      cancelAnimation(titleProgress);
      cancelAnimation(taglineProgress);
      cancelAnimation(supportProgress);
      cancelAnimation(outroProgress);
    };
  }, [
    ambientProgress,
    bgProgress,
    haloGlow,
    logoOpacity,
    logoScale,
    notifyFinished,
    orbitReveal,
    orbitSpin,
    outroProgress,
    reducedMotion,
    supportProgress,
    taglineProgress,
    titleProgress,
  ]);

  const backdropStyle = useAnimatedStyle(() => {
    const opacity = interpolate(outroProgress.value, [0.35, 1], [1, 0], Extrapolation.CLAMP);
    return { opacity };
  });

  const haloStyle = useAnimatedStyle(() => {
    const exitOpacity = interpolate(outroProgress.value, [0, 0.8], [1, 0], Extrapolation.CLAMP);
    return {
      opacity: haloGlow.value * exitOpacity,
      transform: [{ scale: interpolate(haloGlow.value, [0, 1], [0.85, 1.05], Extrapolation.CLAMP) }],
    };
  });

  const logoWrapperStyle = useAnimatedStyle(() => {
    const exitOpacity = interpolate(outroProgress.value, [0, 0.8], [1, 0], Extrapolation.CLAMP);
    const exitScale = interpolate(outroProgress.value, [0, 1], [1, 0.94], Extrapolation.CLAMP);

    return {
      opacity: logoOpacity.value * exitOpacity,
      transform: [{ scale: logoScale.value * exitScale }],
    };
  });

  return (
    <Animated.View style={[styles.root, backdropStyle]} onLayout={handleLayout}>
      <FluidBackground
        bgProgress={bgProgress}
        ambientProgress={ambientProgress}
        outroProgress={outroProgress}
        reducedMotion={reducedMotion}
      />

      <View style={styles.contentColumn} pointerEvents="none">
        <View style={styles.centerpiece}>
          <CelestialOrbit
            orbitReveal={orbitReveal}
            orbitSpin={orbitSpin}
            outroProgress={outroProgress}
            reducedMotion={reducedMotion}
          />

          {/* Subtle lightweight layered radial halo behind icon */}
          <Animated.View style={[styles.haloOuter, haloStyle]}>
            <View style={styles.haloInner} />
          </Animated.View>

          <Animated.View style={[styles.logoFrame, logoWrapperStyle]}>
            <Image
              source={OFFICIAL_ICON_WHITE}
              style={styles.logoImage}
              resizeMode="contain"
              accessibilityLabel="Logo e-Istiwaain"
            />
          </Animated.View>
        </View>

        <SplashTypography
          titleProgress={titleProgress}
          taglineProgress={taglineProgress}
          supportProgress={supportProgress}
          outroProgress={outroProgress}
          reducedMotion={reducedMotion}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#09473E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 24,
  },
  centerpiece: {
    width: ORBIT_SIZE,
    height: ORBIT_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  haloOuter: {
    position: 'absolute',
    width: 152,
    height: 152,
    borderRadius: 76,
    backgroundColor: 'rgba(17, 126, 134, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(195, 151, 71, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  haloInner: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: 'rgba(249, 167, 41, 0.08)',
  },
  logoFrame: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: LOGO_WIDTH,
    height: LOGO_HEIGHT,
  },
});
