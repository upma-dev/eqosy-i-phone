import React from 'react';
import { View } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import { Text } from '../../components/Text';

// Port of web BusCancellationPolicy.jsx: everything comes from the bus's cancellationRules / cancellationPolicy.
const money = (v) => `₹${Math.round(Number(v) || 0).toLocaleString('en-IN')}`;
const hoursText = (h) => { const v = Number(h) || 0; return v >= 48 && v % 24 === 0 ? `${v / 24} days` : `${v} hour${v === 1 ? '' : 's'}`; };
const refundText = (rule) => {
  const v = Number(rule?.refundValue || 0);
  if (rule?.refundType === 'percentage') return v >= 100 ? 'Full refund' : v <= 0 ? 'No refund' : `${v}% refund`;
  if (rule?.refundType === 'fixed') return v <= 0 ? 'No refund' : `${money(v)} refund`;
  return 'No refund';
};

export const buildCancellationLines = (rules = []) => {
  const sorted = [...(Array.isArray(rules) ? rules : [])].sort((a, b) => Number(b.hoursBeforeDeparture || 0) - Number(a.hoursBeforeDeparture || 0));
  return sorted.map((rule, i) => {
    const from = Number(rule.hoursBeforeDeparture || 0);
    const prev = i > 0 ? Number(sorted[i - 1].hoursBeforeDeparture || 0) : null;
    const when = prev === null ? `Cancel ${hoursText(from)} or more before departure` : from <= 0 ? `Cancel less than ${hoursText(prev)} before departure` : `Cancel between ${hoursText(from)} and ${hoursText(prev)} before departure`;
    const refund = refundText(rule);
    return { id: rule.id || `${i}`, when, refund, tone: refund === 'No refund' ? 'rose' : refund === 'Full refund' ? 'emerald' : 'amber', notes: rule.notes || '' };
  });
};

const TONES = { emerald: ['#ECFDF5', '#047857'], amber: ['#FFFBEB', '#B45309'], rose: ['#FFF1F2', '#BE123C'] };

export default function BusCancellationPolicy({ bus, style }) {
  const lines = buildCancellationLines(bus?.cancellationRules);
  const text = String(bus?.cancellationPolicy || '').trim();
  if (!lines.length && !text) return null;
  return (
    <View style={[{ borderRadius: 24, borderWidth: 1, borderColor: '#F1F5F9', backgroundColor: '#fff', padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <ShieldCheck size={15} color="#059669" />
        <Text style={{ fontSize: 11, fontWeight: '900', letterSpacing: 1.8, color: '#64748B' }}>CANCELLATION POLICY</Text>
      </View>
      {text ? <Text style={{ marginTop: 8, fontSize: 13, fontWeight: '600', lineHeight: 20, color: '#475569' }}>{text}</Text> : null}
      {lines.length ? (
        <View style={{ marginTop: 12, gap: 8 }}>
          {lines.map((l) => (
            <View key={l.id} style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, borderRadius: 16, backgroundColor: '#F8FAFC', paddingHorizontal: 12, paddingVertical: 10 }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155' }}>{l.when}</Text>
                {l.notes ? <Text style={{ marginTop: 2, fontSize: 11, fontWeight: '600', color: '#94A3B8' }}>{l.notes}</Text> : null}
              </View>
              <View style={{ borderRadius: 99, backgroundColor: TONES[l.tone][0], paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ fontSize: 10, fontWeight: '900', color: TONES[l.tone][1] }}>{l.refund.toUpperCase()}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
