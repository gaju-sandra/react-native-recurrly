import "@/global.css"

import {FlatList, Image, Pressable, Text, View} from "react-native";
import { Link } from "expo-router";
import {SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import { styled } from "nativewind";
import images from '@/constants/image';
import {HOME_BALANCE, UPCOMING_SUBSCRIPTIONS} from "@/constants/data";
import {useSubscriptions} from "@/context/SubscriptionsContext";
import {icons} from "@/constants/icons";
import {formatCurrency} from "@/lib/utils";
import dayjs from "dayjs";
import Listheading from "@/components/listheading";
import UpcomingSubscriptionCard from "@/components/UpcomingSubscriptionCard";
import SubscriptionCard from "@/components/subscriptionCard";
import CreateSubscriptionModal from "@/components/CreateSubscriptionModal";
import {useState} from "react";
import { useUser } from "@clerk/expo";



const SafeAreaView = styled(RNSafeAreaView);


export default function App() {
    const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<string | null>(null);
    const {subscriptions, addSubscription} = useSubscriptions();
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    const { user } = useUser();
    const displayName = user?.firstName ?? user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] ?? 'there';
    return (
        <SafeAreaView className="flex-1 bg-background p-5">



                <FlatList
                    ListHeaderComponent={()=>(
                        <>
                            <View className="home-header">
                                <View className="home-user">
                                    <Image source ={images.avatar}
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
                                <Text className="home-balnce-label">Balance</Text>
                                <View className="home-balance-row">
                                    <Text className="home-balance-amount">
                                        {formatCurrency(HOME_BALANCE.amount)}
                                    </Text>
                                    <Text className="home-balance-date">
                                        {dayjs(HOME_BALANCE.nextRenewalDate).format('MM/DD')}
                                    </Text>
                                </View>

                            </View>
                            <View className="mb-5">

                                <Listheading title="Upcoming" />
                                <FlatList
                                    data={UPCOMING_SUBSCRIPTIONS} renderItem={({item})=>(<UpcomingSubscriptionCard {...item} />
                                )}
                                    keyExtractor={(item)=> item.id}
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    ListEmptyComponent={<Text className="home-empty-state">No upcoming renewals yet </Text>}
                                />
                            </View>
                            <Listheading title="All Subscriptions" />
                        </>
                    )}
                    data={subscriptions}
                    keyExtractor={(item)=> item.id}
                    renderItem={({ item })=>(
                        <SubscriptionCard {...item}expanded={expandedSubscriptionId
                        === item.id}
                        onPress={()=> setExpandedSubscriptionId((currentId)=>
                            (currentId === item.id ? null : item.id))}
                        />
                    )}
                    extraData={expandedSubscriptionId}
                    ItemSeparatorComponent={()=> <View className="h-4"
                        />}
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={<Text className="home-empty-state">No
                        subscriptions yet. </Text>
                    }
                    contentContainerClassName="pb-20"
                />

                <CreateSubscriptionModal
                    visible={isCreateModalVisible}
                    onClose={() => setIsCreateModalVisible(false)}
                    onCreate={addSubscription}
                />

        </SafeAreaView>
    );
}