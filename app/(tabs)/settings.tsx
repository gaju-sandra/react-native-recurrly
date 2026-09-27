import { useAuth, useUser } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';
import { styled } from 'nativewind';
import { useState } from 'react';
import images from '@/constants/image';
import { colors } from '@/constants/theme';

const SafeAreaView = styled(RNSafeAreaView);

export default function Settings() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'User';
  const email = user?.emailAddresses?.[0]?.emailAddress ?? '';

  const onSignOut = async () => {
    try {
      setSigningOut(true);
      await signOut();
      router.replace('/(auth)/sign-in');
    } catch (e) {
      setSigningOut(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background p-5">

      {/* Header */}
      <Text className="list-title mb-6">Settings</Text>

      {/* User card */}
      <View className="auth-card mb-6" style={{ marginTop: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <Image source={images.avatar} style={{ width: 56, height: 56, borderRadius: 28 }} />
          <View style={{ flex: 1 }}>
            <Text className="sub-title">{displayName}</Text>
            <Text className="sub-meta">{email}</Text>
          </View>
        </View>
      </View>

      {/* Sign out */}
      <TouchableOpacity
        onPress={onSignOut}
        disabled={signingOut}
        activeOpacity={0.8}
        style={{
          backgroundColor: signingOut ? colors.destructive + '70' : colors.destructive,
          borderRadius: 16,
          paddingVertical: 16,
          alignItems: 'center',
        }}
      >
        {signingOut
          ? <ActivityIndicator color="#fff" />
          : <Text style={{ color: '#fff', fontFamily: 'sans-bold', fontSize: 16 }}>Sign Out</Text>
        }
      </TouchableOpacity>

    </SafeAreaView>
  );
}
