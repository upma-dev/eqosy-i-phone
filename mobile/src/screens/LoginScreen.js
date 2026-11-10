import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, Easing, Image, KeyboardAvoidingView, Linking, Modal, Platform, Pressable,
  ScrollView, StyleSheet, TextInput, View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, ArrowRight, Car, Package, ShieldCheck, ShoppingBasket, UtensilsCrossed, X } from 'lucide-react-native';
import { Text } from '../components/Text';
import { unifiedAuth, sessionFromVerify } from '../api/unifiedAuth';
import foodApi from '../api/foodClient';
import { useAuth } from '../store/auth';

// 1:1 port of web modules/auth/pages/Login.jsx (3 steps: number -> OTP -> name for new users).
const RESEND_COOLDOWN_SECONDS = 60;
const C = {
  ink: '#0C1336', muted: '#5E678A', border: '#E4E8F4', orange: '#F7931E', deepOrange: '#E85D04',
  chip: '#FFF0CF', link: '#B84A06', sheet: '#FFFDF6', placeholder: '#AEB5CE',
};
const logo = require('../../assets/brand/logo.png');

// "delivered." gradient #8BE02A -> #FFC400 -> #F7931E, done per letter (no masked view needed).
const lerp = (a, b, t) => Math.round(a + (b - a) * t);
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const gradientAt = (t) => {
  const stops = [hex('#8BE02A'), hex('#FFC400'), hex('#F7931E')];
  const seg = t < 0.5 ? 0 : 1;
  const lt = t < 0.5 ? t * 2 : (t - 0.5) * 2;
  const [a, b] = [stops[seg], stops[seg + 1]];
  return `rgb(${lerp(a[0], b[0], lt)},${lerp(a[1], b[1], lt)},${lerp(a[2], b[2], lt)})`;
};
function GradientText({ text, style }) {
  return (
    <Text style={style}>
      {text.split('').map((ch, i) => (
        <Text key={i} style={{ color: gradientAt(i / Math.max(1, text.length - 1)) }}>{ch}</Text>
      ))}
    </Text>
  );
}

const stripHtml = (html) =>
  String(html || '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<br\s*\/?>|<\/p>|<\/li>|<\/h\d>/gi, '\n')
    .replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\n{3,}/g, '\n\n').trim();

