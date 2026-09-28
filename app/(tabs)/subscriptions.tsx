import React, {useCallback, useMemo, useState} from 'react';
import {FlatList, Keyboard, KeyboardAvoidingView, Platform, Text, View} from 'react-native';
import {SafeAreaView as RNSafeAreaView, useSafeAreaInsets} from "react-native-safe-area-context";
import { styled } from "nativewind";
import {useSubscriptions} from "@/context/SubscriptionsContext";
import {components, spacing} from "@/constants/theme";
import SubscriptionCard from "@/components/subscriptionCard";
import SearchBar from "@/components/searchBar";
import Listheading from "@/components/listheading";

const SafeAreaView = styled(RNSafeAreaView);

const ItemSeparator = () => <View className="h-4" />;

const Subscriptions = () => {
    const insets = useSafeAreaInsets();
    const {subscriptions} = useSubscriptions();
    const [query, setQuery] = useState('');
    const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<string | null>(null);

    const filteredSubscriptions = useMemo(() => {
        const term = query.trim().toLowerCase();
        if (!term) return subscriptions;

        return subscriptions.filter((subscription) =>
            [
                subscription.name,
                subscription.plan,
                subscription.category,
                subscription.billing,
                subscription.status,
            ]
                .filter(Boolean)
                .some((field) => field!.toLowerCase().includes(term))
        );
    }, [query, subscriptions]);

    const handleChangeText = useCallback((value: string) => {
        setQuery(value);
        setExpandedSubscriptionId(null);
    }, []);

    const handleCardPress = useCallback((id: string) => {
        Keyboard.dismiss();
        setExpandedSubscriptionId((currentId) => (currentId === id ? null : id));
    }, []);

    const listBottomPadding =
        components.tabBar.height +
        Math.max(insets.bottom, components.tabBar.horizontalInset) +
        spacing[6];

    const listHeader = (
        <>
            <Listheading title="Subscriptions" />
            <SearchBar
                value={query}
                onChangeText={handleChangeText}
                placeholder="Search by name, plan or category"
            />
            <Text className="search-count">
                {filteredSubscriptions.length}{' '}
                {filteredSubscriptions.length === 1 ? 'subscription' : 'subscriptions'}
            </Text>
        </>
    );

    return (
        <SafeAreaView className="flex-1 bg-background p-5" edges={['top', 'left', 'right']}>
            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <FlatList
                    ListHeaderComponent={listHeader}
                    data={filteredSubscriptions}
                    keyExtractor={(item) => item.id}
                    renderItem={({item}) => (
                        <SubscriptionCard
                            {...item}
                            expanded={expandedSubscriptionId === item.id}
                            onPress={() => handleCardPress(item.id)}
                        />
                    )}
                    extraData={expandedSubscriptionId}
                    ItemSeparatorComponent={ItemSeparator}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="none"
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <Text className="home-empty-state">
                            {query.trim()
                                ? `No subscriptions match "${query.trim()}".`
                                : 'No subscriptions yet.'}
                        </Text>
                    }
                    automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
                    contentContainerStyle={{paddingBottom: listBottomPadding}}
                />
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default Subscriptions;
