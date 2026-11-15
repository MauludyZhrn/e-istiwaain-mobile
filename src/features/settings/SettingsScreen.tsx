import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  Image,
} from 'react-native';
import {
  Moon,
  Sun,
  Bell,
  Volume2,
  VolumeX,
  MapPin,
  Calculator,
  ChevronRight,
  Smartphone,
  ShieldCheck,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppStore, AdhanSoundType } from '../../store/useAppStore';
import { colors } from '../../constants/colors';
import { CalculationMethod } from '../../utils/falakMath';
import {
  playAzanSound,
  stopAzanSound,
  subscribeAzanState,
  AzanPlaybackState,
} from '../../services/soundService';

const LOGO_COLOR = require('../../../assets/e-Istiwaain-Logo/png/logo-color_512.png');
const LOGO_WHITE = require('../../../assets/e-Istiwaain-Logo/png/logo-white_512.png');

function getAdhanSoundLabel(sound: AdhanSoundType): string {
  switch (sound) {
    case 'auto':
    case 'makkah':
    case 'default':
      return 'Otomatis (Adzan Subuh & Standar)';
    case 'biasa':
    case 'madinah':
      return 'Adzan Standar (adzan_biasa.mp3)';
    case 'subuh':
      return 'Adzan Subuh (adzan_subuh.mp3)';
    case 'silent':
      return 'Senyap (Tanpa Suara)';
    default:
      return 'Otomatis (Adzan Subuh & Standar)';
  }
}

