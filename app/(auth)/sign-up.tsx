import { useSignUp } from '@clerk/expo/legacy';
import { Link, useRouter } from 'expo-router';
import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, ScrollView, Platform,
  ActivityIndicator, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/constants/theme';

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
  title:       { fontSize: 26, fontFamily: 'sans-bold', color: colors.primary, marginBottom: 6, textAlign: 'center' },
  subtitle:    { fontSize: 14, fontFamily: 'sans-medium', color: colors.mutedForeground, textAlign: 'center', maxWidth: 260, alignSelf: 'center' },
  card:        { marginTop: 24, backgroundColor: colors.card, borderRadius: 24, borderWidth: 1, borderColor: colors.border, padding: 20, gap: 14 },
  errorBox:    { backgroundColor: '#fde8e8', borderRadius: 12, padding: 12 },
  errorText:   { color: colors.destructive, fontSize: 13, fontFamily: 'sans-medium', textAlign: 'center' },
  field:       { gap: 6 },
  label:       { fontSize: 13, fontFamily: 'sans-semibold', color: colors.primary },
  input:       { borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, fontFamily: 'sans-medium', color: colors.primary, backgroundColor: colors.background },
  codeInput:   { textAlign: 'center', letterSpacing: 8, fontSize: 20 },
  strengthRow: { flexDirection: 'row', gap: 4, marginTop: 6 },
  strengthBar:  { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.border },
  strengthHint: { fontSize: 11, fontFamily: 'sans-medium', marginTop: 4 },
  btn:         { backgroundColor: colors.accent, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  btnOff:      { opacity: 0.5 },
  btnText:     { fontSize: 16, fontFamily: 'sans-bold', color: colors.primary },
  btnSecondary:{ borderRadius: 14, borderWidth: 1, borderColor: colors.accent + '60', backgroundColor: colors.accent + '15', paddingVertical: 13, alignItems: 'center' },
  btnSecText:  { fontSize: 14, fontFamily: 'sans-semibold', color: colors.accent },
  footer:      { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  footerText:  { fontSize: 14, fontFamily: 'sans-medium', color: colors.mutedForeground },
  footerLink:  { fontSize: 14, fontFamily: 'sans-bold', color: colors.accent },
});

function Brand() {
  return (
    <View style={s.brand}>
      <View style={s.logoRow}>
        <View style={s.logoBox}><Text style={s.logoLetter}>R</Text></View>
        <View>
          <Text style={s.wordmark}>Recurlly</Text>
          <Text style={s.wordmarkSub}>SUBSCRIPTION TRACKER</Text>
        </View>
      </View>
    </View>
  );
}

