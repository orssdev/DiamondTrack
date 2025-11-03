import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Dropdown from '../components/Dropdown';
import { ref, onValue } from 'firebase/database';
import { db } from '../../firebaseConfig';
import { useRouter } from 'expo-router';

export default function StartScreen() {
	const [leagues, setLeagues] = useState<Array<{id:string; name:string}>>([]);
	const [teams, setTeams] = useState<Array<{id:string; name:string; leagueId:string}>>([]);

	const [homeLeague, setHomeLeague] = useState<string>('');
	const [homeTeam, setHomeTeam] = useState<string>('');
	const [awayLeague, setAwayLeague] = useState<string>('');
	const [awayTeam, setAwayTeam] = useState<string>('');

	const router = useRouter();

	useEffect(() => {
		const leaguesRef = ref(db, 'leagues');
		const unsubL = onValue(leaguesRef, (snap) => {
			const data = snap.val();
			setLeagues(data ? Object.keys(data).map(k => ({ id: k, ...data[k] })) : []);
		});

		const teamsRef = ref(db, 'Teams');
		const unsubT = onValue(teamsRef, (snap) => {
			const data = snap.val();
			setTeams(data ? Object.keys(data).map(k => ({ id: k, ...data[k] })) : []);
		});

		return () => { unsubL(); unsubT(); };
	}, []);

	const teamsForLeague = (leagueId:string) => teams.filter(t => t.leagueId === leagueId);

		const handleStart = () => {
		if (!homeTeam || !awayTeam) {
			alert('Please select both home and away teams');
			return;
		}
			// use as any to avoid strict route typing when building dynamic query string
			router.push({ pathname: '../GameScreen', params: { home: homeTeam, away: awayTeam } } as any);
	};

	return (
		<View style={styles.container}>
			<Text style={styles.sectionTitle}>HOME</Text>
			<Text style={styles.label}>League:</Text>
			<Dropdown items={[{label: 'Select league', value: ''}, ...leagues.map(l => ({label: l.name, value: l.id}))]} selectedValue={homeLeague} onValueChange={(v: string) => { setHomeLeague(v); setHomeTeam(''); }} placeholder="Select league" />
			<Text style={styles.label}>Team:</Text>
			<Dropdown items={[{label: 'Select team', value: ''}, ...teamsForLeague(homeLeague).map(t => ({label: t.name, value: t.id}))]} selectedValue={homeTeam} onValueChange={setHomeTeam} placeholder="Select team" />

			<View style={{height:24}} />
			<Text style={styles.sectionTitle}>AWAY</Text>
			<Text style={styles.label}>League:</Text>
			<Dropdown items={[{label: 'Select league', value: ''}, ...leagues.map(l => ({label: l.name, value: l.id}))]} selectedValue={awayLeague} onValueChange={(v: string) => { setAwayLeague(v); setAwayTeam(''); }} placeholder="Select league" />
			<Text style={styles.label}>Team:</Text>
			<Dropdown items={[{label: 'Select team', value: ''}, ...teamsForLeague(awayLeague).map(t => ({label: t.name, value: t.id}))]} selectedValue={awayTeam} onValueChange={setAwayTeam} placeholder="Select team" />

			<View style={{height: 32}} />
			<TouchableOpacity style={styles.startButton} onPress={handleStart}>
				<Text style={styles.startButtonText}>START</Text>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, padding: 20, backgroundColor: '#fff' },
	sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 8 },
	label: { marginTop: 8, fontSize: 14 },
	startButton: { backgroundColor: '#007bff', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
	startButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

