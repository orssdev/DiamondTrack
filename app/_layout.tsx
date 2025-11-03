import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
<<<<<<< HEAD
import { emit } from './utils/events';
=======
import { colors } from './theme/colors';
>>>>>>> 9846e53600c7f3ef4956294a28b5d50347a01211

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen
      name="start"
      options={{
        headerShown: true,
        headerTitle: "Start Menu",
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.green,
        headerTitleStyle: { color: colors.textPrimary },
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
          headerShown: true,
          headerTitle: "Game Screen",
<<<<<<< HEAD
          // disable swipe back gesture to prevent returning to start by swiping
          gestureEnabled: false,
          headerStyle: { backgroundColor: "#071524" },
          headerTintColor: "#34D399",
          headerTitleStyle: { color: "#E6EEF7" },
=======
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.green,
          headerTitleStyle: { color: colors.textPrimary },
>>>>>>> 9846e53600c7f3ef4956294a28b5d50347a01211
          headerLeft: () => (
            <TouchableOpacity onPress={() => emit('openMenu','game')}>
              <View style={styles.menuContainer}>
                <Ionicons name="menu" size={28} color={colors.green} />
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
