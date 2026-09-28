import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { colors } from "@/constants/theme";

const Listheading = ({title}:ListHeadingProps) => {
  return (
    <View>
      <Text className="list-title" style={{color: colors.primary}}>{title}</Text>
        <TouchableOpacity className="list-actions">
            <Text className="list-action-text">View all</Text>
        </TouchableOpacity>
    </View>
  );
};

export default Listheading;
