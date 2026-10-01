import "@/global.css"

import {FlatList, Image, Pressable, Text, View} from "react-native";
import { router } from "expo-router";
import {SafeAreaView as RNSafeAreaView, useSafeAreaInsets} from "react-native-safe-area-context";
import { styled } from "nativewind";
import images from '@/constants/image';
import {useSubscriptions} from "@/context/SubscriptionsContext";
import {icons} from "@/constants/icons";
import {components, spacing} from "@/constants/theme";
import {formatCurrency} from "@/lib/utils";
import {getMonthlySpend, getNextRenewal, getUpcoming} from "@/lib/subscriptions";
import Listheading from "@/components/listheading";
import UpcomingSubscriptionCard from "@/components/UpcomingSubscriptionCard";
import SubscriptionCard from "@/components/subscriptionCard";
import CreateSubscriptionModal from "@/components/CreateSubscriptionModal";
import {useState} from "react";
import { useUser } from "@clerk/expo";



const SafeAreaView = styled(RNSafeAreaView);

const ItemSeparator = () => <View className="h-4"/>;


export default function App() {
    const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<string | null>(null);
    const {subscriptions, addSubscription} = useSubscriptions();
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    const insets = useSafeAreaInsets();
    const { user } = useUser();
    const displayName = user?.firstName ?? user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] ?? 'there';
    const monthlySpend = getMonthlySpend(subscriptions);
    const nextRenewal = getNextRenewal(subscriptions);
    const upcoming = getUpcoming(subscriptions);

    // The tab bar floats over the list, so leave room for it like the other tabs do.
    const listBottomPadding =
        components.tabBar.height +
        Math.max(insets.bottom, components.tabBar.horizontalInset) +
        spacing[6];

    // An element, not a component: an inline component would remount on every render
    // and reset the Upcoming list's scroll position whenever a card is expanded.
    const listHeader = (
        <>
            <View className="home-header">
                <View className="home-user">
                    <Image source={user?.imageUrl ? {uri: user.imageUrl} : images.avatar}
                           className="home-avatar"
                    />
                    <Text className="home-user-name">Hi, {displayName} 👋</Text>
                </View>
                <Pressable onPress={() => setIsCreateModalVisible(true)} hitSlop={8}
                           accessibilityLabel="Add subscription">
                    <Image source={icons.add} className="home-add-icon"/>
                </Pressable>
            </View>
            <View className="home-balance-card">
                {/* Average per month across all billing frequencies; Insights shows actual charges. */}
                <Text className="home-balnce-label">Monthly spend</Text>
                <View className="home-balance-row">
                    <Text className="home-balance-amount">
                        {formatCurrency(monthlySpend)}
                    </Text>
                    {nextRenewal && (
                        <Text className="home-balance-date">
                            Next {nextRenewal.format('MM/DD')}
                        </Text>
                    )}
                </View>

            </View>
            <View className="mb-5">

                <Listheading title="Upcoming" onViewAll={() => router.push('/calendar')} />
                <FlatList
                    data={upcoming} renderItem={({item})=>(<UpcomingSubscriptionCard {...item} />
                )}
                    keyExtractor={(item)=> item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    ListEmptyComponent={<Text className="home-empty-state">No renewals in the next 7 days</Text>}
                />
            </View>
            <Listheading title="All Subscriptions" />
        </>
    );

    return (
        <SafeAreaView className="flex-1 bg-background p-5" edges={['top', 'left', 'right']}>



                <FlatList
                    ListHeaderComponent={listHeader}
                    data={subscriptions}
                    keyExtractor={(item)=> item.id}
                    renderItem={({ item })=>(
                        <SubscriptionCard {...item} expanded={expandedSubscriptionId
                        === item.id}
                        onPress={()=> setExpandedSubscriptionId((currentId)=>
                            (currentId === item.id ? null : item.id))}
                        onManagePress={() => router.push(`/subscriptions/${item.id}`)}
                        />
                    )}
                    extraData={expandedSubscriptionId}
                    ItemSeparatorComponent={ItemSeparator}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <Pressable onPress={() => setIsCreateModalVisible(true)}>
                            <Text className="home-empty-state">
                                No subscriptions yet. Tap + to add your first one.
                            </Text>
                        </Pressable>
                    }
                    contentContainerStyle={{paddingBottom: listBottomPadding}}
                />

                <CreateSubscriptionModal
                    visible={isCreateModalVisible}
                    onClose={() => setIsCreateModalVisible(false)}
                    onSubmit={addSubscription}
                />

        </SafeAreaView>
    );
}
