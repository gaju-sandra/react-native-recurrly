import { useSignIn } from '@clerk/expo/legacy';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, ScrollView, Platform,
  ActivityIndicator, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/constants/theme';
import { posthog } from '@/lib/posthog';

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: colors.background },
  flex:        { flex: 1 },
  scroll:      { flexGrow: 1, paddingHorizontal: 20, paddingTop: 40, paddingBottom: 40 },
  brand:       { alignItems: 'center', marginBottom: 8 },
  logoRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  logoBox:     { width: 56, height: 56, borderRadius: 16, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  logoLetter:  { fontSize: 26, fontFamily: 'sans-extrabold', color: '#fff' },
  wordmark:    { fontSize: 26, fontFamily: 'sans-extrabold', color: colors.primary },
  wordmarkSub: { fontSize: 10, fontFamily: 'sans-semibold', color: colors.mutedForeground, letterSpacing: 1 },
  title:       { fontSize: 26, fontFamily: 'sans-bold', color: colors.primary, marginBottom: 6 },
  subtitle:    { fontSize: 14, fontFamily: 'sans-medium', color: colors.mutedForeground, textAlign: 'center', maxWidth: 260 },
  card:        { marginTop: 24, backgroundColor: colors.card, borderRadius: 24, borderWidth: 1, borderColor: colors.border, padding: 20, gap: 14 },
  errorBox:    { backgroundColor: '#fde8e8', borderRadius: 12, padding: 12 },
  errorText:   { color: colors.destructive, fontSize: 13, fontFamily: 'sans-medium', textAlign: 'center' },
  field:       { gap: 6 },
  label:       { fontSize: 13, fontFamily: 'sans-semibold', color: colors.primary },
  input:       { borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, fontFamily: 'sans-medium', color: colors.primary, backgroundColor: colors.background },
  btn:         { backgroundColor: colors.accent, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  btnOff:      { opacity: 0.5 },
  btnText:     { fontSize: 16, fontFamily: 'sans-bold', color: colors.primary },
  footer:      { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  footerText:  { fontSize: 14, fontFamily: 'sans-medium', color: colors.mutedForeground },
  footerLink:  { fontSize: 14, fontFamily: 'sans-bold', color: colors.accent },
});

export default function SignIn() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSignIn = async () => {
    if (!isLoaded) return;
    setError('');
    if (!email.trim()) { setError('Email is required.'); return; }
    if (!password) { setError('Password is required.'); return; }
    setLoading(true);
    try {
      const result = await signIn.create({ identifier: email.trim(), password });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        posthog?.capture('user_signed_in');
        router.replace('/(tabs)');
      } else {
        setError('Sign in incomplete. Please try again.');
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage ?? err?.errors?.[0]?.message ?? 'Sign in failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={s.flex} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <View style={s.brand}>
            <View style={s.logoRow}>
              <View style={s.logoBox}><Text style={s.logoLetter}>R</Text></View>
              <View>
                <Text style={s.wordmark}>Recurlly</Text>
                <Text style={s.wordmarkSub}>SUBSCRIPTION TRACKER</Text>
              </View>
            </View>
            <Text style={s.title}>Welcome back</Text>
            <Text style={s.subtitle}>Sign in to manage your subscriptions</Text>
          </View>

          <View style={s.card}>
            {error ? <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View> : null}

            <View style={s.field}>
              <Text style={s.label}>Email address</Text>
              <TextInput
                style={s.input}
                placeholder="you@example.com"
                placeholderTextColor={colors.mutedForeground}
                value={email}
                onChangeText={(v) => { setEmail(v); setError(''); }}
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="next"
              />
            </View>

            <View style={s.field}>
              <Text style={s.label}>Password</Text>
              <TextInput
                style={s.input}
                placeholder="Your password"
                placeholderTextColor={colors.mutedForeground}
                value={password}
                onChangeText={(v) => { setPassword(v); setError(''); }}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={onSignIn}
              />
            </View>

            <TouchableOpacity style={[s.btn, loading && s.btnOff]} onPress={onSignIn} disabled={loading} activeOpacity={0.75}>
              {loading ? <ActivityIndicator color={colors.primary} /> : <Text style={s.btnText}>Sign In</Text>}
            </TouchableOpacity>
          </View>

          <View style={s.footer}>
            <Text style={s.footerText}>Don't have an account? </Text>
            <Link href="/(auth)/sign-up" asChild>
              <TouchableOpacity><Text style={s.footerLink}>Sign Up</Text></TouchableOpacity>
            </Link>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
