import React, {useMemo, useState} from 'react';
import {Image, Pressable, ScrollView, Text, View} from 'react-native';
import {router} from "expo-router";
import {SafeAreaView as RNSafeAreaView, useSafeAreaInsets} from "react-native-safe-area-context";
import { styled } from "nativewind";
import dayjs from "dayjs";
import {icons} from "@/constants/icons";
import {components, spacing} from "@/constants/theme";
import {useSubscriptions} from "@/context/SubscriptionsContext";
import {formatCurrency} from "@/lib/utils";
import {getRenewalsBetween, type Renewal} from "@/lib/subscriptions";
import MonthCalendar, {dayKey} from "@/components/MonthCalendar";
import SubscriptionIcon from "@/components/SubscriptionIcon";

const SafeAreaView = styled(RNSafeAreaView);

const RenewalRow = ({subscription, date, isTrialEnd}: Renewal) => (
    <Pressable className="insights-history-card" onPress={() => router.push(`/subscriptions/${subscription.id}`)}>
        <SubscriptionIcon name={subscription.name} fallback={icons.wallet} className="insights-history-icon"/>
        <View className="insights-history-copy">
            <Text className="insights-history-name" numberOfLines={1}>{subscription.name}</Text>
            <Text className="insights-history-meta" numberOfLines={1}>
                {date.format('ddd, MMM D')}{isTrialEnd ? ' · Trial ends' : ''}
            </Text>
        </View>
        <View className="insights-history-price-box">
            <Text className="insights-history-name">{formatCurrency(subscription.price, subscription.currency)}</Text>
        </View>
    </Pressable>
);

const Calendar = () => {
    const insets = useSafeAreaInsets();
    const {subscriptions} = useSubscriptions();
    const [month, setMonth] = useState(() => dayjs().startOf('month'));
    // null shows the whole month; tapping a day narrows the list to that day.
    const [selectedDay, setSelectedDay] = useState<string | null>(null);

    const renewals = useMemo(
        () => getRenewalsBetween(subscriptions, month.startOf('month'), month.endOf('month')),
        [subscriptions, month],
    );

    const renewalsByDay = useMemo(() => {
        const byDay = new Map<string, Renewal[]>();
        for (const renewal of renewals) {
            const key = dayKey(renewal.date);
            byDay.set(key, [...(byDay.get(key) ?? []), renewal]);
        }
        return byDay;
    }, [renewals]);

    const visible = selectedDay ? renewalsByDay.get(selectedDay) ?? [] : renewals;
    const monthTotal = renewals.reduce((total, renewal) => total + renewal.subscription.price, 0);

    const changeMonth = (amount: number) => {
        setMonth((current) => current.add(amount, 'month'));
        setSelectedDay(null);
    };

    const bottomPadding =
        components.tabBar.height + Math.max(insets.bottom, components.tabBar.horizontalInset) + spacing[6];

    const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

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
                    <Text className="insights-title">Renewal Calendar</Text>
                    <View className="size-12"/>
                </View>

                <View className="calendar-month-row">
                    <Pressable className="insights-icon-button" onPress={() => changeMonth(-1)}
                               hitSlop={8} accessibilityLabel="Previous month">
                        <Image source={icons.back} className="insights-icon-button-image" resizeMode="contain"/>
                    </Pressable>
                    <Text className="calendar-month-title">{month.format('MMMM YYYY')}</Text>
                    <Pressable className="insights-icon-button" onPress={() => changeMonth(1)}
                               hitSlop={8} accessibilityLabel="Next month">
                        <Image source={icons.back} className="insights-icon-button-image rotate-180"
                               resizeMode="contain"/>
                    </Pressable>
                </View>

                <MonthCalendar
                    month={month}
                    renewalsByDay={renewalsByDay}
                    selectedDay={selectedDay}
                    onSelectDay={(day) => setSelectedDay((current) => (current === day ? null : day))}
                />

                <View className="insights-expense-card">
                    <View>
                        <Text className="insights-expense-title">Due in {month.format('MMMM')}</Text>
                        <Text className="insights-expense-meta">
                            {renewals.length} {renewals.length === 1 ? 'charge' : 'charges'}
                        </Text>
                    </View>
                    <Text className="insights-expense-title">{formatCurrency(monthTotal)}</Text>
                </View>

                <View className="calendar-list-head">
                    <Text className="settings-section-title my-0">
                        {selectedDay ? dayjs(selectedDay).format('dddd, MMMM D') : 'All renewals this month'}
                    </Text>
                    {selectedDay && (
                        <Pressable onPress={() => setSelectedDay(null)} hitSlop={8}>
                            <Text className="auth-link">Show all</Text>
                        </Pressable>
                    )}
                </View>

                <View className="gap-4">
                    {visible.map((renewal) => (
                        <RenewalRow key={`${renewal.subscription.id}-${dayKey(renewal.date)}`} {...renewal}/>
                    ))}
                </View>
                {visible.length === 0 && (
                    <Text className="home-empty-state">
                        {selectedDay ? 'Nothing renews on this day.' : 'Nothing renews this month.'}
                    </Text>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

export default Calendar;