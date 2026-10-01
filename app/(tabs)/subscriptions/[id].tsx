import React, {useState} from 'react';
import {Alert, Image, Pressable, ScrollView, Text, View} from 'react-native';
import {router, useLocalSearchParams} from "expo-router";
import {SafeAreaView as RNSafeAreaView, useSafeAreaInsets} from "react-native-safe-area-context";
import { styled } from "nativewind";
import clsx from "clsx";
import {icons} from "@/constants/icons";
import {components, spacing} from "@/constants/theme";
import {useSubscriptions} from "@/context/SubscriptionsContext";
import {formatCurrency, formatStatusLabel, formatSubscriptionDateTime} from "@/lib/utils";
import {FREQUENCY_LABEL, getNextRenewalDate} from "@/lib/subscriptions";
import {posthog} from "@/lib/posthog";
import SubscriptionIcon from "@/components/SubscriptionIcon";
import CreateSubscriptionModal from "@/components/CreateSubscriptionModal";

const SafeAreaView = styled(RNSafeAreaView);

const DetailRow = ({label, value, first}: {label: string; value: string; first?: boolean}) => (
    <View className={clsx('settings-row', !first && 'settings-row-divider')}>
        <Text className="settings-row-label">{label}</Text>
        <Text className="settings-row-value" numberOfLines={1}>{value}</Text>
    </View>
);

const SubscriptionDetails = () => {
    const {id} = useLocalSearchParams<{id: string}>();
    const insets = useSafeAreaInsets();
    const {subscriptions, updateSubscription, removeSubscription} = useSubscriptions();
    const [isEditing, setIsEditing] = useState(false);

    // Read from the context, not the database, so edits show up immediately.
    const subscription = subscriptions.find((item) => item.id === id);

    const bottomPadding =
        components.tabBar.height + Math.max(insets.bottom, components.tabBar.horizontalInset) + spacing[6];

    const goBack = () => (router.canGoBack() ? router.back() : router.replace('/subscriptions'));

    if (!subscription) {
        return (
            <SafeAreaView className="flex-1 bg-background p-5">
                <Text className="home-empty-state">This subscription no longer exists.</Text>
                <Pressable className="auth-secondary-button mt-4" onPress={goBack}>
                    <Text className="auth-secondary-button-text">Go back</Text>
                </Pressable>
            </SafeAreaView>
        );
    }

    const isCancelled = subscription.status === 'cancelled';

    // Cancelling keeps the record (for history and "money saved"); deleting removes it.
    const toggleCancelled = async () => {
        const status: SubscriptionStatus = isCancelled ? 'active' : 'cancelled';
        try {
            await updateSubscription({...subscription, status});
            posthog?.capture(isCancelled ? 'subscription_reactivated' : 'subscription_cancelled', {
                subscription_name: subscription.name,
            });
        } catch {
            Alert.alert('Could not update', 'Please try again.');
        }
    };

    const confirmDelete = () => {
        Alert.alert('Delete subscription', `Delete ${subscription.name}? This cannot be undone.`, [
            {text: 'Keep', style: 'cancel'},
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await removeSubscription(subscription.id);
                        posthog?.capture('subscription_deleted', {subscription_name: subscription.name});
                        goBack();
                    } catch {
                        Alert.alert('Could not delete', 'Please try again.');
                    }
                },
            },
        ]);
    };

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
            <ScrollView
                contentContainerClassName="p-5"
                contentContainerStyle={{paddingBottom: bottomPadding}}
                showsVerticalScrollIndicator={false}
            >
                <View className="insights-header">
                    <Pressable className="insights-icon-button" onPress={goBack}
                               hitSlop={8} accessibilityLabel="Back">
                        <Image source={icons.back} className="insights-icon-button-image" resizeMode="contain"/>
                    </Pressable>
                    <Text className="insights-title" numberOfLines={1}>{subscription.name}</Text>
                    <View className="size-12"/>
                </View>

                <View className="settings-profile-card">
                    <SubscriptionIcon name={subscription.name} fallback={icons.wallet} className="settings-avatar"/>
                    <View className="min-w-0 flex-1">
                        <Text className="settings-profile-name">
                            {formatCurrency(subscription.price, subscription.currency)}
                        </Text>
                        <Text className="settings-profile-email">{FREQUENCY_LABEL[subscription.frequency]}</Text>
                    </View>
                </View>

                <Text className="settings-section-title">Details</Text>
                <View className="settings-group">
                    <DetailRow first label="Status" value={formatStatusLabel(subscription.status)}/>
                    <DetailRow
                        label="Next renewal"
                        value={isCancelled || subscription.status === 'paused'
                            ? '—'
                            : formatSubscriptionDateTime(getNextRenewalDate(subscription).toISOString())}
                    />
                    {subscription.status === 'trial' && (
                        <DetailRow label="Trial ends" value={formatSubscriptionDateTime(subscription.trialEndsAt)}/>
                    )}
                    <DetailRow label="Started" value={formatSubscriptionDateTime(subscription.startDate)}/>
                    <DetailRow label="Category" value={subscription.category ?? '—'}/>
                    <DetailRow label="Payment" value={subscription.paymentMethod ?? 'Not provided'}/>
                </View>

                <View className="mt-8 gap-3">
                    <Pressable className="auth-button" onPress={() => setIsEditing(true)}>
                        <Text className="auth-button-text">Edit</Text>
                    </Pressable>
                    <Pressable className="auth-secondary-button" onPress={toggleCancelled}>
                        <Text className="auth-secondary-button-text">
                            {isCancelled ? 'Mark as active' : 'Mark as cancelled'}
                        </Text>
                    </Pressable>
                    <Pressable className="settings-signout mt-0" onPress={confirmDelete}>
                        <Text className="settings-signout-text">Delete</Text>
                    </Pressable>
                </View>
            </ScrollView>

            <CreateSubscriptionModal
                visible={isEditing}
                onClose={() => setIsEditing(false)}
                onSubmit={updateSubscription}
                initialValue={subscription}
            />
        </SafeAreaView>
    );
};

export default SubscriptionDetails;
