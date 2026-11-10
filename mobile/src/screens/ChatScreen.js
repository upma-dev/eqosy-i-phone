import React, { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native';
import { Text } from '../components/Text';
import { Ionicons } from '@expo/vector-icons';
import { Screen, ScreenHeader } from '../components/ui';
import { rideService } from '../api/services';
import { emit, subscribe } from '../lib/socket';
import { unwrapData } from '../lib/pricing';
import { colors, radius } from '../theme';

const clock = (value) => {
  const d = value ? new Date(value) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';
};

const normalize = (m) => ({
  id: String(m._id || m.id || `${m.sentAt}-${m.message}`),
  mine: String(m.senderRole || '').toLowerCase() === 'user',
  text: String(m.message || ''),
  time: clock(m.sentAt),
});

export default function ChatScreen({ route, navigation }) {
  const { rideId, peerName } = route.params;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const listRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const ride = unwrapData(await rideService.get(rideId));
        if (Array.isArray(ride?.messages)) setMessages(ride.messages.map(normalize).filter((m) => m.text));
      } catch {
        /* live messages still arrive */
      }
    })();

    emit('joinRide', { rideId });
    emit('ride:join', { rideId });
    const off = subscribe({
      'ride:message:new': (m) => {
        if (String(m?.rideId || '') !== String(rideId)) return;
        const n = normalize(m);
        if (!n.text) return;
        setMessages((cur) => (cur.some((x) => x.id === n.id) ? cur : [...cur, n]));
      },
      'ride:state': (payload) => {
        if (String(payload?.rideId || '') !== String(rideId) || !Array.isArray(payload.messages)) return;
        setMessages(payload.messages.map(normalize).filter((m) => m.text));
      },
      errorMessage: (payload) => setError(payload?.message || 'Could not load ride chat.'),
    });
    return off;
  }, [rideId]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    setError('');
    emit('ride:message:send', { rideId, message: text });
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <ScreenHeader title={peerName || 'Chat'} navigation={navigation} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={0}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          contentContainerStyle={{ padding: 14, gap: 8 }}
          ListEmptyComponent={<Text style={{ textAlign: 'center', color: colors.muted, marginTop: 40 }}>{error || 'Say hello to your driver.'}</Text>}
          renderItem={({ item: m }) => (
            <View style={{ alignSelf: m.mine ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
              <View style={{ backgroundColor: m.mine ? colors.ink : colors.surface, padding: 10, borderRadius: radius.lg }}>
                <Text style={{ color: m.mine ? '#fff' : colors.text }}>{m.text}</Text>
              </View>
              <Text style={{ fontSize: 10, color: colors.muted, alignSelf: m.mine ? 'flex-end' : 'flex-start', marginTop: 2 }}>{m.time}</Text>
            </View>
          )}
        />
        <View style={{ flexDirection: 'row', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Message"
            placeholderTextColor="#9CA3AF"
            onSubmitEditing={send}
            style={{ flex: 1, height: 46, borderRadius: radius.md, backgroundColor: colors.surface, paddingHorizontal: 14, color: colors.text }}
          />
          <Pressable onPress={send} style={{ width: 46, height: 46, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="send" size={20} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
