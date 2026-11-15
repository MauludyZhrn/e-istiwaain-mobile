import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, G, Line, Path } from 'react-native-svg';

export const ORBIT_SIZE = 280;
const CENTER = ORBIT_SIZE / 2;
const OUTER_RADIUS = 128;
const ARC_RADIUS = 110;
const SOLAR_RADIUS = 92;

export interface CelestialOrbitProps {
  orbitReveal: SharedValue<number>;
  orbitSpin: SharedValue<number>;
  outroProgress: SharedValue<number>;
  reducedMotion: boolean;
}

/**
 * Renders concentric celestial orbital rings, astrolabe-inspired arcs and markers,
 * and a golden solar marker that glides along the inner ecliptic path.
 */
export function CelestialOrbit({
  orbitReveal,
  orbitSpin,
  outroProgress,
  reducedMotion,
}: CelestialOrbitProps) {
  const containerStyle = useAnimatedStyle(() => {
    const enterOpacity = interpolate(orbitReveal.value, [0, 1], [0, 1], Extrapolation.CLAMP);
    const exitOpacity = interpolate(outroProgress.value, [0, 0.8], [1, 0], Extrapolation.CLAMP);
    const enterScale = interpolate(orbitReveal.value, [0, 1], [0.84, 1], Extrapolation.CLAMP);
    const exitScale = interpolate(outroProgress.value, [0, 1], [1, 0.94], Extrapolation.CLAMP);

    return {
      opacity: enterOpacity * exitOpacity,
      transform: [{ scale: enterScale * exitScale }],
    };
  });

  const outerArcsStyle = useAnimatedStyle(() => {
    const rotateDeg = reducedMotion
      ? 0
      : interpolate(orbitSpin.value, [0, 1], [0, -24], Extrapolation.CLAMP);

    return {
      transform: [{ rotate: `${rotateDeg}deg` }],
    };
  });

  const solarRingStyle = useAnimatedStyle(() => {
    const rotateDeg = reducedMotion
      ? -38
      : interpolate(orbitSpin.value, [0, 1], [-58, 18], Extrapolation.CLAMP);

    return {
      transform: [{ rotate: `${rotateDeg}deg` }],
    };
  });

  return (
    <Animated.View style={[styles.container, containerStyle]} pointerEvents="none">
      {/* Static reference horizon ring and subtle cardinal ticks */}
      <Svg width={ORBIT_SIZE} height={ORBIT_SIZE} viewBox={`0 0 ${ORBIT_SIZE} ${ORBIT_SIZE}`}>
        <Circle
          cx={CENTER}
          cy={CENTER}
          r={OUTER_RADIUS}
          stroke="#117E86"
          strokeWidth={1}
          strokeOpacity={0.5}
          strokeDasharray="3 6"
          fill="none"
        />
        <G stroke="#C39747" strokeOpacity={0.55} strokeWidth={1.2}>
          <Line x1={CENTER} y1={CENTER - OUTER_RADIUS - 4} x2={CENTER} y2={CENTER - OUTER_RADIUS + 4} />
          <Line x1={CENTER + OUTER_RADIUS - 4} y1={CENTER} x2={CENTER + OUTER_RADIUS + 4} y2={CENTER} />
          <Line x1={CENTER} y1={CENTER + OUTER_RADIUS - 4} x2={CENTER} y2={CENTER + OUTER_RADIUS + 4} />
          <Line x1={CENTER - OUTER_RADIUS - 4} y1={CENTER} x2={CENTER - OUTER_RADIUS + 4} y2={CENTER} />
        </G>
      </Svg>

      {/* Counter-rotating partial orbital arcs and small celestial nodes */}
      <Animated.View style={[StyleSheet.absoluteFill, outerArcsStyle]}>
        <Svg width={ORBIT_SIZE} height={ORBIT_SIZE} viewBox={`0 0 ${ORBIT_SIZE} ${ORBIT_SIZE}`}>
          {/* Top-right sweeping meridian arc */}
          <Path
            d={`M ${CENTER - 28} ${CENTER - ARC_RADIUS + 4} A ${ARC_RADIUS} ${ARC_RADIUS} 0 0 1 ${CENTER + ARC_RADIUS - 4} ${CENTER + 28}`}
            stroke="#C39747"
            strokeWidth={1.4}
            strokeOpacity={0.72}
            strokeLinecap="round"
            fill="none"
          />
          {/* Bottom-left complementary celestial arc */}
          <Path
            d={`M ${CENTER + 28} ${CENTER + ARC_RADIUS - 4} A ${ARC_RADIUS} ${ARC_RADIUS} 0 0 1 ${CENTER - ARC_RADIUS + 4} ${CENTER - 28}`}
            stroke="#117E86"
            strokeWidth={1.5}
            strokeOpacity={0.78}
            strokeLinecap="round"
            fill="none"
          />
          {/* Secondary faint dashed orbit arc */}
          <Circle
            cx={CENTER}
            cy={CENTER}
            r={ARC_RADIUS}
            stroke="#FFFFFF"
            strokeWidth={0.75}
            strokeOpacity={0.14}
            strokeDasharray="18 24"
            fill="none"
          />
          {/* Small orbital markers anchored to arc endpoints */}
          <Circle cx={CENTER - 28} cy={CENTER - ARC_RADIUS + 4} r={2.4} fill="#C39747" fillOpacity={0.9} />
          <Circle cx={CENTER + 28} cy={CENTER + ARC_RADIUS - 4} r={2.2} fill="#117E86" fillOpacity={0.95} />
        </Svg>
      </Animated.View>

      {/* Clockwise solar trajectory ring + golden solar marker */}
      <Animated.View style={[StyleSheet.absoluteFill, solarRingStyle]}>
        <Svg width={ORBIT_SIZE} height={ORBIT_SIZE} viewBox={`0 0 ${ORBIT_SIZE} ${ORBIT_SIZE}`}>
          <Circle
            cx={CENTER}
            cy={CENTER}
            r={SOLAR_RADIUS}
            stroke="#F9A729"
            strokeWidth={1}
            strokeOpacity={0.34}
            fill="none"
          />
          {/* Opposite nadir marker */}
          <Circle cx={CENTER} cy={CENTER + SOLAR_RADIUS} r={2.2} fill="#C39747" fillOpacity={0.75} />
          {/* Golden solar marker at top azimuth (rotated by solarRingStyle) */}
          <Circle cx={CENTER} cy={CENTER - SOLAR_RADIUS} r={13} fill="#F9A729" fillOpacity={0.14} />
          <Circle cx={CENTER} cy={CENTER - SOLAR_RADIUS} r={7.5} fill="#F9A729" fillOpacity={0.32} />
          <Circle cx={CENTER} cy={CENTER - SOLAR_RADIUS} r={4.4} fill="#F9A729" />
          <Circle cx={CENTER} cy={CENTER - SOLAR_RADIUS} r={2} fill="#FFF6DE" />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: ORBIT_SIZE,
    height: ORBIT_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
