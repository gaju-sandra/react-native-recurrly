import React, {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {useSQLiteContext} from "expo-sqlite";
import * as Notifications from "expo-notifications";
import {router, type Href} from "expo-router";
import {getSetting, setSetting} from "@/lib/db";
import {requestReminderPermission, syncRenewalReminders} from "@/lib/notifications";
import {useSubscriptions} from "@/context/SubscriptionsContext";

export const REMINDER_DAY_OPTIONS = [1, 3, 7] as const;
const DEFAULT_DAYS_BEFORE = 1;

interface RemindersContextValue {
    enabled: boolean;
    daysBefore: number;
    // Resolves false when the user refused notification permission.
    setEnabled: (enabled: boolean) => Promise<boolean>;
    setDaysBefore: (days: number) => Promise<void>;
}

const RemindersContext = createContext<RemindersContextValue | null>(null);

// Opens the subscription a reminder is about, both when the app is running
// and when the tap launched the app from scratch.
const useReminderNavigation = () => {
    useEffect(() => {
        const open = (response: Notifications.NotificationResponse | null) => {
            const url = response?.notification.request.content.data?.url;
            if (typeof url === 'string') router.push(url as Href);
        };
        open(Notifications.getLastNotificationResponse());
        const listener = Notifications.addNotificationResponseReceivedListener(open);
        return () => listener.remove();
    }, []);
};

export const RemindersProvider = ({children}: {children: React.ReactNode}) => {
    const db = useSQLiteContext();
    const {subscriptions, isLoading} = useSubscriptions();
    const [enabled, setEnabledState] = useState(false);
    const [daysBefore, setDaysBeforeState] = useState(DEFAULT_DAYS_BEFORE);
    const [settingsLoaded, setSettingsLoaded] = useState(false);
    // Syncs run one after another so a slow one can't cancel a newer schedule.
    const syncQueue = useRef<Promise<void>>(Promise.resolve());

    useReminderNavigation();

    useEffect(() => {
        Promise.all([getSetting(db, 'reminders_enabled'), getSetting(db, 'reminder_days_before')])
            .then(([storedEnabled, storedDays]) => {
                setEnabledState(storedEnabled === 'true');
                if (storedDays) setDaysBeforeState(Number(storedDays));
            })
            .finally(() => setSettingsLoaded(true));
    }, [db]);

    // Any change to subscriptions or settings rebuilds the schedule.
    useEffect(() => {
        if (isLoading || !settingsLoaded) return;
        syncQueue.current = syncQueue.current
            .then(() => syncRenewalReminders(subscriptions, {enabled, daysBefore}))
            .catch((error) => console.warn('Could not schedule reminders', error));
    }, [subscriptions, enabled, daysBefore, isLoading, settingsLoaded]);

    const setEnabled = useCallback(async (next: boolean) => {
        if (next && !(await requestReminderPermission())) return false;
        await setSetting(db, 'reminders_enabled', String(next));
        setEnabledState(next);
        return true;
    }, [db]);

    const setDaysBefore = useCallback(async (days: number) => {
        await setSetting(db, 'reminder_days_before', String(days));
        setDaysBeforeState(days);
    }, [db]);

    const value = useMemo(
        () => ({enabled, daysBefore, setEnabled, setDaysBefore}),
        [enabled, daysBefore, setEnabled, setDaysBefore],
    );

    return (
        <RemindersContext.Provider value={value}>
            {children}
        </RemindersContext.Provider>
    );
};

export const useReminders = () => {
    const context = useContext(RemindersContext);
    if (!context) {
        throw new Error('useReminders must be used within a RemindersProvider');
    }
    return context;
};