export const SettingsScreen = () => {
  const insets = useSafeAreaInsets();

  const isDarkMode = useAppStore((state) => state.isDarkMode);
  const toggleTheme = useAppStore((state) => state.toggleTheme);

  const adhanSound = useAppStore((state) => state.adhanSound) ?? 'auto';
  const setAdhanSound = useAppStore((state) => state.setAdhanSound);

  const notificationsEnabled = useAppStore((state) => state.notificationsEnabled) ?? true;
  const setNotificationsEnabled = useAppStore((state) => state.setNotificationsEnabled);

  const autoLocation = useAppStore((state) => state.autoLocation) ?? true;
  const setAutoLocation = useAppStore((state) => state.setAutoLocation);

  const calculationMethod = useAppStore((state) => state.calculationMethod) ?? 'Kemenag RI (Falak)';
  const setCalculationMethod = useAppStore((state) => state.setCalculationMethod);

  const theme = isDarkMode ? colors.dark : colors.light;

  const [azanState, setAzanState] = useState<AzanPlaybackState>({
    isPlaying: false,
    prayerKey: null,
    audioLabel: null,
  });

  useEffect(() => {
    const unsubscribe = subscribeAzanState((st) => setAzanState(st));
    return unsubscribe;
  }, []);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalOptions, setModalOptions] = useState<{ label: string; value: string }[]>([]);
  const [onSelectCallback, setOnSelectCallback] = useState<(val: any) => void>(() => {});

  const handleMethodSelect = () => {
    setModalTitle('Pilih Metode Perhitungan');
    setModalOptions([
      { label: 'Kemenag RI (Falak)', value: 'Kemenag RI (Falak)' },
      { label: 'Muslim World League (MWL)', value: 'MWL' },
      { label: 'Egyptian General Authority', value: 'Egyptian' },
      { label: 'Umm al-Qura (Makkah)', value: 'Umm al-Qura' },
    ]);
    setOnSelectCallback(() => (val: string) => setCalculationMethod(val as CalculationMethod));
    setModalVisible(true);
  };

  const handleAudioSelect = () => {
    setModalTitle('Pilih Audio Adzan');
    setModalOptions([
      { label: 'Otomatis (Adzan Subuh & Standar)', value: 'auto' },
      { label: 'Adzan Standar (adzan_biasa.mp3)', value: 'biasa' },
      { label: 'Adzan Subuh (adzan_subuh.mp3)', value: 'subuh' },
      { label: 'Senyap / Tanpa Suara (Silent)', value: 'silent' },
    ]);
    setOnSelectCallback(() => (val: string) => setAdhanSound(val as AdhanSoundType));
    setModalVisible(true);
  };

  const handlePreviewAudio = async (type: 'biasa' | 'subuh') => {
    if (azanState.isPlaying && azanState.prayerKey === type) {
      await stopAzanSound();
      return;
    }
    await playAzanSound(type, undefined, type);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { marginTop: insets.top + 10 }]}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Pengaturan</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Kustomisasi aplikasi sesuai kebutuhan Anda
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* SECTION: TAMPILAN */}
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>TAMPILAN</Text>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              {isDarkMode ? <Moon color={theme.accent} size={20} /> : <Sun color={theme.accent} size={20} />}
              <View>
                <Text style={[styles.itemText, { color: theme.textPrimary }]}>Mode Gelap</Text>
                <Text style={[styles.itemSubtext, { color: theme.textSecondary }]}>
                  {isDarkMode ? 'Tema gelap aktif' : 'Tema terang aktif'}
                </Text>
              </View>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.border, true: theme.textSecondary }}
              thumbColor={isDarkMode ? theme.accent : theme.surface}
            />
          </View>
        </View>

        {/* SECTION: NOTIFIKASI & AZAN */}
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>NOTIFIKASI & AUDIO ADZAN</Text>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Bell color={theme.iconi} size={20} />
              <View>
                <Text style={[styles.itemText, { color: theme.textPrimary }]}>Pengingat Shalat</Text>
                <Text style={[styles.itemSubtext, { color: theme.textSecondary }]}>
                  Aktifkan semua notifikasi & suara adzan
                </Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={(val) => setNotificationsEnabled?.(val)}
              trackColor={{ false: theme.border, true: theme.textSecondary }}
              thumbColor={notificationsEnabled ? theme.accent : theme.surface}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <TouchableOpacity style={styles.row} onPress={handleAudioSelect}>
            <View style={styles.rowLeft}>
              <Volume2 color={theme.iconi} size={20} />
              <View>
                <Text style={[styles.itemText, { color: theme.textPrimary }]}>Pilihan Suara Adzan</Text>
                <Text style={[styles.itemSubtext, { color: theme.accent, fontWeight: '500' }]}>
                  {getAdhanSoundLabel(adhanSound)}
                </Text>
              </View>
            </View>
            <ChevronRight color={theme.textSecondary} size={18} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* TOMBOL UJI PUTAR AUDIO ADZAN */}
          <View style={styles.previewRow}>
            <TouchableOpacity
              style={[
                styles.previewBtn,
                {
                  backgroundColor:
                    azanState.isPlaying && azanState.prayerKey === 'biasa'
                      ? '#EF4444'
                      : '#09473E',
                },
              ]}
              onPress={() => handlePreviewAudio('biasa')}
            >
              {azanState.isPlaying && azanState.prayerKey === 'biasa' ? (
                <VolumeX color="#FFFFFF" size={15} />
              ) : (
                <Volume2 color="#F9A729" size={15} />
              )}
              <Text style={styles.previewBtnText}>
                {azanState.isPlaying && azanState.prayerKey === 'biasa'
                  ? 'Stop Adzan Biasa'
                  : 'Tes Adzan Biasa'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.previewBtn,
                {
                  backgroundColor:
                    azanState.isPlaying && azanState.prayerKey === 'subuh'
                      ? '#EF4444'
                      : '#09473E',
                },
              ]}
              onPress={() => handlePreviewAudio('subuh')}
            >
              {azanState.isPlaying && azanState.prayerKey === 'subuh' ? (
                <VolumeX color="#FFFFFF" size={15} />
              ) : (
                <Volume2 color="#F9A729" size={15} />
              )}
              <Text style={styles.previewBtnText}>
                {azanState.isPlaying && azanState.prayerKey === 'subuh'
                  ? 'Stop Adzan Subuh'
                  : 'Tes Adzan Subuh'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SECTION: LOKASI & KALKULASI */}
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>METODE & LOKASI</Text>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <MapPin color={theme.iconi} size={20} />
              <View>
                <Text style={[styles.itemText, { color: theme.textPrimary }]}>GPS Otomatis</Text>
                <Text style={[styles.itemSubtext, { color: theme.textSecondary }]}>
                  Deteksi lokasi pengguna secara akurat
                </Text>
              </View>
            </View>
            <Switch
              value={autoLocation}
              onValueChange={(val) => setAutoLocation?.(val)}
              trackColor={{ false: theme.border, true: theme.textSecondary }}
              thumbColor={autoLocation ? theme.accent : theme.surface}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <TouchableOpacity style={styles.row} onPress={handleMethodSelect}>
            <View style={styles.rowLeft}>
              <Calculator color={theme.iconi} size={20} />
              <View>
                <Text style={[styles.itemText, { color: theme.textPrimary }]}>Metode Falak</Text>
                <Text style={[styles.itemSubtext, { color: theme.accent, fontWeight: '500' }]}>
                  {calculationMethod}
                </Text>
              </View>
            </View>
            <ChevronRight color={theme.textSecondary} size={18} />
          </TouchableOpacity>
        </View>

        {/* SECTION: INFORMASI APLIKASI */}
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>INFORMASI</Text>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Smartphone color={theme.iconi} size={20} />
              <Text style={[styles.itemText, { color: theme.textPrimary }]}>Versi Aplikasi</Text>
            </View>
            <Text style={[styles.itemSubtext, { color: theme.textSecondary, fontWeight: 'bold' }]}>
              v1.0.0
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <TouchableOpacity
            style={styles.row}
            onPress={() => Alert.alert('Privasi', 'Aplikasi ini menjaga data lokasi tetap di perangkat Anda.')}
          >
            <View style={styles.rowLeft}>
              <ShieldCheck color={theme.iconi} size={20} />
              <Text style={[styles.itemText, { color: theme.textPrimary }]}>Kebijakan Privasi</Text>
            </View>
            <ChevronRight color={theme.textSecondary} size={18} />
          </TouchableOpacity>
        </View>

        <View style={styles.brandFooter}>
          <Image
            source={isDarkMode ? LOGO_WHITE : LOGO_COLOR}
            style={styles.brandFooterLogo}
            resizeMode="contain"
          />
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            Aplikasi e-Istiwaain © 2026
          </Text>
        </View>
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <View style={[styles.modalContainer, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>{modalTitle}</Text>

            <ScrollView style={{ maxHeight: 300 }}>
              {modalOptions.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.modalItem, { borderBottomColor: theme.border }]}
                  onPress={() => {
                    onSelectCallback(item.value);
                    setModalVisible(false);
                  }}
                >
                  <Text style={[styles.modalItemText, { color: theme.textPrimary }]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={{ color: theme.accent, fontWeight: 'bold' }}>Batal</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  header: { marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 'bold' },
  subtitle: { fontSize: 13, marginTop: 4 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 12,
    letterSpacing: 1,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  itemText: { fontSize: 14, fontWeight: '600' },
  itemSubtext: { fontSize: 12, marginTop: 2 },
  divider: { height: 1, width: '100%' },
  previewRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 12,
  },
  previewBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  previewBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  brandFooter: {
    alignItems: 'center',
    marginVertical: 20,
  },
  brandFooterLogo: {
    width: 120,
    height: 56,
    marginBottom: 4,
  },
  footerText: { textAlign: 'center', fontSize: 12 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    borderRadius: 16,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalItem: {
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  modalItemText: {
    fontSize: 14,
  },
  closeButton: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 10,
  },
});
