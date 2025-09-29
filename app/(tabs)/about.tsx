import { Text, View, StyleSheet, Image } from 'react-native';

export default function AboutScreen() {
  return (
    <View style={styles.container}>

        <Image
            source={require("../../assets/images/icon.png")}
            style={{width: 200, height: 200, marginBottom: 20}}
        />

      <Text style={styles.text}>This is Carter and Oscar's capstone project:</Text>
        <Text style={styles.text}>DiamondTrack</Text>
      <Text style={styles.text}>Oscar is a big loser btw</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#fff',
  },
});
