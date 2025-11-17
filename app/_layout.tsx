// File: app/_layout.tsx
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { colors } from './theme/colors';
import { emit } from './utils/events';

// Exported Fn: RootLayout
export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.green,
        headerTitleStyle: { color: colors.textPrimary },
      }}
    >
      <Stack.Screen
      name="start"
      options={{
        headerTitle: "Start Menu",
        headerLeft: () => (
          <TouchableOpacity onPress={() => emit('openMenu','start')}> 
            <View style={styles.menuContainer}>
              <Ionicons name="menu" size={28} color={colors.green} />
            </View>
          </TouchableOpacity>
        ),
      }}
      />
      <Stack.Screen
        name="GameScreen"
        options={{
          headerTitle: "Game Screen",
          headerLeft: () => (
            <TouchableOpacity onPress={() => emit('openMenu','game')}>
              <View style={styles.menuContainer}>
                <Ionicons name="menu" size={28} color={colors.green} />
              </View>
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="stats"
        options={{
          headerTitle: "Stats",
        }}
      />
      <Stack.Screen
        name="player/[id]"
        options={{
          headerTitle: "Player",
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  menuContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',     
  },
});
