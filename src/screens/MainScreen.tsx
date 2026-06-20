import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  Clipboard,
  Modal,
  TextInput,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  SupabaseConfig,
  SupabaseProxy,
  SupabaseChannel,
  SupabaseSubscription,
  api,
} from '../api/supabase';
import { DarkColors, LightColors, Colors } from '../theme/colors';
import { AppLanguage, t } from '../i18n/translations';
import ConfigItemCard from './ConfigItemCard';
import ProxyItemCard from './ProxyItemCard';
import AdminPanel from './AdminPanel';
import SplashScreen from './SplashScreen';

type Tab = 'configs' | 'proxies' | 'admin';

export default function MainScreen() {
  const [showSplash, setShowSplash] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [language, setLanguage] = useState<AppLanguage>('EN');
  const [tab, setTab] = useState<Tab>('configs');
  const [showSettings, setShowSettings] = useState(false);

  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [settingsUrl, setSettingsUrl] = useState('');
  const [settingsKey, setSettingsKey] = useState('');

  const [configs, setConfigs] = useState<SupabaseConfig[]>([]);
  const [proxies, setProxies] = useState<SupabaseProxy[]>([]);
  const [channels, setChannels] = useState<SupabaseChannel[]>([]);
  const [subscriptions, setSubscriptions] = useState<SupabaseSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const colors: Colors = darkMode ? DarkColors : LightColors;
  const insets = useSafeAreaInsets();

  const loadData = useCallback(async () => {
    if (!supabaseUrl || !supabaseKey) {
      setLoading(false);
      setError(t('empty_db', language));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [c, p, ch, s] = await Promise.all([
        api.getConfigs(),
        api.getProxies(),
        api.getMonitoredChannels(),
        api.getSubscriptions(),
      ]);
      setConfigs(c);
      setProxies(p);
      setChannels(ch);
      setSubscriptions(s);
    } catch (e: any) {
      setError(e.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [supabaseUrl, supabaseKey, language]);

  useEffect(() => {
    if (supabaseUrl && supabaseKey) {
      api.configure(supabaseUrl, supabaseKey);
      loadData();
    }
  }, [supabaseUrl, supabaseKey]);

  const handleApplySettings = () => {
    setSupabaseUrl(settingsUrl.trim());
    setSupabaseKey(settingsKey.trim());
    setShowSettings(false);
  };

  const openSettings = () => {
    setSettingsUrl(supabaseUrl);
    setSettingsKey(supabaseKey);
    setShowSettings(true);
  };

  if (showSplash) {
    return <SplashScreen onFinished={() => setShowSplash(false)} />;
  }

  const tabs: { key: Tab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'configs', label: t('configs', language), icon: 'layers-outline' },
    { key: 'proxies', label: t('proxies', language), icon: 'key-outline' },
    { key: 'admin', label: t('admin_panel', language), icon: 'shield-outline' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />

      {/* Top Bar */}
      <View style={[styles.topBar, { backgroundColor: colors.bg }]}>
        <View style={[styles.logoIcon, { backgroundColor: `${colors.primary}1A` }]}>
          <Ionicons name="git-network-outline" size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.appTitle, { color: colors.text }]}>{t('app_title', language)}</Text>
          <Text style={[styles.appSubtitle, { color: colors.subText }]}>{t('subtitle', language)}</Text>
        </View>
        <TouchableOpacity onPress={() => setLanguage(language === 'EN' ? 'FA' : 'EN')} style={styles.actionBtn}>
          <Ionicons name="language-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setDarkMode(!darkMode)} style={styles.actionBtn}>
          <Ionicons name={darkMode ? 'sunny-outline' : 'moon-outline'} size={20} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={openSettings} style={styles.actionBtn}>
          <Ionicons name="settings-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
            <TouchableOpacity
              style={[styles.retryBtn, { backgroundColor: colors.primary }]}
              onPress={loadData}
            >
              <Text style={{ color: colors.bg, fontWeight: '600' }}>{t('retry', language)}</Text>
            </TouchableOpacity>
          </View>
        ) : tab === 'configs' ? (
          <FlatList
            data={configs}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <ConfigItemCard
                config={item}
                colors={colors}
                onCopy={() => {
                  Clipboard.setString(item.raw_content);
                  Alert.alert('Copied!');
                }}
                onImport={() => {
                  Linking.openURL(`hiddify://import/#${item.raw_content}`).catch(() =>
                    Alert.alert('Hiddify not installed')
                  );
                }}
              />
            )}
            contentContainerStyle={{ paddingVertical: 8 }}
            ListHeaderComponent={
              <TipBanner text={t('configs_tip', language)} icon="information-circle-outline" color={colors.primary} />
            }
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: colors.subText }]}>{t('empty_db', language)}</Text>
            }
          />
        ) : tab === 'proxies' ? (
          <FlatList
            data={proxies}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <ProxyItemCard
                proxy={item}
                colors={colors}
                onCopy={() => {
                  Clipboard.setString(item.tg_link);
                  Alert.alert('Copied!');
                }}
                onConnect={() => {
                  Linking.openURL(item.tg_link).catch(() =>
                    Alert.alert('Telegram not installed')
                  );
                }}
              />
            )}
            contentContainerStyle={{ paddingVertical: 8 }}
            ListHeaderComponent={
              <TipBanner text={t('proxies_tip', language)} icon="flash-outline" color={colors.primary} />
            }
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: colors.subText }]}>{t('empty_db', language)}</Text>
            }
          />
        ) : (
          <AdminPanel
            colors={colors}
            language={language}
            channels={channels}
            subscriptions={subscriptions}
            onRefresh={loadData}
          />
        )}
      </View>

      {/* Bottom Tabs */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        {tabs.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={styles.tabItem}
            onPress={() => setTab(t.key)}
          >
            <Ionicons
              name={tab === t.key ? t.icon.replace('-outline', '') : t.icon}
              size={22}
              color={tab === t.key ? colors.primary : colors.subText}
            />
            <Text
              style={[
                styles.tabLabel,
                { color: tab === t.key ? colors.primary : colors.subText },
              ]}
            >
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Settings Modal */}
      <Modal visible={showSettings} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <Ionicons name="server-outline" size={28} color={colors.primary} style={{ alignSelf: 'center' }} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('db_setup', language)}</Text>
            <Text style={[styles.modalDesc, { color: colors.subText }]}>{t('dialog_desc', language)}</Text>
            <TextInput
              style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
              placeholder="Supabase URL"
              placeholderTextColor={colors.subText}
              value={settingsUrl}
              onChangeText={setSettingsUrl}
              autoCapitalize="none"
            />
            <TextInput
              style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
              placeholder="API Key"
              placeholderTextColor={colors.subText}
              value={settingsKey}
              onChangeText={setSettingsKey}
              autoCapitalize="none"
              secureTextEntry
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, { borderWidth: 1, borderColor: colors.border }]}
                onPress={() => setShowSettings(false)}
              >
                <Text style={{ color: colors.text }}>{t('cancel', language)}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                onPress={handleApplySettings}
              >
                <Text style={{ color: colors.bg, fontWeight: '600' }}>{t('apply', language)}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function TipBanner({ text, icon, color }: { text: string; icon: keyof typeof Ionicons.glyphMap; color: string }) {
  return (
    <View style={[styles.tipBanner, { backgroundColor: `${color}12` }]}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={[styles.tipText, { color: `${color}BF` }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appTitle: { fontSize: 20, fontWeight: '900' },
  appSubtitle: { fontSize: 11 },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  content: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  errorText: { fontSize: 14, textAlign: 'center', maxWidth: 280 },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginTop: 8 },
  emptyText: { textAlign: 'center', marginTop: 40, fontSize: 14 },
  tipBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  tipText: { fontSize: 12, flex: 1 },
  bottomBar: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    paddingBottom: Platform.OS === 'ios' ? 8 : 8,
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  tabLabel: { fontSize: 11 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    borderRadius: 16,
    padding: 24,
    gap: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  modalDesc: { fontSize: 12, textAlign: 'center', marginBottom: 4 },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
});
