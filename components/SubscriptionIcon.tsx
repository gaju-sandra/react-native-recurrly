import React, {useMemo} from 'react';
import {Image, View} from 'react-native';
import type {ImageSourcePropType} from 'react-native';
import {SvgXml} from "react-native-svg";
import clsx from "clsx";
import {findBrandIcon} from "@/lib/brandIcons";
import {iconTintFor} from "@/lib/utils";

interface SubscriptionIconProps {
    name: string;
    fallback: ImageSourcePropType;
    className?: string;
    // Color behind the icon; the fallback icon is tinted dark or white to stay visible on it.
    backgroundColor?: string;
}

const SubscriptionIcon = ({name, fallback, className, backgroundColor}: SubscriptionIconProps) => {
    const brandIcon = useMemo(() => findBrandIcon(name), [name]);

    if (brandIcon?.type === 'svg') {
        return (
            <View className={clsx(className, 'items-center justify-center bg-white')}>
                <SvgXml xml={brandIcon.xml} width="60%" height="60%"/>
            </View>
        );
    }

    if (brandIcon) {
        return <Image source={brandIcon.source} className={className} resizeMode="contain"/>;
    }

    return <Image source={fallback} className={className} resizeMode="contain"
                  style={{tintColor: iconTintFor(backgroundColor)}}/>;
};

export default SubscriptionIcon;
