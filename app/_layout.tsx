import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RouteProp } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import * as React from 'react';
import { Alert, Text, TouchableOpacity } from 'react-native';
import HomeScreen from './HomeScreen';
import RecordSession from './RecordSession';
import SessionDetail from './SessionDetail';
import ViewSessions from './ViewSessions';

// Define route params type
export type RootStackParamList = {
  home: undefined;
  record: { isRunning?: boolean } | undefined;
  view: undefined;
  'view/:sessionId': { sessionId: string };
};

export type RecordOptionsProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'record'>;
  route: RouteProp<RootStackParamList, 'record'>;
};

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="home">
      <Stack.Screen name="home" component={HomeScreen} options={{ title: 'Home', headerShown: false }} />
      <Stack.Screen
        name="record"
        component={RecordSession}
        options={({ navigation, route }: RecordOptionsProps) => ({
          title: 'Record Session',
          headerLeft: () => (
            <TouchableOpacity
              style={{ marginLeft: 8 }}
              onPress={() => {
                const isRunning = route.params?.isRunning;

                const doGoBack = async () => {
                  // Update timer state
                  await AsyncStorage.removeItem('nextAlarmTime');
                  await AsyncStorage.setItem('timerActive', 'false');
                  // Cancel all scheduled notifications
                  await Notifications.cancelAllScheduledNotificationsAsync();
                  navigation.goBack();
                };

                if (isRunning) {
                  Alert.alert(
                    'Active Timer',
                    'A timer is currently running. If you leave, the session will not be saved. Are you sure you want to go back?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Leave', style: 'destructive', onPress: doGoBack },
                    ]
                  );
                } else {
                  doGoBack();
                }
              }}
            >
              <Text style={{ color: '#007AFF', fontSize: 17 }}>Back</Text>
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen name="view" component={ViewSessions} options={{ title: 'View Sessions' }} />
      <Stack.Screen name="view/:sessionId" component={SessionDetail} options={{ title: 'Session Details' }} />
    </Stack.Navigator>
  );
}
