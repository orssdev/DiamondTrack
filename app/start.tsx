import { useRouter } from 'expo-router';
import { onValue, ref } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../firebaseConfig';
import Dropdown from './components/Dropdown';
import { colors } from './theme/colors';

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

			{/* Footer logo at bottom */}
			<TouchableOpacity style={styles.footer} onPress={() => console.log('Logo pressed')} activeOpacity={0.8}>
				<Text style={styles.footerText}>DiamondTrack ⚾</Text>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	// Adopted the GameScreen visual theme (dark navy, green accents) but kept StartScreen logic unchanged
	container: { flex: 1, padding: 20, backgroundColor: colors.background, paddingBottom: 180 },
	sectionTitle: { fontSize: 18, fontWeight: '700', marginTop: 8, color: colors.textPrimary },
	label: { marginTop: 8, fontSize: 14, color: colors.textSubtle },
	// Button styling visually matches the Outcome pop-up (green border and text)
	startButton: {
		backgroundColor: colors.surface,
		paddingVertical: 14,
		borderRadius: 8,
		alignItems: 'center',
		justifyContent: 'center',
		// Raised look
		shadowColor: 'rgba(0,0,0,0.9)',
		shadowOffset: { width: 0, height: 3 },
		shadowOpacity: 0.4,
		shadowRadius: 4,
		elevation: 6,
		borderWidth: 1,
		borderColor: colors.green,
	},
	startButtonText: { color: colors.green, fontWeight: '700', fontSize: 16 },
	footer: {
		position: 'absolute',
		left: 0,
		right: 0,
		bottom: 0,
		height: 140,
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: colors.surface,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: colors.background,
		paddingHorizontal: 12,
		paddingBottom: 8,
	},
	footerText: {
		fontSize: 30,
		color: colors.green,
		fontWeight: '800',
		letterSpacing: 0.8,
	},
});

