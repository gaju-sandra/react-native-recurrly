import React, {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {useSQLiteContext} from "expo-sqlite";
import * as Notifications from "expo-notifications";
import {router, type Href} from "expo-router";
import {getSetting, setSetting} from "@/lib/db";
import {requestReminderPermission, syncRenewalReminders} from "@/lib/notifications";
import {useSubscriptions} from "@/context/SubscriptionsContext";
import {useAuth} from "@clerk/expo";
import {sendTestEmail as sendTestEmailRequest, syncEmailReminders} from "@/lib/emailReminders";

export const REMINDER_DAY_OPTIONS = [1, 3, 7] as const;
const DEFAULT_DAYS_BEFORE = 1;

interface RemindersContextValue {
    enabled: boolean;
    daysBefore: number;
    // Resolves false when the user refused notification permission.
    setEnabled: (enabled: boolean) => Promise<boolean>;
    setDaysBefore: (days: number) => Promise<void>;
    // An email to the login address on each due date (sent by the server, app open or not).
    emailEnabled: boolean;
    setEmailEnabled: (enabled: boolean) => Promise<void>;
    // Resolves to the address the test email went to.
    sendTestEmail: () => Promise<string>;
}

const RemindersContext = createContext<RemindersContextValue | null>(null);

// Opens the subscription a reminder is about, both when the app is running
// and when the tap launched the app from scratch.
const useReminderNavigation = () => {
    useEffect(() => {
        const open = (response: Notifications.NotificationResponse | null) => {
            const url = response?.notification.request.content.data?.url;
            if (typeof url === 'string') router.push(url as Href);
            // Handle each tap once: this provider remounts on account switch, and would
            // otherwise reopen the same (possibly another account's) subscription.
            if (response) Notifications.clearLastNotificationResponse();
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
    const [emailEnabled, setEmailEnabledState] = useState(false);
    const [settingsLoaded, setSettingsLoaded] = useState(false);
    const {getToken} = useAuth();
    // Through a ref so a new getToken identity doesn't re-trigger the email sync.
    const getTokenRef = useRef(getToken);
    useEffect(() => {
        getTokenRef.current = getToken;
    }, [getToken]);
    const getFreshToken = useCallback(() => getTokenRef.current(), []);
    // Syncs run one after another so a slow one can't cancel a newer schedule.
    const syncQueue = useRef<Promise<void>>(Promise.resolve());
    const emailQueue = useRef<Promise<void>>(Promise.resolve());

    useReminderNavigation();

    useEffect(() => {
        Promise.all([
            getSetting(db, 'reminders_enabled'),
            getSetting(db, 'reminder_days_before'),
            getSetting(db, 'email_reminders_enabled'),
        ])
            .then(([storedEnabled, storedDays, storedEmail]) => {
                setEnabledState(storedEnabled === 'true');
                setEmailEnabledState(storedEmail === 'true');
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

    // Same for emails; only the differences reach the server, so this is cheap when nothing changed.
    useEffect(() => {
        if (isLoading || !settingsLoaded) return;
        emailQueue.current = emailQueue.current
            .then(() => syncEmailReminders(db, subscriptions, {enabled: emailEnabled, getToken: getFreshToken}))
            .catch((error) => console.warn('Could not schedule email reminders', error));
    }, [db, subscriptions, emailEnabled, getFreshToken, isLoading, settingsLoaded]);

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

    const setEmailEnabled = useCallback(async (next: boolean) => {
        await setSetting(db, 'email_reminders_enabled', String(next));
        setEmailEnabledState(next);
    }, [db]);

    const sendTestEmail = useCallback(() => sendTestEmailRequest(getFreshToken), [getFreshToken]);

    const value = useMemo(
        () => ({enabled, daysBefore, setEnabled, setDaysBefore, emailEnabled, setEmailEnabled, sendTestEmail}),
        [enabled, daysBefore, setEnabled, setDaysBefore, emailEnabled, setEmailEnabled, sendTestEmail],
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
