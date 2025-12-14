import { Easing } from "react-native-reanimated";

export const motion = {
  duration: {
    swift: 120,
    quick: 180,
    base: 260,
    relaxed: 360
  },
  easing: Easing.bezier(0.4, 0, 0.2, 1)
};

export const timingConfig = (duration = motion.duration.base) => ({
  duration,
  easing: motion.easing
});

export const springConfig = {
  damping: 16,
  stiffness: 220,
  mass: 0.8
};
