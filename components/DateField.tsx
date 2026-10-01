import React, {useState} from 'react';
import {Platform, Pressable, Text, View} from 'react-native';
import DateTimePicker from "@expo/ui/community/datetime-picker";
import dayjs from "dayjs";
import {colors} from "@/constants/theme";

interface DateFieldProps {
    label: string;
    value: Date;
    onChange: (date: Date) => void;
    minimumDate?: Date;
    maximumDate?: Date;
}

// iOS renders a compact inline picker; Android shows a field that opens a dialog.
const DateField = ({label, value, onChange, minimumDate, maximumDate}: DateFieldProps) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <View className="auth-field">
            <Text className="auth-label">{label}</Text>
            {Platform.OS === 'ios' ? (
                <DateTimePicker
                    value={value}
                    mode="date"
                    display="compact"
                    accentColor={colors.accent}
                    minimumDate={minimumDate}
                    maximumDate={maximumDate}
                    onValueChange={(_, date) => onChange(date)}
                    style={{alignSelf: 'flex-start'}}
                />
            ) : (
                <>
                    <Pressable className="auth-input" onPress={() => setIsOpen(true)}
                               accessibilityLabel={`${label}: ${dayjs(value).format('MMMM D, YYYY')}`}>
                        <Text className="text-base font-sans-medium text-primary">
                            {dayjs(value).format('MMM D, YYYY')}
                        </Text>
                    </Pressable>
                    {isOpen && (
                        <DateTimePicker
                            value={value}
                            mode="date"
                            presentation="dialog"
                            minimumDate={minimumDate}
                            maximumDate={maximumDate}
                            onValueChange={(_, date) => {
                                setIsOpen(false);
                                onChange(date);
                            }}
                            onDismiss={() => setIsOpen(false)}
                        />
                    )}
                </>
            )}
        </View>
    );
};

export default DateField;
