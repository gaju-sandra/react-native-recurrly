import React from 'react';
import {View, Text, TextInput, Pressable} from 'react-native';
import {colors} from "@/constants/theme";

const SearchBar = ({value, onChangeText, placeholder = 'Search'}: SearchBarProps) => {
  return (
    <View className="search-bar">
        <Text className="search-icon">🔍</Text>
        <TextInput
            className="search-input"
            style={{color: colors.primary}}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            clearButtonMode="never"
        />
        {value.length > 0 && (
            <Pressable className="search-clear" onPress={() => onChangeText('')}
                       hitSlop={8} accessibilityLabel="Clear search">
                <Text className="search-clear-text">✕</Text>
            </Pressable>
        )}
    </View>
  );
};

export default SearchBar;
