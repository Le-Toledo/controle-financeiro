import React, { useEffect, useRef } from 'react';
import { Animated, type ViewStyle } from 'react-native';
import { Colors, Radius } from '@/theme';

interface SkeletonBoxProps {
  width?:        number | `${number}%`;
  height?:       number;
  borderRadius?: number;
  style?:        ViewStyle;
}

export function SkeletonBox({
  width,
  height       = 16,
  borderRadius = Radius.sm,
  style,
}: SkeletonBoxProps) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.65, duration: 750, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 750, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { height, borderRadius, backgroundColor: Colors.cardRaised, opacity },
        width !== undefined && { width },
        style,
      ]}
    />
  );
}
