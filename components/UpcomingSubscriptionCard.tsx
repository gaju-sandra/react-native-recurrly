import React from 'react';
import {View, Text} from 'react-native';
import SubscriptionIcon from "@/components/SubscriptionIcon";
import {formatCurrency} from "@/lib/utils";

const UpcomingSubscriptionCard = ({name, price, daysLeft, icon, currency}:UpcomingSubscription) => {
  return (
    <View className="upcoming-card">
      <View className="upcoming-row">
          <SubscriptionIcon name={name} fallback={icon} className="upcoming-icon rounded-lg" />
          <View>
              <Text className="upcoming-price">{formatCurrency(price, currency)}</Text>
              <Text className="upcoming-meta" numberOfLines={1}>{daysLeft >1 ? `${daysLeft} days left` : 'last day'}
              </Text>
          </View>
      </View>
        <Text className="upcoming-name" numberOfLines={1}>{name}</Text>
    </View>
  );
};

export default UpcomingSubscriptionCard;
