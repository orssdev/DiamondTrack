import { useRouter } from 'expo-router';
import { onAuthStateChanged, signInAnonymously, signOut, User } from 'firebase/auth';
import { onValue, ref } from 'firebase/database';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Image, Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { auth, db } from '../firebaseConfig';
import Dropdown from './components/Dropdown';
import { colors } from './theme/colors';
import { on as onEvent } from './utils/events';

export default function StartScreen() {
    // Authentication state
    const [currentUser, setCurrentUser] = useState<User | null>(null); 
    const [authLoading, setAuthLoading] = useState<boolean>(true); 

    const [leagues, setLeagues] = useState<Array<{id:string; name:string}>>([]);
    const [teams, setTeams] = useState<Array<{id:string; name:string; leagueId:string}>>([]);

    const [homeLeague, setHomeLeague] = useState<string>('');
    const [homeTeam, setHomeTeam] = useState<string>('');
    const [awayLeague, setAwayLeague] = useState<string>('');
    const [awayTeam, setAwayTeam] = useState<string>('');
    const router = useRouter();
    const [showMenu, setShowMenu] = useState<boolean>(false);

    const [logoClicks, setLogoClicks] = useState<number>(0);
    const [showEaster, setShowEaster] = useState<boolean>(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    //Authenticate
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setAuthLoading(false);
            if (user) {
                console.log("User signed in:", user.uid);
            } else {
                console.log("No user signed in.");
            }
        });
        return unsubscribe; 
    }, []);

    const handleSignInAnonymously = async () => {
        try {
            await signInAnonymously(auth);
        } catch (error: any) {
            console.error("Anonymous sign-in failed:", error.message);
            Alert.alert("Sign-in Failed", "Could not sign in anonymously: " + error.message);
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut(auth);
        } catch (error: any) {
            console.error("Sign out failed:", error.message);
            Alert.alert("Sign-out Failed", "Could not sign out: " + error.message);
        }
    };
 

    useEffect(() => {
        const unsub = onEvent('openMenu', (payload) => {
            if (payload === 'start') setShowMenu(true);
        });
        return unsub;
    }, []);

    // Fetch Data
    useEffect(() => {
        if (!authLoading && currentUser) {
            console.log("Fetching league and team data...");
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
        } else if (!authLoading && !currentUser) {
            setLeagues([]);
            setTeams([]);
        }
    }, [authLoading, currentUser]); 


    const teamsForLeague = (leagueId:string) => teams.filter(t => t.leagueId === leagueId);

    const handleStart = () => {
        if (!homeTeam || !awayTeam) {
            Alert.alert('Selection Required', 'Please select both home and away teams.');
            return;
        }
        router.push({ pathname: '/GameScreen', params: { home: homeTeam, away: awayTeam } } as any);
    };

    const handleLogoClick = () => {
            setLogoClicks(c => {
                const next = c + 1;
                if (next >= 20) {
                    // show easter image and fade out over 1 second
                    setShowEaster(true);
                    fadeAnim.setValue(1);
                    Animated.timing(fadeAnim, { toValue: 0, duration: 1000, useNativeDriver: true }).start(() => {
                        //setShowEaster(false);
                        //setLogoClicks(0);
                    });
                }
                return next;
            });
        };
	

    return (
        <View style={styles.container}>
            {authLoading ? (
                <View style={styles.authContentContainer}>
                    <ActivityIndicator size="large" color={colors.green} />
                    <Text style={styles.authText}>Loading authentication...</Text>
                </View>
            ) : currentUser ? (
                <>
                    
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

                    <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                        <Text style={styles.signOutButtonText}>Sign Out</Text>
                    </TouchableOpacity>
                </>
            ) : (
                <View style={styles.authContentContainer}>
                    <Text style={styles.authText}>Please sign in to access DiamondTrack.</Text>
                    <TouchableOpacity style={styles.signInButton} onPress={handleSignInAnonymously}>
                        <Text style={styles.signInButtonText}>Sign In Anonymously</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Modal and Footer are outside conditional rendering as they are global to the screen */}
            <Modal visible={showMenu} transparent animationType="fade" onRequestClose={() => setShowMenu(false)}>
                <TouchableWithoutFeedback onPress={() => setShowMenu(false)}>
                    <View style={{flex:1, backgroundColor:'rgba(0,0,0,0.4)'}} />
                </TouchableWithoutFeedback>
                <View style={{position:'absolute', top:60, right:12}}>
                    <View style={{backgroundColor:'#071524', padding:12, borderRadius:8}}>
                        <TouchableOpacity onPress={() => { setShowMenu(false); /* reset game - no-op here */ }} style={{padding:8}}>
                            <Text style={{color:'#fff'}}>Reset Game</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => { setShowMenu(false); router.push('/stats'); }} style={{padding:8}}>
                            <Text style={{color:'#fff'}}>Stats</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <TouchableOpacity style={styles.footer} onPress={() => { handleLogoClick(); }} activeOpacity={0.8}>
                <Text style={styles.footerText}>DiamondTrack ⚾</Text>
            </TouchableOpacity>

            {showEaster && (
                <Animated.View style={{ position: 'absolute', left: 0, right: 0, top: '5%', alignItems: 'center', opacity: fadeAnim }} pointerEvents="none">
                    <Image source={require('../assets/images/easter_chad.jpg')} style={{ width: 900, height: 900, opacity: 1 }} />
                </Animated.View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: colors.background,
        paddingBottom: 180, // Space for the footer
    },
    authContentContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 180, // Ensures content is above the footer
    },
    authText: {
        color: colors.textPrimary,
        fontSize: 18,
        marginBottom: 20,
        textAlign: 'center',
    },
    signInButton: {
        backgroundColor: colors.green,
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 8,
        shadowColor: 'rgba(0,0,0,0.9)',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 6,
    },
    signInButtonText: {
        color: colors.background,
        fontSize: 16,
        fontWeight: 'bold',
    },
    signOutButton: {
        position: 'absolute',
        bottom: 150, // Position above the footer
        alignSelf: 'center',
        backgroundColor: 'transparent',
        padding: 8,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: colors.textSubtle,
    },
    signOutButtonText: {
        color: colors.textSubtle,
        fontSize: 12,
    },
    sectionTitle: { fontSize: 18, fontWeight: '700', marginTop: 8, color: colors.textPrimary },
    label: { marginTop: 8, fontSize: 14, color: colors.textSubtle },
    startButton: {
        backgroundColor: colors.surface,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
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
