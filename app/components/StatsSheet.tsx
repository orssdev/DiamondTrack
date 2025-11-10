import React, { useEffect, useState } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { ref, onValue, get } from 'firebase/database';
import { db } from '../../firebaseConfig';
import { useRouter } from 'expo-router';

export default function StatsSheet({ visible, onClose, homeId, awayId, currentBatSlot }: { visible: boolean; onClose: () => void; homeId?: string; awayId?: string; currentBatSlot?: number }) {
  const [selectedTeam, setSelectedTeam] = useState<'home' | 'away'>('home');
  const [lineup, setLineup] = useState<Array<{ slot: number; playerId?: string; player?: any }>>([]);
  const router = useRouter();

  const teamId = selectedTeam === 'home' ? homeId : awayId;

  useEffect(() => {
  let unsub: (() => void) | null = null;
  // cleanup for player subscriptions created inside the onValue handler
  let playerSubsCleanup: (() => void) | null = null;
    if (!teamId) { setLineup([]); return; }
    const r = ref(db, `Teams/${teamId}/lineup`);
    unsub = onValue(r, (snap) => {
      const val = snap.val() || {};
      // Expecting keys '1' through '9' mapped to playerId
      const arr: Array<{ slot: number; playerId?: string }> = [];
      for (let i = 1; i <= 9; i++) {
        const pid = val && (val[i] || val[String(i)]);
        arr.push({ slot: i, playerId: pid });
      }

      // For live updates, subscribe to each player node and update lineup entries when they change
      // clean up any prior player subscriptions first
      if (playerSubsCleanup) {
        try { playerSubsCleanup(); } catch (e) {}
        playerSubsCleanup = null;
      }
      const subs: { [pid: string]: (() => void) } = {};
      const results: Array<{ slot: number; playerId?: string; player?: any }> = arr.map(a => ({ ...a, player: null }));
      arr.forEach((entry, idx) => {
        if (!entry.playerId) return;
        const pRef = ref(db, `Players/${entry.playerId}`);
        const unsubP = onValue(pRef, (psnap) => {
          const p = psnap.val();
          // only keep if team matches
          if (p && p.teamId === teamId) results[idx].player = { id: entry.playerId, ...p };
          else results[idx].player = null;
          setLineup([...results]);
        });
        subs[entry.playerId] = unsubP;
      });

      // set initial lineup (will be updated by subs)
      setLineup(results);

      // cleanup function should also remove player subs
      const cleanup = () => {
        Object.values(subs).forEach(u => { try { u(); } catch (e) {} });
      };
      // store cleanup in closure variable so outer return can call it safely
      playerSubsCleanup = cleanup;
    });
    return () => { 
      if (playerSubsCleanup) { try { playerSubsCleanup(); } catch (e) {} }
      if (unsub) try { unsub(); } catch (e) {}
    };
  }, [teamId]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={[styles.teamButton, selectedTeam === 'home' && styles.teamButtonActive]} onPress={() => setSelectedTeam('home')}>
              <Text style={styles.teamButtonText}>Home</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.teamButton, selectedTeam === 'away' && styles.teamButtonActive]} onPress={() => setSelectedTeam('away')}>
              <Text style={styles.teamButtonText}>Away</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}><Text style={{color:'#fff'}}>Close</Text></TouchableOpacity>
          </View>

          <FlatList
            data={lineup}
            keyExtractor={it => String(it.slot)}
            renderItem={({item}) => (
              <View style={[styles.playerRow, currentBatSlot === item.slot ? styles.currentBatRow : undefined]}>
                {item.player ? (
                  <Text style={styles.playerName}>{item.slot}. {item.player.name}, {item.player.position ?? '??'} #{item.player.number ?? ''}</Text>
                ) : (
                  <Text style={{color:'#888'}}>{item.slot}. (empty)</Text>
                )}
                {item.player ? (
                  <TouchableOpacity style={styles.viewButton} onPress={() => { onClose(); router.push(`/player/${item.player.id}`); }}>
                    <Text style={styles.viewButtonText}>View</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.viewButton} onPress={() => { onClose(); router.push(`/player/new?teamId=${teamId}&slot=${item.slot}`); }}>
                    <Text style={styles.viewButtonText}>Add</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            ListEmptyComponent={<Text style={{padding:12, color:'#ddd'}}>No lineup data</Text>}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { height: '60%', backgroundColor: '#071524', borderTopLeftRadius: 12, borderTopRightRadius: 12, padding: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  teamButton: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#0f1720' },
  teamButtonActive: { backgroundColor: '#34D399' },
  teamButtonText: { color: '#fff', fontWeight: '600' },
  closeButton: { padding: 8, backgroundColor: '#0f1720', borderRadius: 8 },
  playerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)' },
  playerName: { color: '#E6EEF7' },
  viewButton: { backgroundColor: '#0f1720', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  viewButtonText: { color: '#34D399' },
  currentBatRow: { backgroundColor: 'rgba(52,211,153,0.08)', borderRadius: 6 },
});
