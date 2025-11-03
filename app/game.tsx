import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebaseConfig';

export default function GameScreen() {
  const params = useLocalSearchParams();
  const homeId = params.home as string | undefined;
  const awayId = params.away as string | undefined;

  const [homeName, setHomeName] = useState<string>('');
  const [awayName, setAwayName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubHome: any = () => {};
    let unsubAway: any = () => {};
    if (homeId) {
      const r = ref(db, `Teams/${homeId}`);
      unsubHome = onValue(r, (snap) => {
        const data = snap.val();
        setHomeName(data?.name ?? '');
        setLoading(false);
      });
    }
    if (awayId) {
      const r = ref(db, `Teams/${awayId}`);
      unsubAway = onValue(r, (snap) => {
        const data = snap.val();
        setAwayName(data?.name ?? '');
        setLoading(false);
      });
    }

    return () => { unsubHome(); unsubAway(); };
  }, [homeId, awayId]);

  if (loading) return <View style={styles.centered}><ActivityIndicator /></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Game</Text>
      <View>
        <View style={styles.teamBox}><Text style={styles.teamText}>{homeName || 'Home'}</Text></View>
        <Text style={styles.vs}>vs</Text>
        <View style={styles.teamBox}><Text style={styles.teamText}>{awayName || 'Away'}</Text></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold' },
  teamBox: { padding: 16, backgroundColor: '#f0f0f0', borderRadius: 8, minWidth: 120, alignItems: 'center' },
  teamText: { fontSize: 16, fontWeight: 'bold' },
  vs: { alignItems: 'center', marginHorizontal: 16, fontSize: 18 },
});
