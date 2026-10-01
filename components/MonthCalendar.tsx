import React from 'react';
import {Pressable, Text, View} from 'react-native';
import dayjs, {type Dayjs} from "dayjs";
import clsx from "clsx";
import {colors} from "@/constants/theme";
import {mondayIndex, WEEK_DAYS, type Renewal} from "@/lib/subscriptions";

// More dots than this won't fit under a day number; the list below shows them all.
const MAX_DOTS = 3;
const CELL_WIDTH = `${100 / 7}%` as const;

export const dayKey = (date: Dayjs) => date.format('YYYY-MM-DD');

interface MonthCalendarProps {
    month: Dayjs;
    // Renewals of this month, grouped by dayKey.
    renewalsByDay: Map<string, Renewal[]>;
    selectedDay: string | null;
    onSelectDay: (day: string) => void;
}

const MonthCalendar = ({month, renewalsByDay, selectedDay, onSelectDay}: MonthCalendarProps) => {
    const first = month.startOf('month');
    const today = dayKey(dayjs());

    // Empty cells before the 1st so it lands under the right weekday.
    const cells: (Dayjs | null)[] = [
        ...Array.from({length: mondayIndex(first)}, () => null),
        ...Array.from({length: first.daysInMonth()}, (_, index) => first.add(index, 'day')),
    ];

    return (
        <View className="calendar-card">
            <View className="flex-row">
                {WEEK_DAYS.map((day) => (
                    <Text key={day} className="calendar-weekday" style={{width: CELL_WIDTH}}>{day}</Text>
                ))}
            </View>

            <View className="flex-row flex-wrap">
                {cells.map((date, index) => {
                    if (!date) return <View key={`blank-${index}`} style={{width: CELL_WIDTH}}/>;

                    const key = dayKey(date);
                    const renewals = renewalsByDay.get(key) ?? [];
                    const isSelected = key === selectedDay;

                    return (
                        <Pressable
                            key={key}
                            style={{width: CELL_WIDTH}}
                            className="calendar-cell"
                            onPress={() => onSelectDay(key)}
                            accessibilityRole="button"
                            accessibilityState={{selected: isSelected}}
                            accessibilityLabel={`${date.format('MMMM D')}, ${renewals.length} renewals`}
                        >
                            <View className={clsx(
                                'calendar-day',
                                key === today && 'calendar-day-today',
                                isSelected && 'calendar-day-selected',
                            )}>
                                <Text className={clsx('calendar-day-text', isSelected && 'calendar-day-text-selected')}>
                                    {date.date()}
                                </Text>
                            </View>
                            <View className="calendar-dots">
                                {renewals.slice(0, MAX_DOTS).map((renewal) => (
                                    <View
                                        key={renewal.subscription.id}
                                        className="calendar-dot"
                                        style={{backgroundColor: renewal.isTrialEnd ? colors.destructive : colors.accent}}
                                    />
                                ))}
                            </View>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
};

export default MonthCalendar;