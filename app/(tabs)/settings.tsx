import { useAuth, useUser } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Switch, Pressable, Linking } from 'react-native';
import { SafeAreaView as RNSafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { styled } from 'nativewind';
import { useState } from 'react';
import Constants from 'expo-constants';
import dayjs from 'dayjs';
import clsx from 'clsx';
import UserAvatar from '@/components/UserAvatar';
import { colors, components, spacing } from '@/constants/theme';
import { useSubscriptions } from '@/context/SubscriptionsContext';
import { REMINDER_DAY_OPTIONS, useReminders } from '@/context/RemindersContext';
import { cancelAllReminders } from '@/lib/notifications';
import { formatCurrency } from '@/lib/utils';
import { getMonthlySpend } from '@/lib/subscriptions';
import { posthog } from '@/lib/posthog';

const SafeAreaView = styled(RNSafeAreaView);

const SettingsRow = ({ label, value, first }: { label: string; value: string; first?: boolean }) => (
  <View className={clsx('settings-row', !first && 'settings-row-divider')}>
    <Text className="settings-row-label">{label}</Text>
    <Text className="settings-row-value" numberOfLines={1}>{value}</Text>
  </View>
);

export default function Settings() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { subscriptions } = useSubscriptions();
  const [signingOut, setSigningOut] = useState(false);

  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'User';
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress ?? '';
  const memberSince = user?.createdAt ? dayjs(user.createdAt).format('MMMM YYYY') : '—';
  const activeCount = subscriptions.filter((subscription) => subscription.status === 'active').length;
  const monthlySpend = getMonthlySpend(subscriptions);
  const appVersion = Constants.expoConfig?.version ?? '—';
  const { enabled: remindersEnabled, daysBefore, setEnabled: setRemindersEnabled, setDaysBefore } = useReminders();

  const toggleReminders = async (next: boolean) => {
    const allowed = await setRemindersEnabled(next);
    if (!allowed) {
      // The OS won't show its permission prompt again, so send the user to system settings.
      Alert.alert(
        'Notifications are off',
        'Allow notifications for Recurly in your phone settings to get renewal reminders.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Open settings', onPress: () => Linking.openSettings() },
        ],
      );
      return;
    }
    posthog?.capture(next ? 'reminders_enabled' : 'reminders_disabled', { days_before: daysBefore });
  };

  const onSignOut = async () => {
    try {
      setSigningOut(true);
      posthog?.capture('user_signed_out');
      await cancelAllReminders();
      await signOut();
      posthog?.reset();
      router.replace('/(auth)/sign-in');
    } catch (e) {
      setSigningOut(false);
    }
  };

  const confirmSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: onSignOut },
    ]);
  };

  const bottomPadding =
    components.tabBar.height + Math.max(insets.bottom, components.tabBar.horizontalInset) + spacing[6];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerClassName="p-5"
        contentContainerStyle={{ paddingBottom: bottomPadding }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="list-title mb-5">Settings</Text>

        <View className="settings-profile-card">
          <UserAvatar className="settings-avatar" />
          <View className="min-w-0 flex-1">
            <Text className="settings-profile-name" numberOfLines={1}>{displayName}</Text>
            <Text className="settings-profile-email" numberOfLines={1}>{email}</Text>
          </View>
        </View>

        <View className="settings-stats-row">
          <View className="settings-stat">
            <Text className="settings-stat-value">{activeCount}</Text>
            <Text className="settings-stat-label">Active subscriptions</Text>
          </View>
          <View className="settings-stat">
            <Text className="settings-stat-value">{formatCurrency(monthlySpend)}</Text>
            <Text className="settings-stat-label">Monthly spend</Text>
          </View>
        </View>

        <Text className="settings-section-title">Account</Text>
        <View className="settings-group">
          <SettingsRow first label="Name" value={displayName} />
          <SettingsRow label="Email" value={email || '—'} />
          <SettingsRow label="Member since" value={memberSince} />
        </View>

        <Text className="settings-section-title">Subscriptions</Text>
        <View className="settings-group">
          <SettingsRow first label="Total tracked" value={String(subscriptions.length)} />
          <SettingsRow label="Yearly spend" value={formatCurrency(monthlySpend * 12)} />
        </View>

        <Text className="settings-section-title">Reminders</Text>
        <View className="settings-group">
          <View className="settings-row">
            <Text className="settings-row-label">Renewal reminders</Text>
            <Switch
              value={remindersEnabled}
              onValueChange={toggleReminders}
              trackColor={{ true: colors.accent }}
              accessibilityLabel="Renewal reminders"
            />
          </View>
          {remindersEnabled && (
            <View className="settings-row settings-row-divider">
              <Text className="settings-row-label">Remind me</Text>
              <View className="flex-row gap-2">
                {REMINDER_DAY_OPTIONS.map((days) => {
                  const active = daysBefore === days;
                  return (
                    <Pressable
                      key={days}
                      className={clsx('picker-option px-3', active && 'picker-option-active')}
                      onPress={() => setDaysBefore(days)}
                      accessibilityLabel={`${days} days before`}
                    >
                      <Text className={clsx('picker-option-text', active && 'picker-option-text-active')}>
                        {days}d before
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        <Text className="settings-section-title">About</Text>
        <View className="settings-group">
          <SettingsRow first label="App version" value={appVersion} />
        </View>

        <TouchableOpacity
          className={clsx('settings-signout', signingOut && 'settings-signout-disabled')}
          onPress={confirmSignOut}
          disabled={signingOut}
          activeOpacity={0.8}
        >
          {signingOut
            ? <ActivityIndicator color="#fff" />
            : <Text className="settings-signout-text">Sign Out</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
