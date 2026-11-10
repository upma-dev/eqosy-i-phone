import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { Outfit_800ExtraBold } from '@expo-google-fonts/outfit';
import RootNavigator from './src/navigation';
import OpeningAnimation from './src/components/OpeningAnimation';
import { useAuth } from './src/store/auth';
import { useVertical } from './src/store/vertical';

export default function App() {
  const hydrateAuth = useAuth((s) => s.hydrate);
  const hydrateVertical = useVertical((s) => s.hydrate);
  const [intro, setIntro] = useState(true); // web: AppOpeningAnimation, once per launch
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Outfit_800ExtraBold,
  });

  useEffect(() => {
    hydrateAuth();
    hydrateVertical();
  }, [hydrateAuth, hydrateVertical]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style={intro ? 'light' : 'dark'} />
      <View style={{ flex: 1 }}>
        <RootNavigator />
        {intro ? <OpeningAnimation onDone={() => setIntro(false)} /> : null}
      </View>
    </SafeAreaProvider>
  );
}
