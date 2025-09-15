import { useState } from "react";
import { Text, View, Button, Alert } from "react-native";

export default function Index() {
  const [count, setCount] = useState(0);
  const [strikes, setStrikes] = useState(0);
  const [outs, setOuts] = useState(0);
  const [balls, setBalls] = useState(0);

  const handleStrike = () => {
    const newStrikes = strikes + 1; 
    setStrikes(newStrikes);

    if (newStrikes === 3) {
      handleOut();
      setStrikes(0);
    }
  };

  const handleOut = () => {
    const newOuts = outs + 1;
    setOuts(newOuts);
    if (newOuts === 3) {
    setStrikes(0);
    setBalls(0);
    setOuts(0);
    }
    };
  const handleBall = () => {
    const newBalls = balls + 1;
    setBalls(newBalls);
    if (newBalls === 4) {
    setStrikes(0);
    setBalls(0);
    }
  }
  

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Pitch Count: {count}</Text>
      <Text style={{ fontSize: 24 }}>Strikes: {'⚾'.repeat(strikes)}</Text>
      <Text style={{ fontSize: 24 }}>Balls: {'⚾'.repeat(balls)}</Text>
      <Text style={{ fontSize: 24 }}>Outs: {'⚾'.repeat(outs)}</Text>

      <Button title="Strike" onPress={handleStrike} />
      <Button title="Ball" onPress={handleBall} />
      <Button title="Out" onPress={handleOut} />
      <Button
        title="reset"
        onPress={() => {
          setCount(0);
          balls = 0;
          strikes = 0;
          outs = 0;
        }}
      />
    </View>
  );
}
