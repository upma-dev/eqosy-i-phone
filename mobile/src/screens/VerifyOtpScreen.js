import React, { useEffect, useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Text } from '../components/Text';
import AuthLayout from '../components/AuthLayout';
import { Button, ErrorText } from '../components/ui';
import { authService, unwrap } from '../api/services';
import { useAuth } from '../store/auth';
import { colors, radius } from '../theme';

const OTP_LENGTH = 4;
const RESEND_SECONDS = 30;

export default function VerifyOtpScreen({ route, navigation }) {
  const { phone, referralCode } = route.params;
  const signIn = useAuth((s) => s.signIn);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const inputRef = useRef(null);

  useEffect(() => {
    if (seconds <= 0) return undefined;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const verify = async (code) => {
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      const response = await authService.verifyOtp(phone, code);
      const payload = unwrap(response);
      if (payload.exists) {
        // Existing user: saving the session makes the navigator switch to the app.
        await signIn(payload.token, payload.user);
        return;
      }
      navigation.replace('Signup', { phone, referralCode });
    } catch (e) {
      setError(e?.message || 'The OTP you entered is incorrect. Please try again.');
      setOtp('');
      inputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  const onChange = (t) => {
    const clean = t.replace(/\D/g, '').slice(0, OTP_LENGTH);
    setOtp(clean);
    if (clean.length === OTP_LENGTH) verify(clean);
  };

  const resend = async () => {
    if (seconds > 0) return;
    try {
      await authService.startOtp(phone);
      setSeconds(RESEND_SECONDS);
      setError('');
    } catch (e) {
      setError(e?.message || 'Could not resend OTP.');
    }
  };

  return (
    <AuthLayout
      title="Verify OTP"
      subtitle={`We sent a ${OTP_LENGTH}-digit code to +91 ${phone}`}
      onBack={() => navigation.goBack()}
    >

        <Pressable
          onPress={() => inputRef.current?.focus()}
          style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}
        >
          {Array.from({ length: OTP_LENGTH }).map((_, i) => (
            <View
              key={i}
              style={{
                width: 60, height: 60, borderRadius: radius.md, borderWidth: 2,
                borderColor: error ? colors.danger : otp.length === i ? colors.primary : colors.border,
                backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 26, fontWeight: '800', color: colors.text }}>{otp[i] || ''}</Text>
            </View>
          ))}
        </Pressable>

        <TextInput
          ref={inputRef}
          value={otp}
          onChangeText={onChange}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          maxLength={OTP_LENGTH}
          autoFocus
          style={{ position: 'absolute', opacity: 0, height: 1, width: 1 }}
        />

        <ErrorText>{error}</ErrorText>
        <Button title="Verify" onPress={() => verify(otp)} disabled={otp.length !== OTP_LENGTH} loading={loading} />
        <Pressable onPress={resend} style={{ marginTop: 20, alignItems: 'center' }}>
          <Text style={{ color: seconds > 0 ? '#9CA3AF' : colors.primary, fontWeight: '700' }}>
            {seconds > 0 ? `Resend OTP in ${seconds}s` : 'Resend OTP'}
          </Text>
        </Pressable>
    </AuthLayout>
  );
}
