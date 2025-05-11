import { colors } from '@/constants/theme';
import { formatAnswer, formatTime } from '@/utils/module';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import React, { useEffect, useState } from 'react';
import { FlatList, Platform, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { IntervalRecord } from './RecordSession';

interface Session {
  id: number;
  startedAt: number;
  intervals: IntervalRecord[];
}

const ViewSessions = () => {
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const sessionsRaw = await AsyncStorage.getItem('sessions');
        if (sessionsRaw) {
          setSessions(JSON.parse(sessionsRaw));
        }
      } catch (e) {
        setSessions([]);
      }
    };
    loadSessions();
  }, []);

  // Export sessions to CSV
  const exportToCSV = async () => {
    if (!sessions.length) {
      return;
    }

    // Create CSV header
    let csv = 'Session Index,Session Start,Interval Index,Interval Start,Interval Duration,Answer\n';
    // Add session data
    sessions.forEach((session, sessionIdx) => {
      session.intervals.forEach((interval) => {
        const answer = formatAnswer(interval.answer);
        const intervalDuration = formatTime(interval.duration);
        const sessionStart = new Date(session.startedAt).toString();
        const intervalStart = new Date(interval.start).toString();

        csv += `${sessionIdx + 1},${sessionStart},${interval.index + 1},${intervalStart},${intervalDuration},${answer}\n`;
      });
    });

    // Web: Create a downloadable blob
    if (Platform.OS === 'web') {
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sessions_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);

      return;
    }

    // Native: use FileSystem and Share
    try {
      const fileUri = FileSystem.cacheDirectory + `sessions_${Date.now()}.csv`;
      await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });
      await Share.share({ url: fileUri, message: 'Session Data CSV', title: 'Exported Sessions' });
    } catch (e) {
      alert('Failed to export CSV: ' + e);
    }
  };

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text style={styles.title}>View Sessions</Text>
        <TouchableOpacity onPress={exportToCSV} style={{ backgroundColor: '#007AFF', padding: 8, borderRadius: 8, marginLeft: 8 }}>
          <Text style={{ color: colors.white, fontWeight: 'bold' }}>Export CSV</Text>
        </TouchableOpacity>
      </View>
      {sessions.length === 0 ? (
        <Text>No sessions recorded yet.</Text>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.sessionCard}>
              <Text style={styles.sessionTitle}>Session: {new Date(item.startedAt).toLocaleString()}</Text>
              <Text style={styles.sessionSubtitle}>Intervals: {item.intervals.length}</Text>
              {item.intervals.map((interval, idx) => (
                <Text key={interval.index} style={styles.intervalText}>
                  #{interval.index + 1}: {new Date(interval.start).toLocaleTimeString()} - {Math.round(interval.duration / 1000)}s
                  {typeof interval.answer !== 'undefined' && (
                    <> — <Text style={{color: interval.answer === 'yes' ? colors.success : colors.destructive}}>{interval.answer === 'yes' ? '✔' : '✘'}</Text></>
                  )}
                </Text>
              ))}
            </View>
          )}
        />
      )}
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
    marginBottom: 20,
    textAlign: 'center',
  },
  sessionCard: {
    backgroundColor: '#f2f2f7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sessionTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  sessionSubtitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  intervalText: {
    fontSize: 13,
    marginLeft: 8,
  },
});

export default ViewSessions;
