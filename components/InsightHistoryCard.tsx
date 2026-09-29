import React from 'react';
import {Text, View} from 'react-native';
import dayjs from "dayjs";
import SubscriptionIcon from "@/components/SubscriptionIcon";
import {formatCurrency} from "@/lib/utils";
import {icons} from "@/constants/icons";
import {FREQUENCY_LABEL} from "@/lib/subscriptions";

const InsightHistoryCard = ({name, price, currency, frequency, color, startDate}: Subscription) => {
    const date = startDate && dayjs(startDate).isValid() ? dayjs(startDate).format('MMMM D, HH:mm') : '';

    return (
        <View className="insights-history-card" style={color ? {backgroundColor: color} : undefined}>
            <SubscriptionIcon name={name} fallback={icons.wallet} className="insights-history-icon"/>
            <View className="insights-history-copy">
                <Text className="insights-history-name" numberOfLines={1}>{name}</Text>
                {date ? <Text className="insights-history-meta" numberOfLines={1}>{date}</Text> : null}
            </View>
            <View className="insights-history-price-box">
                <Text className="insights-history-name">{formatCurrency(price, currency)}</Text>
                <Text className="insights-history-meta">
                    {FREQUENCY_LABEL[frequency]}
                </Text>
            </View>
        </View>
    );
};

export default InsightHistoryCard;
