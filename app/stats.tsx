import { useRouter } from 'expo-router';
import { DatabaseReference, DataSnapshot, equalTo, onValue, orderByChild, query, ref, set } from 'firebase/database';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { db } from '../firebaseConfig';
import AddLeagueModal from './components/addLeagueModal';
import AddTeamModal from './components/addTeamModal';

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
    battingAverage: number;
    plateAppearences: number;
  }
}

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

  // New state for showing add item modals
  const [showAddLeagueModal, setShowAddLeagueModal] = useState<boolean>(false);
  const [showAddTeamModal, setShowAddTeamModal] = useState<boolean>(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [editLeagueData, setEditLeagueData] = useState<{ id: string; name: string; country: string } | null>(null);
  const [editTeamData, setEditTeamData] = useState<{ id: string; leagueId: string; name: string; location: string; record?: { wins: number; losses: number; ties: number } } | null>(null);
  const router = useRouter();
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

  useEffect(() => {
    let unsubscribe: () => void = () => {};

    if (selectedLeagueId) {
      setLoadingTeams(true);
      setFilteredTeams([]);
      setFilteredPlayers([]);
      setSelectedTeamId(null);

      const teamsRef: DatabaseReference = ref(db, 'Teams'); // Ensure 'teams' matches your RTDB path
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

  useEffect(() => {
    let unsubscribe: () => void = () => {};

    if (selectedTeamId) {
      setLoadingPlayers(true);
      setFilteredPlayers([]);

      const playersRef: DatabaseReference = ref(db, 'Players'); // Ensure 'players' matches your RTDB path
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


  const handleAddLeague = () => {
    setEditLeagueData(null);
    setShowAddLeagueModal(true);
    console.log("Opening Add League form...");
  };

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
            <Text style={[styles.popupItemText, {color: 'red'}]}>Delete</Text>
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
        <ActivityIndicator size="small" color="#0000ff" />
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
            <ActivityIndicator size="small" color="#0000ff" />
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
            <ActivityIndicator size="small" color="#0000ff" />
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

      {/* Add Modals */}
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

      {/* Full-screen menu modal to avoid clipping */}
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
                      <Text style={[styles.popupItemText, {color: 'red'}]}>Delete</Text>
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
                      <Text style={[styles.popupItemText, {color: 'red'}]}>Delete</Text>
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
                      <Text style={[styles.popupItemText, {color: 'red'}]}>Delete</Text>
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
    backgroundColor: '#f8f8f8',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)'
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
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: { // New style for title and button alignment
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: { 
    backgroundColor: '#007bff', 
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'space-around',
    alignItems: 'center'
  },
    addButtonText: {
    color: 'white',
    fontSize: 20,
    lineHeight: 22, 
    fontWeight: 'bold',
  },
  itemContainer: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginBottom: 5,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedItem: {
    backgroundColor: '#e6f7ff',
    borderColor: '#007bff',
  },
  itemText: {
    fontSize: 16,
    color: '#555',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 10,
  },
  menuButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  menuButtonText: {
    fontSize: 20,
    color: '#333',
  },
  popupMenu: {
    position: 'absolute',
    right: 10,
    top: 36,
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    zIndex: 999,
  },
  popupTitle: {
    fontWeight: 'bold',
    marginBottom: 6,
  },
  popupItem: {
    paddingVertical: 6,
  },
  popupItemText: {
    fontSize: 16,
    color: '#007bff',
  },
  addPlayerButton: {
    marginTop: 12,
    alignSelf: 'center',
    backgroundColor: '#007bff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addPlayerButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
