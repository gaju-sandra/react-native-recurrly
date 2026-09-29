import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { colors } from "@/constants/theme";

const Listheading = ({title, onViewAll}:ListHeadingProps) => {
  return (
    <View className="list-head">
      <Text className="list-title" style={{color: colors.primary}}>{title}</Text>
        <TouchableOpacity className="list-action" onPress={onViewAll} disabled={!onViewAll}>
            <Text className="list-action-text">View all</Text>
        </TouchableOpacity>
    </View>
  );
};

export default Listheading;
