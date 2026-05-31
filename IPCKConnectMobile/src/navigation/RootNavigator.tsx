import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RootStackParamList, MainTabParamList } from './types';
import { tokens } from '../theme/tokens';
import { fonts } from '../theme/typography';
import { Icon } from '../components/Icon';
import { ErrorBoundary } from '../components/ErrorBoundary';

// Enveloppe chaque écran : une exception au rendu d'un écran affiche un état
// « Réessayer » au lieu de planter/recharger toute l'application.
const screenLayout = ({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary>{children}</ErrorBoundary>
);

// ─── Onboarding screens ───
import SplashScreen from '../screens/onboarding/SplashScreen';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import SignUpScreen from '../screens/onboarding/SignUpScreen';
import PhoneScreen from '../screens/onboarding/PhoneScreen';
import OTPScreen from '../screens/onboarding/OTPScreen';
import ProfileSetupScreen from '../screens/onboarding/ProfileSetupScreen';
import InterestsScreen from '../screens/onboarding/InterestsScreen';
import NotifPermissionScreen from '../screens/onboarding/NotifPermissionScreen';
import WelcomeScreen from '../screens/onboarding/WelcomeScreen';

// ─── Tab screens ───
import TodayHomeScreen from '../screens/today/TodayHomeScreen';
import WatchListScreen from '../screens/watch/WatchListScreen';
import GiveHomeScreen from '../screens/give/GiveHomeScreen';
import CommunityHomeScreen from '../screens/community/CommunityHomeScreen';
import ProfileHomeScreen from '../screens/profile/ProfileHomeScreen';

// ─── Today flow ───
import DevotionalScreen from '../screens/today/DevotionalScreen';
import PastDevotionalsScreen from '../screens/today/PastDevotionalsScreen';
import StreakScreen from '../screens/today/StreakScreen';
import PrayedScreen from '../screens/today/PrayedScreen';

// ─── Watch ───
import SermonDetailScreen from '../screens/watch/SermonDetailScreen';
import ContentDetailScreen from '../screens/watch/ContentDetailScreen';
import LiveScreen from '../screens/watch/LiveScreen';

// ─── Give ───
import WalletScreen from '../screens/give/WalletScreen';
import WalletTopupScreen from '../screens/give/WalletTopupScreen';
import WalletTransactionsScreen from '../screens/give/WalletTransactionsScreen';
import GiveAmountScreen from '../screens/give/GiveAmountScreen';
import GiveFundScreen from '../screens/give/GiveFundScreen';
import GiveMethodScreen from '../screens/give/GiveMethodScreen';
import GiveMomoConfirmScreen from '../screens/give/GiveMomoConfirmScreen';
import GiveMomoPromptScreen from '../screens/give/GiveMomoPromptScreen';
import GiveCardScreen from '../screens/give/GiveCardScreen';
import GiveSuccessScreen from '../screens/give/GiveSuccessScreen';
import GiveReceiptScreen from '../screens/give/GiveReceiptScreen';
import GiveHistoryScreen from '../screens/give/GiveHistoryScreen';

// ─── Community ───
import GroupsListScreen from '../screens/community/GroupsListScreen';
import GroupDetailScreen from '../screens/community/GroupDetailScreen';
import GroupChatScreen from '../screens/community/GroupChatScreen';
import PrayerWallScreen from '../screens/community/PrayerWallScreen';
import PrayerDetailScreen from '../screens/community/PrayerDetailScreen';
import SubmitPrayerScreen from '../screens/community/SubmitPrayerScreen';
import EventsScreen from '../screens/community/EventsScreen';
import EventDetailScreen from '../screens/community/EventDetailScreen';

// ─── Profile / cross-cutting ───
import AboutScreen from '../screens/profile/AboutScreen';
import ServiceTimesScreen from '../screens/profile/ServiceTimesScreen';
import ContactScreen from '../screens/profile/ContactScreen';
import BookTopicScreen from '../screens/profile/BookTopicScreen';
import BookSlotScreen from '../screens/profile/BookSlotScreen';
import BookConfirmScreen from '../screens/profile/BookConfirmScreen';
import BookSuccessScreen from '../screens/profile/BookSuccessScreen';
import MyAppointmentsScreen from '../screens/profile/MyAppointmentsScreen';
import NotificationsScreen from '../screens/profile/NotificationsScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenLayout={screenLayout}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: tokens.primary,
        tabBarInactiveTintColor: tokens.textSecondary,
        tabBarStyle: {
          backgroundColor: tokens.bg,
          borderTopColor: tokens.borderSoft,
          height: 64,
          paddingTop: 8,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontFamily: fonts.uiMedium, fontSize: 11 },
        tabBarIcon: ({ color, focused }) => {
          const name =
            route.name === 'TodayHome' ? 'today' :
            route.name === 'WatchList' ? 'watch' :
            route.name === 'GiveHome' ? 'give' :
            route.name === 'CommunityHome' ? 'community' : 'profile';
          return <Icon name={name as any} size={22} color={color} strokeWidth={focused ? 2 : 1.6} />;
        },
      })}
    >
      <Tab.Screen name="TodayHome"     component={TodayHomeScreen}     options={{ tabBarLabel: 'Today' }} />
      <Tab.Screen name="WatchList"     component={WatchListScreen}     options={{ tabBarLabel: 'Watch' }} />
      <Tab.Screen name="GiveHome"      component={GiveHomeScreen}      options={{ tabBarLabel: 'Give' }} />
      <Tab.Screen name="CommunityHome" component={CommunityHomeScreen} options={{ tabBarLabel: 'Community' }} />
      <Tab.Screen name="ProfileHome"   component={ProfileHomeScreen}   options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenLayout={screenLayout}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: tokens.bg },
      }}
    >
      {/* Onboarding */}
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="Phone" component={PhoneScreen} />
      <Stack.Screen name="OTP" component={OTPScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      <Stack.Screen name="Interests" component={InterestsScreen} />
      <Stack.Screen name="NotifPermission" component={NotifPermissionScreen} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />

      {/* Main tabs */}
      <Stack.Screen name="Main" component={MainTabs} />

      {/* Today flow */}
      <Stack.Screen name="Devotional" component={DevotionalScreen} />
      <Stack.Screen name="PastDevotionals" component={PastDevotionalsScreen} />
      <Stack.Screen name="Streak" component={StreakScreen} />
      <Stack.Screen name="Prayed" component={PrayedScreen} />

      {/* Watch */}
      <Stack.Screen name="SermonDetail" component={SermonDetailScreen} />
      <Stack.Screen name="ContentDetail" component={ContentDetailScreen} />
      <Stack.Screen name="Live" component={LiveScreen} />

      {/* Give */}
      <Stack.Screen name="Wallet" component={WalletScreen} />
      <Stack.Screen name="WalletTopup" component={WalletTopupScreen} />
      <Stack.Screen name="WalletTransactions" component={WalletTransactionsScreen} />
      <Stack.Screen name="GiveAmount" component={GiveAmountScreen} />
      <Stack.Screen name="GiveFund" component={GiveFundScreen} />
      <Stack.Screen name="GiveMethod" component={GiveMethodScreen} />
      <Stack.Screen name="GiveMomoConfirm" component={GiveMomoConfirmScreen} />
      <Stack.Screen name="GiveMomoPrompt" component={GiveMomoPromptScreen} />
      <Stack.Screen name="GiveCard" component={GiveCardScreen} />
      <Stack.Screen name="GiveSuccess" component={GiveSuccessScreen} />
      <Stack.Screen name="GiveReceipt" component={GiveReceiptScreen} />
      <Stack.Screen name="GiveHistory" component={GiveHistoryScreen} />

      {/* Community */}
      <Stack.Screen name="GroupsList" component={GroupsListScreen} />
      <Stack.Screen name="GroupDetail" component={GroupDetailScreen} />
      <Stack.Screen name="GroupChat" component={GroupChatScreen} />
      <Stack.Screen name="PrayerWall" component={PrayerWallScreen} />
      <Stack.Screen name="PrayerDetail" component={PrayerDetailScreen} />
      <Stack.Screen name="SubmitPrayer" component={SubmitPrayerScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="Events" component={EventsScreen} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} />

      {/* Profile / cross-cutting */}
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="ServiceTimes" component={ServiceTimesScreen} />
      <Stack.Screen name="Contact" component={ContactScreen} />
      <Stack.Screen name="BookTopic" component={BookTopicScreen} />
      <Stack.Screen name="BookSlot" component={BookSlotScreen} />
      <Stack.Screen name="BookConfirm" component={BookConfirmScreen} />
      <Stack.Screen name="BookSuccess" component={BookSuccessScreen} />
      <Stack.Screen name="MyAppointments" component={MyAppointmentsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}
