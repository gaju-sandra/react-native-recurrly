import React from 'react';
import {View, Text, Pressable} from 'react-native';
import SubscriptionIcon from "@/components/SubscriptionIcon";
import {formatCurrency, formatStatusLabel, formatSubscriptionDateTime} from "@/lib/utils";
import clsx from "clsx";
import {icons} from "@/constants/icons";
import {getNextRenewalDate} from "@/lib/subscriptions";

const SubscriptionCard = ({name, price, currency, frequency, color, category,
                              plan, expanded, onPress, onManagePress, paymentMethod, startDate, status, trialEndsAt }: SubscriptionCardProps)=> {
  const renewalDate = getNextRenewalDate({startDate, frequency, status, trialEndsAt}).toISOString();

  return (

    <Pressable onPress={onPress} className={clsx('sub-card',expanded ?
        'sub-card-expanded':'bg-card')} style={!expanded && color ? {
            backgroundColor: color}: undefined}>
      <View className= "sub-head">
          <View className="sub-main">
              <SubscriptionIcon name={name} fallback={icons.wallet} className="sub-icon" />
              <View className="sub-copy">
                  <Text numberOfLines={1}className="sub-title">
                      {name}
                  </Text>
                  <Text numberOfLines={1} ellipsizeMode="tail"
                        className="sub-meta">
                      {category?.trim() || plan?.trim()||
                          (renewalDate? formatSubscriptionDateTime(renewalDate) : '')}
                  </Text>
              </View>
          </View>
          <View className="sub-price-box">
              <Text className="sub-price">{formatCurrency(price)}
              </Text>
              <Text className="sub-billing">{frequency}
              </Text>
          </View>
      </View>


        {expanded &&
            (
                <View className="sub-body">
                    <View className="sub-details">
                        <View className="sub-row">
                        <View className="sub-row-copy">
                            <Text className="sub-label">Category:</Text>
                            <Text className="sub-value" numberOfLines={1}
                                  ellipsizeMode="tail">{category?.trim() || plan?.trim()}</Text>
                        </View>
                    </View>
                        <View className="sub-row">
                            <View className="sub-row-copy">
                                <Text className="sub-label">Renewal date:</Text>
                                <Text className="sub-value" numberOfLines={1}
                                      ellipsizeMode="tail">{renewalDate ?
                                formatSubscriptionDateTime(renewalDate): ''}</Text>
                            </View>
                        </View>
                        <View className="sub-row">
                            <View className="sub-row-copy">
                                <Text className="sub-label">Payment:</Text>
                                <Text className="sub-value" numberOfLines={1}
                                      ellipsizeMode="tail">{paymentMethod?.trim() ?? 'Not provided'}</Text>
                            </View>
                        </View>
                        <View className="sub-row">
                            <View className="sub-row-copy">
                                <Text className="sub-label">Status:</Text>
                                <Text className="sub-value" numberOfLines={1}
                                      ellipsizeMode="tail">{status ?
                                formatStatusLabel(status) : ''}</Text>
                            </View>
                        </View>


                    </View>
                    {onManagePress && (
                        <Pressable className="sub-cancel" onPress={onManagePress}
                                   accessibilityLabel={`Manage ${name}`}>
                            <Text className="sub-cancel-text">Manage</Text>
                        </Pressable>
                    )}
                </View>
            )}

    </Pressable>
  );
};

export default SubscriptionCard;
