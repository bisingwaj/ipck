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
  Prayed: { streakCount?: number; blessings?: number } | undefined;

  // Watch
  SermonDetail: { id: string };
  ContentDetail: { id: string };
  Live: undefined;

  // Give — le montant/fonds/méthode est threadé tout au long du flow
  Wallet: undefined;
  WalletTopup: undefined;
  WalletTransactions: undefined;
  GiveAmount: undefined;
  GiveFund: { amount: number };
  GiveMethod: { amount: number; fundId: string };
  GiveMomoConfirm: { amount: number; fundId: string; method: string };
  GiveMomoPrompt: { amount: number; fundId: string; method: string };
  GiveCard: { amount: number; fundId: string; method: string };
  GiveSuccess: { donationId: string; ref: string; amount: number; fundName: string };
  GiveReceipt: { donationId: string };
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
  BookSlot: { topicId: string; topicLabel: string };
  BookConfirm: { topicId: string; topicLabel: string; slotStart: string };
  BookSuccess: { slotStart: string; topicLabel: string };
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