function Chip({ icon, label, children }) {
  return (
    <View style={styles.pill}>
      {icon}
      <Text style={{ fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>{label}</Text>
    </View>
  );
}

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const signIn = useAuth((s) => s.signIn);

  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [agree, setAgree] = useState(false);
  const [pending, setPending] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(0);
  const [focus, setFocus] = useState('');
  const [policy, setPolicy] = useState({ open: false, title: '', body: '', loading: false });
  const otpRefs = useRef([]);
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(slide, { toValue: 1, duration: 500, easing: Easing.bezier(0.22, 1, 0.36, 1), useNativeDriver: true }).start();
  }, [slide]);

  useEffect(() => {
    if (timer <= 0) return undefined;
    const t = setTimeout(() => setTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  const disabled =
    loading || (step === 1 && phone.length < 10) || (step === 2 && (!agree || otp.length !== 4)) ||
    (step === 3 && (!agree || name.trim().length < 2));

  const heading =
    step === 1 ? ['Welcome to Eqosy', 'Enter your mobile number to continue']
      : step === 2 ? ['Verify your number', 'Enter the 4-digit code we sent you']
        : ['One last step', 'Tell us your name to finish up'];

  const fail = (e, fallback) => setError(e?.message || fallback);

  const sendOtp = async (resend = false) => {
    if (loading || (resend && timer > 0)) return;
    setLoading(true); setError('');
    try {
      await unifiedAuth.requestOtp(phone);
      setOtp(''); setTimer(RESEND_COOLDOWN_SECONDS);
      if (!resend) setStep(2);
    } catch (e) { fail(e, resend ? 'Failed to resend OTP.' : 'Failed to send OTP.'); }
    finally { setLoading(false); }
  };

  const verify = async () => {
    if (loading) return;
    setLoading(true); setError('');
    try {
      const body = await unifiedAuth.verifyOtp({ phone, otp });
      const data = body?.data || body || {};
      if (!data.accessToken || !data.user) throw new Error('Invalid response from server');
      const hasName = data.user?.name && String(data.user.name).trim() && String(data.user.name).toLowerCase() !== 'null';
      if (data.isNewUser === true || data.needsNamePrompt === true || !hasName) {
        setPending(data); setName(''); setStep(3);
        return;
      }
      const s = sessionFromVerify(body);
      await signIn(s.token, s.user, { foodToken: s.foodToken, refreshToken: s.refreshToken }); // navigator switches to the app
    } catch (e) {
      let msg = e?.message || 'Invalid OTP. Please try again.';
      if (e?.status === 401) {
        msg = /deactivat/i.test(msg) ? 'Your account is deactivated. Please contact support.' : 'Invalid or expired code, or account not active.';
      }
      setError(msg);
    } finally { setLoading(false); }
  };

  const completeProfile = async () => {
    const trimmed = name.trim();
    if (loading || trimmed.length < 2) return;
    if (!pending?.accessToken || !pending?.user) { setError('Session expired. Please verify OTP again.'); setStep(1); setOtp(''); setPending(null); return; }
    setLoading(true); setError('');
    try {
      await foodApi.patch('/food/user/profile', { name: trimmed }, { headers: { Authorization: `Bearer ${pending.accessToken}` } });
      const next = { ...pending, user: { ...pending.user, name: trimmed } };
      const s = sessionFromVerify(next);
      await signIn(s.token, s.user, { foodToken: s.foodToken, refreshToken: s.refreshToken });
    } catch (e) { fail(e, 'Failed to save your name.'); }
    finally { setLoading(false); }
  };

  const submit = () => (step === 1 ? sendOtp(false) : step === 2 ? verify() : completeProfile());
  const editNumber = () => { setStep(1); setOtp(''); setName(''); setPending(null); setTimer(0); setError(''); };
  const back = () => { if (step > 1) editNumber(); };

  const openPolicy = async (type) => {
    const title = type === 'terms' ? 'Terms of Service' : 'Privacy Policy';
    setPolicy({ open: true, title, body: '', loading: true });
    try {
      const res = await foodApi.get(type === 'terms' ? '/food/pages/terms' : '/food/pages/privacy');
      const p = res?.data || res || {};
      const body = stripHtml(p.content) || `Welcome to Eqosy. Please read and agree to our ${title} before using our services.`;
      setPolicy({ open: true, title: p.title || title, body, loading: false });
    } catch {
      setPolicy({ open: true, title, body: `Welcome to Eqosy. Please read and agree to our ${title} before using our services.`, loading: false });
    }
  };

  const Policies = () => (
    <>
      <Text style={styles.link} onPress={() => openPolicy('terms')}>Terms of Service</Text>
      {' and '}
      <Text style={styles.link} onPress={() => openPolicy('privacy')}>Privacy Policy</Text>
    </>
  );

  const numberChip = (label) => (
    <View style={styles.numberChip}>
      <View>
        <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.8, color: '#7A6A3A' }}>{label.toUpperCase()}</Text>
        <Text style={{ fontSize: 15, fontWeight: '800', color: C.ink }}>+91 {phone}</Text>
      </View>
      <Pressable onPress={editNumber} style={styles.editBtn}>
        <Text style={{ fontSize: 12, fontWeight: '800', color: C.link }}>Edit</Text>
      </Pressable>
    </View>
  );

  const fieldStyle = (id) => [styles.field, focus === id && styles.fieldFocus];

  const onOtpChange = (index, text) => {
    const digits = text.replace(/\D/g, '');
    const cur = otp.padEnd(4, ' ').split('');
    if (!digits) {
      cur[index] = ' ';
      setOtp(cur.join('').replace(/ +$/, '').replace(/ /g, ''));
      if (index > 0) otpRefs.current[index - 1]?.focus();
      return;
    }
    if (digits.length >= 4) { setOtp(digits.slice(0, 4)); otpRefs.current[3]?.focus(); return; }
    cur[index] = digits.slice(-1);
    setOtp(cur.join('').replace(/ /g, ''));
    if (index < 3) otpRefs.current[index + 1]?.focus();
  };

  return (
    <LinearGradient colors={['#060A22', '#0C1336', '#16204F']} style={{ flex: 1 }}>
      {/* warm glow + soft rings */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View style={[styles.glow, { top: -60, left: -20, width: 260, height: 260, backgroundColor: 'rgba(247,147,30,0.28)' }]} />
        <View style={[styles.glow, { top: 40, right: -70, width: 220, height: 220, backgroundColor: 'rgba(126,211,33,0.20)' }]} />
        <View style={[styles.ring, { top: 60, width: 256, height: 256, left: '50%', marginLeft: -128, borderColor: 'rgba(255,255,255,0.10)' }]} />
        <View style={[styles.ring, { top: 16, width: 384, height: 384, left: '50%', marginLeft: -192, borderColor: 'rgba(255,255,255,0.05)' }]} />
      </View>

      <Pressable onPress={back} accessibilityLabel="Back" style={[styles.backBtn, { top: insets.top + 8 }]}>
        <ArrowLeft size={20} color="#fff" />
      </Pressable>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" bounces={false}>
          {/* Hero */}
          <View style={{ alignItems: 'center', paddingHorizontal: 24, paddingBottom: 48, paddingTop: insets.top + 56 }}>
            <LinearGradient
              colors={['#7ED321', '#FFC400', '#F7931E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={{ borderRadius: 25, padding: 3, shadowColor: '#F7931E', shadowOpacity: 0.7, shadowRadius: 20, shadowOffset: { width: 0, height: 14 }, elevation: 10 }}
            >
              <View style={{ width: 68, height: 68, borderRadius: 22, overflow: 'hidden', backgroundColor: '#fff' }}>
                <Image source={logo} style={{ width: '100%', height: '100%', transform: [{ scale: 1.1 }] }} resizeMode="cover" />
              </View>
            </LinearGradient>
            <Text style={{ marginTop: 12, fontSize: 20, fontWeight: '900', letterSpacing: -0.4, lineHeight: 22 }}>
              <Text style={{ color: '#8BE02A' }}>E</Text><Text style={{ color: C.orange }}>q</Text><Text style={{ color: '#fff' }}>osy</Text>
            </Text>
            <Text style={{ marginTop: 8, fontSize: 25, fontWeight: '900', lineHeight: 29, color: '#fff', textAlign: 'center', letterSpacing: -0.4 }}>
              Everything you need,{'\n'}
              <GradientText text="delivered." />
            </Text>
            <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 }}>
              <Chip label="Food" icon={<UtensilsCrossed size={14} color="#F7931E" />} />
              <Chip label="Grocery" icon={<ShoppingBasket size={14} color="#10B981" />} />
              <Chip label="Rides" icon={<Car size={14} color="#8BE02A" />} />
              <Chip label="Parcel" icon={<Package size={14} color="#FFC400" />} />
            </View>
          </View>

          {/* Bottom sheet */}
          <Animated.View
            style={[styles.sheet, { paddingBottom: Math.max(20, insets.bottom), opacity: slide, transform: [{ translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [60, 0] }) }] }]}
          >
            <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#D9DEEE', marginBottom: 8 }} />
            <Text style={{ fontSize: 22, fontWeight: '900', color: C.ink, lineHeight: 26 }}>{heading[0]}</Text>
            <Text style={{ fontSize: 14, fontWeight: '500', color: C.muted, marginTop: 2, marginBottom: 16 }}>{heading[1]}</Text>

            <View style={{ gap: 16, marginBottom: 24 }}>
              {step === 1 ? (
                <View style={fieldStyle('phone')}>
                  <View style={styles.prefix}><Text style={{ fontSize: 18, fontWeight: '900', color: C.link }}>+91</Text></View>
                  <TextInput
                    value={phone} onChangeText={(t) => setPhone(t.replace(/\D/g, '').slice(0, 10))}
                    keyboardType="number-pad" maxLength={10} autoFocus placeholder="Mobile number" placeholderTextColor={C.placeholder}
                    onFocus={() => setFocus('phone')} onBlur={() => setFocus('')}
                    style={[styles.input, phone ? { fontSize: 22, fontWeight: '800', letterSpacing: 3 } : { fontSize: 17, fontWeight: '600' }]}
                  />
                </View>
              ) : step === 2 ? (
                <>
                  {numberChip('Code sent to')}
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    {[0, 1, 2, 3].map((i) => (
                      <TextInput
                        key={i} ref={(r) => { otpRefs.current[i] = r; }}
                        value={otp[i] || ''} onChangeText={(t) => onOtpChange(i, t)}
                        onKeyPress={({ nativeEvent }) => {
                          if (nativeEvent.key === 'Backspace' && !otp[i] && i > 0) {
                            setOtp(otp.slice(0, i - 1)); otpRefs.current[i - 1]?.focus();
                          }
                        }}
                        onFocus={() => setFocus(`otp${i}`)} onBlur={() => setFocus('')}
                        keyboardType="number-pad" textContentType="oneTimeCode" autoFocus={i === 0}
                        placeholder="-" placeholderTextColor="#C4CAE0" maxLength={i === 0 ? 4 : 1}
                        style={[styles.otpBox, focus === `otp${i}` && styles.fieldFocus]}
                      />
                    ))}
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 }}>
                    <Text style={{ fontSize: 12, fontWeight: '500', color: C.muted }}>Didn't receive it?</Text>
                    {timer > 0 ? (
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#9AA2C0' }}>
                        Resend in {String(Math.floor(timer / 60)).padStart(2, '0')}:{String(timer % 60).padStart(2, '0')}
                      </Text>
                    ) : (
                      <Pressable onPress={() => sendOtp(true)}><Text style={{ fontSize: 12, fontWeight: '800', color: C.orange }}>Resend Code</Text></Pressable>
                    )}
                  </View>
                </>
              ) : (
                <>
                  {numberChip('New account')}
                  <View style={fieldStyle('name')}>
                    <TextInput
                      value={name} onChangeText={setName} autoFocus placeholder="Enter your full name" placeholderTextColor={C.placeholder}
                      onFocus={() => setFocus('name')} onBlur={() => setFocus('')}
                      style={[styles.input, { fontSize: 18, fontWeight: '700' }]}
                    />
                  </View>
                </>
              )}

              {step > 1 ? (
                <Pressable onPress={() => setAgree(!agree)} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 4 }}>
                  <View style={[styles.check, agree && { backgroundColor: C.deepOrange, borderColor: C.deepOrange }]}>
                    {agree ? <Text style={{ color: '#fff', fontSize: 11, fontWeight: '900', lineHeight: 13 }}>✓</Text> : null}
                  </View>
                  <Text style={{ flex: 1, fontSize: 11.5, fontWeight: '500', lineHeight: 16, color: '#4A5378' }}>I agree to the <Policies />.</Text>
                </Pressable>
              ) : null}

              {error ? <Text style={{ color: '#EF4444', fontSize: 13, fontWeight: '600', textAlign: 'center' }}>{error}</Text> : null}

              <Pressable onPress={submit} disabled={disabled} style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.98 : 1 }] })}>
                {disabled ? (
                  <View style={[styles.cta, { backgroundColor: '#E9ECF6' }]}>
                    {loading ? <ActivityIndicator color="#A3AAC6" /> : <CtaLabel step={step} color="#A3AAC6" />}
                  </View>
                ) : (
                  <LinearGradient colors={['#F7931E', '#E85D04']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.cta, { shadowColor: '#E85D04', shadowOpacity: 0.6, shadowRadius: 14, shadowOffset: { width: 0, height: 10 }, elevation: 6 }]}>
                    <CtaLabel step={step} color="#fff" />
                  </LinearGradient>
                )}
              </Pressable>
            </View>

            {/* Legal footer */}
            <View style={{ marginTop: 'auto', borderTopWidth: 1, borderTopColor: C.border, paddingTop: 12, alignItems: 'center' }}>
              {step === 1 ? (
                <Text style={{ fontSize: 11, fontWeight: '500', lineHeight: 16, color: C.muted, textAlign: 'center' }}>By continuing, you agree to our <Policies />.</Text>
              ) : null}
              <View style={{ marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <ShieldCheck size={14} color="#5FB410" />
                  <Text style={{ fontSize: 11, fontWeight: '700', color: C.muted }}>Secure login</Text>
                </View>
                <View style={{ width: 1, height: 12, backgroundColor: '#D9DEEE' }} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: C.muted }} onPress={() => Linking.openURL('https://eqosy.com/support')}>Help & Support</Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Legal policy modal */}
      <Modal visible={policy.open} transparent animationType="fade" onRequestClose={() => setPolicy({ ...policy, open: false })}>
        <View style={styles.modalWrap}>
          <View style={styles.modal}>
            <View style={styles.modalHead}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#0F172A' }}>{policy.title}</Text>
              <Pressable onPress={() => setPolicy({ ...policy, open: false })} style={styles.modalClose}><X size={18} color="#374151" /></Pressable>
            </View>
            <ScrollView style={{ padding: 20 }}>
              {policy.loading ? <ActivityIndicator color={C.orange} style={{ marginVertical: 40 }} /> : <Text style={{ fontSize: 14, lineHeight: 21, color: '#334155' }}>{policy.body}</Text>}
              <View style={{ height: 24 }} />
            </ScrollView>
            <View style={{ padding: 14, alignItems: 'flex-end', borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
              <Pressable onPress={() => setPolicy({ ...policy, open: false })} style={{ paddingHorizontal: 24, paddingVertical: 8, borderRadius: 999, backgroundColor: '#1A1A1A' }}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

function CtaLabel({ step, color }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Text style={{ fontSize: 16, fontWeight: '900', letterSpacing: 0.4, color }}>
        {step === 1 ? 'Get OTP' : step === 2 ? 'Verify & Login' : 'Complete Profile'}
      </Text>
      <ArrowRight size={16} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  glow: { position: 'absolute', borderRadius: 999 },
  ring: { position: 'absolute', borderRadius: 999, borderWidth: 1 },
  backBtn: {
    position: 'absolute', left: 16, zIndex: 20, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.10)',
  },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.10)',
  },
  sheet: {
    flex: 1, width: '100%', maxWidth: 460, alignSelf: 'center', backgroundColor: C.sheet, borderTopLeftRadius: 32, borderTopRightRadius: 32,
    paddingHorizontal: 20, paddingTop: 12, shadowColor: '#000', shadowOpacity: 0.6, shadowRadius: 25, shadowOffset: { width: 0, height: -20 }, elevation: 20,
  },
  field: { height: 64, flexDirection: 'row', alignItems: 'center', overflow: 'hidden', borderRadius: 16, borderWidth: 1.5, borderColor: C.border, backgroundColor: '#fff' },
  fieldFocus: { borderColor: C.orange, shadowColor: C.orange, shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } },
  prefix: { height: '100%', paddingHorizontal: 20, justifyContent: 'center', backgroundColor: C.chip },
  input: { flex: 1, height: '100%', paddingHorizontal: 16, color: C.ink },
  otpBox: {
    flex: 1, height: 64, borderRadius: 16, borderWidth: 1.5, borderColor: C.border, backgroundColor: '#fff',
    textAlign: 'center', fontSize: 28, fontWeight: '900', color: C.ink, fontFamily: 'Outfit_800ExtraBold',
  },
  numberChip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 16, backgroundColor: C.chip, paddingHorizontal: 16, paddingVertical: 10 },
  editBtn: { borderRadius: 999, backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 6, elevation: 1 },
  check: { width: 16, height: 16, marginTop: 1, borderRadius: 4, borderWidth: 1.5, borderColor: '#C4CAE0', alignItems: 'center', justifyContent: 'center' },
  cta: { height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  link: { fontWeight: '800', color: C.link, textDecorationLine: 'underline' },
  modalWrap: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modal: { width: '100%', maxWidth: 512, maxHeight: '85%', backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden' },
  modalHead: { padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F9FAFB', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  modalClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
});
