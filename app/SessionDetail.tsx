import { exportCsvWeb, formatAnswerForCsv } from '@/common/module';
import { colors } from '@/common/theme';
import { Answer } from '@/common/types';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Platform, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import IntervalAnswerButtons from '../components/IntervalAnswerButtons';
import type { IntervalRecord } from './RecordSession';

interface Session {
  id: number;
  startedAt: number;
  intervals: IntervalRecord[];
}

type SessionDetailRouteProp = RouteProp<any, any>;

const SessionDetail = () => {
  const navigation = useNavigation();
  const route = useRoute<SessionDetailRouteProp>();
  const { sessionId } = route.params as { sessionId: number };
  const [session, setSession] = useState<Session | null>(null);
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardColor = useThemeColor({}, 'card');
  const primaryColor = useThemeColor({}, 'primary');

  useEffect(() => {
    const loadSession = async () => {
      const sessionsRaw = await AsyncStorage.getItem('sessions');
      if (sessionsRaw) {
        const sessions: Session[] = JSON.parse(sessionsRaw);
        const found = sessions.find(s => s.id === sessionId);
        setSession(found || null);
      }
    };
    loadSession();
  }, [sessionId]);

  // Export intervals to CSV
  const exportToCSV = useCallback(async () => {
    if (!session) {
        return;
    }

    let csv = 'Interval Index,Interval Start,Interval Duration,Earned Token(s)?\n';
    session.intervals.forEach(interval => {
      const intervalStart = new Date(interval.start).toString();
      const intervalDuration = Math.round(interval.duration / 1000) + 's';
      const answer = formatAnswerForCsv(interval.answer);
      csv += `${interval.index + 1},${intervalStart},${intervalDuration},${answer}\n`;
    });

    const sessionStartedAt = new Date(session.startedAt).toLocaleString();
    const sessionStartedAtFormatted = sessionStartedAt.replace(/[:/]/g, '-').replace(/ /g, '_');
    const csvFileName = `session_${sessionStartedAtFormatted}.csv`;

    if (Platform.OS === 'web') {
      exportCsvWeb(csv, csvFileName);
      return;
    }

    try {
      const fileUri = FileSystem.cacheDirectory + csvFileName;
      await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });
      await Share.share({ url: fileUri, message: 'Session Intervals CSV', title: 'Exported Session' });
    } catch (e) {
      alert('Failed to export CSV: ' + e);
    }
  }, [session]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={exportToCSV}
        >
          <Ionicons name="download-outline" size={28} color={primaryColor} />
        </TouchableOpacity>
      ),
    });
  }, [exportToCSV, navigation, primaryColor]);

  if (!session) {
    return <View style={[styles.container, { backgroundColor }]}><Text style={{ color: textColor }}>Loading...</Text></View>;
  }

  // Save answer for an interval
  const saveAnswer = async (intervalIdx: number, answer: 'yes' | 'no' | 'missed') => {
    if (!session) {
        return;
    }

    const storedAnswer: Answer = answer === 'missed' ? 'missed' : answer;
    const updatedIntervals = session.intervals.map((interval, idx) =>
      idx === intervalIdx ? { ...interval, answer: storedAnswer } : interval
    );
    const updatedSession = { ...session, intervals: updatedIntervals };
    setSession(updatedSession);

    // Update AsyncStorage
    const sessionsRaw = await AsyncStorage.getItem('sessions');
    if (sessionsRaw) {
      const sessions: Session[] = JSON.parse(sessionsRaw);
      const sessionIdx = sessions.findIndex(s => s.id === session.id);
      if (sessionIdx !== -1) {
        sessions[sessionIdx] = updatedSession;
        await AsyncStorage.setItem('sessions', JSON.stringify(sessions));
      }
    }
  };

  // Sort intervals ascending by index
  const sortedIntervals = [...session.intervals].sort((a, b) => a.index - b.index);

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Text style={[styles.sessionSubtitle, { color: textColor }]}>Date: {new Date(session.startedAt).toLocaleString()}</Text>
      <FlatList
        data={sortedIntervals}
        keyExtractor={item => item.index.toString()}
        renderItem={({ item }) => (
          <View style={[styles.intervalCard, { backgroundColor: cardColor, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
            <View>
              <Text style={[styles.intervalText, { color: textColor }]}>Interval #{item.index + 1}</Text>
              <Text style={[styles.intervalText, { color: textColor }]}>Start: {new Date(item.start).toLocaleTimeString()}</Text>
              <Text style={[styles.intervalText, { color: textColor }]}>Duration: {Math.round(item.duration / 1000)}s</Text>
            </View>
            <IntervalAnswerButtons
              answer={item.answer ?? undefined}
              onAnswer={ans => {
                if (ans === undefined) {
                  // Reset answer
                  saveAnswer(item.index, 'missed'); // or handle as needed
                } else {
                  saveAnswer(item.index, ans);
                }
              }}
              primaryColor={primaryColor}
            />
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.white,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  sessionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  intervalCard: {
    backgroundColor: '#f2f2f7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  intervalText: {
    fontSize: 14,
    marginBottom: 2,
  },
  answerBtn: {
    padding: 8,
    borderRadius: 8,
  },
  answerBtnText: {
    color: colors.white,
    fontWeight: 'bold',
  },
});

export default SessionDetail;
