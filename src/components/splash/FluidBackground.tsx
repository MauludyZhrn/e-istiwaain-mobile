import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';

export interface FluidBackgroundProps {
  bgProgress: SharedValue<number>;
  ambientProgress: SharedValue<number>;
  outroProgress: SharedValue<number>;
  reducedMotion: boolean;
}

/**
 * Renders layered translucent organic fluid waves and soft zenith luminescence
 * over the official Deep Emerald brand canvas without expensive blur filters.
 */
export function FluidBackground({
  bgProgress,
  ambientProgress,
  outroProgress,
  reducedMotion,
}: FluidBackgroundProps) {
  const upperFluidStyle = useAnimatedStyle(() => {
    const enterOpacity = interpolate(bgProgress.value, [0, 1], [0.15, 1], Extrapolation.CLAMP);
    const exitOpacity = interpolate(outroProgress.value, [0, 0.85], [1, 0], Extrapolation.CLAMP);
    const driftX = reducedMotion
      ? 0
      : interpolate(ambientProgress.value, [0, 1], [24, -14], Extrapolation.CLAMP);
    const driftY = reducedMotion
      ? 0
      : interpolate(ambientProgress.value, [0, 1], [-18, 12], Extrapolation.CLAMP);
    const rotateDeg = reducedMotion
      ? 0
      : interpolate(ambientProgress.value, [0, 1], [-7, 5], Extrapolation.CLAMP);
    const enterScale = interpolate(bgProgress.value, [0, 1], [0.9, 1], Extrapolation.CLAMP);
    const exitScale = interpolate(outroProgress.value, [0, 1], [1, 1.08], Extrapolation.CLAMP);

    return {
      opacity: enterOpacity * exitOpacity,
      transform: [
        { translateX: driftX },
        { translateY: driftY },
        { rotate: `${rotateDeg}deg` },
        { scale: enterScale * exitScale },
      ],
    };
  });

  const lowerFluidStyle = useAnimatedStyle(() => {
    const enterOpacity = interpolate(bgProgress.value, [0, 1], [0.1, 1], Extrapolation.CLAMP);
    const exitOpacity = interpolate(outroProgress.value, [0, 0.85], [1, 0], Extrapolation.CLAMP);
    const driftX = reducedMotion
      ? 0
      : interpolate(ambientProgress.value, [0, 1], [-22, 16], Extrapolation.CLAMP);
    const driftY = reducedMotion
      ? 0
      : interpolate(ambientProgress.value, [0, 1], [20, -10], Extrapolation.CLAMP);
    const rotateDeg = reducedMotion
      ? 0
      : interpolate(ambientProgress.value, [0, 1], [9, -4], Extrapolation.CLAMP);
    const enterScale = interpolate(bgProgress.value, [0, 1], [0.92, 1], Extrapolation.CLAMP);
    const exitScale = interpolate(outroProgress.value, [0, 1], [1, 1.07], Extrapolation.CLAMP);

    return {
      opacity: enterOpacity * exitOpacity,
      transform: [
        { translateX: driftX },
        { translateY: driftY },
        { rotate: `${rotateDeg}deg` },
        { scale: enterScale * exitScale },
      ],
    };
  });

  const goldAccentStyle = useAnimatedStyle(() => {
    const enterOpacity = interpolate(bgProgress.value, [0.15, 1], [0, 1], Extrapolation.CLAMP);
    const exitOpacity = interpolate(outroProgress.value, [0, 0.8], [1, 0], Extrapolation.CLAMP);
    const driftX = reducedMotion
      ? 0
      : interpolate(ambientProgress.value, [0, 1], [-12, 14], Extrapolation.CLAMP);
    const driftY = reducedMotion
      ? 0
      : interpolate(ambientProgress.value, [0, 1], [8, -12], Extrapolation.CLAMP);
    const scale = reducedMotion
      ? 1
      : interpolate(ambientProgress.value, [0, 0.5, 1], [0.96, 1.04, 1], Extrapolation.CLAMP);

    return {
      opacity: enterOpacity * exitOpacity,
      transform: [{ translateX: driftX }, { translateY: driftY }, { scale }],
    };
  });

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Lightweight SVG radial luminance centered behind orbital assembly */}
      <Svg style={StyleSheet.absoluteFill} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <RadialGradient id="emeraldZenith" cx="50%" cy="44%" r="58%">
            <Stop offset="0%" stopColor="#117E86" stopOpacity="0.28" />
            <Stop offset="48%" stopColor="#0B4F37" stopOpacity="0.22" />
            <Stop offset="100%" stopColor="#09473E" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx="200" cy="350" r="290" fill="url(#emeraldZenith)" />
      </Svg>

      {/* Upper-right translucent teal fluid wave */}
      <Animated.View style={[styles.upperWaveWrapper, upperFluidStyle]}>
        <Svg width="100%" height="100%" viewBox="0 0 420 420" preserveAspectRatio="none">
          <Path
            d="M36,92 C110,18 258,12 346,84 C418,142 414,264 334,328 C252,394 128,378 62,304 C2,236 -24,154 36,92 Z"
            fill="#117E86"
            fillOpacity="0.24"
          />
          <Path
            d="M84,126 C158,64 274,78 334,148 C384,206 362,298 286,336 C210,374 114,342 74,274 C40,216 32,170 84,126 Z"
            fill="#0B4F37"
            fillOpacity="0.32"
          />
        </Svg>
      </Animated.View>

      {/* Lower-left emerald-teal organic fluid swell */}
      <Animated.View style={[styles.lowerWaveWrapper, lowerFluidStyle]}>
        <Svg width="100%" height="100%" viewBox="0 0 440 420" preserveAspectRatio="none">
          <Path
            d="M52,118 C132,34 282,42 364,124 C434,194 420,318 326,368 C236,416 106,390 42,312 C-16,242 -12,184 52,118 Z"
            fill="#117E86"
            fillOpacity="0.2"
          />
          <Path
            d="M92,158 C166,94 288,108 342,182 C392,250 356,340 268,368 C182,394 86,348 56,276 C32,218 44,198 92,158 Z"
            fill="#0B4F37"
            fillOpacity="0.36"
          />
        </Svg>
      </Animated.View>

      {/* Subtle golden solar ribbon accent behind the orbital horizon */}
      <Animated.View style={[styles.goldRibbonWrapper, goldAccentStyle]}>
        <Svg width="100%" height="100%" viewBox="0 0 360 360" preserveAspectRatio="none">
          <Defs>
            <RadialGradient id="goldAura" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#F9A729" stopOpacity="0.16" />
              <Stop offset="55%" stopColor="#C39747" stopOpacity="0.08" />
              <Stop offset="100%" stopColor="#C39747" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="180" cy="180" r="165" fill="url(#goldAura)" />
          <Path
            d="M58,196 C108,112 226,96 296,154 C338,188 332,248 278,266 C206,290 96,268 58,196 Z"
            fill="#C39747"
            fillOpacity="0.09"
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#09473E',
    overflow: 'hidden',
  },
  upperWaveWrapper: {
    position: 'absolute',
    top: '-10%',
    right: '-20%',
    width: '108%',
    height: '52%',
  },
  lowerWaveWrapper: {
    position: 'absolute',
    bottom: '-14%',
    left: '-22%',
    width: '112%',
    height: '52%',
  },
  goldRibbonWrapper: {
    position: 'absolute',
    top: '21%',
    alignSelf: 'center',
    width: 340,
    height: 340,
  },
});
