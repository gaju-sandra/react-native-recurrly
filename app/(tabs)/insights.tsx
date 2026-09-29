import React, {useMemo} from 'react';
import {FlatList, Image, Pressable, Text, View} from 'react-native';
import {SafeAreaView as RNSafeAreaView, useSafeAreaInsets} from "react-native-safe-area-context";
import { styled } from "nativewind";
import {useRouter} from "expo-router";
import dayjs from "dayjs";
import {icons} from "@/constants/icons";
import {components, spacing} from "@/constants/theme";
import {useSubscriptions} from "@/context/SubscriptionsContext";
import {formatCurrency} from "@/lib/utils";
import {getMonthOverMonthChange, getSpendBetween, getWeeklySpending} from "@/lib/subscriptions";
import Listheading from "@/components/listheading";
import WeeklySpendingChart from "@/components/WeeklySpendingChart";
import InsightHistoryCard from "@/components/InsightHistoryCard";

const SafeAreaView = styled(RNSafeAreaView);

const ItemSeparator = () => <View className="h-4" />;

const Insights = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const {subscriptions} = useSubscriptions();

    // Actual charges this month, the same measure the % change compares.
    const monthSpend = getSpendBetween(subscriptions, dayjs().startOf('month'), dayjs().endOf('month'));
    const monthChange = getMonthOverMonthChange(subscriptions);
    const weeklySpending = useMemo(() => getWeeklySpending(subscriptions), [subscriptions]);

    // Most recently added first.
    const history = useMemo(
        () => [...subscriptions].sort((a, b) => dayjs(b.startDate).valueOf() - dayjs(a.startDate).valueOf()),
        [subscriptions],
    );

    const listBottomPadding =
        components.tabBar.height +
        Math.max(insets.bottom, components.tabBar.horizontalInset) +
        spacing[6];

    const listHeader = (
        <>
            <View className="insights-header">
                <Pressable className="insights-icon-button" onPress={() => router.navigate('/')}
                           hitSlop={8} accessibilityLabel="Back to home">
                    <Image source={icons.back} className="insights-icon-button-image" resizeMode="contain"/>
                </Pressable>
                <Text className="insights-title">Monthly Insights</Text>
                <View className="size-12"/>
            </View>

            <Listheading title="This week"/>
            <WeeklySpendingChart data={weeklySpending}/>

            <View className="insights-expense-card">
                <View>
                    <Text className="insights-expense-title">Expenses</Text>
                    <Text className="insights-expense-meta">{dayjs().format('MMMM YYYY')}</Text>
                </View>
                <View className="items-end">
                    <Text className="insights-expense-title">-{formatCurrency(monthSpend)}</Text>
                    {monthChange !== null && (
                        <Text className="insights-expense-meta">
                            {monthChange >= 0 ? '+' : ''}{monthChange}% vs last month
                        </Text>
                    )}
                </View>
            </View>

            <Listheading title="History" onViewAll={() => router.navigate('/subscriptions')}/>
        </>
    );

    return (
        <SafeAreaView className="flex-1 bg-background p-5" edges={['top', 'left', 'right']}>
            <FlatList
                ListHeaderComponent={listHeader}
                data={history}
                keyExtractor={(item) => item.id}
                renderItem={({item}) => <InsightHistoryCard {...item}/>}
                ItemSeparatorComponent={ItemSeparator}
                ListEmptyComponent={<Text className="home-empty-state">No subscriptions yet.</Text>}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{paddingBottom: listBottomPadding}}
            />
        </SafeAreaView>
    );
};

export default Insights;
