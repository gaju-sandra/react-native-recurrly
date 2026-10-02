import React from 'react';
import {Alert, Pressable, Text, View} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import {posthog} from "@/lib/posthog";
import SubscriptionIcon from "@/components/SubscriptionIcon";
import {icons} from "@/constants/icons";
import {formatCurrency} from "@/lib/utils";
import type {Recommendation} from "@/lib/recommendations";

const RecommendationCard = ({recommendation}: {recommendation: Recommendation}) => {
    if (recommendation.kind === 'save') {
        return (
            <View className="insights-history-card items-start">
                <Text className="text-2xl">💡</Text>
                <View className="insights-history-copy">
                    <Text className="insights-history-name">{recommendation.title}</Text>
                    <Text className="insights-history-meta">{recommendation.body}</Text>
                </View>
            </View>
        );
    }

    const {service} = recommendation;
    // In-app browser, so the user lands back in Recurly when they close it.
    const openWebsite = async () => {
        try {
            await WebBrowser.openBrowserAsync(service.website);
            posthog?.capture('recommendation_opened', {service_id: service.id, category: service.category});
        } catch {
            Alert.alert('Could not open the page', service.website);
        }
    };

    return (
        <Pressable onPress={openWebsite} className="insights-history-card active:opacity-70"
                   accessibilityRole="link" accessibilityLabel={`Visit the ${service.name} website`}>
            <SubscriptionIcon name={service.name} fallback={icons.wallet} className="insights-history-icon"/>
            <View className="insights-history-copy">
                <Text className="insights-history-name" numberOfLines={1}>{service.name}</Text>
                <Text className="insights-history-meta" numberOfLines={1}>
                    You have no {service.category} yet
                </Text>
            </View>
            <View className="insights-history-price-box">
                <Text className="insights-history-meta">from ~{formatCurrency(service.fromPrice)}/mo</Text>
                <Text className="insights-history-meta">Visit ↗</Text>
            </View>
        </Pressable>
    );
};

export default RecommendationCard;
