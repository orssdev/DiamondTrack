import { useLocalSearchParams, useRouter } from 'expo-router';
import { onValue, ref, get, set, update } from 'firebase/database';
import { on as onEvent, emit } from './utils/events';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { db } from '../firebaseConfig';
import StatsSheet from './components/StatsSheet';
import { colors } from './theme/colors';
import { on as onEvent } from './utils/events';

const { width, height } = Dimensions.get("window");

export default function GameScreen() {
  const params = useLocalSearchParams();
    const homeId = params.home as string | undefined;
    const awayId = params.away as string | undefined;
  
    const [homeName, setHomeName] = useState<string>('');
    const [awayName, setAwayName] = useState<string>('');
    const [loading, setLoading] = useState(true);
    // interactive state
    const [balls, setBalls] = useState<number>(0); // 0..3
    const [strikes, setStrikes] = useState<number>(0); // 0..2
    const [outs, setOuts] = useState<number>(0); // 0..2

    // game-wide state
    const [homeRuns, setHomeRuns] = useState<number>(0);
    const [awayRuns, setAwayRuns] = useState<number>(0);
    const [inning, setInning] = useState<number>(1);
    const [isTop, setIsTop] = useState<boolean>(true); // top of inning initially
    const [runners, setRunners] = useState<{first:boolean; second:boolean; third:boolean}>({ first:false, second:false, third:false });

    // history stack for undo - store full game state snapshot
    const [history, setHistory] = useState<Array<any>>([]);

    const [showOutcomeModal, setShowOutcomeModal] = useState<boolean>(false);
      const [showStatsSheet, setShowStatsSheet] = useState<boolean>(false);
      const [showHeaderMenu, setShowHeaderMenu] = useState<boolean>(false);
    // runner confirmation modal state
    const [pendingRunnerPrompts, setPendingRunnerPrompts] = useState<Array<'first'|'second'|'third'>>([]);
    const [pendingOutcomeResult, setPendingOutcomeResult] = useState<OutcomeResult | null>(null);
  const [pendingOutcomeKey, setPendingOutcomeKey] = useState<string | null>(null);
    const [pendingPreRunners, setPendingPreRunners] = useState<RunnerState | null>(null);
    const [currentPromptIndex, setCurrentPromptIndex] = useState<number>(0);
    const router = useRouter();

    // field images map (key: first-second-third)
    const fieldImages: Record<string, any> = {
      '000': require("../assets/images/BaseballField_E.png"),
      '100': require("../assets/images/BaseballField_1.png"),
      '010': require("../assets/images/BaseballField_2.png"),
      '001': require("../assets/images/BaseballField_3.png"),
      '110': require("../assets/images/BaseballField_12.png"),
      '011': require("../assets/images/BaseballField_23.png"),
      '111': require("../assets/images/BaseballField_123.png"),
      '101': require("../assets/images/BaseballField_13.png"),
    };

    const getFieldImage = (r:{first:boolean; second:boolean; third:boolean}) => {
      const key = `${r.first?1:0}${r.second?1:0}${r.third?1:0}`;
      return fieldImages[key] ?? fieldImages['000'];
    };
  
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

    useEffect(() => {
      const unsub = onEvent('openMenu', (payload) => {
        if (payload === 'game') setShowHeaderMenu(true);
      });
      return unsub;
    }, []);

    // current batter slot and display name
    const [currentBatSlot, setCurrentBatSlot] = useState<number>(1);
    const [currentBatterDisplay, setCurrentBatterDisplay] = useState<string>('');
    // persist per-team current batter slots so switching sides restores correct batter
    const [homeCurrentBat, setHomeCurrentBat] = useState<number>(1);
    const [awayCurrentBat, setAwayCurrentBat] = useState<number>(1);

    useEffect(() => {
      const battingTeamId = isTop ? awayId : homeId;
      // when switching sides, set currentBatSlot to saved value for that team
      if (!battingTeamId) { setCurrentBatterDisplay(''); return; }
      const saved = isTop ? awayCurrentBat : homeCurrentBat;
      setCurrentBatSlot(saved || 1);
      // read lineup slot -> playerId, then fetch player name
      const slotRef = ref(db, `Teams/${battingTeamId}/lineup/${currentBatSlot}`);
      let unsubP: any = () => {};
      const unsubSlot = onValue(slotRef, (snap) => {
        const pid = snap.val();
        // cleanup previous player listener
        try { unsubP(); } catch (e) {}
        if (!pid) { setCurrentBatterDisplay(`${currentBatSlot}. (empty)`); return; }
        const pSnapRef = ref(db, `Players/${pid}`);
        unsubP = onValue(pSnapRef, (psnap) => {
          const p = psnap.val();
          if (p) setCurrentBatterDisplay(`${currentBatSlot}. ${p.name}, ${p.position ?? ''} #${p.number ?? ''}`);
          else setCurrentBatterDisplay(`${currentBatSlot}. Unknown`);
        });
      });
      return () => { try { unsubSlot(); } catch (e) {}; try { unsubP(); } catch (e) {} };
    }, [homeId, awayId, isTop, currentBatSlot, homeCurrentBat, awayCurrentBat]);

    // watch Teams/<team>/currentBatSlot so changes persist across screens
    useEffect(() => {
      let unsubHome: any = () => {};
      let unsubAway: any = () => {};
      if (homeId) {
        const r = ref(db, `Teams/${homeId}/currentBatSlot`);
        unsubHome = onValue(r, (snap) => {
          const v = snap.val();
          setHomeCurrentBat(typeof v === 'number' ? v : (v ? Number(v) : 1));
        });
      }
      if (awayId) {
        const r = ref(db, `Teams/${awayId}/currentBatSlot`);
        unsubAway = onValue(r, (snap) => {
          const v = snap.val();
          setAwayCurrentBat(typeof v === 'number' ? v : (v ? Number(v) : 1));
        });
      }
      return () => { unsubHome(); unsubAway(); };
    }, [homeId, awayId]);

    const handleRestartGame = () => {
      // reset only the in-memory game state
      setHomeRuns(0); setAwayRuns(0); setInning(1); setIsTop(true); setBalls(0); setStrikes(0); setOuts(0); setRunners({ first:false, second:false, third:false });
      setShowHeaderMenu(false);
    };


    const handleEndGame = () => {
      Alert.alert('Confirm end game','This will finalize the game and apply stats to players. Proceed?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'End Game', style: 'default', onPress: () => { {router.push('/start'); } setShowHeaderMenu(false); } }
      ]);
    };
  
    if (loading) return <View style={styles.centered}><ActivityIndicator /></View>;

  // OUTCOMES
  type RunnerState = { first: boolean; second: boolean; third: boolean };
  type OutcomeResult = { balls: number; strikes: number; outs: number; runners: RunnerState; runsScored: number };
  type Outcome = { key: string; label: string; effect: (s: { balls:number; strikes:number; outs:number; runners: RunnerState }) => OutcomeResult };

  const OUTCOMES: Outcome[] = [
      { key: 'single', label: 'Single', effect: (s) => {
          const r = s.runners;
          const runs = r.third ? 1 : 0;
          const newThird = r.second;
          const newSecond = r.first;
          const newFirst = true;
          return { balls:0, strikes:0, outs: s.outs, runners: { first: newFirst, second: newSecond, third: newThird }, runsScored: runs };
        }},

      { key: 'double', label: 'Double', effect: (s) => {
          const r = s.runners;
          const runs = (r.third?1:0) + (r.second?1:0);
          const newThird = r.first;
          const newSecond = true;
          const newFirst = false;
          return { balls:0, strikes:0, outs: s.outs, runners: { first: newFirst, second: newSecond, third: newThird }, runsScored: runs };
        }},

      { key: 'home_run', label: 'Home Run', effect: (s) => {
          const r = s.runners;
          const occupied = (r.first?1:0)+(r.second?1:0)+(r.third?1:0);
          const runs = occupied + 1; 
          return { balls:0, strikes:0, outs: s.outs, runners: { first:false, second:false, third:false }, runsScored: runs };
        }},

      { key: 'walk', label: 'Walk', effect: (s) => {
          const r = s.runners;
          let runs = 0;
          if (r.first && r.second && r.third) runs += 1;
          const newFirst = true;
          const newSecond = r.first || false;
          const newThird = r.second || false;
          return { balls:0, strikes:0, outs: s.outs, runners: { first: newFirst, second: newSecond, third: newThird }, runsScored: runs };
        }},

      { key: 'strikeout', label: 'Strikeout', effect: (s) => ({
        balls:0, 
        strikes:0, 
        outs: Math.min(3, s.outs + 1), 
        runners: s.runners, 
        runsScored: 0 })
       },

      { key: 'groundout', label: 'Ground Out', effect: (s) => ({ 
        balls:0, 
        strikes:0, 
        outs: Math.min(3, s.outs + 1), 
        runners: s.runners, 
        runsScored: 0 })
       },

      { key: 'flyout', label: 'Fly Out', effect: (s) => ({ 
        balls:0, 
        strikes:0, 
        outs: Math.min(3, s.outs + 1), 
        runners: s.runners, 
        runsScored: 0 })
       },

      { key: 'foul', label: 'Foul', effect: (s) => ({ 
        balls: s.balls, 
        strikes: Math.min(2, s.strikes + 1), 
        outs: s.outs, 
        runners: s.runners, 
        runsScored: 0 }) 
      }

    ];

    const pushHistory = () => {
      setHistory(h => [...h, { balls, strikes, outs, runners: {...runners}, homeRuns, awayRuns, inning, isTop }]);
    };

    const undo = () => {
      setHistory(h => {
        if (h.length === 0) return h;
        const last = h[h.length - 1] as any;
        setBalls(last.balls);
        setStrikes(last.strikes);
        setOuts(last.outs);
        setRunners(last.runners || { first:false, second:false, third:false });
        setHomeRuns(last.homeRuns || 0);
        setAwayRuns(last.awayRuns || 0);
        setInning(last.inning || 1);
        setIsTop(typeof last.isTop === 'boolean' ? last.isTop : true);
        return h.slice(0, h.length - 1);
      });
    };

    const handleBall = () => {
      pushHistory();
      if (balls + 1 >= 4) {
        applyOutcome('walk');
        return;
      }
      setBalls(b => Math.min(3, b + 1));
    };

    const handleStrike = () => {
      pushHistory();
      if (strikes + 1 >= 3) {
        applyOutcome('strikeout');
        return;
      }
      setStrikes(s => Math.min(2, s + 1));
    };

    const applyOutcome = (outcomeKey: string) => {
      const outcome = OUTCOMES.find(o => o.key === outcomeKey);
      if (!outcome) return;
      pushHistory();
      const result = outcome.effect({ balls, strikes, outs, runners });

      const pre = runners;
      const post = result.runners;
      const toPrompt: Array<'first'|'second'|'third'> = [];

      // If outcome is a home run we already know everyone scores -> skip prompting
      if (outcomeKey === 'home_run') {
        commitOutcomeResult(result, outcomeKey);
        return;
      }

      // Only prompt for bases where there was a runner before and their occupancy changed
      (['first','second','third'] as Array<'first'|'second'|'third'>).forEach((base) => {
        if (pre[base] && pre[base] !== post[base]) {
          toPrompt.push(base);
        }
      });

      if (toPrompt.length === 0) {
        commitOutcomeResult(result, outcomeKey);
      } else {
        setPendingPreRunners(pre);
        setPendingOutcomeResult(result);
        setPendingOutcomeKey(outcomeKey);
        setPendingRunnerPrompts(toPrompt);
        setCurrentPromptIndex(0);
        // open a focused runner prompt modal by reusing showOutcomeModal area
        setShowOutcomeModal(false);
      }
    };

    const commitOutcomeResult = (result: OutcomeResult, outcomeKeyParam?: string | null) => {
      setBalls(result.balls);
      setStrikes(result.strikes);
      setOuts(result.outs);
      if (result.runsScored && result.runsScored > 0) {
        if (isTop) setAwayRuns(r => r + result.runsScored);
        else setHomeRuns(r => r + result.runsScored);
      }
      setRunners(result.runners);
      setShowOutcomeModal(false);

      // Update player stats depending on outcome
      const battingTeamId = isTop ? awayId : homeId;
      const battingSlot = currentBatSlot;
      const outcomeKey = outcomeKeyParam ?? pendingOutcomeKey;
      // clear pending outcome key
      setPendingOutcomeKey(null);
      if (battingTeamId && outcomeKey) {
        // only treat these as final plate appearances
        const finalOutcomes = new Set(['single','double','home_run','walk','strikeout','groundout','flyout']);
        const abOutcomes = new Set(['single','double','home_run','strikeout','groundout','flyout']);
        const hitSingles = new Set(['single']);
        const hitDoubles = new Set(['double']);
        const hitTriples = new Set(['triple']);
        const hitHR = new Set(['home_run']);

        if (finalOutcomes.has(outcomeKey)) {
          const slotRef = ref(db, `Teams/${battingTeamId}/lineup/${battingSlot}`);
          get(slotRef).then(snap => {
            const pid = snap.val();
            if (!pid) return;
            // PA always increment for final outcomes
            updatePlayerStats(pid, { plateAppearances: 1 });
            // at-bat increments for abOutcomes
            if (abOutcomes.has(outcomeKey)) updatePlayerStats(pid, { atBats: 1 });
            // hits and specific hit types
            if (hitSingles.has(outcomeKey)) updatePlayerStats(pid, { hits: 1 });
            if (hitDoubles.has(outcomeKey)) updatePlayerStats(pid, { hits: 1, doubles: 1 });
            if (hitTriples.has(outcomeKey)) updatePlayerStats(pid, { hits: 1, triples: 1 });
            if (hitHR.has(outcomeKey)) updatePlayerStats(pid, { hits: 1, homeRuns: 1 });
            // walks
            if (outcomeKey === 'walk') updatePlayerStats(pid, { walks: 1 });
            // strikeouts
            if (outcomeKey === 'strikeout') updatePlayerStats(pid, { strikeouts: 1 });
            // RBIs: approximate by runs scored on the play
            if (result.runsScored && result.runsScored > 0) updatePlayerStats(pid, { rbis: result.runsScored });
          }).catch(() => {});

          // advance batter slot and persist
          advanceBatterSlot(battingTeamId);
        }
      }

      if (result.outs >= 3) {
        setTimeout(() => {
          setBalls(0);
          setStrikes(0);
          setOuts(0);
          setRunners({ first:false, second:false, third:false });
          if (isTop) {
            setIsTop(false);
          } else {
            setIsTop(true);
            setInning(i => i + 1);
          }
        }, 50);
      }
    };

    const handleRunnerChoice = (base: 'first'|'second'|'third', choice: 'held'|'to2'|'to3'|'score'|'to1') => {
      if (!pendingOutcomeResult || !pendingPreRunners) return;
      const r = { ...pendingOutcomeResult.runners } as RunnerState;
      let additionalRuns = 0;

      if (choice === 'held') {
        r[base] = true;
      } else if (choice === 'to1') {
        r.first = true;
        r[base] = false;
      } else if (choice === 'to2') {
        r.second = true;
        r[base] = false;
      } else if (choice === 'to3') {
        r.third = true;
        r[base] = false;
      } else if (choice === 'score') {
        additionalRuns += 1;
        r[base] = false;
      }

      // decrement runsScored in pendingOutcomeResult by replacing with new object
      const newResult: OutcomeResult = { ...pendingOutcomeResult, runners: r, runsScored: (pendingOutcomeResult.runsScored || 0) + additionalRuns };
      setPendingOutcomeResult(newResult);

      // move to next prompt or commit
      const nextIndex = currentPromptIndex + 1;
      if (nextIndex >= pendingRunnerPrompts.length) {
        // all prompts answered -> commit
        setPendingRunnerPrompts([]);
        setPendingPreRunners(null);
        setCurrentPromptIndex(0);
        if (newResult) commitOutcomeResult(newResult);
      } else {
        setCurrentPromptIndex(nextIndex);
      }
    };

    // helper: increment numeric fields on a player record (pa, hits, etc.)
    const updatePlayerStats = async (playerId: string, increments: { [k:string]: number }) => {
      try {
        const pRef = ref(db, `Players/${playerId}`);
        const snap = await get(pRef);
        const p = snap.val() || {};
        const stats = p.stats || {};
        const updates: any = {};
        // write into nested stats keys so player screens read stats.statsKey
        Object.keys(increments).forEach(k => {
          const current = typeof stats[k] === 'number' ? stats[k] : 0;
          updates[`stats/${k}`] = current + increments[k];
        });
        await update(pRef, updates);
      } catch (e) {
        // ignore for now
      }
    };

    // advance the batter slot for a team (1..9, wraps) and persist to Teams/<team>/currentBatSlot
    const advanceBatterSlot = async (teamId: string) => {
      try {
        const curRef = ref(db, `Teams/${teamId}/currentBatSlot`);
        const snap = await get(curRef);
        const cur = typeof snap.val() === 'number' ? snap.val() : (snap.val() ? Number(snap.val()) : 1);
        const next = cur >= 9 ? 1 : cur + 1;
        await set(curRef, next);
        // also update local cached values
        if (teamId === homeId) setHomeCurrentBat(next);
        if (teamId === awayId) setAwayCurrentBat(next);
      } catch (e) {
        // ignore
      }
    };
  return (
    <View style={styles.screen}>
      {/* Info row (three columns) */}
      <View style={styles.infoRow}>
        <View style={styles.infoCell}>
          <Text style={styles.infoTitle}>{homeId || homeName || 'Home'}</Text>
          <Text style={styles.infoValue}>{homeRuns}</Text>
        </View>
        <View style={styles.infoCell}>
          <Text style={styles.infoTitle}>INN</Text>
          <Text style={styles.infoValue}>{isTop ? '↑' : '↓'}{inning}</Text>
        </View>
        <View style={styles.infoCell}>
          <Text style={styles.infoTitle}>{awayId || awayName || 'Away'}</Text>
          <Text style={styles.infoValue}>{awayRuns}</Text>
        </View>
      </View>

      {/* Thin row for Balls / Strikes / Outs (dots) */}
      <View style={styles.countRow}>
        <View style={styles.countGroup}>
          <Text style={styles.countLabel}>B</Text>
          <View style={styles.dotsRow}>
            {[0,1,2].map(i => (
              <View key={i} style={i < balls ? styles.dotPressed : styles.dotEmpty} />
            ))}
          </View>
        </View>

        <View style={styles.countGroup}>
          <Text style={styles.countLabel}>S</Text>
          <View style={styles.dotsRow}>
            {[0,1,2].map(i => (
              <View key={i} style={i < strikes ? styles.dotPressed : styles.dotEmpty} />
            ))}
          </View>
        </View>

        <View style={styles.countGroup}>
          <Text style={styles.countLabel}>O</Text>
          <View style={styles.dotsRow}>
            {[0,1,2].map(i => (
              <View key={i} style={i < outs ? styles.dotFilled : styles.dotEmpty} />
            ))}
          </View>
        </View>
      </View>

      {/* Baseball field image in the center */}
      <View style={styles.fieldContainer}>
        <Image
          source={getFieldImage(runners)}
          style={styles.fieldImage}
          resizeMode="contain"
        />
      </View>

      {/* 2x2 grid of action buttons */}
      <View style={styles.buttonGrid}>
        <TouchableOpacity
          style={styles.gridButton}
          onPress={handleStrike}
        >
          <Text style={styles.gridButtonText}>Strike</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gridButton}
          onPress={handleBall}
        >
          <Text style={styles.gridButtonText}>Ball</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gridButton}
          onPress={() => setShowOutcomeModal(true)}
        >
          <Text style={styles.gridButtonText}>Outcome</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gridButton}
          onPress={undo}
        >
          <Text style={styles.gridButtonText}>Undo</Text>
        </TouchableOpacity>
      </View>

      {/* Outcome modal (full-screen overlay) */}
      <Modal visible={showOutcomeModal} transparent animationType="fade" onRequestClose={() => setShowOutcomeModal(false)}>
        <TouchableWithoutFeedback onPress={() => setShowOutcomeModal(false)}>
          <View style={styles.menuOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.menuModalContainer} pointerEvents="box-none">
          <View style={styles.menuModal}>
            <Text style={{ fontWeight: 'bold', marginBottom: 8, color: '#E6EEF7', fontSize: 16 }}>Select Outcome</Text>
            <FlatList
              data={OUTCOMES}
              keyExtractor={it => it.key}
              renderItem={({item}) => (
                <TouchableOpacity style={styles.popupItem} onPress={() => applyOutcome(item.key) } activeOpacity={0.7}>
                  <Text style={styles.popupItemText}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Runner advance prompt modal (sequential) */}
      <Modal visible={pendingRunnerPrompts.length > 0} transparent animationType="fade" onRequestClose={() => {}}>
        <TouchableWithoutFeedback>
          <View style={styles.menuOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.menuModalContainer} pointerEvents="box-none">
          <View style={styles.menuModal}>
            <Text style={{fontWeight:'bold', marginBottom:8}}>Runner advancement</Text>
            {pendingRunnerPrompts.length > 0 && pendingPreRunners && (
              <View>
                {/* current base being prompted */}
                <Text style={styles.runnerPrompt}>Runner on {pendingRunnerPrompts[currentPromptIndex]} — where did they go?</Text>
                {/* compute allowed choices depending on base */}
                {(() => {
                  const base = pendingRunnerPrompts[currentPromptIndex];
                  // allowed choices default: held and scored
                  const choices: Array<{ key: string; label: string }> = [];
                  choices.push({ key: 'held', label: 'Held at base' });
                  if (base === 'first') {
                    choices.push({ key: 'to2', label: 'To 2nd' });
                    choices.push({ key: 'to3', label: 'To 3rd' });
                    choices.push({ key: 'score', label: 'Scored' });
                  } else if (base === 'second') {
                    choices.push({ key: 'to3', label: 'To 3rd' });
                    choices.push({ key: 'score', label: 'Scored' });
                  } else if (base === 'third') {
                    choices.push({ key: 'score', label: 'Scored' });
                  }
                  return choices.map(c => (
                    <TouchableOpacity key={c.key} style={styles.popupItem} onPress={() => handleRunnerChoice(base, c.key as any)}>
                      <Text style={styles.popupItemText}>{c.label}</Text>
                    </TouchableOpacity>
                  ));
                })()}
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Bottom play bar with current player and up-arrow button */}
      <TouchableOpacity
        style={styles.playBar}
        onPress={() => setShowStatsSheet(true)}
      >
        <Text style={styles.playText}>{currentBatterDisplay || '1. (empty)'}</Text>
        <Text style={styles.upArrow}>^</Text>
      </TouchableOpacity>

      <StatsSheet visible={showStatsSheet} onClose={() => setShowStatsSheet(false)} homeId={homeId} awayId={awayId} />

      {/* Header menu modal for GameScreen */}
      <Modal visible={showHeaderMenu} transparent animationType="fade" onRequestClose={() => setShowHeaderMenu(false)}>
        <TouchableWithoutFeedback onPress={() => setShowHeaderMenu(false)}>
          <View style={styles.menuOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.menuModalContainer} pointerEvents="box-none">
          <View style={[styles.menuModal, { width: 220 }] }>
            <TouchableOpacity style={styles.popupItem} onPress={() => { setShowHeaderMenu(false); setShowStatsSheet(true); }}>
              <Text style={styles.popupItemText}>Open Stats</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.popupItem} onPress={() => { handleRestartGame(); }}>
              <Text style={styles.popupItemText}>Restart Game</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.popupItem} onPress={() => { handleEndGame(); }}>
              <Text style={styles.popupItemText}>End Game</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingBottom: 64,
  },
  infoRow: {
    flexDirection: "row",
    paddingTop: 12,
    paddingBottom: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 0,
    alignItems: "center",
    justifyContent: "space-between",
  },
  infoCell: {
    flex: 1,
    alignItems: "center",
  },
  infoTitle: {
    fontSize: 14,
    color: colors.textMuted,
  },
  infoValue: {
    fontSize: 26,
    fontWeight: "600",
    color: colors.green,
    marginTop: 4,
  },
  countRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 6,
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  countGroup: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  countLabel: {
    width: 18,
    textAlign: "center",
    color: colors.textSubtle,
    fontWeight: "600",
  },
  dotsRow: {
    flexDirection: "row",
    marginLeft: 8,
  },
  dotFilled: {
    width: 10,
    height: 10,
    borderRadius: 6,
    backgroundColor: colors.green, // green accent
    marginRight: 6,
  },
  dotEmpty: {
    width: 10,
    height: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.green,
    backgroundColor: "transparent",
    marginRight: 6,
  },
  fieldContainer: {
    flex: 1.1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
  },
  fieldImage: {
    width: Math.min(width * 0.98, 780),
    height: Math.min(height * 0.48, 720),
  },
  buttonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: -12,
  },
  gridButton: {
    width: "48%",
    backgroundColor: colors.surface, 
    paddingVertical: 16,
    marginBottom: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
    shadowColor: "rgba(0,0,0,0.9)",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  gridButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  playBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 56,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: colors.background,
  },
  playText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  upArrow: {
    fontSize: 20,
    color: colors.green,
    paddingHorizontal: 8,
  },
  centered: { 
    flex: 1, 
    justifyContent: 'center',
    alignItems: 'center'
  },
  dotPressed: {
    width: 10,
    height: 10,
    borderRadius: 6,
    backgroundColor: colors.green,
    marginRight: 6,
    opacity: 1,
  },
  menuOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.6)' 
  },
  menuModalContainer: { 
    position: 'absolute', 
    top: 0, left: 0, right: 0, bottom: 0, 
    justifyContent: 'center', 
    alignItems: 'center' 
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
  popupItem: { 
    paddingVertical: 12, 
    paddingHorizontal: 8, 
    borderRadius: 6,
    backgroundColor: colors.background,
    marginBottom: 6,
  },
  popupItemText: { 
    fontSize: 16, 
    color: colors.green,
    fontWeight: '600',
  },
  runnerPrompt: {
    color: '#FFFFFF',
    marginBottom: 6,
  },
});
