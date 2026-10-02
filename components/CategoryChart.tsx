import React, {useState} from 'react';
import {Pressable, Text, View} from 'react-native';
import Svg, {Circle, Path, Text as SvgText} from "react-native-svg";
import clsx from "clsx";
import {colors} from "@/constants/theme";
import type {SubscriptionCategory} from "@/lib/catalog";
import type {CategoryCount} from "@/lib/categories";

// Fixed color per category (not per rank), so a category keeps its color as spending changes.
// Colorblind-safe order checked against the card surface; the legend labels every slice.
// Typed as a Record so adding a category without a color fails to compile.
const CATEGORY_COLORS: Record<SubscriptionCategory, string> = {
    'Entertainment': '#2a78d6',
    'AI Tools': '#eb6834',
    'Developer Tools': '#1baf7a',
    'Design': '#eda100',
    'Productivity': '#e87ba4',
    'Cloud': '#008300',
    'Music': '#4a3aa7',
    'Other': '#e34948',
};

const SIZE = 180;
const THICKNESS = 22;
const RADIUS = (SIZE - THICKNESS) / 2 - 2;
const CENTER = SIZE / 2;
// 2px of card showing between slices.
const GAP = 2 / RADIUS;

const point = (angle: number) => ({
    x: CENTER + RADIUS * Math.sin(angle),
    y: CENTER - RADIUS * Math.cos(angle),
});

// Arc along the ring's centre line, clockwise from 12 o'clock; drawn as a thick stroke.
const arcPath = (start: number, end: number) => {
    const from = point(start);
    const to = point(end);
    const largeArc = end - start > Math.PI ? 1 : 0;
    return `M ${from.x} ${from.y} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${to.x} ${to.y}`;
};

const percent = (share: number) => `${Math.round(share * 100)}%`;

const CategoryChart = ({data}: {data: CategoryCount[]}) => {
    const [selected, setSelected] = useState<SubscriptionCategory | null>(null);
    const toggle = (category: SubscriptionCategory) =>
        setSelected((current) => (current === category ? null : category));

    const total = data.reduce((sum, item) => sum + item.count, 0);
    const selectedItem = data.find((item) => item.category === selected);

    const slices = data.map((item, index) => {
        const start = data.slice(0, index).reduce((sum, previous) => sum + previous.share, 0) * Math.PI * 2;
        return {...item, start, end: start + item.share * Math.PI * 2};
    });

    const strokeFor = (category: SubscriptionCategory) => ({
        stroke: CATEGORY_COLORS[category],
        strokeWidth: category === selected ? THICKNESS + 6 : THICKNESS,
        opacity: selected && category !== selected ? 0.35 : 1,
    });

    return (
        <View className="insights-chart-card mb-5">
            <View className="items-center">
                <Svg width={SIZE} height={SIZE}>
                    {slices.length === 1 ? (
                        <Circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none"
                                {...strokeFor(slices[0].category)}
                                onPress={() => toggle(slices[0].category)}/>
                    ) : (
                        slices.map((slice) => (
                            <Path key={slice.category} d={arcPath(slice.start + GAP / 2, slice.end - GAP / 2)}
                                  fill="none" {...strokeFor(slice.category)}
                                  onPress={() => toggle(slice.category)}/>
                        ))
                    )}
                    <SvgText x={CENTER} y={CENTER - 4} fontSize={20} fontFamily="sans-bold"
                             fill={colors.primary} textAnchor="middle">
                        {selectedItem?.count ?? total}
                    </SvgText>
                    <SvgText x={CENTER} y={CENTER + 16} fontSize={12} fontFamily="sans-medium"
                             fill={colors.mutedForeground} textAnchor="middle">
                        {selectedItem
                            ? `${selectedItem.category} · ${percent(selectedItem.share)}`
                            : total === 1 ? 'subscription' : 'subscriptions'}
                    </SvgText>
                </Svg>
            </View>

            <View className="mt-4 gap-1">
                {data.map((item) => (
                    <Pressable key={item.category} onPress={() => toggle(item.category)}
                               className={clsx('flex-row items-center rounded-xl px-2 py-2',
                                   item.category === selected && 'bg-background')}
                               accessibilityRole="button"
                               accessibilityState={{selected: item.category === selected}}
                               accessibilityLabel={`${item.category}, ${item.count} ${item.count === 1 ? 'subscription' : 'subscriptions'}, ${percent(item.share)}`}>
                        <View className="size-3 rounded-sm" style={{backgroundColor: CATEGORY_COLORS[item.category]}}/>
                        <Text className="ml-3 flex-1 font-sans-medium text-sm text-primary" numberOfLines={1}>
                            {item.category}
                        </Text>
                        <Text className="w-12 text-right font-sans-medium text-sm text-muted-foreground">
                            {percent(item.share)}
                        </Text>
                        <Text className="w-10 text-right font-sans-bold text-sm text-primary">
                            {item.count}
                        </Text>
                    </Pressable>
                ))}
            </View>
        </View>
    );
};

export default CategoryChart;
