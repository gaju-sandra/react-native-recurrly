import React, {useEffect, useState} from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from 'react-native';
import clsx from "clsx";
import dayjs from "dayjs";
import * as Crypto from "expo-crypto";
import {colors} from "@/constants/theme";
import {posthog} from "@/lib/posthog";

const FREQUENCIES: SubscriptionFrequency[] = ['Weekly', 'Monthly', 'Quarterly', 'Yearly'];

const CATEGORIES = [
    'Entertainment',
    'AI Tools',
    'Developer Tools',
    'Design',
    'Productivity',
    'Cloud',
    'Music',
    'Other',
] as const;

type SubscriptionCategory = typeof CATEGORIES[number];

const CATEGORY_COLORS: Record<SubscriptionCategory, string> = {
    'Entertainment': '#f8c8c8',
    'AI Tools': '#b8d4e3',
    'Developer Tools': '#e8def8',
    'Design': '#f5c542',
    'Productivity': '#c8e6c9',
    'Cloud': '#cfe3f7',
    'Music': '#b8e8d0',
    'Other': '#f6eecf',
};

const parsePrice = (value: string) => Number(value.replace(',', '.').trim());

const toCategory = (value?: string): SubscriptionCategory =>
    CATEGORIES.find((option) => option === value) ?? 'Other';

// One form for both creating and editing: pass `initialValue` to edit.
const CreateSubscriptionModal = ({visible, onClose, onSubmit, initialValue}: CreateSubscriptionModalProps) => {
    const isEditing = Boolean(initialValue);
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [frequency, setFrequency] = useState<SubscriptionFrequency>('Monthly');
    const [category, setCategory] = useState<SubscriptionCategory>('Entertainment');
    const [isSaving, setIsSaving] = useState(false);

    // Fill the form each time it opens: with the subscription being edited, or empty.
    useEffect(() => {
        if (!visible) return;
        setName(initialValue?.name ?? '');
        setPrice(initialValue ? String(initialValue.price) : '');
        setFrequency(initialValue?.frequency ?? 'Monthly');
        setCategory(initialValue ? toCategory(initialValue.category) : 'Entertainment');
    }, [visible, initialValue]);

    const parsedPrice = parsePrice(price);
    const isValid = name.trim().length > 0 && price.trim().length > 0
        && Number.isFinite(parsedPrice) && parsedPrice > 0;

    const handleSubmit = async () => {
        if (!isValid || isSaving) return;

        const fields = {
            name: name.trim(),
            price: parsedPrice,
            frequency,
            category,
            color: CATEGORY_COLORS[category],
        };

        // Editing keeps id, status, startDate, etc. and only replaces the form fields.
        const subscription: Subscription = initialValue
            ? {...initialValue, ...fields}
            : {...fields, id: Crypto.randomUUID(), status: 'active', startDate: dayjs().toISOString()};

        try {
            setIsSaving(true);
            await onSubmit(subscription);
            posthog?.capture(isEditing ? 'subscription_updated' : 'subscription_created', {
                subscription_name: fields.name,
                price: fields.price,
                frequency,
                category,
            });
            onClose();
        } catch {
            Alert.alert('Could not save', 'Something went wrong saving this subscription. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View className="modal-overlay">
                    <Pressable className="flex-1" onPress={onClose} accessibilityLabel="Close"/>

                    <View className="modal-container">
                        <View className="modal-header">
                            <Text className="modal-title">{isEditing ? 'Edit Subscription' : 'New Subscription'}</Text>
                            <Pressable className="modal-close" onPress={onClose} hitSlop={8}
                                       accessibilityLabel="Close">
                                <Text className="modal-close-text">✕</Text>
                            </Pressable>
                        </View>

                        <ScrollView
                            contentContainerClassName="modal-body"
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                        >
                            <View className="auth-field">
                                <Text className="auth-label">Name</Text>
                                <TextInput
                                    className="auth-input"
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="e.g. Netflix"
                                    placeholderTextColor={colors.mutedForeground}
                                    returnKeyType="next"
                                />
                            </View>

                            <View className="auth-field">
                                <Text className="auth-label">Price</Text>
                                <TextInput
                                    className="auth-input"
                                    value={price}
                                    onChangeText={setPrice}
                                    placeholder="0.00"
                                    placeholderTextColor={colors.mutedForeground}
                                    keyboardType="decimal-pad"
                                />
                            </View>

                            <View className="auth-field">
                                <Text className="auth-label">Frequency</Text>
                                <View className="picker-row">
                                    {FREQUENCIES.map((option) => {
                                        const active = frequency === option;
                                        return (
                                            <Pressable
                                                key={option}
                                                className={clsx('picker-option', active && 'picker-option-active')}
                                                onPress={() => setFrequency(option)}
                                            >
                                                <Text className={clsx('picker-option-text',
                                                    active && 'picker-option-text-active')}>
                                                    {option}
                                                </Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            </View>

                            <View className="auth-field">
                                <Text className="auth-label">Category</Text>
                                <View className="category-scroll">
                                    {CATEGORIES.map((option) => {
                                        const active = category === option;
                                        return (
                                            <Pressable
                                                key={option}
                                                className={clsx('category-chip', active && 'category-chip-active')}
                                                onPress={() => setCategory(option)}
                                            >
                                                <Text className={clsx('category-chip-text',
                                                    active && 'category-chip-text-active')}>
                                                    {option}
                                                </Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            </View>

                            <Pressable
                                className={clsx('auth-button', (!isValid || isSaving) && 'auth-button-disabled')}
                                onPress={handleSubmit}
                                disabled={!isValid || isSaving}
                            >
                                <Text className="auth-button-text">
                                    {isEditing ? 'Save Changes' : 'Add Subscription'}
                                </Text>
                            </Pressable>
                        </ScrollView>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

export default CreateSubscriptionModal;
