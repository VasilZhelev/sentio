import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

export type IconName = ComponentProps<typeof Ionicons>['name'];
export type SportProfile = 'SKI' | 'MOTOCROSS';

export type HazardKind = {
  key: string;
  label: string;
  icon: IconName;
};

export type SportConfig = {
  label: string;
  short: string;
  description: string;
  icon: IconName;
  hazards: HazardKind[];
};

export const SPORTS: Record<SportProfile, SportConfig> = {
  SKI: {
    label: 'Ski & snowboard',
    short: 'Slopes',
    description: 'Pistes, lifts and backcountry',
    icon: 'snow-outline',
    hazards: [
      { key: 'ice', label: 'Icy patch', icon: 'snow-outline' },
      { key: 'queue', label: 'Long lift queue', icon: 'people-outline' },
      { key: 'ungroomed', label: 'Ungroomed', icon: 'trending-down-outline' },
      { key: 'closed', label: 'Run closed', icon: 'close-circle-outline' },
      { key: 'obstacle', label: 'Obstacle', icon: 'alert-circle-outline' },
      { key: 'visibility', label: 'Low visibility', icon: 'cloud-outline' },
    ],
  },
  MOTOCROSS: {
    label: 'Moto & MTB',
    short: 'Trails',
    description: 'Tracks, enduro and trails',
    icon: 'bicycle-outline',
    hazards: [
      { key: 'mud', label: 'Deep mud', icon: 'water-outline' },
      { key: 'rocks', label: 'Loose rocks', icon: 'diamond-outline' },
      { key: 'rut', label: 'Deep rut', icon: 'git-commit-outline' },
      { key: 'closed', label: 'Trail closed', icon: 'close-circle-outline' },
      { key: 'obstacle', label: 'Fallen tree', icon: 'leaf-outline' },
      { key: 'jump', label: 'Blind jump', icon: 'trending-up-outline' },
    ],
  },
};

export function hazardFor(sport: SportProfile, key: string): HazardKind {
  return (
    SPORTS[sport].hazards.find((h) => h.key === key) ??
    SPORTS.SKI.hazards.concat(SPORTS.MOTOCROSS.hazards).find((h) => h.key === key) ?? {
      key,
      label: key,
      icon: 'alert-circle-outline',
    }
  );
}
