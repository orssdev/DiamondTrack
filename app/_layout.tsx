import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    ZenDots: require('../assets/fonts/ZenDots-Regular.ttf'),
  });

  const router = useRouter();

  const [headerTitle, setHeaderTitle] = useState('Diamond Track')

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{headerShown: false}} />
      <Stack.Screen 
        name="(tabs)"
        options={{ 
          headerShown: true,
          headerTitle,
          headerBackTitle: "Go Back"
        }} 
      />
    </Stack>
  );
}
