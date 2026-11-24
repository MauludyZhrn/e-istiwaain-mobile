import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  ScrollView,
  StyleProp,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

interface RunningTextProps {
  text: string;
  style?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  speedMsPerPx?: number;
  pauseMs?: number;
}

/**
 * Smooth single-line marquee text component.
 * Uses a disabled horizontal ScrollView internally so React Native Yoga measures
 * the true unconstrained intrinsic text width instead of clamping it to containerWidth.
 */
export const RunningText: React.FC<RunningTextProps> = ({
  text,
  style,
  containerStyle,
  speedMsPerPx = 32,
  pauseMs = 1400,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const [textWidth, setTextWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    translateX.stopAnimation();
    translateX.setValue(0);

    const overflow = textWidth - containerWidth;
    if (overflow > 4 && containerWidth > 0) {
      const distance = overflow + 18;
      const duration = Math.max(1800, Math.round(distance * speedMsPerPx));

      const animation = Animated.loop(
        Animated.sequence([
          Animated.delay(pauseMs),
          Animated.timing(translateX, {
            toValue: -distance,
            duration,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.delay(pauseMs),
          Animated.timing(translateX, {
            toValue: 0,
            duration: Math.max(1200, Math.round(duration * 0.65)),
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );

      animation.start();
      return () => {
        animation.stop();
      };
    }

    return undefined;
  }, [text, textWidth, containerWidth, speedMsPerPx, pauseMs, translateX]);

  return (
    <View
      style={[{ flex: 1, overflow: 'hidden' }, containerStyle]}
      onLayout={(e) => {
        const nextWidth = Math.round(e.nativeEvent.layout.width);
        if (nextWidth !== containerWidth) {
          setContainerWidth(nextWidth);
        }
      }}
    >
      <ScrollView
        horizontal
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        pointerEvents="none"
        contentContainerStyle={{ alignItems: 'center' }}
      >
        <Animated.Text
          numberOfLines={1}
          onLayout={(e) => {
            const nextWidth = Math.round(e.nativeEvent.layout.width);
            if (nextWidth !== textWidth) {
              setTextWidth(nextWidth);
            }
          }}
          style={[style, { transform: [{ translateX }] }]}
        >
          {text}
        </Animated.Text>
      </ScrollView>
    </View>
  );
};
