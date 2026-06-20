import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SupabaseProxy } from '../api/supabase';
import { Colors } from '../theme/colors';

interface Props {
  proxy: SupabaseProxy;
  colors: Colors;
  onCopy: () => void;
  onConnect: () => void;
}

export default function ProxyItemCard({ proxy, colors, onCopy, onConnect }: Props) {
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconBox, { backgroundColor: `${colors.primary}1F` }]}>
            <Ionicons name="radio-outline" size={18} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>MTProto</Text>
        </View>
        <View style={[styles.idBadge, { backgroundColor: `${colors.primary}1F` }]}>
          <Text style={[styles.idText, { color: colors.primary }]}>#{proxy.id}</Text>
        </View>
      </View>

      <View style={[styles.details, { backgroundColor: colors.bg }]}>
        <DetailRow label="Server" value={proxy.server} colors={colors} />
        <DetailRow label="Port" value={String(proxy.port)} colors={colors} />
        <DetailRow label="Secret" value={proxy.secret} colors={colors} />
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.btn, { borderColor: colors.border }]}
          onPress={onCopy}
        >
          <Ionicons name="copy-outline" size={14} color={colors.text} />
          <Text style={[styles.btnText, { color: colors.text }]}>Copy</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.primary }]}
          onPress={onConnect}
        >
          <Ionicons name="send-outline" size={14} color={colors.bg} />
          <Text style={[styles.btnText, { color: colors.bg }]}>Telegram</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function DetailRow({ label, value, colors }: { label: string; value: string; colors: Colors }) {
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: colors.subText }]}>{label}</Text>
      <Text
        style={[styles.detailValue, { color: colors.text }]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
  idBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  idText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  details: {
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 11,
    fontFamily: 'monospace',
    maxWidth: 180,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  btnText: {
    fontSize: 12,
  },
});
