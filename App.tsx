import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import HomeScreen from './screens/HomeScreen';
import ShipmentSearchScreen from './screens/ShipmentSearchScreen';
import ShipmentDetailsScreen from './screens/ShipmentDetailsScreen';
import ReturnShipmentDetailsScreen from './screens/ReturnShipmentDetailsScreen';
import EventClosureScreen from './screens/EventClosureScreen';
import PackagesMenuScreen from './screens/PackagesMenuScreen';
import BarcodeMenuScreen from './screens/BarcodeMenuScreen';
import BarcodeScanScreen from './screens/BarcodeScanScreen';

export type RootStackParamList = {
  Home: undefined;
  PackagesMenu: undefined;
  BarcodeMenu: undefined;
  BarcodeScan: {
    title: string;
    count: number;
    headerColor: string;
  };
  EventClosure: undefined;
  ShipmentSearch: undefined;
  ShipmentDetails: {
    shipmentData: any;
    barcode: string;
  };
  ReturnShipmentDetails: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

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
        <Stack.Screen name="PackagesMenu" component={PackagesMenuScreen} />
        <Stack.Screen name="BarcodeMenu" component={BarcodeMenuScreen} />
        <Stack.Screen name="BarcodeScan" component={BarcodeScanScreen} />
        <Stack.Screen name="EventClosure" component={EventClosureScreen} />
        <Stack.Screen name="ShipmentSearch" component={ShipmentSearchScreen} />
        <Stack.Screen name="ShipmentDetails" component={ShipmentDetailsScreen} />
        <Stack.Screen name="ReturnShipmentDetails" component={ReturnShipmentDetailsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
