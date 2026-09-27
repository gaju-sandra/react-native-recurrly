## Plan: Clerk Auth Integration for Expo Router

We will set up Clerk using the CLI in your existing Expo Router project (detected via `expo` and `expo-router` in [package.json](package.json), with npm from [package-lock.json](package-lock.json)). The flow is: show your required pre-checklist, install/update CLI, authenticate with Clerk, initialize against your fixed Clerk app ID, then wire visible auth controls into existing routes and layouts so sign-in, sign-up, and signed-in state are obvious in-app.

### Steps
1. Present your exact pre-setup checklist prompt and wait for confirmation to proceed.
2. Check `clerk` availability/version, then install or update using npm in this repo context.
3. Run `clerk auth login` immediately after install/update, then continue after browser auth completes.
4. Initialize this non-empty project with `clerk init --app app_3JoL2OQMTZg1XnMn6jcPigpgFXp` using detected npm setup.
5. If `clerk init` is partial for Expo, complete remaining integration from Expo quickstart and align with `RootLayout` in [app/_layout.tsx](app/_layout.tsx).
6. Add clear auth UX in [app/(auth)/sign-in.tsx](app/(auth)/sign-in.tsx), [app/(auth)/sign-up.tsx](app/(auth)/sign-up.tsx), and likely [app/(tabs)/settings.tsx](app/(tabs)/settings.tsx), then run `clerk doctor`.

### Further Considerations
1. Auth control placement preference: Option A nav-level in `RootLayout`; Option B `Settings` tab; Option C both.
2. Since this is Expo (not Next.js), proxy matcher checks (`middleware.ts`/`proxy.ts`) are expected to be not applicable.
3. If `clerk init` requests manual env setup, we should add placeholders without exposing or printing secret values.

