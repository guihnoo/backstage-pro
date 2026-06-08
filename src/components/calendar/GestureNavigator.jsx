import { motion } from 'framer-motion';

const SWIPE_CONFIDENCE_THRESHOLD = 10000;

export default function GestureNavigator({ onSwipeLeft, onSwipeRight, children }) {
  const onPanEnd = (e, { offset, velocity }) => {
    const swipe = Math.abs(offset.x) * velocity.x;

    if (swipe < -SWIPE_CONFIDENCE_THRESHOLD) {
      onSwipeLeft?.();
    } else if (swipe > SWIPE_CONFIDENCE_THRESHOLD) {
      onSwipeRight?.();
    }
  };

  return (
    <motion.div
      onPanEnd={onPanEnd}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}