import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

type Floater = {
  id: number;
  emoji: string;
  x: number;
};

export function EmojiSpam({ triggerDate, currentEmoji }: { triggerDate: number; currentEmoji: string }) {
  const [floaters, setFloaters] = useState<Floater[]>([]);

  useEffect(() => {
    if (triggerDate === 0) return;
    
    // Spawn 5-8 emojis randomly around the center
    const spawnCount = Math.floor(Math.random() * 4) + 5;
    const newFloaters = Array.from({ length: spawnCount }).map((_, i) => ({
      id: Date.now() + i,
      emoji: currentEmoji,
      // Random X offset from center
      x: (width / 2) - 30 + (Math.random() * 60 - 30),
    }));
    
    setFloaters((prev) => [...prev, ...newFloaters]);
  }, [triggerDate]);

  return (
    <>
      {floaters.map((f) => (
        <FloatingEmoji
          key={f.id}
          emoji={f.emoji}
          startX={f.x}
          onComplete={() => setFloaters((prev) => prev.filter(p => p.id !== f.id))}
        />
      ))}
    </>
  );
}

function FloatingEmoji({ emoji, startX, onComplete }: { emoji: string; startX: number; onComplete: () => void }) {
  const translateY = useSharedValue(height / 2 + 50);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0.2);
  const translateX = useSharedValue(startX);

  useEffect(() => {
    // Pop up effect
    scale.value = withSpring(1.5 + Math.random() * 0.5);
    
    // Drift upwards and slightly random drift horizontally
    translateY.value = withTiming(height / 2 - 150 - Math.random() * 100, { duration: 1200 + Math.random() * 500 });
    translateX.value = withTiming(startX + (Math.random() * 40 - 20), { duration: 1500 });
    
    // Fade out as it rises
    opacity.value = withSequence(
      withTiming(1, { duration: 800 }),
      withTiming(0, { duration: 400 + Math.random() * 300 }, (finished) => {
        if (finished) runOnJS(onComplete)();
      })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value }
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.Text style={[styles.emoji, animatedStyle]}>
      {emoji}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  emoji: {
    position: 'absolute',
    fontSize: 40,
    zIndex: 9999,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  }
});
