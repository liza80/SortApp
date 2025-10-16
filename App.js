import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import HomeScreen from './screens/HomeScreen';
import ShipmentSearchScreen from './screens/ShipmentSearchScreen';
import ShipmentDetailsScreen from './screens/ShipmentDetailsScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="ShipmentSearch" component={ShipmentSearchScreen} />
        <Stack.Screen name="ShipmentDetails" component={ShipmentDetailsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
