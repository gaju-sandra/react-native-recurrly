import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import {useSQLiteContext} from "expo-sqlite";
import {deleteSubscription, getAllSubscriptions, insertSubscription, updateSubscription as saveSubscription} from "@/lib/db";

interface SubscriptionsContextValue {
    subscriptions: Subscription[];
    isLoading: boolean;
    addSubscription: (subscription: Subscription) => Promise<void>;
    updateSubscription: (subscription: Subscription) => Promise<void>;
    removeSubscription: (id: string) => Promise<void>;
}

const SubscriptionsContext = createContext<SubscriptionsContextValue | null>(null);

// Screens read from React state (fast); every change is written to SQLite first,
// so the state never shows something that failed to save.
export const SubscriptionsProvider = ({children}: {children: React.ReactNode}) => {
    const db = useSQLiteContext();
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        getAllSubscriptions(db)
            .then(setSubscriptions)
            .finally(() => setIsLoading(false));
    }, [db]);

    const addSubscription = useCallback(async (subscription: Subscription) => {
        await insertSubscription(db, subscription);
        setSubscriptions((current) => [subscription, ...current]);
    }, [db]);

    const updateSubscription = useCallback(async (subscription: Subscription) => {
        await saveSubscription(db, subscription);
        setSubscriptions((current) =>
            current.map((item) => (item.id === subscription.id ? subscription : item)));
    }, [db]);

    const removeSubscription = useCallback(async (id: string) => {
        await deleteSubscription(db, id);
        setSubscriptions((current) => current.filter((item) => item.id !== id));
    }, [db]);

    const value = useMemo(
        () => ({subscriptions, isLoading, addSubscription, updateSubscription, removeSubscription}),
        [subscriptions, isLoading, addSubscription, updateSubscription, removeSubscription],
    );

    return (
        <SubscriptionsContext.Provider value={value}>
            {children}
        </SubscriptionsContext.Provider>
    );
};

export const useSubscriptions = () => {
    const context = useContext(SubscriptionsContext);
    if (!context) {
        throw new Error('useSubscriptions must be used within a SubscriptionsProvider');
    }
    return context;
};
