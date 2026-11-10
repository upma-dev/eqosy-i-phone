import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  Home, Clock, BusFront, Map, User, Truck, UtensilsCrossed, Tag, Store, LayoutGrid, ShoppingCart, Receipt,
} from 'lucide-react-native';
import { useAuth } from '../store/auth';
import { useVertical } from '../store/vertical';
import { colors, APP_VARIANT } from '../theme';
import ComingSoonApp from '../screens/ComingSoonApp';
import DriverNavigator from '../apps/driver/DriverNavigator';
import DeliveryNavigator from '../apps/delivery/DeliveryNavigator';
import RestaurantNavigator from '../apps/restaurant/RestaurantNavigator';
import PillTabBar from '../components/PillTabBar';
import { VERTICAL_ROUTE } from '../components/VerticalHeader';
import VerticalPlaceholder from '../screens/VerticalPlaceholder';
import FoodHome from '../screens/food/FoodHomeScreen';
import FoodProfile from '../screens/food/FoodProfileScreen';
import FoodOrders from '../screens/food/FoodOrdersScreen';
import RestaurantDetails from '../screens/food/RestaurantDetailsScreen';
import FoodCart from '../screens/food/FoodCartScreen';
import FoodOrderDetails from '../screens/food/FoodOrderDetailsScreen';
import FoodSearch from '../screens/food/SearchScreen';
import FoodWallet from '../screens/food/FoodWalletScreen';
import FoodOffers from '../screens/food/OffersScreen';
import FoodGourmet from '../screens/food/GourmetScreen';
import FoodFavorites from '../screens/food/FavoritesScreen';
import FoodDining from '../screens/food/DiningScreen';
import FoodUnder250 from '../screens/food/Switch99Screen';
import GroceryHome from '../screens/food/GroceryHomeScreen';
import SupportTab from '../screens/SupportScreen';
import BusTab from '../screens/bus/BusHomeScreen';
import BusList from '../screens/bus/BusListScreen';
import BusDetails from '../screens/bus/BusPreviewScreen';
import BusSeats from '../screens/bus/BusSeatsScreen';
import BusCheckout from '../screens/bus/BusCheckoutScreen';
import BusConfirm from '../screens/bus/BusConfirmScreen';

import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import ActivityScreen from '../screens/ActivityScreen';
import WalletScreen from '../screens/WalletScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SelectLocationScreen from '../screens/SelectLocationScreen';
import SelectVehicleScreen from '../screens/SelectVehicleScreen';
import SearchingDriverScreen from '../screens/SearchingDriverScreen';
import RideTrackingScreen from '../screens/RideTrackingScreen';
import ChatScreen from '../screens/ChatScreen';
import RideCompleteScreen from '../screens/RideCompleteScreen';

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

// Active colours of each vertical's bottom bar (web BottomNavigation / BottomNavbar).
const TAB_COLOR = { food: '#F97316', taxi: '#2563EB', grocery: '#16A34A' };

const icon = (Icon) => ({ color, focused }) => <Icon size={20} color={color} strokeWidth={focused ? 2.5 : 2} />;

const ph = (title, note, withHeader) => () => <VerticalPlaceholder title={title} note={note} withHeader={withHeader} />;

// ---- Taxi: Ride | Rides | Bus | Support | Profile --------------------------------------------

function TaxiTabs() {
  useEffect(() => useVertical.getState().setActive('taxi'), []);
  return (
    <Tabs.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(p) => <PillTabBar {...p} color={TAB_COLOR.taxi} />}
    >
      <Tabs.Screen name="HomeTab" component={HomeScreen} options={{ title: 'Ride', tabBarIcon: icon(Home) }} />
      <Tabs.Screen name="ActivityTab" component={ActivityScreen} options={{ title: 'Rides', tabBarIcon: icon(Clock) }} />
      <Tabs.Screen name="BusTab" component={BusTab} options={{ title: 'Bus', tabBarIcon: icon(BusFront) }} />
      <Tabs.Screen name="SupportTab" component={SupportTab} options={{ title: 'Support', tabBarIcon: icon(Map) }} />
      <Tabs.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'Profile', tabBarIcon: icon(User) }} />
    </Tabs.Navigator>
  );
}

// ---- Food: Delivery | Dining | Switch 99 | Profile ---------------------------------------------

function FoodTabs() {
  useEffect(() => useVertical.getState().setActive('food'), []);
  return (
    <Tabs.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(p) => <PillTabBar {...p} color={TAB_COLOR.food} />}
    >
      <Tabs.Screen name="FoodHome" component={FoodHome} options={{ title: 'Delivery', tabBarIcon: icon(Truck) }} />
      <Tabs.Screen name="FoodDining" component={FoodDining} options={{ title: 'Dining', tabBarIcon: icon(UtensilsCrossed) }} />
      <Tabs.Screen name="FoodUnder250" component={FoodUnder250} options={{ title: 'Switch 99', tabBarIcon: icon(Tag) }} />
      <Tabs.Screen name="FoodProfile" component={FoodProfile} options={{ title: 'Profile', tabBarIcon: icon(User) }} />
    </Tabs.Navigator>
  );
}

