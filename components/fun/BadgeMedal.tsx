import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { tierColor } from '@/constants/tokens';
import type { Tier } from '@/store/useSocialStore';
import type { IconName } from '@/constants/sports';
import { ProgressRing } from './ProgressRing';

type Props = { icon: IconName; tier: Tier; size?: number; locked?: boolean; progress?: number };

/** A medal: tier-coloured rim, tinted core, icon. Locked medals show progress instead. */
export function BadgeMedal({ icon, tier, size = 64, locked, progress = 0 }: Props) {
  const { colors } = useTheme();
  const c = tierColor[tier];

  if (locked) {
    return (
      <ProgressRing size={size} stroke={4} progress={progress} color={colors.textTertiary} track={colors.surfaceSunken} hole={colors.surfaceRaised}>
        <Ionicons name={icon} size={size * 0.4} color={colors.textTertiary} />
      </ProgressRing>
    );
  }

  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: c, padding: 3, shadowColor: c, shadowOpacity: 0.45, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } }}>
      <View style={{ flex: 1, borderRadius: size, backgroundColor: '#1A1D22', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)' }}>
        <View style={{ position: 'absolute', top: 2, left: size * 0.18, right: size * 0.18, height: size * 0.2, borderRadius: size, backgroundColor: 'rgba(255,255,255,0.045)' }} />
        <Ionicons name={icon} size={size * 0.42} color={c} />
      </View>
    </View>
  );
}
