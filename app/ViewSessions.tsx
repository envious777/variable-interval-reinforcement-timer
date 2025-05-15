import { exportCsvWeb, formatAnswerForCsv } from '@/common/module';
import { colors } from '@/common/theme';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Platform, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { IntervalRecord } from './RecordSession';

interface Session {
  id: number;
  startedAt: number;
  intervals: IntervalRecord[];
}

const ViewSessions = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'primary');
  const cardColor = useThemeColor({}, 'card');
  const navigation = useNavigation<any>();

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const sessionsRaw = await AsyncStorage.getItem('sessions');
        if (sessionsRaw) {
          setSessions(JSON.parse(sessionsRaw));
        }
      } catch {
        setSessions([]);
      }
    };
    loadSessions();
  }, []);

  // Sort sessions by startedAt descending (most recent first)
  const sortedSessions = [...sessions].sort((a, b) => b.startedAt - a.startedAt);

  const handleSessionPress = (session: Session) => {
    navigation.navigate('view/:sessionId', { sessionId: session.id });
  };

  // Toggle session selection
  const toggleSelect = (idx: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  // Export selected sessions to CSV
  const exportSelectedToCSV = useCallback(async () => {
    if (selected.size === 0) {
      return;
    }

    let csv = 'Session Index,Session Start,Interval Index,Interval Start,Interval Duration,Answer\n';

    selected.forEach(idx => {
      const session = sortedSessions[idx];
      if (!session) {
        return;
      }

      session.intervals.forEach(interval => {
        const sessionStart = new Date(session.startedAt).toString();
        const intervalStart = new Date(interval.start).toString();
        const intervalDuration = Math.round(interval.duration / 1000) + 's';
        const answer = formatAnswerForCsv(interval.answer);
        csv += `${sortedSessions.length - idx},${sessionStart},${interval.index + 1},${intervalStart},${intervalDuration},${answer}\n`;
      });
    });

    const filename = `sessions_export_${Date.now()}.csv`;
    if (Platform.OS === 'web') {
      exportCsvWeb(csv, filename);
      return;
    }

    try {
      const fileUri = FileSystem.cacheDirectory + filename;
      await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });
      await Share.share({ url: fileUri, message: 'Exported Sessions CSV', title: 'Exported Sessions' });
    } catch (e) {
      alert('Failed to export CSV: ' + e);
    }
  }, [selected, sortedSessions]);

  // Delete selected sessions
  const deleteSelectedSessions = useCallback(async () => {
    if (selected.size === 0) {
      return;
    }

    const toDeleteIds = Array.from(selected).map(idx => sortedSessions[idx]?.id).filter(Boolean);
    const newSessions = sessions.filter(session => !toDeleteIds.includes(session.id));
    setSessions(newSessions);
    setSelected(new Set());
    await AsyncStorage.setItem('sessions', JSON.stringify(newSessions));
  }, [selected, sessions, sortedSessions]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () =>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={exportSelectedToCSV} disabled={selected.size === 0}>
              <Ionicons name="download-outline" size={28} color={selected.size === 0 ? "#ccc" : primaryColor}/>
            </TouchableOpacity>
            <TouchableOpacity onPress={deleteSelectedSessions} disabled={selected.size === 0}>
              <Ionicons name="trash-outline" size={28} color={selected.size === 0 ? "#ccc" : colors.destructive} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>
      ,
    });
  }, [deleteSelectedSessions, exportSelectedToCSV, navigation, primaryColor, selected.size]);

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {sortedSessions.length === 0 ? (
        <Text style={{ color: textColor }}>No sessions recorded yet.</Text>
      ) : (
        <FlatList
          data={sortedSessions}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item, index }: { item: Session; index: number }) => (
            <View style={[styles.sessionCard, { flexDirection: 'row', alignItems: 'center', backgroundColor: cardColor }]}>
              <TouchableOpacity onPress={() => toggleSelect(index)}>
                <MaterialIcons
                  name={selected.has(index) ? 'check-box' : 'check-box-outline-blank'}
                  size={24}
                  color={selected.has(index) ? primaryColor : textColor}
                  style={{ marginRight: 12 }}
                />
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1 }} onPress={() => handleSessionPress(item)}>
                <Text style={[styles.sessionTitle, { color: textColor }]}>Session {sortedSessions.length - index}</Text>
                <Text style={[styles.sessionSubtitle, { color: textColor }]}>Date: {new Date(item.startedAt).toLocaleString()}</Text>
              </TouchableOpacity>
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
