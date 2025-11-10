import { useLocalSearchParams, useRouter } from 'expo-router';
import { onValue, ref } from 'firebase/database';
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

    useEffect(() => {
      const battingTeamId = isTop ? awayId : homeId;
      if (!battingTeamId) { setCurrentBatterDisplay(''); return; }
      // read lineup slot -> playerId, then fetch player name
      const slotRef = ref(db, `Teams/${battingTeamId}/lineup/${currentBatSlot}`);
      const unsubSlot = onValue(slotRef, async (snap) => {
        const pid = snap.val();
        if (!pid) { setCurrentBatterDisplay(`${currentBatSlot}. (empty)`); return; }
        const pSnapRef = ref(db, `Players/${pid}`);
        const unsubP = onValue(pSnapRef, (psnap) => {
          const p = psnap.val();
          if (p) setCurrentBatterDisplay(`${currentBatSlot}. ${p.name}, ${p.position ?? ''} #${p.number ?? ''}`);
          else setCurrentBatterDisplay(`${currentBatSlot}. Unknown`);
        });
        // cleanup inner subscription when pid changes
      });
      return () => { unsubSlot(); };
    }, [homeId, awayId, isTop, currentBatSlot]);

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

  // --- Outcomes: easily configurable list and effects ---
  // Types for runners/outcome (defined here to avoid JSX parsing ambiguity)
  type RunnerState = { first: boolean; second: boolean; third: boolean };
  type OutcomeResult = { balls: number; strikes: number; outs: number; runners: RunnerState; runsScored: number };
  type Outcome = { key: string; label: string; effect: (s: { balls:number; strikes:number; outs:number; runners: RunnerState }) => OutcomeResult };

  // Each outcome has a label and an effect function that takes current counts + runners and returns new counts, runners, and runsScored
  const OUTCOMES: Outcome[] = [
      { key: 'single', label: 'Single', effect: (s) => {
          // batter to first, other runners advance one base; runners on third score
          const r = s.runners;
          const runs = r.third ? 1 : 0;
          const newThird = r.second;
          const newSecond = r.first;
          const newFirst = true;
          return { balls:0, strikes:0, outs: s.outs, runners: { first: newFirst, second: newSecond, third: newThird }, runsScored: runs };
        }},
      { key: 'double', label: 'Double', effect: (s) => {
          // batter to second; runners advance two bases
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
          const runs = occupied + 1; // batter + existing
          return { balls:0, strikes:0, outs: s.outs, runners: { first:false, second:false, third:false }, runsScored: runs };
        }},
      { key: 'walk', label: 'Walk', effect: (s) => {
          const r = s.runners;
          let runs = 0;
          // force advance: if bases loaded, runner on third scores
          if (r.first && r.second && r.third) runs += 1;
          const newFirst = true;
          const newSecond = r.first || false;
          const newThird = r.second || false;
          return { balls:0, strikes:0, outs: s.outs, runners: { first: newFirst, second: newSecond, third: newThird }, runsScored: runs };
        }},
      { key: 'strikeout', label: 'Strikeout', effect: (s) => ({ balls:0, strikes:0, outs: Math.min(3, s.outs + 1), runners: s.runners, runsScored: 0 }) },
      { key: 'groundout', label: 'Ground Out', effect: (s) => ({ balls:0, strikes:0, outs: Math.min(3, s.outs + 1), runners: s.runners, runsScored: 0 }) },
      { key: 'flyout', label: 'Fly Out', effect: (s) => ({ balls:0, strikes:0, outs: Math.min(3, s.outs + 1), runners: s.runners, runsScored: 0 }) },
      { key: 'foul', label: 'Foul', effect: (s) => ({ balls: s.balls, strikes: Math.min(2, s.strikes + 1), outs: s.outs, runners: s.runners, runsScored: 0 }) },
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
      // if this ball would make 4, it's a walk
      if (balls + 1 >= 4) {
        applyOutcome('walk');
        return;
      }
      setBalls(b => Math.min(3, b + 1));
    };

    const handleStrike = () => {
      pushHistory();
      // if this strike would make 3, it's a strikeout
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

      // if the outcome doesn't change runner occupancy for any pre-existing runner, apply immediately
      const pre = runners;
      const post = result.runners;
      const toPrompt: Array<'first'|'second'|'third'> = [];
      (['first','second','third'] as Array<'first'|'second'|'third'>).forEach((base) => {
        if (pre[base] && pre[base] !== post[base]) {
          toPrompt.push(base);
        }
      });

      if (toPrompt.length === 0) {
        // no prompts necessary
        commitOutcomeResult(result);
      } else {
        // queue prompts
        setPendingPreRunners(pre);
        setPendingOutcomeResult(result);
        setPendingRunnerPrompts(toPrompt);
        setCurrentPromptIndex(0);
        // open a focused runner prompt modal by reusing showOutcomeModal area
        setShowOutcomeModal(false);
      }
    };

    // commit final result to state (runs, runners, counts, half-inning advances)
    const commitOutcomeResult = (result: OutcomeResult) => {
      setBalls(result.balls);
      setStrikes(result.strikes);
      setOuts(result.outs);
      if (result.runsScored && result.runsScored > 0) {
        if (isTop) setAwayRuns(r => r + result.runsScored);
        else setHomeRuns(r => r + result.runsScored);
      }
      setRunners(result.runners);
      setShowOutcomeModal(false);

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

    // handle user selection for a single runner prompt
    const handleRunnerChoice = (base: 'first'|'second'|'third', choice: 'held'|'to2'|'to3'|'score'|'to1') => {
      if (!pendingOutcomeResult || !pendingPreRunners) return;
      // copy current pending outcome's runners and runs
      const r = { ...pendingOutcomeResult.runners } as RunnerState;
      let additionalRuns = 0;

      // interpret choice and modify r/add runs accordingly. choices: held, to1, to2, to3, score
      if (choice === 'held') {
        // leave base occupancy as pre (so set the base to true, others unchanged)
        r[base] = true;
      } else if (choice === 'to1') {
        // move to first (used if runner on home? unlikely) - set first true, previous base false
        r.first = true;
        r[base] = false;
      } else if (choice === 'to2') {
        // moved to second
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
                <Text style={{marginBottom:6}}>Runner on {pendingRunnerPrompts[currentPromptIndex]} — where did they go?</Text>
                <TouchableOpacity style={styles.popupItem} onPress={() => handleRunnerChoice(pendingRunnerPrompts[currentPromptIndex], 'held')}>
                  <Text style={styles.popupItemText}>Held at base</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.popupItem} onPress={() => handleRunnerChoice(pendingRunnerPrompts[currentPromptIndex], 'to1')}>
                  <Text style={styles.popupItemText}>To 1st</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.popupItem} onPress={() => handleRunnerChoice(pendingRunnerPrompts[currentPromptIndex], 'to2')}>
                  <Text style={styles.popupItemText}>To 2nd</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.popupItem} onPress={() => handleRunnerChoice(pendingRunnerPrompts[currentPromptIndex], 'to3')}>
                  <Text style={styles.popupItemText}>To 3rd</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.popupItem} onPress={() => handleRunnerChoice(pendingRunnerPrompts[currentPromptIndex], 'score')}>
                  <Text style={styles.popupItemText}>Scored</Text>
                </TouchableOpacity>
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
});
