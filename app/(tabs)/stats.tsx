import { Text, View, StyleSheet, Image } from 'react-native';

export default function StatsScreen() {
  return (
    <View style={styles.container}>
        <Text style={styles.text}>Carter:</Text>
        <Text style={styles.text}>Strikeouts: 0</Text>
        <Text style={styles.text}>Homeruns: 100000000000000</Text>
        <Text></Text>
        <Text style={styles.text}>Oscar:</Text>
        <Text style={styles.text}>Strikeouts: 100000000000000</Text>
        <Text style={styles.text}>Homeruns: 0</Text>

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
