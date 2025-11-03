import { useLocalSearchParams, useRouter } from 'expo-router';
import { DatabaseReference, DataSnapshot, get, onValue, ref, set } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { db } from '../../firebaseConfig';
import Dropdown from '../components/Dropdown';

interface League { id: string; name: string; country?: string }
interface Team { id: string; leagueId: string; name: string; location?: string }
interface Player { id: string; name: string; number: number; teamId: string; position: string; stats?: { plateAppearances?: number; battingAverage?: number } }

export default function PlayerScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const isNew = id === 'new';

  const [mode, setMode] = useState<'view'|'edit'>(isNew ? 'edit' : 'view');
  const [loading, setLoading] = useState<boolean>(true);

  const [leagues, setLeagues] = useState<League[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('');

  const [player, setPlayer] = useState<Player>({ id: '', name: '', number: 0, teamId: '', position: '' });

  // stats fields
  const [plateAppearances, setPlateAppearances] = useState<string>('0');
  const [battingAverage, setBattingAverage] = useState<string>('0');

  useEffect(() => {
    const leaguesRef: DatabaseReference = ref(db, 'leagues');
    const unsubscribe = onValue(leaguesRef, (snap: DataSnapshot) => {
      const data = snap.val();
      if (data) setLeagues(Object.keys(data).map(k => ({ id: k, ...data[k] })));
      else setLeagues([]);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // if editing existing player, load player
    if (!isNew && id) {
      setLoading(true);
      const playerRef = ref(db, `Players/${id}`);
      const unsubscribe = onValue(playerRef, (snap: DataSnapshot) => {
        const data = snap.val();
        if (data) {
          const teamId = data.teamId ?? '';
          setPlayer({ id: id as string, name: data.name ?? '', number: data.number ?? 0, teamId, position: data.position ?? '', stats: data.stats ?? {} });
          setPlateAppearances(String(data.stats?.plateAppearances ?? 0));
          setBattingAverage(String(data.stats?.battingAverage ?? 0));
          // infer league from team (one-time read)
          (async () => {
            try {
              const tSnap = await get(ref(db, 'Teams'));
              const tData = tSnap.val();
              const all = tData ? Object.keys(tData).map(k => ({ id: k, ...tData[k] })) : [];
              const found = all.find((tt: any) => tt.id === teamId);
              setSelectedLeagueId(found?.leagueId ?? '');
            } catch (e) {
              console.error('Failed to infer league', e);
            }
          })();
        }
        setLoading(false);
      }, (e) => { console.error('Failed loading player', e); setLoading(false); });
      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // load teams for selected league (if player has team selected, find league)
    if (player.teamId) {
      // find team to get leagueId
      const teamRef = ref(db, 'Teams');
      const unsubscribe = onValue(teamRef, (snap: DataSnapshot) => {
        const data = snap.val();
        const allTeams = data ? Object.keys(data).map(k => ({ id: k, ...data[k] })) : [];
        setTeams(allTeams);
      });
      return () => unsubscribe();
    } else {
      // load all teams (so user can choose league then team)
      const teamRef = ref(db, 'Teams');
      const unsubscribe = onValue(teamRef, (snap: DataSnapshot) => {
        const data = snap.val();
        const allTeams = data ? Object.keys(data).map(k => ({ id: k, ...data[k] })) : [];
        setTeams(allTeams);
      });
      return () => unsubscribe();
    }
  }, [player.teamId]);

  const teamsForLeague = (leagueId?: string) => teams.filter(t => t.leagueId === (leagueId ?? selectedLeagueId ?? ''));

  const handleSave = async () => {
    if (!player.id && isNew) {
      Alert.alert('Missing ID', 'Please provide an id for the player.');
      return;
    }
    if (!player.name.trim()) { Alert.alert('Missing', 'Player name required'); return; }
    try {
      const playerRef = ref(db, `Players/${player.id}`);
      await set(playerRef, {
        name: player.name,
        number: Number(player.number),
        teamId: player.teamId,
        position: player.position,
        stats: { plateAppearances: Number(plateAppearances), battingAverage: Number(battingAverage) }
      });
      Alert.alert('Saved', 'Player saved successfully');
      setMode('view');
  if (isNew) router.replace('/stats');
    } catch (e) {
      console.error('Failed saving player', e);
      Alert.alert('Error', 'Failed to save player');
    }
  };

  if (loading) return <View style={styles.centered}><ActivityIndicator /></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{padding: 20}}>
      <Text style={styles.title}>{mode === 'view' ? 'Player' : 'Edit Player'}</Text>

      <Text style={styles.label}>Player ID</Text>
      <TextInput style={styles.input} value={player.id} onChangeText={(v) => setPlayer(p => ({...p, id: v}))} editable={mode === 'edit'} placeholderTextColor="#666" placeholder="unique id" />

      <Text style={styles.label}>Name</Text>
      <TextInput style={styles.input} value={player.name} onChangeText={(v) => setPlayer(p => ({...p, name: v}))} editable={mode === 'edit'} placeholderTextColor="#666" placeholder="Full name" />

      <Text style={styles.label}>Number</Text>
      <TextInput style={styles.input} value={String(player.number ?? '')} onChangeText={(v) => setPlayer(p => ({...p, number: Number(v)}))} keyboardType="numeric" editable={mode === 'edit'} placeholderTextColor="#666" placeholder="Jersey number" />

      <Text style={styles.label}>Position</Text>
      <Dropdown
        items={[
          { label: 'Pitcher', value: 'P' },
          { label: 'Catcher', value: 'C' },
          { label: 'First Base', value: '1B' },
          { label: 'Second Base', value: '2B' },
          { label: 'Shortstop', value: 'SS' },
          { label: 'Third Base', value: '3B' },
          { label: 'Outfield', value: 'OF' },
        ]}
        selectedValue={player.position}
        onValueChange={(v: string) => setPlayer(p => ({...p, position: String(v)}))}
        placeholder="Select position"
        enabled={mode === 'edit'}
      />

      <Text style={styles.label}>League</Text>
      <Dropdown
        items={[{ label: 'Select league', value: '' }, ...leagues.map(l => ({ label: l.name, value: l.id }))]}
  selectedValue={selectedLeagueId}
  onValueChange={(leagueId: string) => { setPlayer(p => ({...p, teamId: ''})); setSelectedLeagueId(leagueId); }}
        placeholder="Select league"
        enabled={mode === 'edit'}
      />

      <Text style={styles.label}>Team</Text>
      <Dropdown
  items={[{ label: 'Select team', value: '' }, ...teamsForLeague(selectedLeagueId).map(t => ({ label: t.name, value: t.id }))]}
        selectedValue={player.teamId}
        onValueChange={(teamId: string) => setPlayer(p => ({...p, teamId: String(teamId)}))}
        placeholder="Select team"
        enabled={mode === 'edit'}
      />

      <Text style={styles.label}>Plate Appearances</Text>
      <TextInput style={styles.input} value={plateAppearances} onChangeText={setPlateAppearances} keyboardType="numeric" editable={mode === 'edit'} placeholderTextColor="#666" />

      <Text style={styles.label}>Batting Average</Text>
      <TextInput style={styles.input} value={battingAverage} onChangeText={setBattingAverage} keyboardType="numeric" editable={mode === 'edit'} placeholderTextColor="#666" />

      <View style={{height: 16}} />
      {mode === 'edit' ? (
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.saveButton} onPress={() => setMode('edit')}>
          <Text style={styles.saveButtonText}>Edit</Text>
        </TouchableOpacity>
      )}

      <View style={{height: 40}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  label: { fontSize: 14, marginTop: 8 },
  input: { height: 40, borderColor: '#ddd', borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, marginTop: 6 },
  saveButton: { backgroundColor: '#007bff', paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  saveButtonText: { color: '#fff', fontWeight: 'bold' },
});
