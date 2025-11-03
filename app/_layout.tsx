import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { emit } from './utils/events';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen
      name="start"
      options={{
        headerShown: true,
        headerTitle: "Start Menu",
        headerStyle: { backgroundColor: "#071524" },
        headerTintColor: "#34D399",
        headerTitleStyle: { color: "#E6EEF7" },
        headerLeft: () => (
          <TouchableOpacity onPress={() => emit('openMenu','start')}> 
            <View style={styles.menuContainer}>
              <Ionicons name="menu" size={28} color="#34D399" />
            </View>
          </TouchableOpacity>
        ),
      }}
      />
      <Stack.Screen
        name="GameScreen"
        options={{
          headerShown: true,
          headerTitle: "Game Screen",
          // disable swipe back gesture to prevent returning to start by swiping
          gestureEnabled: false,
          headerStyle: { backgroundColor: "#071524" },
          headerTintColor: "#34D399",
          headerTitleStyle: { color: "#E6EEF7" },
          headerLeft: () => (
            <TouchableOpacity onPress={() => emit('openMenu','game')}>
              <View style={styles.menuContainer}>
                <Ionicons name="menu" size={28} color="#34D399" />
              </View>
            </TouchableOpacity>
          ),
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
