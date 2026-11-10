import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, User, Wallet } from 'lucide-react-native';
import PillTabBar from '../../components/PillTabBar';
import { useAuth } from '../../store/auth';
import DriverLoginScreen from './DriverLoginScreen';
import DriverHomeScreen from './DriverHomeScreen';
import ActiveTripScreen from './ActiveTripScreen';
import DriverWalletScreen from './DriverWalletScreen';
import DriverProfileScreen from './DriverProfileScreen';

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();
const BLUE = '#3B6BF0';

const icon = (Icon) => ({ color, focused }) => <Icon size={20} color={color} strokeWidth={focused ? 2.5 : 2} />;

function DriverTabs() {
  return (
    <Tabs.Navigator screenOptions={{ headerShown: false }} tabBar={(p) => <PillTabBar {...p} color={BLUE} />}>
      <Tabs.Screen name="DriverHome" component={DriverHomeScreen} options={{ title: 'Home', tabBarIcon: icon(Home) }} />
      <Tabs.Screen name="DriverWallet" component={DriverWalletScreen} options={{ title: 'Wallet', tabBarIcon: icon(Wallet) }} />
      <Tabs.Screen name="DriverProfile" component={DriverProfileScreen} options={{ title: 'Profile', tabBarIcon: icon(User) }} />
    </Tabs.Navigator>
  );
}

// Root of the Eqosy Driver app (APP_VARIANT=driver). The token is the driver JWT kept in the shared auth store.
export default function DriverNavigator() {
  const token = useAuth((s) => s.token);
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {token ? (
          <>
            <Stack.Screen name="DriverTabs" component={DriverTabs} />
            <Stack.Screen name="ActiveTrip" component={ActiveTripScreen} options={{ gestureEnabled: false, animation: 'default' }} />
          </>
        ) : (
          <Stack.Screen name="DriverLogin" component={DriverLoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
