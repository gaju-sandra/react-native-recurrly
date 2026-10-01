import { Tabs } from "expo-router";
import { tabs } from "@/constants/data";
import {View} from "react-native";
import {colors, components } from '@/constants/theme';
import clsx from "clsx";
import {Image} from 'react-native';
import {useSafeAreaFrame, useSafeAreaInsets} from "react-native-safe-area-context";
import {SubscriptionsProvider} from "@/context/SubscriptionsContext";
import {RemindersProvider} from "@/context/RemindersContext";
import {SQLiteProvider} from "expo-sqlite";
import {useAuth} from "@clerk/expo";
import {migrateDbIfNeeded} from "@/lib/db";

const tabBar = components.tabBar;

const TabLayout = () => {
    const insets = useSafeAreaInsets();
    const {userId} = useAuth();
    const TabIcon = ({focused, icon}: TabIconProps) => {
        return (
            <View className={"tabs-icon"}>

                <View className={clsx('tabs-pill', focused &&
                    'tabs-active')}>
                    <Image source={icon} resizeMode="contain"
                           className="tabs-glyph"/>

                </View>

            </View>
        );
    };

    // Signed out: AuthGuard in app/_layout.tsx is redirecting to sign-in.
    if (!userId) return null;

    return (
        // One database file per user, so a different account on the same phone
        // never sees someone else's subscriptions. `key` remounts on account switch.
        <SQLiteProvider databaseName={`recurlly-${userId}.db`} onInit={migrateDbIfNeeded} key={userId}>
        <SubscriptionsProvider>
        <RemindersProvider>
        <Tabs screenOptions={{
            headerShown: false,
            tabBarShowLabel: false,
            tabBarStyle:{
                position:'absolute',
               bottom: Math.max(insets.bottom, tabBar.horizontalInset),
                height: tabBar.height,
                marginHorizontal: tabBar.horizontalInset,
                borderRadius: tabBar.radius,
                backgroundColor: colors.primary,
                borderTopWidth: 0,
                elevation: 0,

            },
            tabBarItemStyle:{
                paddingVertical: tabBar.height /2 -
                    tabBar.iconFrame / 1.6
            },
            tabBarIconStyle:{
                width: tabBar.iconFrame,
                height: tabBar.iconFrame,
                alignItems: 'center',
            }

        }}>
            {tabs.map((tab) => (
                <Tabs.Screen
                    key={tab.name}
                    name={tab.name}
                    options={{
                        title: tab.title,
                        tabBarIcon: ({focused}) => (
                            <TabIcon focused={focused} icon={tab.icon}/>
                        )
                    }}
                />
            ))}
            <Tabs.Screen name="subscriptions/[id]" options={{href: null}}/>
            <Tabs.Screen name="calendar" options={{href: null}}/>
        </Tabs>
        </RemindersProvider>
        </SubscriptionsProvider>
        </SQLiteProvider>
    );
}

export default TabLayout;
