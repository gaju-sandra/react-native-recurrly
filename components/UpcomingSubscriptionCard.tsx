import React from 'react';
import {View, Text} from 'react-native';
import SubscriptionIcon from "@/components/SubscriptionIcon";
import {formatCurrency} from "@/lib/utils";
import {icons} from "@/constants/icons";

const daysLeftLabel = (daysLeft: number) => {
  if (daysLeft <= 0) return 'Today';
  if (daysLeft === 1) return 'Tomorrow';
  return `${daysLeft} days left`;
};

const UpcomingSubscriptionCard = ({name, price, daysLeft, currency}:UpcomingSubscription) => {
  return (
    <View className="upcoming-card">
      <View className="upcoming-row">
          <SubscriptionIcon name={name} fallback={icons.wallet} className="upcoming-icon rounded-lg" />
          <View>
              <Text className="upcoming-price">{formatCurrency(price, currency)}</Text>
              <Text className="upcoming-meta" numberOfLines={1}>{daysLeftLabel(daysLeft)}
              </Text>
          </View>
      </View>
        <Text className="upcoming-name" numberOfLines={1}>{name}</Text>
    </View>
  );
};

export default UpcomingSubscriptionCard;
