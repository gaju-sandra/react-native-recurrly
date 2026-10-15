import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import {useSQLiteContext} from "expo-sqlite";
import * as Crypto from "expo-crypto";
import {
    deletePayment,
    deleteSubscription,
    getAllPayments,
    getAllSubscriptions,
    insertPayment,
    insertSubscription,
    updateSubscription as saveSubscription,
} from "@/lib/db";

interface SubscriptionsContextValue {
    subscriptions: Subscription[];
    isLoading: boolean;
    addSubscription: (subscription: Subscription) => Promise<void>;
    updateSubscription: (subscription: Subscription) => Promise<void>;
    removeSubscription: (id: string) => Promise<void>;
    // Renewals marked as paid, newest due date first.
    payments: Payment[];
    recordPayment: (subscription: Subscription, dueDate: string) => Promise<void>;
    undoPayment: (id: string) => Promise<void>;
}

const SubscriptionsContext = createContext<SubscriptionsContextValue | null>(null);

// Screens read from React state (fast); every change is written to SQLite first,
// so the state never shows something that failed to save.
export const SubscriptionsProvider = ({children}: {children: React.ReactNode}) => {
    const db = useSQLiteContext();
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        Promise.all([getAllSubscriptions(db), getAllPayments(db)])
            .then(([storedSubscriptions, storedPayments]) => {
                setSubscriptions(storedSubscriptions);
                setPayments(storedPayments);
            })
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
        setPayments((current) => current.filter((payment) => payment.subscriptionId !== id));
    }, [db]);

    const recordPayment = useCallback(async (subscription: Subscription, dueDate: string) => {
        const payment: Payment = {
            id: Crypto.randomUUID(),
            subscriptionId: subscription.id,
            dueDate,
            amount: subscription.price,
            currency: subscription.currency ?? 'USD',
            paidAt: new Date().toISOString(),
        };
        await insertPayment(db, payment);
        setPayments((current) =>
            [payment, ...current].sort((a, b) => b.dueDate.localeCompare(a.dueDate)));
    }, [db]);

    const undoPayment = useCallback(async (id: string) => {
        await deletePayment(db, id);
        setPayments((current) => current.filter((payment) => payment.id !== id));
    }, [db]);

    const value = useMemo(
        () => ({
            subscriptions, isLoading, addSubscription, updateSubscription, removeSubscription,
            payments, recordPayment, undoPayment,
        }),
        [subscriptions, isLoading, addSubscription, updateSubscription, removeSubscription,
            payments, recordPayment, undoPayment],
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
