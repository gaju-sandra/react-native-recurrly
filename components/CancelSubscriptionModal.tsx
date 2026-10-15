import {
    Modal,
    Pressable,
    Text,
    View,
} from 'react-native';
import {STORE_SUBSCRIPTIONS} from "@/lib/catalog";

// Recurly can't cancel for the user, so this only offers the ways to do it:
// the provider's page, the app store (for subscriptions bought there), or marking it done.
const CancelSubscriptionModal = ({
    visible,
    onClose,
    serviceName,
    cancelLabel,
    onOpenCancelPage,
    onOpenStorePage,
    onMarkCancelled,
}: CancelSubscriptionModalProps) => {
    // Close first, then act, so the modal isn't left open behind the browser or an Alert.
    const closeThen = (action: () => void) => () => {
        onClose();
        action();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View className="modal-overlay">
                <Pressable className="flex-1" onPress={onClose} accessibilityLabel="Close"/>

                <View className="modal-container">
                    <View className="modal-header">
                        <Text className="modal-title">Cancel {serviceName}</Text>
                        <Pressable className="modal-close" onPress={onClose} hitSlop={8}
                                   accessibilityLabel="Close">
                            <Text className="modal-close-text">✕</Text>
                        </Pressable>
                    </View>

                    <View className="modal-body gap-3">
                        <Pressable className="detail-button" onPress={closeThen(onOpenCancelPage)}>
                            <Text className="auth-button-text">{cancelLabel}</Text>
                        </Pressable>

                        <Pressable className="detail-button-secondary" onPress={closeThen(onOpenStorePage)}>
                            <Text className="detail-button-secondary-text">
                                Subscribed through {STORE_SUBSCRIPTIONS.label}?
                            </Text>
                        </Pressable>

                        <Pressable className="detail-link" onPress={closeThen(onMarkCancelled)} hitSlop={8}>
                            <Text className="auth-link">Already cancelled? Mark as cancelled</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default CancelSubscriptionModal;
