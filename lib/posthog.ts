import Constants from 'expo-constants'
import PostHog from 'posthog-react-native'

const extra = Constants.expoConfig?.extra
const projectToken = extra?.posthogProjectToken as string | undefined
const host = extra?.posthogHost as string | undefined

// Analytics is optional: without config, `posthog` is null and every call site no-ops via `posthog?.`.
if (__DEV__ && (!projectToken || !host)) {
  console.warn(
    'PostHog is disabled: set EXPO_PUBLIC_POSTHOG_PROJECT_TOKEN and EXPO_PUBLIC_POSTHOG_HOST in .env, then restart with `npx expo start -c`.',
  )
}

export const posthog =
  projectToken && host
    ? new PostHog(projectToken, {
        host,
        captureAppLifecycleEvents: true,
        // Send each event right away in dev so it shows up in PostHog Activity immediately.
        ...(__DEV__ && {flushAt: 1}),
        errorTracking: {
          autocapture: {
            uncaughtExceptions: true,
            unhandledRejections: true,
          },
        },
      })
    : null
