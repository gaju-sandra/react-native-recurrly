import React, {useMemo} from 'react';
import {Image, View} from 'react-native';
import type {ImageSourcePropType} from 'react-native';
import {SvgXml} from "react-native-svg";
import clsx from "clsx";
import {findBrandIcon} from "@/lib/brandIcons";

interface SubscriptionIconProps {
    name: string;
    fallback: ImageSourcePropType;
    className?: string;
}

const SubscriptionIcon = ({name, fallback, className}: SubscriptionIconProps) => {
    const brandIcon = useMemo(() => findBrandIcon(name), [name]);

    if (brandIcon?.type === 'svg') {
        return (
            <View className={clsx(className, 'items-center justify-center bg-white')}>
                <SvgXml xml={brandIcon.xml} width="60%" height="60%"/>
            </View>
        );
    }

    return <Image source={brandIcon?.source ?? fallback} className={className} resizeMode="contain"/>;
};

export default SubscriptionIcon;
