import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '../components/Text';
import AuthLayout from '../components/AuthLayout';
import { Button, Field, ErrorText } from '../components/ui';
import { authService } from '../api/services';
import { useAuth } from '../store/auth';
import { colors, radius } from '../theme';

const GENDERS = ['male', 'female', 'other'];

export default function SignupScreen({ route, navigation }) {
  const { phone, referralCode: refFromRoute } = route.params;
  const signIn = useAuth((s) => s.signIn);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('');
  const [referralCode, setReferralCode] = useState(refFromRoute || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!name.trim() || loading) return;
    setLoading(true);
    setError('');
    try {
      const response = await authService.signup({
        name: name.trim(),
        phone,
        email: email.trim(),
        gender,
        profileImage: '',
        referralCode: referralCode.trim().toUpperCase(),
      });
      const payload = response?.data || {};
      await signIn(payload.token, payload.user);
    } catch (e) {
      const msg = e?.message || 'Signup failed. Please try again.';
      if (/OTP session|Verify OTP before signup/i.test(msg)) {
        setError('Your verification expired. Please request a fresh OTP.');
        setTimeout(() => navigation.popToTop(), 1200);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create your profile" subtitle={`+91 ${phone} verified`} onBack={() => navigation.goBack()}>

          <Field label="Full name" value={name} onChangeText={setName} placeholder="Your name" />
          <Field
            label="Email (optional)"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={{ fontSize: 12, fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>
            Gender
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            {GENDERS.map((g) => (
              <Pressable
                key={g}
                onPress={() => setGender(g)}
                style={{
                  flex: 1, height: 46, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center',
                  borderWidth: 1, borderColor: gender === g ? colors.ink : colors.border,
                  backgroundColor: gender === g ? colors.ink : colors.surface,
                }}
              >
                <Text style={{ color: gender === g ? '#fff' : colors.text, fontWeight: '700', textTransform: 'capitalize' }}>
                  {g}
                </Text>
              </Pressable>
            ))}
          </View>

          <Field
            label="Referral code (optional)"
            value={referralCode}
            onChangeText={setReferralCode}
            autoCapitalize="characters"
            placeholder="CODE"
          />
          <ErrorText>{error}</ErrorText>
          <Button title="Create account" onPress={submit} disabled={!name.trim()} loading={loading} variant="primary" />
    </AuthLayout>
  );
}
