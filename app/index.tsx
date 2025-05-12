import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as React from 'react';
import HomeScreen from './HomeScreen';
import RecordSession from './RecordSession';
import SessionDetail from './SessionDetail';
import ViewSessions from './ViewSessions';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="home">
      <Stack.Screen name="home" component={HomeScreen} options={{ title: 'Home', headerShown: false }} />
      <Stack.Screen name="record" component={RecordSession} options={{ title: 'Record Session' }} />
      <Stack.Screen name="view" component={ViewSessions} options={{ title: 'View Sessions' }} />
      <Stack.Screen name="view/:sessionId" component={SessionDetail} options={{ title: 'Session Details' }} />
    </Stack.Navigator>
  );
}
