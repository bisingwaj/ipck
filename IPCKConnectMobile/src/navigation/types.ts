// Typed routes for React Navigation

export type RootStackParamList = {
  // Onboarding
  Splash: undefined;
  Onboarding: undefined;
  SignUp: undefined;
  Phone: undefined;
  OTP: { phone?: string };
  ProfileSetup: undefined;
  Interests: undefined;
  NotifPermission: undefined;
  Welcome: undefined;

  // Main tabs container
  Main: undefined;

  // Today flow
  Devotional: { devotionalId?: string } | undefined;
  PastDevotionals: undefined;
  Streak: undefined;
  Prayed: undefined;

  // Watch
  SermonDetail: { id: string };
  Live: undefined;

  // Give
  Wallet: undefined;
  WalletTopup: undefined;
  GiveAmount: undefined;
  GiveFund: undefined;
  GiveMethod: undefined;
  GiveMomoConfirm: undefined;
  GiveMomoPrompt: undefined;
  GiveCard: undefined;
  GiveSuccess: undefined;
  GiveReceipt: undefined;
  GiveHistory: undefined;

  // Community
  GroupsList: undefined;
  GroupDetail: { id: string };
  GroupChat: { id: string };
  PrayerWall: undefined;
  PrayerDetail: { id: string };
  SubmitPrayer: undefined;
  Events: undefined;
  EventDetail: { id: string };

  // Profile / cross-cutting
  About: undefined;
  ServiceTimes: undefined;
  Contact: undefined;
  BookTopic: undefined;
  BookSlot: undefined;
  BookConfirm: undefined;
  BookSuccess: undefined;
  MyAppointments: undefined;
  Notifications: undefined;
  Settings: undefined;
};

export type MainTabParamList = {
  TodayHome: undefined;
  WatchList: undefined;
  GiveHome: undefined;
  CommunityHome: undefined;
  ProfileHome: undefined;
};
