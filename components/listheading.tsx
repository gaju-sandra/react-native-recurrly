import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

const Listheading = ({title}:ListHeadingProps) => {
  return (
    <View>
      <Text className="list-title">{title}</Text>
        <TouchableOpacity className="list-actions">
            <Text className="list-action-text">View all</Text>
        </TouchableOpacity>
    </View>
  );
};

export default Listheading;
