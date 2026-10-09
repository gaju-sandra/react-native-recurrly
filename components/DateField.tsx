import React, {useState} from 'react';
import {Platform, Pressable, Text, View} from 'react-native';
import DateTimePicker from "@expo/ui/community/datetime-picker";
import dayjs from "dayjs";
import clsx from "clsx";
import {colors} from "@/constants/theme";

interface DateFieldProps {
    label: string;
    // null means nothing picked yet, so the placeholder is shown.
    value: Date | null;
    onChange: (date: Date) => void;
    placeholder?: string;
    minimumDate?: Date;
    maximumDate?: Date;
    // One-tap shortcuts shown under the picker, e.g. "1 month ago".
    presets?: {label: string; date: Date}[];
}

// A dropdown-style field: tapping it opens a calendar (inline on iOS, a dialog on Android).
const DateField = ({label, value, onChange, placeholder = 'Choose a date', minimumDate, maximumDate, presets}: DateFieldProps) => {
    const [isOpen, setIsOpen] = useState(false);

    const pick = (date: Date) => {
        setIsOpen(false);
        onChange(date);
    };

    return (
        <View className="auth-field">
            <Text className="auth-label">{label}</Text>
            <Pressable className="auth-input flex-row items-center justify-between"
                       onPress={() => setIsOpen((open) => !open)}
                       accessibilityRole="button"
                       accessibilityState={{expanded: isOpen}}
                       accessibilityLabel={`${label}: ${value ? dayjs(value).format('MMMM D, YYYY') : placeholder}`}>
                <Text className={clsx('text-base font-sans-medium', value ? 'text-primary' : 'text-muted-foreground')}>
                    {value ? dayjs(value).format('MMM D, YYYY') : placeholder}
                </Text>
                <Text className="text-base text-muted-foreground">{isOpen ? '▴' : '▾'}</Text>
            </Pressable>
            {isOpen && (
                Platform.OS === 'ios' ? (
                    <DateTimePicker
                        value={value ?? maximumDate ?? new Date()}
                        mode="date"
                        display="inline"
                        accentColor={colors.accent}
                        themeVariant="light"
                        minimumDate={minimumDate}
                        maximumDate={maximumDate}
                        onValueChange={(_, date) => pick(date)}
                    />
                ) : (
                    <DateTimePicker
                        value={value ?? maximumDate ?? new Date()}
                        mode="date"
                        presentation="dialog"
                        minimumDate={minimumDate}
                        maximumDate={maximumDate}
                        onValueChange={(_, date) => pick(date)}
                        onDismiss={() => setIsOpen(false)}
                    />
                )
            )}
            {presets && presets.length > 0 && (
                <View className="picker-row mt-2">
                    {presets.map((preset) => {
                        const active = value !== null && dayjs(preset.date).isSame(value, 'day');
                        return (
                            <Pressable key={preset.label} onPress={() => pick(preset.date)}
                                       className={clsx('picker-option py-2', active && 'picker-option-active')}
                                       accessibilityRole="button" accessibilityState={{selected: active}}>
                                <Text className={clsx('picker-option-text', active && 'picker-option-text-active')}>
                                    {preset.label}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>
            )}
        </View>
    );
};

export default DateField;
