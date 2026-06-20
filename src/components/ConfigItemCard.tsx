import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SupabaseConfig } from '../api/supabase';
import { Colors } from '../theme/colors';

interface Props {
  config: SupabaseConfig;
  colors: Colors;
  onCopy: () => void;
  onImport: () => void;
}

const protocolColors: Record<string, string> = {
  vmess: '#6366F1',
  vless: '#0EA5E9',
  trojan: '#EC4899',
  shadowsocks: '#F59E0B',
  hysteria: '#10B981',
  tuic: '#8B5CF6',
};

export default function ConfigItemCard({ config, colors, onCopy, onImport }: Props) {
  const protoColor = protocolColors[config.type?.toLowerCase()] || '#6366F1';

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: `${protoColor}22` }]}>
          <Text style={[styles.badgeText, { color: protoColor }]}>{config.type?.toUpperCase()}</Text>
        </View>
        <Text style={[styles.remarks, { color: colors.subText }]}>
          {config.remarks || `#${config.id}`}
        </Text>
      </View>

      <View style={[styles.contentBox, { backgroundColor: colors.bg }]}>
        <Text
          style={[styles.content, { color: `${colors.text}A6` }]}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {config.raw_content}
        </Text>
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
          onPress={onImport}
        >
          <Ionicons name="download-outline" size={14} color={colors.bg} />
          <Text style={[styles.btnText, { color: colors.bg }]}>Hiddify</Text>
        </TouchableOpacity>
      </View>
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
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  remarks: {
    fontSize: 11,
  },
  contentBox: {
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  content: {
    fontSize: 10,
    fontFamily: 'monospace',
    lineHeight: 15,
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