export default function SignUp() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  // password strength: 0-4
  const getStrength = (p: string) => {
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  };
  const strength = getStrength(password);
  const strengthColor = ['#e5e7eb', colors.destructive, '#f59e0b', '#3b82f6', colors.success][strength];
  const strengthLabel = ['', 'Too short', 'Weak', 'Good', 'Strong'][strength];

  const onSignUp = async () => {
    if (!isLoaded) return;
    setError('');
    if (!name.trim()) { setError('Full name is required.'); return; }
    if (!email.trim()) { setError('Email is required.'); return; }
    if (!password || password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      const nameParts = name.trim().split(' ');
      await signUp.create({
        emailAddress: email.trim(),
        password,
        firstName: nameParts[0],
        lastName: nameParts.slice(1).join(' ') || undefined,
      });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage ?? err?.errors?.[0]?.message ?? 'Sign up failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const onVerify = async () => {
    if (!isLoaded || loading) return;
    setError('');
    if (!code.trim()) { setError('Please enter the verification code.'); return; }
    setLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code: code.trim() });
      console.log('verify status:', result.status, 'sessionId:', result.createdSessionId);
      if (result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        router.replace('/(tabs)');
      } else {
        setError(`Unexpected status: ${result.status}. Please try again.`);
      }
    } catch (err: any) {
      console.log('verify error:', JSON.stringify(err?.errors));
      const msg = err?.errors?.[0]?.longMessage ?? err?.errors?.[0]?.message ?? 'Verification failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (pendingVerification) {
    return (
      <SafeAreaView style={s.safe}>
        <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView style={s.flex} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Brand />
            <Text style={s.title}>Check your inbox</Text>
            <Text style={s.subtitle}>
              We sent a 6-digit code to{'\n'}
              <Text style={{ color: colors.accent }}>{email}</Text>
            </Text>

            <View style={s.card}>
              {error ? <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View> : null}

              <View style={s.field}>
                <Text style={s.label}>Verification code</Text>
                <TextInput
                  style={[s.input, s.codeInput]}
                  placeholder="• • • • • •"
                  placeholderTextColor={colors.mutedForeground}
                  value={code}
                  onChangeText={(v) => { setCode(v); setError(''); }}
                  keyboardType="number-pad"
                  maxLength={6}
                  returnKeyType="done"
                  onSubmitEditing={onVerify}
                />
              </View>

              <TouchableOpacity style={[s.btn, loading && s.btnOff]} onPress={onVerify} disabled={loading} activeOpacity={0.75}>
                {loading ? <ActivityIndicator color={colors.primary} /> : <Text style={s.btnText}>Verify Email</Text>}
              </TouchableOpacity>

              <TouchableOpacity
                style={s.btnSecondary}
                onPress={async () => {
                  try { await signUp.prepareEmailAddressVerification({ strategy: 'email_code' }); }
                  catch (e) { /* verification already exists, ignore */ }
                }}
                activeOpacity={0.7}
              >
                <Text style={s.btnSecText}>Resend code</Text>
              </TouchableOpacity>
            </View>

            <View style={s.footer}>
              <Text style={s.footerText}>Wrong email? </Text>
              <TouchableOpacity onPress={() => { setPendingVerification(false); setError(''); }}>
                <Text style={s.footerLink}>Go back</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={s.flex} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Brand />
          <Text style={s.title}>Create your account</Text>
          <Text style={s.subtitle}>Start tracking your subscriptions in one place</Text>

          <View style={s.card}>
            {error ? <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View> : null}

            <View style={s.field}>
              <Text style={s.label}>Full name</Text>
              <TextInput
                style={s.input}
                placeholder="Jane Smith"
                placeholderTextColor={colors.mutedForeground}
                value={name}
                onChangeText={(v) => { setName(v); setError(''); }}
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
              />
            </View>

            <View style={s.field}>
              <Text style={s.label}>Email address</Text>
              <TextInput
                ref={emailRef}
                style={s.input}
                placeholder="you@example.com"
                placeholderTextColor={colors.mutedForeground}
                value={email}
                onChangeText={(v) => { setEmail(v); setError(''); }}
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
            </View>

            <View style={s.field}>
              <Text style={s.label}>Password</Text>
              <TextInput
                ref={passwordRef}
                style={s.input}
                placeholder="Min. 8 characters"
                placeholderTextColor={colors.mutedForeground}
                value={password}
                onChangeText={(v) => { setPassword(v); setError(''); }}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={onSignUp}
              />
              {password.length > 0 && (
                <>
                  <View style={s.strengthRow}>
                    {[1,2,3,4].map(i => (
                      <View key={i} style={[s.strengthBar, { backgroundColor: i <= strength ? strengthColor : colors.border }]} />
                    ))}
                  </View>
                  <Text style={[s.strengthHint, { color: strengthColor }]}>{strengthLabel}</Text>
                </>
              )}
            </View>

            <TouchableOpacity style={[s.btn, loading && s.btnOff]} onPress={onSignUp} disabled={loading} activeOpacity={0.75}>
              {loading ? <ActivityIndicator color={colors.primary} /> : <Text style={s.btnText}>Create Account</Text>}
            </TouchableOpacity>
          </View>

          <View style={s.footer}>
            <Text style={s.footerText}>Already have an account? </Text>
            <Link href="/(auth)/sign-in" asChild>
              <TouchableOpacity><Text style={s.footerLink}>Sign In</Text></TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
