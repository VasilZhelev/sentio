import React from 'react';
import { Modal, View, Pressable, StyleSheet, ScrollView } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from './Text';
import { IconButton } from './IconButton';
import { useTheme } from '@/hooks/useTheme';
import { radius, space } from '@/constants/tokens';

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  scroll?: boolean;
};

/** Bottom sheet. Tap the scrim or the close button to dismiss. */
export function Sheet({ visible, onClose, title, subtitle, children, scroll }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      {visible && (
        <View style={StyleSheet.absoluteFill}>
          <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(150)} style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" accessibilityRole="button" />
          </Animated.View>
          <Animated.View
            entering={reduced ? FadeIn.duration(120) : SlideInDown.springify().damping(22).stiffness(240)}
            exiting={reduced ? FadeOut.duration(100) : SlideOutDown.duration(180)}
            accessibilityViewIsModal
            style={[
              styles.sheet,
              { backgroundColor: colors.surfaceRaised, borderColor: colors.border, paddingBottom: insets.bottom + space.lg },
            ]}
          >
            <View style={[styles.grabber, { backgroundColor: colors.borderStrong }]} />
            {(title || subtitle) && (
              <View style={styles.header}>
                <View style={{ flex: 1 }}>
                  {title && (
                    <Text variant="headline" accessibilityRole="header">
                      {title}
                    </Text>
                  )}
                  {subtitle && (
                    <Text variant="callout" tone="secondary" style={{ marginTop: 2 }}>
                      {subtitle}
                    </Text>
                  )}
                </View>
                <IconButton icon="close" size={36} variant="solid" accessibilityLabel="Close" onPress={onClose} />
              </View>
            )}
            {scroll ? <ScrollView style={{ maxHeight: 480 }}>{children}</ScrollView> : children}
          </Animated.View>
        </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: space.xl,
    paddingTop: space.sm,
  },
  grabber: { alignSelf: 'center', width: 36, height: 5, borderRadius: 3, marginBottom: space.md },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md, marginBottom: space.lg },
});
