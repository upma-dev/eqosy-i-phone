import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, User, Wallet } from 'lucide-react-native';
import PillTabBar from '../../components/PillTabBar';
import { useAuth } from '../../store/auth';
import DeliveryLoginScreen from './DeliveryLoginScreen';
import DeliveryHomeScreen from './DeliveryHomeScreen';
import ActiveOrderScreen from './ActiveOrderScreen';
import DeliveryPocketScreen from './DeliveryPocketScreen';
import DeliveryProfileScreen from './DeliveryProfileScreen';

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();
const GREEN = '#1F9D4B';

const icon = (Icon) => ({ color, focused }) => <Icon size={20} color={color} strokeWidth={focused ? 2.5 : 2} />;

function DeliveryTabs() {
  return (
    <Tabs.Navigator screenOptions={{ headerShown: false }} tabBar={(p) => <PillTabBar {...p} color={GREEN} />}>
      <Tabs.Screen name="DeliveryHome" component={DeliveryHomeScreen} options={{ title: 'Home', tabBarIcon: icon(Home) }} />
      <Tabs.Screen name="DeliveryPocket" component={DeliveryPocketScreen} options={{ title: 'Pocket', tabBarIcon: icon(Wallet) }} />
      <Tabs.Screen name="DeliveryProfile" component={DeliveryProfileScreen} options={{ title: 'Profile', tabBarIcon: icon(User) }} />
    </Tabs.Navigator>
  );
}

// Root of the Eqosy Delivery app (APP_VARIANT=delivery). Uses the Food session (foodToken) for the delivery API.
export default function DeliveryNavigator() {
  const token = useAuth((s) => s.token);
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {token ? (
          <>
            <Stack.Screen name="DeliveryTabs" component={DeliveryTabs} />
            <Stack.Screen name="ActiveOrder" component={ActiveOrderScreen} options={{ gestureEnabled: false, animation: 'default' }} />
          </>
        ) : (
          <Stack.Screen name="DeliveryLogin" component={DeliveryLoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
