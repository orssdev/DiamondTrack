// File: app/player/[id].tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import { DatabaseReference, DataSnapshot, get, onValue, ref, set } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { db } from '../../firebaseConfig';
import Dropdown from '../components/Dropdown';
import { colors } from '../theme/colors';

interface League { id: string; name: string; country?: string }
interface Team { id: string; leagueId: string; name: string; location?: string }
interface Player {
  id: string;
  name: string;
  number: number;
  teamId: string;
  position: string;
  stats?: {
    plateAppearances?: number;
    atBats?: number;
    hits?: number;
    doubles?: number;
    triples?: number;
    homeRuns?: number;
    walks?: number;
    hitByPitch?: number;
    sacFlies?: number;
    rbis?: number;
    stolenBases?: number;
    caughtStealing?: number;
    strikeouts?: number;
    runs?: number;
  };
}

// Exported Fn: PlayerScreen
export default function PlayerScreen() {
  const params = useLocalSearchParams();
  const id = (params as any).id as string | undefined;
  const preTeamParam = (params as any).teamId as string | undefined;
  const preSlotParam = (params as any).slot as string | undefined;
  const router = useRouter();
  const isNew = id === 'new';

  const [mode, setMode] = useState<'view'|'edit'>(isNew ? 'edit' : 'view');
  const [loading, setLoading] = useState<boolean>(true);

  const [leagues, setLeagues] = useState<League[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('');

  const [player, setPlayer] = useState<Player>({ id: '', name: '', number: 0, teamId: '', position: '' });

 
  const [statsEditable, setStatsEditable] = useState<{ [k:string]: string }>({
    plateAppearances: '0',
    atBats: '0',
    hits: '0',
    doubles: '0',
    triples: '0',
    homeRuns: '0',
    walks: '0',
    hitByPitch: '0',
    sacFlies: '0',
    rbis: '0',
    stolenBases: '0',
    caughtStealing: '0',
    strikeouts: '0',
    runs: '0',
  });

  // If creating a new player from a team/slot, prefill team and infer league; also subscribe to leagues list
  useEffect(() => {
   
    if (isNew && preTeamParam) {
      setPlayer(p => ({ ...p, teamId: preTeamParam }));
     
      (async () => {
        try {
          const tSnap = await get(ref(db, 'Teams'));
          const tData = tSnap.val();
          const all = tData ? Object.keys(tData).map(k => ({ id: k, ...tData[k] })) : [];
          const found = all.find((tt: any) => tt.id === preTeamParam);
          if (found) setSelectedLeagueId(found.leagueId ?? '');
        } catch (e) {}
      })();
    }
    const leaguesRef: DatabaseReference = ref(db, 'leagues');
    const unsubscribe = onValue(leaguesRef, (snap: DataSnapshot) => {
      const data = snap.val();
      if (data) setLeagues(Object.keys(data).map(k => ({ id: k, ...data[k] })));
      else setLeagues([]);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to this player's record for live updates when editing/viewing an existing player
  useEffect(() => {
   
    if (!isNew && id) {
      setLoading(true);
      const playerRef = ref(db, `Players/${id}`);
      const unsubscribe = onValue(playerRef, (snap: DataSnapshot) => {
        const data = snap.val();
        if (data) {
          const teamId = data.teamId ?? '';
          const stats = data.stats ?? {};
          setPlayer({ id: id as string, name: data.name ?? '', number: data.number ?? 0, teamId, position: data.position ?? '', stats });
          setStatsEditable({
            plateAppearances: String(stats.plateAppearances ?? 0),
            atBats: String(stats.atBats ?? 0),
            hits: String(stats.hits ?? 0),
            doubles: String(stats.doubles ?? 0),
            triples: String(stats.triples ?? 0),
            homeRuns: String(stats.homeRuns ?? 0),
            walks: String(stats.walks ?? 0),
            hitByPitch: String(stats.hitByPitch ?? 0),
            sacFlies: String(stats.sacFlies ?? 0),
            rbis: String(stats.rbis ?? 0),
            stolenBases: String(stats.stolenBases ?? 0),
            caughtStealing: String(stats.caughtStealing ?? 0),
            strikeouts: String(stats.strikeouts ?? 0),
            runs: String(stats.runs ?? 0),
          });
         
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

  // Subscribe to Teams list and update when player's team selection changes
  useEffect(() => {
   
    if (player.teamId) {
     
      const teamRef = ref(db, 'Teams');
      const unsubscribe = onValue(teamRef, (snap: DataSnapshot) => {
        const data = snap.val();
        const allTeams = data ? Object.keys(data).map(k => ({ id: k, ...data[k] })) : [];
        setTeams(allTeams);
      });
      return () => unsubscribe();
    } else {
     
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

// Save the player record and attach to lineup slot if created from a slot param
// Fn: handleSave
  const handleSave = async () => {
    if (!player.id && isNew) {
      Alert.alert('Missing ID', 'Please provide an id for the player.');
      return;
    }
    if (!player.name.trim()) { Alert.alert('Missing', 'Player name required'); return; }
    try {
      const playerRef = ref(db, `Players/${player.id}`);
      const statsToSave = {
        plateAppearances: Number(statsEditable.plateAppearances ?? 0),
        atBats: Number(statsEditable.atBats ?? 0),
        hits: Number(statsEditable.hits ?? 0),
        doubles: Number(statsEditable.doubles ?? 0),
        triples: Number(statsEditable.triples ?? 0),
        homeRuns: Number(statsEditable.homeRuns ?? 0),
        walks: Number(statsEditable.walks ?? 0),
        hitByPitch: Number(statsEditable.hitByPitch ?? 0),
        sacFlies: Number(statsEditable.sacFlies ?? 0),
        rbis: Number(statsEditable.rbis ?? 0),
        stolenBases: Number(statsEditable.stolenBases ?? 0),
        caughtStealing: Number(statsEditable.caughtStealing ?? 0),
        strikeouts: Number(statsEditable.strikeouts ?? 0),
        runs: Number(statsEditable.runs ?? 0),
      };

      await set(playerRef, {
        name: player.name,
        number: Number(player.number),
        teamId: player.teamId,
        position: player.position,
        stats: statsToSave,
      });
     
      if (isNew && preTeamParam && preSlotParam) {
        try {
          await set(ref(db, `Teams/${preTeamParam}/lineup/${preSlotParam}`), player.id);
        } catch (e) {}
      }
      Alert.alert('Saved', 'Player saved successfully');
      setMode('view');
  if (isNew) router.replace('/stats');
    } catch (e) {
      console.error('Failed saving player', e);
      Alert.alert('Error', 'Failed to save player');
    }
  };

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={colors.green} /></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{padding: 20}}>
      <Text style={styles.title}>{mode === 'view' ? 'Player' : 'Edit Player'}</Text>

      <Text style={styles.label}>Player ID</Text>
      <TextInput style={styles.input} value={player.id} onChangeText={(v) => setPlayer(p => ({...p, id: v}))} editable={mode === 'edit'} placeholderTextColor={colors.textMuted} placeholder="unique id" />

      <Text style={styles.label}>Name</Text>
      <TextInput style={styles.input} value={player.name} onChangeText={(v) => setPlayer(p => ({...p, name: v}))} editable={mode === 'edit'} placeholderTextColor={colors.textMuted} placeholder="Full name" />

      <Text style={styles.label}>Number</Text>
      <TextInput style={styles.input} value={String(player.number ?? '')} onChangeText={(v) => setPlayer(p => ({...p, number: Number(v)}))} keyboardType="numeric" editable={mode === 'edit'} placeholderTextColor={colors.textMuted} placeholder="Jersey number" />

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

      {}
      {(() => {
        const pa = Number(statsEditable.plateAppearances || 0);
        const ab = Number(statsEditable.atBats || 0);
        const h = Number(statsEditable.hits || 0);
        const doubles = Number(statsEditable.doubles || 0);
        const triples = Number(statsEditable.triples || 0);
        const hrs = Number(statsEditable.homeRuns || 0);
        const walks = Number(statsEditable.walks || 0);
        const hbp = Number(statsEditable.hitByPitch || 0);
        const sf = Number(statsEditable.sacFlies || 0);
        const tb = h - doubles - triples - hrs + (doubles * 2) + (triples * 3) + (hrs * 4);
        const ba = ab > 0 ? (h / ab) : 0;
        const obpDen = pa > 0 ? (pa + hbp + sf) : 0;
        const obp = obpDen > 0 ? ((h + walks + hbp) / obpDen) : 0;
        const slg = ab > 0 ? (tb / ab) : 0;
        return (
          <View>
            <Text style={styles.label}>Batting Average (BA)</Text>
            <Text style={styles.readOnly}>{ba.toFixed(3)}</Text>
            <Text style={styles.label}>On-Base % (OBP)</Text>
            <Text style={styles.readOnly}>{obp.toFixed(3)}</Text>
            <Text style={styles.label}>Slugging (SLG)</Text>
            <Text style={styles.readOnly}>{slg.toFixed(3)}</Text>
          </View>
        );
      })()}

      {}
      <Text style={styles.label}>Plate Appearances</Text>
      <TextInput style={styles.input} value={statsEditable.plateAppearances} onChangeText={(v) => setStatsEditable(s => ({...s, plateAppearances: v}))} keyboardType="numeric" editable={mode === 'edit'} placeholderTextColor={colors.textMuted} />

      <Text style={styles.label}>At Bats</Text>
      <TextInput style={styles.input} value={statsEditable.atBats} onChangeText={(v) => setStatsEditable(s => ({...s, atBats: v}))} keyboardType="numeric" editable={mode === 'edit'} placeholderTextColor={colors.textMuted} />

      <Text style={styles.label}>Hits</Text>
      <TextInput style={styles.input} value={statsEditable.hits} onChangeText={(v) => setStatsEditable(s => ({...s, hits: v}))} keyboardType="numeric" editable={mode === 'edit'} placeholderTextColor={colors.textMuted} />

  <Text style={styles.label}>Doubles</Text>
  <TextInput style={styles.input} value={statsEditable.doubles} onChangeText={(v) => setStatsEditable(s => ({...s, doubles: v}))} keyboardType="numeric" editable={mode === 'edit'} placeholderTextColor={colors.textMuted} />

  <Text style={styles.label}>Triples</Text>
  <TextInput style={styles.input} value={statsEditable.triples} onChangeText={(v) => setStatsEditable(s => ({...s, triples: v}))} keyboardType="numeric" editable={mode === 'edit'} placeholderTextColor={colors.textMuted} />

  <Text style={styles.label}>Home Runs</Text>
  <TextInput style={styles.input} value={statsEditable.homeRuns} onChangeText={(v) => setStatsEditable(s => ({...s, homeRuns: v}))} keyboardType="numeric" editable={mode === 'edit'} placeholderTextColor={colors.textMuted} />

  <Text style={styles.label}>Walks</Text>
  <TextInput style={styles.input} value={statsEditable.walks} onChangeText={(v) => setStatsEditable(s => ({...s, walks: v}))} keyboardType="numeric" editable={mode === 'edit'} placeholderTextColor={colors.textMuted} />

  <Text style={styles.label}>Hit By Pitch</Text>
  <TextInput style={styles.input} value={statsEditable.hitByPitch} onChangeText={(v) => setStatsEditable(s => ({...s, hitByPitch: v}))} keyboardType="numeric" editable={mode === 'edit'} placeholderTextColor={colors.textMuted} />

  <Text style={styles.label}>Sacrifice Flies</Text>
  <TextInput style={styles.input} value={statsEditable.sacFlies} onChangeText={(v) => setStatsEditable(s => ({...s, sacFlies: v}))} keyboardType="numeric" editable={mode === 'edit'} placeholderTextColor={colors.textMuted} />

  <Text style={styles.label}>RBI</Text>
  <TextInput style={styles.input} value={statsEditable.rbis} onChangeText={(v) => setStatsEditable(s => ({...s, rbis: v}))} keyboardType="numeric" editable={mode === 'edit'} placeholderTextColor={colors.textMuted} />

  <Text style={styles.label}>Stolen Bases</Text>
  <TextInput style={styles.input} value={statsEditable.stolenBases} onChangeText={(v) => setStatsEditable(s => ({...s, stolenBases: v}))} keyboardType="numeric" editable={mode === 'edit'} placeholderTextColor={colors.textMuted} />

  <Text style={styles.label}>Caught Stealing</Text>
  <TextInput style={styles.input} value={statsEditable.caughtStealing} onChangeText={(v) => setStatsEditable(s => ({...s, caughtStealing: v}))} keyboardType="numeric" editable={mode === 'edit'} placeholderTextColor={colors.textMuted} />

  <Text style={styles.label}>Strikeouts</Text>
  <TextInput style={styles.input} value={statsEditable.strikeouts} onChangeText={(v) => setStatsEditable(s => ({...s, strikeouts: v}))} keyboardType="numeric" editable={mode === 'edit'} placeholderTextColor={colors.textMuted} />

  <Text style={styles.label}>Runs</Text>
  <TextInput style={styles.input} value={statsEditable.runs} onChangeText={(v) => setStatsEditable(s => ({...s, runs: v}))} keyboardType="numeric" editable={mode === 'edit'} placeholderTextColor={colors.textMuted} />

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
  container: { 
    flex: 1, 
    backgroundColor: colors.background 
  },
  centered: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: colors.background 
  },
  title: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    marginBottom: 12,
    color: colors.textPrimary 
  },
  label: { 
    fontSize: 14, 
    marginTop: 8,
    color: colors.textSubtle 
  },
  input: { 
    height: 40, 
    borderColor: colors.borderSubtle, 
    borderWidth: 1, 
    borderRadius: 6, 
    paddingHorizontal: 8, 
    marginTop: 6,
    color: colors.textPrimary,
    backgroundColor: colors.surface 
  },
  saveButton: { 
    backgroundColor: colors.surface, 
    paddingVertical: 14, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginTop: 12,
    shadowColor: 'rgba(0,0,0,0.9)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
    borderWidth: 1,
    borderColor: colors.green 
  },
  saveButtonText: { 
    color: colors.green, 
    fontWeight: '700',
    fontSize: 16 
  },
  readOnly: { 
    color: colors.textPrimary, 
    fontSize: 16, 
    marginTop: 4 
  },
});
