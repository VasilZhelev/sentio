import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';

interface TacticalBlurProps extends ViewProps {
  children?: React.ReactNode;
  tint?: 'light' | 'dark' | 'default';
  intensity?: number;
  fallbackOpacity?: number;
}

/**
 * Tactical Glassmorphism Component (Pure Style Fallback)
 * This avoids native BlurView warnings by using a themed, semi-transparent 
 * matte surface with tactical hardware-style borders.
 */
export default function TacticalBlur({ 
  children, 
  tint = 'dark', 
  intensity = 70, 
  fallbackOpacity = 0.82,
  style,
  ...props 
}: TacticalBlurProps) {
  
  // High-end Matte Glass Simulation
  // Using a specific tactical color palette directly for stability
  const backgroundColor = tint === 'dark' ? `rgba(18, 18, 18, ${fallbackOpacity})` : `rgba(255, 255, 255, ${fallbackOpacity})`;
  const borderColor = tint === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0,0,0,0.1)';

  return (
    <View 
      style={[
        styles.matteBase, 
        { backgroundColor, borderColor },
        style
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  matteBase: {
    overflow: 'hidden',
    borderWidth: 1,
    // Tactical hardware depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});
