// File: app/stats.tsx
import { useRouter } from 'expo-router';
import { DatabaseReference, DataSnapshot, equalTo, onValue, orderByChild, query, ref, set } from 'firebase/database';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { db } from '../firebaseConfig';
import AddLeagueModal from './components/addLeagueModal';
import AddTeamModal from './components/addTeamModal';
import { colors } from './theme/colors';

interface League {
  id: string;
  name: string;
  country: string;
}

interface Team {
  id: string;
  leagueId: string;
  location: string;
  name: string;
  record: {
    wins: number;
    losses: number; 
    ties: number;
  }
}

interface Player {
  id: string;
  name: string;
  number: number;
  teamId: string;
  position: string;
  stats: {
    plateAppearences: number;
    atBats: number;
    hits: number;
    walks: number;
    strikeouts: number;
    singles: number;
    doubles: number;
    triples: number;
    homeruns: number;
    RBIs: number;
    runs: number;
    battingAverage: number;
    onBasePercent: number;
    Slugging: number;
  }
}

// Exported Fn: StatsScreen
export default function StatsScreen() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);

  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const [loadingLeagues, setLoadingLeagues] = useState<boolean>(true);
  const [loadingTeams, setLoadingTeams] = useState<boolean>(false);
  const [loadingPlayers, setLoadingPlayers] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

 
  const [showAddLeagueModal, setShowAddLeagueModal] = useState<boolean>(false);
  const [showAddTeamModal, setShowAddTeamModal] = useState<boolean>(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [editLeagueData, setEditLeagueData] = useState<{ id: string; name: string; country: string } | null>(null);
  const [editTeamData, setEditTeamData] = useState<{ id: string; leagueId: string; name: string; location: string; record?: { wins: number; losses: number; ties: number } } | null>(null);
  const router = useRouter();
  // Subscribe to the leagues list for the left column and update loading state
  useEffect(() => {
    setLoadingLeagues(true);
    const leaguesRef: DatabaseReference = ref(db, 'leagues');
    const unsubscribe = onValue(leaguesRef, (snapshot: DataSnapshot) => {
      const data: { [key: string]: Omit<League, 'id'> } | null = snapshot.val();
      if (data) {
        setLeagues(Object.keys(data).map(key => ({ id: key, ...data[key] })));
      } else {
        setLeagues([]);
      }
      setLoadingLeagues(false);
    }, (e) => {
      console.error("Error fetching leagues:", e);
      setError(e.message);
      setLoadingLeagues(false);
    });

    return () => unsubscribe();
  }, []);

  // When a league is selected, subscribe to Teams for that league and populate the teams list
  useEffect(() => {
    let unsubscribe: () => void = () => {};

    if (selectedLeagueId) {
      setLoadingTeams(true);
      setFilteredTeams([]);
      setFilteredPlayers([]);
      setSelectedTeamId(null);

      const teamsRef: DatabaseReference = ref(db, 'Teams');
      const teamsQuery = query(teamsRef, orderByChild('leagueId'), equalTo(selectedLeagueId));

      unsubscribe = onValue(teamsQuery, (snapshot: DataSnapshot) => {
        const data: { [key: string]: Omit<Team, 'id'> } | null = snapshot.val();
        if (data) {
          setFilteredTeams(Object.keys(data).map(key => ({ id: key, ...data[key] })));
        } else {
          setFilteredTeams([]);
        }
        setLoadingTeams(false);
      }, (e) => {
        console.error("Error fetching teams:", e);
        setError(e.message);
        setLoadingTeams(false);
      });
    } else {
      setFilteredTeams([]);
      setSelectedTeamId(null);
    }

    return () => unsubscribe();
  }, [selectedLeagueId]);

  // When a team is selected, subscribe to Players for that team and populate the player list
  useEffect(() => {
    let unsubscribe: () => void = () => {};

    if (selectedTeamId) {
      setLoadingPlayers(true);
      setFilteredPlayers([]);

      const playersRef: DatabaseReference = ref(db, 'Players');
      const playersQuery = query(playersRef, orderByChild('teamId'), equalTo(selectedTeamId));

      unsubscribe = onValue(playersQuery, (snapshot: DataSnapshot) => {
        const data: { [key: string]: Omit<Player, 'id'> } | null = snapshot.val();
        if (data) {
          setFilteredPlayers(Object.keys(data).map(key => ({ id: key, ...data[key] })));
        } else {
          setFilteredPlayers([]);
        }
        setLoadingPlayers(false);
      }, (e) => {
        console.error("Error fetching players:", e);
        setError(e.message);
        setLoadingPlayers(false);
      });
    } else {
      setFilteredPlayers([]);
    }

    return () => unsubscribe();
  }, [selectedTeamId]);

  const handleSelectLeague = useCallback((leagueId: string) => {
    setSelectedLeagueId(prev => (prev === leagueId ? null : leagueId));
  }, []);

  const handleSelectTeam = useCallback((teamId: string) => {
    setSelectedTeamId(prev => (prev === teamId ? null : teamId));
  }, []);


// Open the Add League modal (reset edit state)
// Fn: handleAddLeague
  const handleAddLeague = () => {
    setEditLeagueData(null);
    setShowAddLeagueModal(true);
    console.log("Opening Add League form...");
  };

// Open the Add Team modal for the selected league (requires a league selected)
// Fn: handleAddTeam
  const handleAddTeam = () => {
    if (!selectedLeagueId) {
      alert("Please select a league first to add a team.");
      return;
    }
    setEditTeamData(null);
    setShowAddTeamModal(true);
    console.log(`Opening Add Team form for League: ${selectedLeagueId}...`);
  };

  const handleSaveLeague = async (leagueData: { id: string; name: string; country: string }) => {
    if (!leagueData.id) throw new Error('League id is required');
    const leagueRef: DatabaseReference = ref(db, `leagues/${leagueData.id}`);
    await set(leagueRef, {
      name: leagueData.name,
      country: leagueData.country,
    });
  };

  const handleSaveTeam = async (teamData: { id: string; leagueId: string; name: string; location: string; record: { wins: number; losses: number; ties: number } }) => {
    if (!teamData.id) throw new Error('Team id is required');
    const teamRef: DatabaseReference = ref(db, `Teams/${teamData.id}`);
    await set(teamRef, {
      leagueId: teamData.leagueId,
      name: teamData.name,
      location: teamData.location,
      record: teamData.record,
    });
  };

// Return a safe empty team object when needed for UI fallbacks
// Fn: teamsFallback
  const teamsFallback = () => ({ id: '', leagueId: selectedLeagueId ?? '', name: '', location: '', record: { wins: 0, losses: 0, ties: 0 } });

  const renderLeagueItem = ({ item }: { item: League }) => (
    <View style={[styles.itemContainer, selectedLeagueId === item.id && styles.selectedItem, {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}]}>
      <TouchableOpacity onPress={() => handleSelectLeague(item.id)} style={{flex: 1}}>
        <Text style={styles.itemText}>- {item.name} ({item.country})</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setOpenMenu(prev => prev === `league:${item.id}` ? null : `league:${item.id}`)} style={styles.menuButton}>
        <Text style={styles.menuButtonText}>⋯</Text>
      </TouchableOpacity>
    </View>
  );

  const renderTeamItem = ({ item }: { item: Team }) => (
    <View style={[styles.itemContainer, selectedTeamId === item.id && styles.selectedItem, {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}]}>
      <TouchableOpacity onPress={() => handleSelectTeam(item.id)} style={{flex: 1}}>
        <Text style={styles.itemText}>- {item.name}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setOpenMenu(prev => prev === `team:${item.id}` ? null : `team:${item.id}`)} style={styles.menuButton}>
        <Text style={styles.menuButtonText}>⋯</Text>
      </TouchableOpacity>
      {openMenu === `team:${item.id}` && (
        <View style={styles.popupMenu}>
          <Text style={styles.popupTitle}>{item.name}</Text>
          <TouchableOpacity style={styles.popupItem} onPress={() => {
            setEditTeamData({ id: item.id, leagueId: item.leagueId, name: item.name, location: item.location, record: item.record });
            setShowAddTeamModal(true);
            setOpenMenu(null);
          }}>
            <Text style={styles.popupItemText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.popupItem} onPress={async () => {
            try {
              await set(ref(db, `Teams/${item.id}`), null);
            } catch (e) {
              console.error('Failed to delete team', e);
            } finally {
              setOpenMenu(null);
            }
          }}>
            <Text style={[styles.popupItemText, {color: colors.textMuted}]}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderPlayerItem = ({ item }: { item: Player }) => (
    <View style={[styles.itemContainer, {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}]}>
      <Text style={styles.itemText}>- #{item.number} {item.name} ({item.position})</Text>
      <TouchableOpacity onPress={() => router.push(`/player/${item.id}`)} style={styles.menuButton}>
        <Text style={styles.menuButtonText}>›</Text>
      </TouchableOpacity>
      
    </View>
  );

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Leagues</Text>
        <TouchableOpacity onPress={handleAddLeague} style={styles.addButton}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      {loadingLeagues ? (
        <ActivityIndicator size="small" color={colors.green} />
      ) : (
        <FlatList
          data={leagues}
          keyExtractor={(item: League) => item.id}
          renderItem={renderLeagueItem}
          ListEmptyComponent={<Text style={styles.emptyText}>No leagues found.</Text>}
          scrollEnabled={false}
        />
      )}

      {selectedLeagueId && (
        <>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Teams in {selectedLeagueId}</Text>
            <TouchableOpacity onPress={handleAddTeam} style={styles.addButton}>
              <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          {loadingTeams ? (
            <ActivityIndicator size="small" color={colors.green} />
          ) : (
            <FlatList
              data={filteredTeams}
              keyExtractor={(item: Team) => item.id}
              renderItem={renderTeamItem}
              ListEmptyComponent={<Text style={styles.emptyText}>No teams found for this league.</Text>}
              scrollEnabled={false}
            />
          )}
        </>
      )}

      {selectedTeamId && (
        <>
          {(() => {
            const team = filteredTeams.find(t => t.id === selectedTeamId);
            if (!team) return <Text style={styles.emptyText}>Loading team...</Text>;

            return (
              <View>
                <Text style={styles.title}>{team.name} Stats</Text>
                <Text style={styles.itemText}>Location: {team.location}</Text>
                <Text style={styles.itemText}>Record: {team.record?.wins ?? 0} - {team.record?.losses ?? 0} - {team.record?.ties ?? 0}</Text>
              </View>
            );
          })()}
          {loadingPlayers ? (
            <ActivityIndicator size="small" color={colors.green} />
          ) : (
            <FlatList
              data={filteredPlayers}
              keyExtractor={(item: Player) => item.id}
              renderItem={renderPlayerItem}
              ListEmptyComponent={<Text style={styles.emptyText}>No players found for this team.</Text>}
              scrollEnabled={false}
            />
          )}
          <TouchableOpacity style={styles.addPlayerButton} onPress={() => router.push('/player/new')}>
            <Text style={styles.addPlayerButtonText}>+ Add Player</Text>
          </TouchableOpacity>
        </>
      )}

      {}
      <AddLeagueModal
        isVisible={showAddLeagueModal}
        onClose={() => setShowAddLeagueModal(false)}
        onSave={async (leagueData) => {
          try {
            await handleSaveLeague(leagueData);
          } catch (e) {
            console.error('Failed to save league', e);
            throw e;
          } finally {
            setShowAddLeagueModal(false);
          }
        }}
        initialData={editLeagueData}
        mode={editLeagueData ? 'edit' : 'add'}
      />

      <AddTeamModal
        isVisible={showAddTeamModal}
        onClose={() => setShowAddTeamModal(false)}
        onSave={async (teamData) => {
          try {
            await handleSaveTeam(teamData);
          } catch (e) {
            console.error('Failed to save team', e);
            throw e;
          } finally {
            setShowAddTeamModal(false);
          }
        }}
        selectedLeagueId={selectedLeagueId}
        selectedLeagueName={leagues.find(l => l.id === selectedLeagueId)?.name ?? ''}
        initialData={editTeamData}
        mode={editTeamData ? 'edit' : 'add'}
      />

      {}
      <Modal
        visible={!!openMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setOpenMenu(null)}
      >
        <TouchableWithoutFeedback onPress={() => setOpenMenu(null)}>
          <View style={styles.menuOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.menuModalContainer} pointerEvents="box-none">
          <View style={styles.menuModal}>
            {(() => {
              if (!openMenu) return null;
              const [type, id] = openMenu.split(':');
              if (type === 'league') {
                const item = leagues.find(l => l.id === id);
                if (!item) return null;
                return (
                  <View>
                    <Text style={styles.popupTitle}>{item.name}</Text>
                    <TouchableOpacity style={styles.popupItem} onPress={() => {
                      setEditLeagueData({ id: item.id, name: item.name, country: item.country });
                      setShowAddLeagueModal(true);
                      setOpenMenu(null);
                    }}>
                      <Text style={styles.popupItemText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.popupItem} onPress={async () => {
                      try {
                        await set(ref(db, `leagues/${item.id}`), null);
                      } catch (e) {
                        console.error('Failed to delete league', e);
                      } finally {
                        setOpenMenu(null);
                      }
                    }}>
                      <Text style={[styles.popupItemText, {color: colors.textMuted}]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                );
              }
              if (type === 'team') {
                const item = filteredTeams.find(t => t.id === id) || teamsFallback();
                if (!item) return null;
                return (
                  <View>
                    <Text style={styles.popupTitle}>{item.name}</Text>
                    <TouchableOpacity style={styles.popupItem} onPress={() => {
                      setEditTeamData({ id: item.id, leagueId: item.leagueId, name: item.name, location: item.location, record: item.record });
                      setShowAddTeamModal(true);
                      setOpenMenu(null);
                    }}>
                      <Text style={styles.popupItemText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.popupItem} onPress={async () => {
                      try {
                        await set(ref(db, `Teams/${item.id}`), null);
                      } catch (e) {
                        console.error('Failed to delete team', e);
                      } finally {
                        setOpenMenu(null);
                      }
                    }}>
                      <Text style={[styles.popupItemText, {color: colors.textMuted}]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                );
              }
              if (type === 'player') {
                const item = filteredPlayers.find(p => p.id === id);
                if (!item) return null;
                return (
                  <View>
                    <Text style={styles.popupTitle}>{item.name}</Text>
                    <TouchableOpacity style={styles.popupItem} onPress={() => {
                      setOpenMenu(null);
                      alert('Edit player not implemented yet');
                    }}>
                      <Text style={styles.popupItemText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.popupItem} onPress={async () => {
                      try {
                        await set(ref(db, `Players/${item.id}`), null);
                      } catch (e) {
                        console.error('Failed to delete player', e);
                      } finally {
                        setOpenMenu(null);
                      }
                    }}>
                      <Text style={[styles.popupItemText, {color: colors.textMuted}]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                );
              }
              return null;
            })()}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
    backgroundColor: colors.background,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)'
  },
  menuModalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuModal: {
    width: 280,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: colors.green,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  addButton: { 
    backgroundColor: colors.green, 
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: 'rgba(0,0,0,0.9)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
  },
    addButtonText: {
    color: colors.background,
    fontSize: 20,
    lineHeight: 22, 
    fontWeight: 'bold',
  },
  itemContainer: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginBottom: 5,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  selectedItem: {
    backgroundColor: colors.surface,
    borderColor: colors.green,
  },
  itemText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  errorText: {
    color: colors.green,
    fontSize: 16,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 10,
  },
  menuButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  menuButtonText: {
    fontSize: 20,
    color: colors.textPrimary,
  },
  popupMenu: {
    position: 'absolute',
    right: 10,
    top: 36,
    backgroundColor: colors.surface,
    borderRadius: 6,
    padding: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.green,
    zIndex: 999,
  },
  popupTitle: {
    fontWeight: 'bold',
    marginBottom: 6,
    color: colors.textPrimary,
  },
  popupItem: {
    paddingVertical: 6,
  },
  popupItemText: {
    fontSize: 16,
    color: colors.green,
  },
  addPlayerButton: {
    marginTop: 12,
    alignSelf: 'center',
    backgroundColor: colors.green,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    shadowColor: 'rgba(0,0,0,0.9)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
  },
  addPlayerButtonText: {
    color: colors.background,
    fontWeight: 'bold',
  },
});
