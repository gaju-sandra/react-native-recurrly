import React, {useEffect, useRef, useState} from 'react';
import {Alert, AppState, Image, Linking, Pressable, ScrollView, Text, View, type NativeEventSubscription} from 'react-native';
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
import {findService, getCancelLink, getPayLink, STORE_SUBSCRIPTIONS} from "@/lib/catalog";
import {billLabel, getBill} from "@/lib/payments";
import dayjs from "dayjs";
import SubscriptionIcon from "@/components/SubscriptionIcon";
import CreateSubscriptionModal from "@/components/CreateSubscriptionModal";
import CancelSubscriptionModal from "@/components/CancelSubscriptionModal";

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
    const {subscriptions, updateSubscription, removeSubscription, payments, recordPayment,
        undoPayment} = useSubscriptions();
    const [isEditing, setIsEditing] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    // Waits for the user to come back from the provider's cancel or billing page.
    const returnListener = useRef<NativeEventSubscription |
        null>(null);

    useEffect(() => () =>
        returnListener.current?.remove(), []);

    // Read from the context, not the database, so edits show up immediately.
    const subscription = subscriptions.find((item) =>
        item.id === id);

    const bottomPadding =
        components.tabBar.height + Math.max(insets.bottom,
            components.tabBar.horizontalInset) + spacing[6];

    const goBack = () => (router.canGoBack() ? router.back() :
        router.replace('/subscriptions'));

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

    const serviceName = findService(subscription.name)?.name ?? subscription.name;
    const cancelLink = getCancelLink(subscription.name);
    const payLink = getPayLink(subscription.name);
    const bill = getBill(subscription, payments);
    const history = payments.filter((payment) => payment.subscriptionId === subscription.id);
    const amount = formatCurrency(subscription.price, subscription.currency);

    // Cancelling keeps the record (for history and "money saved"); deleting removes it.
    const setCancelled = async (cancelled: boolean) => {
        try {
            await updateSubscription({...subscription, status: cancelled ? 'cancelled' : 'active'});
            posthog?.capture(cancelled ? 'subscription_cancelled' : 'subscription_reactivated', {
                subscription_name: subscription.name,
            });
        } catch {
            Alert.alert('Could not update', 'Please try again.');
        }
    };

    // Opens a provider page in the browser and runs `onReturn` once the user is back in the app.
    const openThenAsk = async (url: string, onReturn: () => void): Promise<boolean> => {
        try {
            await Linking.openURL(url);
        } catch {
            Alert.alert('Could not open the page', url);
            return false;
        }
        returnListener.current?.remove();
        returnListener.current = AppState.addEventListener('change', (state) => {
            if (state !== 'active') return;
            returnListener.current?.remove();
            returnListener.current = null;
            onReturn();
        });
        return true;
    };

    // Recurly can't cancel for the user (that needs their login with the provider), so it
    // opens the provider's page and, once they're back, asks whether to mark it cancelled.
    const openCancelPage = async (url: string) => {
        const opened = await openThenAsk(url, () =>
            Alert.alert(`Did you cancel ${serviceName}?`, 'We\'ll mark it as cancelled and stop reminding you.', [
                {text: 'Not yet', style: 'cancel'},
                {text: 'Yes, cancelled', onPress: () => setCancelled(true)},
            ]));
        if (opened) posthog?.capture('cancel_page_opened', {subscription_name: subscription.name, known: cancelLink.known});
    };

    const markPaid = async (dueDate: string) => {
        try {
            await recordPayment(subscription, dueDate);
            posthog?.capture('payment_recorded', {subscription_name: subscription.name, due_date: dueDate});
        } catch {
            Alert.alert('Could not save the payment', 'Please try again.');
        }
    };

    // Payment happens on the provider's own site (Recurly never handles card details);
    // when the user comes back, they confirm and the bill is marked as paid.
    const openPayPage = async (dueDate: string) => {
        const due = dayjs(dueDate).format('MMM D');
        const opened = await openThenAsk(payLink.url, () =>
            Alert.alert(`Did you pay ${serviceName}?`, `We'll mark the ${due} bill (${amount}) as paid.`, [
                {text: 'Not yet', style: 'cancel'},
                {text: 'Yes, paid', onPress: () => markPaid(dueDate)},
            ]));
        if (opened) posthog?.capture('payment_page_opened', {subscription_name: subscription.name, known: payLink.known});
    };

    const confirmMarkPaid = (dueDate: string) => {
        Alert.alert('Mark as paid', `Mark the ${dayjs(dueDate).format('MMM D')} bill (${amount}) as paid?`, [
            {text: 'Cancel', style: 'cancel'},
            {text: 'Mark as paid', onPress: () => markPaid(dueDate)},
        ]);
    };

    const onUndoPayment = async (payment: Payment) => {
        try {
            await undoPayment(payment.id);
            posthog?.capture('payment_undone', {subscription_name: subscription.name, due_date: payment.dueDate});
        } catch {
            Alert.alert('Could not undo', 'Please try again.');
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

                {bill && (
                    <>
                        <Text className="settings-section-title">Payment</Text>
                        <View className="settings-group">
                            <View className="settings-row">
                                <Text className="settings-row-label">This bill</Text>
                                <Text numberOfLines={1} className={clsx('settings-row-value',
                                    bill.state === 'overdue' && 'text-destructive',
                                    bill.state === 'due-today' && 'text-accent',
                                    bill.state === 'paid' && 'text-success')}>
                                    {billLabel(bill)}
                                </Text>
                            </View>
                            {bill.state === 'paid' && (
                                <DetailRow label="Next due" value={dayjs(bill.nextDueDate).format('MMM D, YYYY')}/>
                            )}
                        </View>
                        {bill.payment ? (
                            <Pressable onPress={() => bill.payment && onUndoPayment(bill.payment)} hitSlop={8}
                                       className="detail-link mt-4">
                                <Text className="auth-link">Undo payment</Text>
                            </Pressable>
                        ) : (
                            <View className="mt-4 gap-2">
                                <Pressable className="detail-button" onPress={() => openPayPage(bill.dueDate)}>
                                    <Text className="auth-button-text" numberOfLines={1}>
                                        {payLink.known ? `Pay ${amount} on ${serviceName}` : `Pay ${amount}`}
                                    </Text>
                                </Pressable>
                                <Pressable onPress={() => confirmMarkPaid(bill.dueDate)} hitSlop={8}
                                           className="detail-link">
                                    <Text className="auth-link">Already paid? Mark as paid</Text>
                                </Pressable>
                            </View>
                        )}
                    </>
                )}

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

                {history.length > 0 && (
                    <>
                        <Text className="settings-section-title">Payment history</Text>
                        <View className="settings-group">
                            {history.map((payment, index) => (
                                <DetailRow key={payment.id} first={index === 0}
                                           label={dayjs(payment.dueDate).format('MMM D, YYYY')}
                                           value={`${formatCurrency(payment.amount, payment.currency)} · paid ${dayjs(payment.paidAt).format('MMM D')}`}/>
                            ))}
                        </View>
                    </>
                )}

                <View className="mt-8 gap-3">
                    <Pressable className="detail-button" onPress={() => setIsEditing(true)}>
                        <Text className="auth-button-text">Edit</Text>
                    </Pressable>
                    {isCancelled ? (
                        <Pressable className="detail-button-secondary" onPress={() => setCancelled(false)}>
                            <Text className="detail-button-secondary-text">Reactivate</Text>
                        </Pressable>
                    ) : (
                        <Pressable className="detail-button-secondary" onPress={() => setIsCancelModalOpen(true)}>
                            <Text className="detail-button-secondary-text">Cancel subscription</Text>
                        </Pressable>
                    )}
                    <Pressable className="detail-button-danger mt-3" onPress={confirmDelete}>
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

            <CancelSubscriptionModal
                visible={isCancelModalOpen}
                onClose={() => setIsCancelModalOpen(false)}
                serviceName={serviceName}
                cancelLabel={cancelLink.known ? `Open ${serviceName}'s cancel page` : 'Search how to cancel'}
                onOpenCancelPage={() => openCancelPage(cancelLink.url)}
                onOpenStorePage={() => openCancelPage(STORE_SUBSCRIPTIONS.url)}
                onMarkCancelled={() => setCancelled(true)}
            />
        </SafeAreaView>
    );
};

export default SubscriptionDetails;
