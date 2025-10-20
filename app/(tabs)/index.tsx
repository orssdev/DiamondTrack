import { useState } from "react";
import { View, Text, Button, Image, StyleSheet } from "react-native";
import { Link } from "expo-router";

export default function Index() {
  const [count, setCount] = useState(0);
  const [strikes, setStrikes] = useState(0);
  const [outs, setOuts] = useState(0);
  const [balls, setBalls] = useState(0);
  

  const handleStrike = () => {
    const newStrikes = strikes + 1;
    setStrikes(newStrikes);
    setCount(count + 1);
    if (newStrikes === 3) {
      handleOut();
      setStrikes(0);
    }
  };

  const handleOut = () => {
    const newOuts = outs + 1;
    setOuts(newOuts);
    setCount(count + 1);
    if (newOuts === 3) {
      setStrikes(0);
      setBalls(0);
      setOuts(0);
    }
  };

  const handleBall = () => {
    const newBalls = balls + 1;
    setBalls(newBalls);
    setCount(count + 1);
    if (newBalls === 4) {
      setStrikes(0);
      setBalls(0);
    }
  };

  return (

// I am at a loss why all of this is showing errors or why the image is not working.

    <View
      style={styles.container}
    >
       <Image
            source={require("../../assets/images/BaseballField_E.png")}
            style={{width: 200, height: 200, marginBottom: 20}}
        />

      <Text>Pitch Count: {count}</Text>
      <Text style={styles.Text}>Strikes: {'⚾'.repeat(strikes)}</Text>
      <Text style={styles.Text}>Balls: {'⚾'.repeat(balls)}</Text>
      <Text style={styles.Text}>Outs: {'⚾'.repeat(outs)}</Text>
      <Text style={{fontSize: 24, color: '#fefbfbff'}}>Oscar is a big loser</Text>

      <Button title="Strike" onPress={handleStrike} />
      <Button title="Ball" onPress={handleBall} />
      <Button title="Out" onPress={handleOut} />
      <Button
        title="reset"
        onPress={() => {
          setCount(0);
          setBalls(0);
          setStrikes(0);
          setOuts(0);
        }}
      />
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#ffffff"
  },
  Text: {
    fontSize: 24
  },
  button: {
    fontSize: 20,
    textDecorationLine: 'underline',
    color: '#000000',
  }
})