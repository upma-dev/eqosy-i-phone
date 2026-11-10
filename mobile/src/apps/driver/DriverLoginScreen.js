import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Car } from 'lucide-react-native';
import { Text } from '../../components/Text';
import { driverApi, pick } from './api';
import { useAuth } from '../../store/auth';

// Port of web Taxi/modules/driver/pages/registration PhoneRegistration (login mode) + OTPVerification.
// New-driver registration steps (personal / vehicle / documents) come in the next phase.
const BLUE = '#3B6BF0';
const RESEND = 30;

export default function DriverLoginScreen() {
  const signIn = useAuth((s) => s.signIn);
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [left, setLeft] = useState(0);

  useEffect(() => {
    if (left <= 0) return undefined;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  const clean = phone.replace(/\D/g, '').slice(-10);

  const send = async () => {
    if (clean.length !== 10) return setError('Enter a valid 10-digit mobile number');
    setBusy(true);
    setError('');
    try {
      await driverApi.sendLoginOtp(clean);
      setStep(2);
      setLeft(RESEND);
    } catch (e) {
      setError(e?.message || 'Could not send OTP. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    if (otp.length !== 4) return setError('Enter the 4-digit OTP');
    setBusy(true);
    setError('');
    try {
      const payload = pick(await driverApi.verifyLoginOtp(clean, otp));
      if (!payload?.token) throw new Error('Login failed. Please try again.');
      await signIn(payload.token, payload.driver || {});
    } catch (e) {
      setError(e?.message || 'Invalid OTP. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <LinearGradient colors={['#040920', '#0A1A57', '#14308A']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }} keyboardShouldPersistTaps="handled">
            <View style={{ alignItems: 'center', marginBottom: 28 }}>
              <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center' }}>
                <Car size={30} color="#fff" />
              </View>
              <Text style={{ color: '#fff', fontSize: 26, fontWeight: '800', marginTop: 14 }}>Eqosy Driver</Text>
              <Text style={{ color: '#C7D2FE', marginTop: 4 }}>{step === 1 ? 'Log in to start earning' : `Enter the OTP sent to +91 ${clean}`}</Text>
            </View>

            <View style={{ backgroundColor: '#fff', borderRadius: 24, padding: 20, gap: 14 }}>
              {step === 1 ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E4E8F4', borderRadius: 14, paddingHorizontal: 14 }}>
                  <Text style={{ fontWeight: '700', color: '#0C1336', marginRight: 8 }}>+91</Text>
                  <TextInput
                    value={phone}
                    onChangeText={(t) => { setPhone(t.replace(/\D/g, '').slice(0, 10)); setError(''); }}
                    keyboardType="number-pad"
                    placeholder="Mobile number"
                    placeholderTextColor="#AEB5CE"
                    maxLength={10}
                    style={{ flex: 1, paddingVertical: 14, fontSize: 16, color: '#0C1336' }}
                  />
                </View>
              ) : (
                <TextInput
                  value={otp}
                  onChangeText={(t) => { setOtp(t.replace(/\D/g, '').slice(0, 4)); setError(''); }}
                  keyboardType="number-pad"
                  placeholder="----"
                  placeholderTextColor="#AEB5CE"
                  maxLength={4}
                  autoFocus
                  style={{ borderWidth: 1, borderColor: '#E4E8F4', borderRadius: 14, paddingVertical: 14, fontSize: 26, letterSpacing: 18, textAlign: 'center', color: '#0C1336' }}
                />
              )}

              {error ? <Text style={{ color: '#DC2626', fontSize: 13 }}>{error}</Text> : null}

              <Pressable
                disabled={busy}
                onPress={step === 1 ? send : verify}
                style={{ backgroundColor: BLUE, borderRadius: 14, paddingVertical: 15, alignItems: 'center', opacity: busy ? 0.7 : 1 }}
              >
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>{step === 1 ? 'Send OTP' : 'Verify & Login'}</Text>}
              </Pressable>

              {step === 2 ? (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Pressable onPress={() => { setStep(1); setOtp(''); setError(''); }}><Text style={{ color: BLUE, fontWeight: '600' }}>Change number</Text></Pressable>
                  <Pressable disabled={left > 0 || busy} onPress={send}>
                    <Text style={{ color: left > 0 ? '#9CA3AF' : BLUE, fontWeight: '600' }}>{left > 0 ? `Resend in ${left}s` : 'Resend OTP'}</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}
