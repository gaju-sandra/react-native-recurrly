import React from 'react';
import { Text } from 'react-native';
import {Link, useLocalSearchParams} from "expo-router";
import {SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import { styled } from "nativewind";

const SafeAreaView = styled(RNSafeAreaView);
const SubscriptionDetails  = () => {

 const { id }= useLocalSearchParams<{id: string } >();
  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <Text>Subscription Details: {id}</Text>
      <Link href="/">Go back</Link>
    </SafeAreaView>
  );
};

export default SubscriptionDetails;
