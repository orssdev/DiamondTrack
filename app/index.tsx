import { useRouter } from 'expo-router';
import React from 'react';
import { Image, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';

export default function WelcomeScreen() {
    const router = useRouter()

    const handlePress = () => {
        router.push('/(tabs)')
    }

    return (
        <ImageBackground
            source={require('../assets/images/background-gradient.jpg')}
            style={styles.background}
        >
            <View style={styles.container}>
                <Text style={styles.title}>Diamond Track</Text>
                <Image
                    source={require("../assets/images/BaseballField_E.png")}
                    style={{width: 300, height: 300}}
                />
                <Pressable style={styles.button} onPress={handlePress}>
                    <Text style={styles.buttonText}>Start Game</Text>
                </Pressable>
                <Pressable style={styles.button} onPress={handlePress}>
                    <Text style={styles.buttonText}>Game Stats</Text>
                </Pressable>
            </View>
        </ImageBackground>
    )
}

const styles = StyleSheet.create({
    background: {
    flex: 1,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 25,
  },
  title: {
    fontSize: 36,
    color: '#fff',
    fontFamily: 'ZenDots'
  },
  button: {
    backgroundColor: '#00B615',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 5, 
    borderColor: '#FFA74F',
    borderRadius: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '600',
    fontFamily: 'ZenDots'
  },
})