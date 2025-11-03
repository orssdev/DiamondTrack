import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { colors } from './theme/colors';
import { on as onEvent, emit } from './utils/events';

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
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.green,
          headerTitleStyle: { color: colors.textPrimary },
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
