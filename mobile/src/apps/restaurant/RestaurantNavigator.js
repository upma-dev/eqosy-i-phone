import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Receipt, User } from 'lucide-react-native';
import PillTabBar from '../../components/PillTabBar';
import { useAuth } from '../../store/auth';
import RestaurantLoginScreen from './RestaurantLoginScreen';
import RestaurantOrdersScreen from './RestaurantOrdersScreen';
import RestaurantProfileScreen from './RestaurantProfileScreen';

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();
const PINK = '#EC4899';

const icon = (Icon) => ({ color, focused }) => <Icon size={20} color={color} strokeWidth={focused ? 2.5 : 2} />;

function RestaurantTabs() {
  return (
    <Tabs.Navigator screenOptions={{ headerShown: false }} tabBar={(p) => <PillTabBar {...p} color={PINK} />}>
      <Tabs.Screen name="RestaurantOrders" component={RestaurantOrdersScreen} options={{ title: 'Orders', tabBarIcon: icon(Receipt) }} />
      <Tabs.Screen name="RestaurantProfile" component={RestaurantProfileScreen} options={{ title: 'Profile', tabBarIcon: icon(User) }} />
    </Tabs.Navigator>
  );
}

// Root of the Eqosy Restaurant app (APP_VARIANT=restaurant). Uses the Food session for the restaurant API.
export default function RestaurantNavigator() {
  const token = useAuth((s) => s.token);
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {token ? <Stack.Screen name="RestaurantTabs" component={RestaurantTabs} /> : <Stack.Screen name="RestaurantLogin" component={RestaurantLoginScreen} />}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
