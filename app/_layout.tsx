import { ClerkProvider, useAuth, useUser } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { Stack, useRouter, useSegments } from "expo-router";
import { SplashScreen } from "expo-router";
import '@/global.css';
import { useFonts } from "expo-font";
import { useEffect, useRef } from "react";
import { PostHogProvider } from 'posthog-react-native';
import { posthog } from '@/lib/posthog';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";

if (!publishableKey) {
  throw new Error("Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in .env");
}

SplashScreen.preventAutoHideAsync();

function AuthGuard() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const segments = useSegments();
  const router = useRouter();
  const identifiedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!isSignedIn && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
    } else if (isSignedIn && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isSignedIn, isLoaded, segments]);

  useEffect(() => {
    if (!isLoaded || !isUserLoaded) return;

    if (!isSignedIn) {
      identifiedUserId.current = null;
      return;
    }

    if (!user?.id || identifiedUserId.current === user.id) return;

    posthog?.identify(user.id, {
      $set: {
        ...(user.primaryEmailAddress?.emailAddress && {
          email: user.primaryEmailAddress.emailAddress,
        }),
        ...(user.firstName && { first_name: user.firstName }),
        ...(user.lastName && { last_name: user.lastName }),
      },
    });
    identifiedUserId.current = user.id;
  }, [isLoaded, isSignedIn, isUserLoaded, user]);

  return null;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'sans-regular': require('../assets/fonts/PlusJakartaSans-Regular.ttf'),
    'sans-bold': require('../assets/fonts/PlusJakartaSans-Bold.ttf'),
    'sans-medium': require('../assets/fonts/PlusJakartaSans-Medium.ttf'),
    'sans-semibold': require('../assets/fonts/PlusJakartaSans-SemiBold.ttf'),
    'sans-light': require('../assets/fonts/PlusJakartaSans-Light.ttf'),
    'sans-extrabold': require('../assets/fonts/PlusJakartaSans-ExtraBold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  const app = (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <AuthGuard />
      <Stack screenOptions={{ headerShown: false }} />
    </ClerkProvider>
  );

  return posthog ? <PostHogProvider client={posthog}>{app}</PostHogProvider> : app;
}