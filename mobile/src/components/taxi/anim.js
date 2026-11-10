import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

// framer-motion animate={{ y: [0, N, 0] }} repeat: Infinity, as a reusable hook.
export function useFloat(to, duration, delay = 0, from = 0) {
  const v = useRef(new Animated.Value(from)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: to, duration: duration / 2, delay, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(v, { toValue: from, duration: duration / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v, to, duration, delay, from]);
  return v;
}

// Plays once after mount (framer: initial -> animate with spring/ease).
export function useEnter(delaySeconds = 0, duration = 600) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration, delay: delaySeconds * 1000, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [v, delaySeconds, duration]);
  return v;
}
