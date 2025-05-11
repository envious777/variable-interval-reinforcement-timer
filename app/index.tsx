import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as React from 'react';
import HomeScreen from './HomeScreen';
import RecordSession from './RecordSession';
import ViewSessions from './ViewSessions';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="RecordSession" component={RecordSession} options={{ title: 'Record Session' }} />
      <Stack.Screen name="ViewSessions" component={ViewSessions} options={{ title: 'View Sessions' }} />
    </Stack.Navigator>
  );
}
