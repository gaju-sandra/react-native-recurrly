import React, {useState} from 'react';
import {
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
import {icons} from "@/constants/icons";
import {colors} from "@/constants/theme";
import {posthog} from "@/lib/posthog";

const FREQUENCIES: SubscriptionFrequency[] = ['Monthly', 'Yearly'];

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

const CreateSubscriptionModal = ({visible, onClose, onCreate}: CreateSubscriptionModalProps) => {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [frequency, setFrequency] = useState<SubscriptionFrequency>('Monthly');
    const [category, setCategory] = useState<SubscriptionCategory>('Entertainment');

    const parsedPrice = parsePrice(price);
    const isValid = name.trim().length > 0 && price.trim().length > 0
        && Number.isFinite(parsedPrice) && parsedPrice > 0;

    const resetForm = () => {
        setName('');
        setPrice('');
        setFrequency('Monthly');
        setCategory('Entertainment');
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSubmit = () => {
        if (!isValid) return;

        const startDate = dayjs();
        const renewalDate = startDate.add(1, frequency === 'Monthly' ? 'month' : 'year');

        posthog?.capture('subscription_created', {
            subscription_name: name.trim(),
            price: parsedPrice,
            frequency,
            category,
        });

        onCreate({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            name: name.trim(),
            price: parsedPrice,
            frequency,
            category,
            status: 'active',
            startDate: startDate.toISOString(),
            renewalDate: renewalDate.toISOString(),
            icon: icons.wallet,
            billing: frequency,
            color: CATEGORY_COLORS[category],
        });

        handleClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View className="modal-overlay">
                    <Pressable className="flex-1" onPress={handleClose} accessibilityLabel="Close"/>

                    <View className="modal-container">
                        <View className="modal-header">
                            <Text className="modal-title">New Subscription</Text>
                            <Pressable className="modal-close" onPress={handleClose} hitSlop={8}
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
                                className={clsx('auth-button', !isValid && 'auth-button-disabled')}
                                onPress={handleSubmit}
                                disabled={!isValid}
                            >
                                <Text className="auth-button-text">Add Subscription</Text>
                            </Pressable>
                        </ScrollView>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

export default CreateSubscriptionModal;
