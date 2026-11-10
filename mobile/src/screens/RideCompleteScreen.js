import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Text } from '../components/Text';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Button, Card, ErrorText } from '../components/ui';
import { authService, rideService } from '../api/services';
import { unwrapData } from '../lib/pricing';
import { colors, radius } from '../theme';

const TIPS = [0, 10, 20, 50];

export default function RideCompleteScreen({ route, navigation }) {
  const { rideId } = route.params;
  const [ride, setRide] = useState(null);
  const [wallet, setWallet] = useState(0);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [tip, setTip] = useState(0);
  const [method, setMethod] = useState('wallet');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const [r, w] = await Promise.allSettled([rideService.get(rideId), authService.getWallet()]);
      if (r.status === 'fulfilled') setRide(unwrapData(r.value));
      if (w.status === 'fulfilled') {
        const d = unwrapData(w.value);
        setWallet(Number(d?.wallet?.balance ?? d?.balance ?? 0));
      }
      setLoading(false);
    })();
  }, [rideId]);

  const fare = Number(ride?.fare || 0);
  const isCash = String(ride?.paymentMethod || 'Cash').toLowerCase() === 'cash';
  const alreadyPaid = ride?.paymentStatus === 'paid' || ride?.driverPaymentCollection?.status === 'paid';
  const payable = isCash || alreadyPaid ? 0 : fare + tip;

  const submit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const body = { rating, comment, tipAmount: tip || 0 };
      if (payable > 0 && method === 'wallet') await rideService.payWithWallet(rideId, body);
      else await rideService.feedback(rideId, body);
      setDone(true);
    } catch (e) {
      setError(e?.message || 'Could not submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Screen><View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.primary} /></View></Screen>;
  }

  if (done) {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Ionicons name="checkmark-circle" size={80} color={colors.success} />
          <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text, marginTop: 12 }}>Thank you!</Text>
          <Text style={{ color: colors.muted, marginTop: 6 }}>Your feedback was submitted.</Text>
          <Button title="Back to home" onPress={() => navigation.popToTop()} style={{ marginTop: 28, alignSelf: 'stretch' }} />
        </View>
      </Screen>
    );
  }

  const walletShort = method === 'wallet' && payable > wallet;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
        <Text style={{ fontSize: 26, fontWeight: '800', color: colors.text }}>Trip complete</Text>

        <Card>
          <Text style={{ color: colors.muted, fontWeight: '700', fontSize: 12, textTransform: 'uppercase' }}>Fare</Text>
          <Text style={{ fontSize: 34, fontWeight: '800', color: colors.text }}>₹{fare}</Text>
          <Text style={{ color: colors.muted, marginTop: 4 }} numberOfLines={2}>
            {ride?.pickupAddress} to {ride?.dropAddress}
          </Text>
        </Card>

        <View>
          <Text style={{ fontWeight: '800', color: colors.text, marginBottom: 8 }}>Rate your driver</Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable key={n} onPress={() => setRating(n)}>
                <Ionicons name={n <= rating ? 'star' : 'star-outline'} size={36} color={colors.primary} />
              </Pressable>
            ))}
          </View>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Add a comment (optional)"
            placeholderTextColor="#9CA3AF"
            multiline
            style={{ marginTop: 12, minHeight: 70, borderRadius: radius.md, backgroundColor: colors.surface, padding: 12, color: colors.text, textAlignVertical: 'top' }}
          />
        </View>

        <View>
          <Text style={{ fontWeight: '800', color: colors.text, marginBottom: 8 }}>Add a tip</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {TIPS.map((t) => (
              <Pressable
                key={t}
                onPress={() => setTip(t)}
                style={{
                  flex: 1, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: tip === t ? colors.ink : colors.surface,
                }}
              >
                <Text style={{ fontWeight: '700', color: tip === t ? '#fff' : colors.text }}>{t === 0 ? 'No tip' : `₹${t}`}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {payable > 0 ? (
          <Card>
            <Text style={{ fontWeight: '800', color: colors.text }}>Pay ₹{payable}</Text>
            <Text style={{ color: colors.muted, marginTop: 4 }}>Wallet balance: ₹{wallet.toFixed(2)}</Text>
            {walletShort ? <Text style={{ color: colors.danger, marginTop: 4 }}>Not enough wallet balance. Top up your wallet first.</Text> : null}
          </Card>
        ) : (
          <Text style={{ color: colors.muted }}>{isCash ? 'Pay the driver in cash.' : 'Payment already completed.'}</Text>
        )}

        <ErrorText>{error}</ErrorText>
        <Button
          title={payable > 0 ? `Pay ₹${payable} and submit` : 'Submit'}
          onPress={submit}
          loading={submitting}
          disabled={walletShort}
          variant="primary"
        />
      </ScrollView>
    </Screen>
  );
}
