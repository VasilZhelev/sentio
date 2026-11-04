// One meaning per haptic. Keep this mapping consistent across the app.
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const enabled = Platform.OS === 'ios' || Platform.OS === 'android';
const safe = (fn: () => Promise<unknown>) => {
  if (enabled) fn().catch(() => {});
};

export const haptic = {
  /** Tabs, chips, segmented controls, toggles. */
  select: () => safe(() => Haptics.selectionAsync()),
  /** Ordinary button press. */
  tap: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  /** Committing something (report sent, message sent, paired). */
  success: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  /** Something needs attention (disconnected, hold-to-SOS progress). */
  warning: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  /** Crash / SOS only. */
  sos: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
  heavy: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)),
};
