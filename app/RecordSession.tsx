import { Answer, SoundType } from '@/common/types';
import { BACKGROUND_TASK_IDENTIFIER } from '@/constants/constants';
import { useThemeColor } from '@/hooks/useThemeColor';
import useUnmount from '@/hooks/useUnmount';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { AudioPlayer, createAudioPlayer, PLAYBACK_STATUS_UPDATE } from 'expo-audio';
import * as BackgroundTask from 'expo-background-task';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  AppState,
  AppStateStatus,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  Vibration,
  View
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { calculateNextInterval, formatTime, getSoundFile, registerBackgroundTask, SOUND_OPTIONS, timeToMilliseconds, triggerNotification } from '../common/module';
import TimeInput from '../components/TimeInput';
import { colors, darkTheme, lightTheme, Theme } from '../constants/theme';

// Add type for interval record
export interface IntervalRecord {
  index: number;
  start: number; // timestamp (ms)
  duration: number; // ms
  answer?: Answer;
}

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Register the background task
TaskManager.defineTask(BACKGROUND_TASK_IDENTIFIER, async () => {
  try {
    // This will be executed when the background fetch is triggered
    // We'll use this to check if we need to trigger a notification
    const nextAlarmTime = await AsyncStorage.getItem('nextAlarmTime');
    const isActive = await AsyncStorage.getItem('timerActive');
    const selectedSound = (await AsyncStorage.getItem('selectedSound') || 'bell') as SoundType;

    if (isActive === 'true' && nextAlarmTime) {
      const now = Date.now();
      if (now >= parseInt(nextAlarmTime)) {
        // It's time to trigger the notification
        await triggerNotification(selectedSound);

        // Calculate and set the next alarm time
        const interval = await calculateNextInterval();
        const newAlarmTime = now + interval;
        await AsyncStorage.setItem('nextAlarmTime', newAlarmTime.toString());

        return BackgroundTask.BackgroundTaskResult.Success;
      }
    }

    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (error) {
    console.error("Background task error:", error);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

type State = {
  isRunning: boolean;
  avgHours: string;
  avgMinutes: string;
  avgSeconds: string;
  minHours: string;
  minMinutes: string;
  minSeconds: string;
  maxHours: string;
  maxMinutes: string;
  maxSeconds: string;
  nextAlarm: number | null;
  darkMode: boolean;
  theme: Theme;
  selectedSound: SoundType;
  // Question popup states
  showQuestion: boolean;
  questionVisible: boolean;
  questionTimeout: ReturnType<typeof setTimeout> | null;
  questionDuration: number;
  currentIntervalIdx: number | null;
}

const DEFAULT_STATE: State = {
  isRunning: false,
  avgHours: '0',
  avgMinutes: '30',
  avgSeconds: '0',
  minHours: '0',
  minMinutes: '20',
  minSeconds: '0',
  maxHours: '0',
  maxMinutes: '40',
  maxSeconds: '0',
  nextAlarm: null,
  darkMode: false,
  theme: lightTheme,
  selectedSound: 'bell',
  showQuestion: false,
  questionVisible: false,
  questionTimeout: null,
  questionDuration: 0,
  currentIntervalIdx: null,
}

// A component to record a session
// This component is responsible for managing the timer, settings, and notifications
const RecordSession = () => {
  const systemColorScheme = useColorScheme();
  const [state, setState] = useState(DEFAULT_STATE);

  // Add interval recording state
  const [intervalRecords, setIntervalRecords] = useState<IntervalRecord[]>([]);
  const intervalIndexRef = useRef(0);
  const intervalStartRef = useRef<number | null>(null);

  // State for question popup
  const [questionProgress] = useState(new Animated.Value(1));

  // Animation for question popup slide in/out
  const slideAnim = useRef(new Animated.Value(-150)).current; // Start above the screen

  // Show/hide question popup with animation
  useEffect(() => {
    if (state.showQuestion) {
      setState(prev => ({ ...prev, questionVisible: true }));
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start();
    } else if (state.questionVisible) {
      Animated.timing(slideAnim, {
        toValue: -150,
        duration: 350,
        useNativeDriver: true,
      }).start(() => setState(prev => ({ ...prev, questionVisible: false })));
    }
  }, [state.showQuestion, slideAnim, state.questionVisible]);

  // Update individual state values using a helper function
  const updateState = useCallback((key: keyof typeof state, value: any) => {
    setState((prevState) => ({ ...prevState, [key]: value }));
  }, []);

  // Effect to handle theme changes
  useEffect(() => {
    updateState('theme', state.darkMode ? darkTheme : lightTheme);
  }, [state.darkMode, updateState]);

  // Effect to handle system theme changes
  useEffect(() => {
    if (systemColorScheme) {
      updateState('darkMode', systemColorScheme === 'dark');
    }
  }, [systemColorScheme, updateState]);

  // References
  const timerRef = useRef<number | null>(null);
  const soundRef = useRef<AudioPlayer | null>(null);
  const appState = useRef(AppState.currentState);

  // Load settings from AsyncStorage
  const loadSettings = useCallback(async () => {
    try {
      // Average duration
      const savedAvgHours = await AsyncStorage.getItem('avgHours');
      const savedAvgMinutes = await AsyncStorage.getItem('avgMinutes');
      const savedAvgSeconds = await AsyncStorage.getItem('avgSeconds');

      // Minimum duration
      const savedMinHours = await AsyncStorage.getItem('minHours');
      const savedMinMinutes = await AsyncStorage.getItem('minMinutes');
      const savedMinSeconds = await AsyncStorage.getItem('minSeconds');

      // Maximum duration
      const savedMaxHours = await AsyncStorage.getItem('maxHours');
      const savedMaxMinutes = await AsyncStorage.getItem('maxMinutes');
      const savedMaxSeconds = await AsyncStorage.getItem('maxSeconds');

      // Other settings
      const savedTimerActive = await AsyncStorage.getItem('timerActive');
      const savedDarkMode = await AsyncStorage.getItem('darkMode');
      const savedNextAlarm = await AsyncStorage.getItem('nextAlarmTime');
      const savedSelectedSound = await AsyncStorage.getItem('selectedSound') as SoundType | null;

      // Set state if values exist
      setState({
        avgHours: savedAvgHours || DEFAULT_STATE.avgHours,
        avgMinutes: savedAvgMinutes || DEFAULT_STATE.avgMinutes,
        avgSeconds: savedAvgSeconds || DEFAULT_STATE.avgSeconds,

        minHours: savedMinHours || DEFAULT_STATE.minHours,
        minMinutes: savedMinMinutes || DEFAULT_STATE.minMinutes,
        minSeconds: savedMinSeconds || DEFAULT_STATE.minSeconds,

        maxHours: savedMaxHours || DEFAULT_STATE.maxHours,
        maxMinutes: savedMaxMinutes || DEFAULT_STATE.maxMinutes,
        maxSeconds: savedMaxSeconds || DEFAULT_STATE.maxSeconds,

        isRunning: savedTimerActive === 'true' ? true : DEFAULT_STATE.isRunning,
        darkMode: savedDarkMode === 'true' ? true : DEFAULT_STATE.darkMode,
        nextAlarm: savedNextAlarm ? parseInt(savedNextAlarm) : DEFAULT_STATE.nextAlarm,
        selectedSound: savedSelectedSound || DEFAULT_STATE.selectedSound,
        theme: savedDarkMode === 'true' ? darkTheme : lightTheme,
        showQuestion: DEFAULT_STATE.showQuestion,
        questionVisible: DEFAULT_STATE.questionVisible,
        questionTimeout: DEFAULT_STATE.questionTimeout,
        questionDuration: DEFAULT_STATE.questionDuration,
        currentIntervalIdx: DEFAULT_STATE.currentIntervalIdx,
      });
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  }, []);

  // Check timer status
  const checkTimerStatus = useCallback(async () => {
    try {
    const nextAlarmTime = await AsyncStorage.getItem('nextAlarmTime');
      if (nextAlarmTime) {
        updateState('nextAlarm', parseInt(nextAlarmTime));
      }
    } catch (error) {
      console.error("Error checking timer status:", error);
    }
  }, [updateState]);

  // Handle app state changes
  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      // App has come to the foreground
      loadSettings();
      checkTimerStatus();
    }
    appState.current = nextAppState;
  }, [checkTimerStatus, loadSettings]);

  // Load saved settings on startup
  useEffect(() => {
    loadSettings();
    registerForPushNotifications();
    registerBackgroundTask();

    // Listen for app state changes (foreground/background)
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
      // Clean up any active timers
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [handleAppStateChange, loadSettings]);

  // Save settings to AsyncStorage
  const saveSettings = useCallback(async () => {
    try {
      // Save all state values to AsyncStorage
      await AsyncStorage.setItem('avgHours', state.avgHours);
      await AsyncStorage.setItem('avgMinutes', state.avgMinutes);
      await AsyncStorage.setItem('avgSeconds', state.avgSeconds);

      await AsyncStorage.setItem('minHours', state.minHours);
      await AsyncStorage.setItem('minMinutes', state.minMinutes);
      await AsyncStorage.setItem('minSeconds', state.minSeconds);

      await AsyncStorage.setItem('maxHours', state.maxHours);
      await AsyncStorage.setItem('maxMinutes', state.maxMinutes);
      await AsyncStorage.setItem('maxSeconds', state.maxSeconds);

      await AsyncStorage.setItem('darkMode', state.darkMode.toString());
      await AsyncStorage.setItem('selectedSound', state.selectedSound);
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  }, [state]);

  // Register for push notifications
  const registerForPushNotifications = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Failed to get push token for push notification!');
        return;
      }
    } catch (error) {
      console.error("Error registering for notifications:", error);
    }
  };

  // Play sound when timer triggers
  const playSound = useCallback(async () => {
    if (Platform.OS === 'web') {
      try {
        const audio = new window.Audio(getSoundFile(state.selectedSound));
        audio.play();
      } catch (error) {
        console.error("Error playing sound on web:", error);
      }

      return;
    }

    try {
      const player = createAudioPlayer(getSoundFile(state.selectedSound));
      soundRef.current = player;
      player.play();

      player.addListener(PLAYBACK_STATUS_UPDATE, (status) => {
        if (status.isLoaded && status.didJustFinish) {
          soundRef.current = null;
        }
      });
    } catch (error) {
      console.error("Error playing sound:", error);
    }

    // Trigger vibration on iOS and Android
    Vibration.vibrate();
  }, [state.selectedSound]);

  // Show question popup for the required duration
  const triggerQuestion = useCallback((intervalIdx: number, intervalDuration: number) => {
    // Calculate how long to show the question
    let duration = 60000; // default 1 min
    if (intervalDuration < 60000) {
      duration = Math.max(1000, Math.floor(intervalDuration / 2));
    }
    setState(prev => ({
      ...prev,
      showQuestion: true,
      questionDuration: duration,
      currentIntervalIdx: intervalIdx,
    }));
    questionProgress.setValue(1);
    // Animate progress bar
    Animated.timing(questionProgress, {
      toValue: 0,
      duration,
      useNativeDriver: false,
    }).start();

    // Hide after duration
    if (state.questionTimeout) {
      clearTimeout(state.questionTimeout);
    }

    const timeout = setTimeout(() => {
      setState(prev => ({ ...prev, showQuestion: false, currentIntervalIdx: null, questionTimeout: null }));
    }, duration);

    setState(prev => ({ ...prev, questionTimeout: timeout }));
  }, [questionProgress, state.questionTimeout]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (state.questionTimeout) {
        clearTimeout(state.questionTimeout);
      }
    };
  }, [state.questionTimeout]);

  // Start a foreground timer (when app is in foreground)
  const startForegroundTimer = useCallback((interval: number) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Record the start of this interval
    const now = Date.now();
    intervalStartRef.current = now;
    const currentIndex = intervalIndexRef.current;
    setIntervalRecords((prev) => [
      ...prev,
      { index: currentIndex, start: now, duration: interval },
    ]);
    intervalIndexRef.current += 1;

    timerRef.current = setTimeout(async () => {
      // Play sound and trigger notification
      await playSound();

      // Show question popup for this interval
      triggerQuestion(currentIndex, interval);

      // Calculate next interval and start next timer
      const nextInterval = await calculateNextInterval();
      const nextAlarmTime = Date.now() + nextInterval;

      // Save the next alarm time
      await AsyncStorage.setItem('nextAlarmTime', nextAlarmTime.toString());
      updateState('nextAlarm', nextAlarmTime);

      // Start next timer
      startForegroundTimer(nextInterval);
    }, interval);
  }, [playSound, updateState, triggerQuestion]);

  // Start the timer
  const startTimer = useCallback(async () => {
    try {
      // Calculate the first interval
      const interval = await calculateNextInterval();
      const nextAlarmTime = Date.now() + interval;

      // Update timer state
      await AsyncStorage.setItem('nextAlarmTime', nextAlarmTime.toString());
      await AsyncStorage.setItem('timerActive', 'true');
      setState(prev => ({
        ...prev,
        nextAlarm: nextAlarmTime,
        isRunning: true,
      }));

      // Start foreground timer (for when app is open)
      startForegroundTimer(interval);

      // Save settings
      await saveSettings();
      setIntervalRecords([]); // Reset records for new session
      intervalIndexRef.current = 0;
    } catch (error) {
      console.error("Error starting timer:", error);
    }
  }, [saveSettings, startForegroundTimer]);

  // Stop the timer
  const stopTimer = useCallback(async () => {
    try {
      // Clear foreground timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      // Update timer state
      await AsyncStorage.removeItem('nextAlarmTime');
      await AsyncStorage.setItem('timerActive', 'false');
      setState(prev => ({
        ...prev,
        nextAlarm: null,
        isRunning: false,
      }));

      // Save settings
      await saveSettings();

      // Save session to AsyncStorage
      if (intervalRecords.length > 0) {
        try {
          const prevSessionsRaw = await AsyncStorage.getItem('sessions');
          const prevSessions = prevSessionsRaw ? JSON.parse(prevSessionsRaw) : [];
          const session = {
            id: Date.now(),
            startedAt: intervalRecords[0]?.start,
            intervals: intervalRecords,
          };
          await AsyncStorage.setItem('sessions', JSON.stringify([session, ...prevSessions]));
        } catch (e) {
          console.error('Failed to save session:', e);
        }
      }
    } catch (error) {
      console.error("Error stopping timer:", error);
    }
  }, [saveSettings, intervalRecords]);

  // Calculate time remaining until next alarm
  const remainingTime = useMemo(() => {
    if (!state.nextAlarm || !state.isRunning) {
      return null;
    }

    const now = Date.now();
    const remaining = state.nextAlarm - now;

    return formatTime(remaining);
  }, [state.isRunning, state.nextAlarm]);

  // Validate input to ensure min <= avg <= max
  const inputsValid = useMemo(() => {
    // Convert all time inputs to milliseconds for comparison
    const min = timeToMilliseconds(state.minHours, state.minMinutes, state.minSeconds);
    const avg = timeToMilliseconds(state.avgHours, state.avgMinutes, state.avgSeconds);
    const max = timeToMilliseconds(state.maxHours, state.maxMinutes, state.maxSeconds);

    // Ensure min <= avg <= max and that at least one value is non-zero
    return min <= avg && avg <= max && max > 0;
  }, [state.avgHours, state.avgMinutes, state.avgSeconds, state.maxHours, state.maxMinutes, state.maxSeconds, state.minHours, state.minMinutes, state.minSeconds]);

  const onDurationChanged = useCallback(async (key: 'avgHours' | 'avgMinutes' | 'avgSeconds' | 'minHours' | 'minMinutes' | 'minSeconds' | 'maxHours' | 'maxMinutes' | 'maxSeconds', value: string) => {
    // Update the state with the new value
    updateState(key, value);
    await AsyncStorage.setItem(key, value);
  }, [updateState]);

  // Add handler for sound selection
  const onSoundChanged = useCallback(async (value: string) => {
    updateState('selectedSound', value);
    await AsyncStorage.setItem('selectedSound', value);
  }, [updateState]);

  // Update answer for the current interval
  const handleAnswer = useCallback((answer: 'yes' | 'no') => {
    setState(prev => ({ ...prev, showQuestion: false, currentIntervalIdx: null, questionTimeout: null }));
    setIntervalRecords(prev => {
      if (prev.length === 0) {
        return prev;
      }

      // Only update the last interval's answer
      const updated = [...prev];
      updated[updated.length - 1] = { ...updated[updated.length - 1], answer };
      return updated;
    });
  }, []);

  // UI for question popup
  const renderQuestionPopup = () => {
    if (!state.questionVisible) {
      return null;
    }

    return (
      <Animated.View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        zIndex: 100,
        elevation: 10,
        padding: 24,
        alignItems: 'center',
        transform: [{ translateY: slideAnim }],
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 8,
      }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>Got reinforcement or not?</Text>
        <View style={{ flexDirection: 'row', gap: 24, marginBottom: 16 }}>
          <TouchableOpacity
            style={{ backgroundColor: colors.success, borderRadius: 32, padding: 16, marginHorizontal: 8 }}
            onPress={() => handleAnswer('yes')}
          >
            <Text style={{ color: colors.white, fontSize: 20 }}>✔ Yes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ backgroundColor: colors.destructive, borderRadius: 32, padding: 16, marginHorizontal: 8 }}
            onPress={() => handleAnswer('no')}
          >
            <Text style={{ color: colors.white, fontSize: 20 }}>✘ No</Text>
          </TouchableOpacity>
        </View>
        <View style={{ width: '100%', height: 8, backgroundColor: '#eee', borderRadius: 4, overflow: 'hidden' }}>
          <Animated.View style={{
            height: 8,
            backgroundColor: primaryColor,
            width: questionProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          }} />
        </View>
      </Animated.View>
    );
  };

  useUnmount(async () => {
    // Unload sound when component unmounts
    if (soundRef.current) {
      soundRef.current = null;
    }

    // Clear any active timers
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // Clear question timeout
    if (state.questionTimeout) {
      clearTimeout(state.questionTimeout);
      setState(prev => ({ ...prev, questionTimeout: null }));
    }

    // Remove keys in local storage
    await AsyncStorage.removeItem('timerActive');
    await AsyncStorage.removeItem('nextAlarmTime');
  });

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const primaryColor = useThemeColor({}, 'primary');
  const errorColor = useThemeColor({}, 'error');

  return (
    <SafeAreaProvider>
      <View style={[styles.container, { backgroundColor }]}>
        {renderQuestionPopup()}
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-start' }} keyboardShouldPersistTaps="handled">
          <StatusBar />

          <View style={styles.header}>
            <Text style={[styles.title, { color: textColor }]}>Variable Interval Timer</Text>
          </View>

          <View style={[styles.card, { backgroundColor: cardColor }]}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Average Duration</Text>
            <View style={styles.timeInputRow}>
              <TimeInput
                label="Hours"
                value={state.avgHours}
                onChangeText={(hours) => onDurationChanged('avgHours', hours)}
                editable={!state.isRunning}
                placeholder="0"
                textColor={textColor}
                borderColor={borderColor}
              />
              <Text style={[styles.timeSeparator, { color: textColor }]}>:</Text>
              <TimeInput
                label="Minutes"
                value={state.avgMinutes}
                onChangeText={(minutes) => onDurationChanged('avgMinutes', minutes)}
                editable={!state.isRunning}
                placeholder="00"
                textColor={textColor}
                borderColor={borderColor}
              />
              <Text style={[styles.timeSeparator, { color: textColor }]}>:</Text>
              <TimeInput
                label="Seconds"
                value={state.avgSeconds}
                onChangeText={(seconds) => onDurationChanged('avgSeconds', seconds)}
                editable={!state.isRunning}
                placeholder="00"
                textColor={textColor}
                borderColor={borderColor}
              />
            </View>

            <Text style={[styles.sectionTitle, { color: textColor, marginTop: 16 }]}>Minimum Duration</Text>
            <View style={styles.timeInputRow}>
              <TimeInput
                label="Hours"
                value={state.minHours}
                onChangeText={(hours) => onDurationChanged('minHours', hours)}
                editable={!state.isRunning}
                placeholder="0"
                textColor={textColor}
                borderColor={borderColor}
              />
              <Text style={[styles.timeSeparator, { color: textColor }]}>:</Text>
              <TimeInput
                label="Minutes"
                value={state.minMinutes}
                onChangeText={(minutes) => onDurationChanged('minMinutes', minutes)}
                editable={!state.isRunning}
                placeholder="00"
                textColor={textColor}
                borderColor={borderColor}
              />
              <Text style={[styles.timeSeparator, { color: textColor }]}>:</Text>
              <TimeInput
                label="Seconds"
                value={state.minSeconds}
                onChangeText={(seconds) => onDurationChanged('minSeconds', seconds)}
                editable={!state.isRunning}
                placeholder="00"
                textColor={textColor}
                borderColor={borderColor}
              />
            </View>

            <Text style={[styles.sectionTitle, { color: textColor, marginTop: 16 }]}>Maximum Duration</Text>
            <View style={styles.timeInputRow}>
              <TimeInput
                label="Hours"
                value={state.maxHours}
                onChangeText={(hours) => onDurationChanged('maxHours', hours)}
                editable={!state.isRunning}
                placeholder="0"
                textColor={textColor}
                borderColor={borderColor}
              />
              <Text style={[styles.timeSeparator, { color: textColor }]}>:</Text>
              <TimeInput
                label="Minutes"
                value={state.maxMinutes}
                onChangeText={(minutes) => onDurationChanged('maxMinutes', minutes)}
                editable={!state.isRunning}
                placeholder="00"
                textColor={textColor}
                borderColor={borderColor}
              />
              <Text style={[styles.timeSeparator, { color: textColor }]}>:</Text>
              <TimeInput
                label="Seconds"
                value={state.maxSeconds}
                onChangeText={(seconds) => onDurationChanged('maxSeconds', seconds)}
                editable={!state.isRunning}
                placeholder="00"
                textColor={textColor}
                borderColor={borderColor}
              />
            </View>

            {!inputsValid && !state.isRunning && (
              <Text style={[styles.errorText, { color: errorColor }]}>
                Ensure Min ≤ Average ≤ Max and at least one value is greater than zero.
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: state.isRunning ? errorColor : primaryColor },
              !inputsValid && !state.isRunning && { opacity: 0.5 }
            ]}
            onPress={state.isRunning ? stopTimer : startTimer}
            disabled={!state.isRunning && !inputsValid}
          >
            <Text style={[styles.buttonText, { color: backgroundColor }]}>
              {state.isRunning ? 'Stop Timer' : 'Start Timer'}
            </Text>
          </TouchableOpacity>

          {state.isRunning && (
            <View style={[styles.statusCard, { backgroundColor: cardColor }]}>
              <Text style={[styles.statusText, { color: textColor }]}>
                Timer is running
              </Text>
              {state.nextAlarm && (
                <>
                  <Text style={[styles.statusLabel, { color: textColor }]}>Next alert in:</Text>
                  <Text style={[styles.timerText, { color: primaryColor }]}>
                    {remainingTime}
                  </Text>
                </>
              )}
            </View>
          )}

          <Text style={[styles.sectionTitle, { color: textColor, marginTop: 16 }]}>Notification Sound</Text>
          <View style={{ borderWidth: 1, borderColor, borderRadius: 8 }}>
            <Picker
              selectedValue={state.selectedSound}
              onValueChange={onSoundChanged}
              enabled={!state.isRunning}
              style={{ color: textColor }}
              dropdownIconColor={textColor}
            >
              {SOUND_OPTIONS.map(opt => (
                <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
              ))}
            </Picker>
          </View>

          <View style={styles.footerContainer}>
            <Text style={[styles.footer, { color: textColor }]}>
              The timer will continue to run in the background
            </Text>
            {state.isRunning && (
              <Text style={[styles.footerNote, { color: textColor }]}>
                Your current configuration: {state.minHours || '0'}h {state.minMinutes || '0'}m {state.minSeconds || '0'}s to {state.maxHours || '0'}h {state.maxMinutes || '0'}m {state.maxSeconds || '0'}s (avg: {state.avgHours || '0'}h {state.avgMinutes || '0'}m {state.avgSeconds || '0'}s)
              </Text>
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaProvider>
  );
}

export default RecordSession;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    overflowY: 'scroll',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 16,
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    width: 80,
    textAlign: 'center',
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  timeInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  timeInputContainer: {
    flex: 1,
    alignItems: 'center',
  },
  timeInputLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  timeInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    width: '80%',
    textAlign: 'center',
    fontSize: 18,
  },
  timeSeparator: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  button: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusCard: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  statusText: {
    fontSize: 16,
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 4,
  },
  timerText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
  },
  footer: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },
  footerNote: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.7,
  },
  footerContainer: {
    marginTop: 'auto',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
});