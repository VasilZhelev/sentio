import { useEffect } from 'react';
import { Alert } from 'react-native';
import * as Updates from 'expo-updates';

/**
 * On launch, check EAS Update
 * for a newer JS bundle. If one exists, download it and offer to restart right away,
 * so changes published with `eas update` show up without reinstalling the app.
 */
export function useOtaUpdates() {
  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled) return;

    let cancelled = false;
    (async () => {
      try {
        const check = await Updates.checkForUpdateAsync();
        if (!check.isAvailable || cancelled) return;
        await Updates.fetchUpdateAsync();
        if (cancelled) return;
        Alert.alert('Update ready', 'A new version of Sentio was downloaded.', [
          { text: 'Later', style: 'cancel' },
          { text: 'Restart now', onPress: () => Updates.reloadAsync() },
        ]);
      } catch (e) {
        console.log('[Updates] check failed:', e);
      }
    })();

    return () => { cancelled = true; };
  }, []);
}
