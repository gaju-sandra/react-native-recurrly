import React, {useState} from 'react';
import {View} from 'react-native';
import Svg, {Line, Rect, Text as SvgText} from "react-native-svg";
import {colors} from "@/constants/theme";
import {formatCurrency} from "@/lib/utils";

const CHART_HEIGHT = 200;
const AXIS_WIDTH = 28;
const LABEL_HEIGHT = 24;
const TOP_PADDING = 32;
const BAR_WIDTH = 12;
const TICK_COUNT = 5;

const WeeklySpendingChart = ({data}: {data: DailySpending[]}) => {
    const [width, setWidth] = useState(0);

    const maxAmount = Math.max(...data.map((item) => item.amount), 0);
    const highlightIndex = data.findIndex((item) => item.amount === maxAmount);
    const tickStep = Math.max(Math.ceil(maxAmount / TICK_COUNT / 5) * 5, 5);
    const axisMax = tickStep * TICK_COUNT;

    const plotHeight = CHART_HEIGHT - TOP_PADDING - LABEL_HEIGHT;
    const plotWidth = Math.max(width - AXIS_WIDTH, 0);
    const slotWidth = data.length ? plotWidth / data.length : 0;
    const yFor = (value: number) => TOP_PADDING + plotHeight - (value / axisMax) * plotHeight;

    return (
        <View className="insights-chart-card" onLayout={(event) => setWidth(event.nativeEvent.layout.width - 24)}>
            {width > 0 && (
                <Svg width={width} height={CHART_HEIGHT}>
                    {Array.from({length: TICK_COUNT + 1}, (_, index) => {
                        const value = index * tickStep;
                        const y = yFor(value);
                        return (
                            <React.Fragment key={value}>
                                <Line x1={AXIS_WIDTH} x2={width} y1={y} y2={y}
                                      stroke={colors.border} strokeDasharray="4 4"/>
                                <SvgText x={0} y={y + 4} fontSize={11} fontFamily="sans-medium"
                                         fill={colors.mutedForeground}>
                                    {value}
                                </SvgText>
                            </React.Fragment>
                        );
                    })}

                    {data.map((item, index) => {
                        const centerX = AXIS_WIDTH + slotWidth * index + slotWidth / 2;
                        const barTop = yFor(item.amount);
                        const isHighlighted = index === highlightIndex;
                        return (
                            <React.Fragment key={item.day}>
                                <Rect
                                    x={centerX - BAR_WIDTH / 2}
                                    y={barTop}
                                    width={BAR_WIDTH}
                                    height={Math.max(yFor(0) - barTop, 0)}
                                    rx={BAR_WIDTH / 2}
                                    fill={isHighlighted ? colors.accent : colors.primary}
                                />
                                {isHighlighted && (
                                    <>
                                        <Rect x={centerX - 22} y={barTop - 28} width={44} height={22}
                                              rx={8} fill="#ffffff"/>
                                        <SvgText x={centerX} y={barTop - 13} fontSize={11}
                                                 fontFamily="sans-bold" fill={colors.accent}
                                                 textAnchor="middle">
                                            {formatCurrency(item.amount).replace('.00', '')}
                                        </SvgText>
                                    </>
                                )}
                                <SvgText x={centerX} y={CHART_HEIGHT - 4} fontSize={12}
                                         fontFamily="sans-medium" fill={colors.primary}
                                         textAnchor="middle">
                                    {item.day}
                                </SvgText>
                            </React.Fragment>
                        );
                    })}
                </Svg>
            )}
        </View>
    );
};

export default WeeklySpendingChart;