// ---- Grocery (Quick Mart): Quick Mart | Categories | Cart | Orders | Profile -------------------
const GroceryCategories = ph('Categories', 'Grocery categories are ported in the Food phase.');

function GroceryTabs() {
  useEffect(() => useVertical.getState().setActive('grocery'), []);
  return (
    <Tabs.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(p) => <PillTabBar {...p} color={TAB_COLOR.grocery} />}
    >
      <Tabs.Screen name="GroceryHome" component={GroceryHome} options={{ title: 'Quick Mart', tabBarIcon: icon(Store) }} />
      <Tabs.Screen name="GroceryCategories" component={GroceryCategories} options={{ title: 'Categories', tabBarIcon: icon(LayoutGrid) }} />
      <Tabs.Screen name="GroceryCart" component={FoodCart} options={{ title: 'Cart', tabBarIcon: icon(ShoppingCart) }} />
      <Tabs.Screen name="GroceryOrders" component={FoodOrders} options={{ title: 'Orders', tabBarIcon: icon(Receipt) }} />
      <Tabs.Screen name="GroceryProfile" component={FoodProfile} options={{ title: 'Profile', tabBarIcon: icon(User) }} />
    </Tabs.Navigator>
  );
}

export default function RootNavigator() {
  const ready = useAuth((s) => s.ready);
  const token = useAuth((s) => s.token);
  const vReady = useVertical((s) => s.ready);
  const active = useVertical((s) => s.active);
  const initialVertical = useRef(null);
  if (ready && vReady && !initialVertical.current) initialVertical.current = active;

  if (APP_VARIANT === 'driver') return ready ? <DriverNavigator /> : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.primary} /></View>;
  if (APP_VARIANT === 'delivery') return ready ? <DeliveryNavigator /> : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.primary} /></View>;
  if (APP_VARIANT === 'restaurant') return ready ? <RestaurantNavigator /> : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.primary} /></View>;
  if (APP_VARIANT !== 'user') return <ComingSoonApp />;

  if (!ready || !vReady) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {/* The vertical the user was last in opens first (web: eqosy_active_module). */}
      <Stack.Navigator
        initialRouteName={VERTICAL_ROUTE[initialVertical.current] || VERTICAL_ROUTE.food}
        screenOptions={{ headerShown: false, animation: 'fade' }}
      >
        {token ? (
          <>
            <Stack.Screen name={VERTICAL_ROUTE.food} component={FoodTabs} />
            <Stack.Screen name={VERTICAL_ROUTE.taxi} component={TaxiTabs} />
            <Stack.Screen name={VERTICAL_ROUTE.grocery} component={GroceryTabs} />
            <Stack.Screen name="RestaurantDetails" component={RestaurantDetails} options={{ animation: 'default' }} />
            <Stack.Screen name="FoodCart" component={FoodCart} options={{ animation: 'default' }} />
            <Stack.Screen name="FoodSearch" component={FoodSearch} options={{ animation: 'default' }} />
            <Stack.Screen name="FoodWallet" component={FoodWallet} options={{ animation: 'default' }} />
            <Stack.Screen name="FoodOffers" component={FoodOffers} options={{ animation: 'default' }} />
            <Stack.Screen name="FoodGourmet" component={FoodGourmet} options={{ animation: 'default' }} />
            <Stack.Screen name="FoodFavorites" component={FoodFavorites} options={{ animation: 'default' }} />
            <Stack.Screen name="FoodOrders" component={FoodOrders} options={{ animation: 'default' }} />
            <Stack.Screen name="FoodOrderDetails" component={FoodOrderDetails} options={{ animation: 'default' }} />
            <Stack.Screen name="BusList" component={BusList} options={{ animation: 'default' }} />
            <Stack.Screen name="BusDetails" component={BusDetails} options={{ animation: 'default' }} />
            <Stack.Screen name="BusSeats" component={BusSeats} options={{ animation: 'default' }} />
            <Stack.Screen name="BusCheckout" component={BusCheckout} options={{ animation: 'default' }} />
            <Stack.Screen name="BusConfirm" component={BusConfirm} options={{ animation: 'default' }} />
            <Stack.Screen name="Wallet" component={WalletScreen} options={{ animation: 'default' }} />
            <Stack.Screen
              name="SelectLocation"
              component={SelectLocationScreen}
              options={{ animation: 'default' }}
            />
            <Stack.Screen name="SelectVehicle" component={SelectVehicleScreen} options={{ animation: 'default' }} />
            <Stack.Screen name="SearchingDriver" component={SearchingDriverScreen} options={{ title: 'Searching', gestureEnabled: false, animation: 'default' }} />
            <Stack.Screen name="RideTracking" component={RideTrackingScreen} options={{ gestureEnabled: false, animation: 'default' }} />
            <Stack.Screen name="Chat" component={ChatScreen} options={{ animation: 'default' }} />
            <Stack.Screen name="RideComplete" component={RideCompleteScreen} options={{ gestureEnabled: false, animation: 'default' }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
