// server/database.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const LEAGUES_KEY = 'leagues';
const TEAMS_KEY = 'teams';
const PLAYERS_KEY = 'players';

export type League = { id: number; name: string };
export type Team = { id: number; name: string; league_id: number };
export type Player = { id: number; name: string; position: string; team_id: number };

// Initialize default data
export async function initDatabase() {
  const leagues = await AsyncStorage.getItem(LEAGUES_KEY);
  if (!leagues) {
    await AsyncStorage.setItem(
      LEAGUES_KEY,
      JSON.stringify([
        { id: 1, name: 'MLB' },
        { id: 2, name: 'AAA' },
      ])
    );
  }

  const teams = await AsyncStorage.getItem(TEAMS_KEY);
  if (!teams) {
    await AsyncStorage.setItem(
      TEAMS_KEY,
      JSON.stringify([
        { id: 1, name: 'Brewers', league_id: 1 },
        { id: 2, name: 'Cubs', league_id: 1 },
        { id: 3, name: 'Scranton', league_id: 2 },
      ])
    );
  }

  const players = await AsyncStorage.getItem(PLAYERS_KEY);
  if (!players) {
    await AsyncStorage.setItem(
      PLAYERS_KEY,
      JSON.stringify([
        { id: 1, name: 'Christian Yelitch', position: 'OF', team_id: 1 },
        { id: 2, name: 'Freddy Peralta', position: 'RSP', team_id: 1 },
        { id: 3, name: 'Cal Raleigh', position: 'OF', team_id: 2 },
        { id: 4, name: 'Player AAA', position: 'P', team_id: 3 },
      ])
    );
  }
}

// Getters
export async function getLeagues(): Promise<League[]> {
  const leagues = await AsyncStorage.getItem(LEAGUES_KEY);
  return leagues ? JSON.parse(leagues) : [];
}

export async function getTeamsByLeague(league_id: number): Promise<Team[]> {
  const teams = await AsyncStorage.getItem(TEAMS_KEY);
  return teams
    ? JSON.parse(teams).filter((t: Team) => t.league_id === league_id)
    : [];
}

export async function getPlayersByTeam(team_id: number): Promise<Player[]> {
  const players = await AsyncStorage.getItem(PLAYERS_KEY);
  return players
    ? JSON.parse(players).filter((p: Player) => p.team_id === team_id)
    : [];
}

// Add a player
export async function addPlayer(player: Player) {
  const players = await AsyncStorage.getItem(PLAYERS_KEY);
  const arr: Player[] = players ? JSON.parse(players) : [];
  arr.push(player);
  await AsyncStorage.setItem(PLAYERS_KEY, JSON.stringify(arr));
}
