import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
} from 'react-native';
import {
  Moon,
  Sun,
  Bell,
  Volume2,
  MapPin,
  Calculator,
  ChevronRight,
  Smartphone,
  ShieldCheck,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppStore } from '../../store/useAppStore';
import { colors } from '../../constants/colors';
import { CalculationMethod } from '../../utils/falakMath';

export const SettingsScreen = () => {
  const insets = useSafeAreaInsets();

  // Integrated Store States & Actions
  const isDarkMode = useAppStore((state) => state.isDarkMode);
  const toggleTheme = useAppStore((state) => state.toggleTheme);
  
  const adhanSound = useAppStore((state) => state.adhanSound) ?? 'Azan Makkah';
  const setAdhanSound = useAppStore((state) => (state as any).setAdhanSound);

  const notificationsEnabled = useAppStore((state) => (state as any).notificationsEnabled) ?? true;
  const setNotificationsEnabled = useAppStore((state) => (state as any).setNotificationsEnabled);

  const autoLocation = useAppStore((state) => (state as any).autoLocation) ?? true;
  const setAutoLocation = useAppStore((state) => (state as any).setAutoLocation);

  const calculationMethod = useAppStore((state) => (state as any).calculationMethod) ?? 'Kemenag RI (Falak)';
  const setCalculationMethod = useAppStore((state) => (state as any).setCalculationMethod);

  const theme = isDarkMode ? colors.dark : colors.light;

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
    setOnSelectCallback(() => (val: string) => setCalculationMethod(val));
    setModalVisible(true);
  };

  const handleAudioSelect = () => {
    setModalTitle('Pilih Suara Notifikasi');
    setModalOptions([
      { label: 'Azan Makkah', value: 'makkah' },
      { label: 'Azan Madinah', value: 'madinah' },
      { label: 'Nada Bip Singkat', value: 'bip' },
      { label: 'Senyap (Silent)', value: 'silent' },
    ]);
    setOnSelectCallback(() => (val: string) => setAdhanSound(val));
    setModalVisible(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header dengan Safe Area Padding */}
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
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>NOTIFIKASI & ALARM</Text>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Bell color={theme.iconi} size={20} />
              <View>
                <Text style={[styles.itemText, { color: theme.textPrimary }]}>Pengingat Shalat</Text>
                <Text style={[styles.itemSubtext, { color: theme.textSecondary }]}>
                  Aktifkan semua notifikasi azan
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
                <Text style={[styles.itemText, { color: theme.textPrimary }]}>Suara Notifikasi</Text>
                <Text style={[styles.itemSubtext, { color: theme.accent, fontWeight: '500' }]}>
                  {adhanSound === 'silent' ? 'Senyap (Silent)' : adhanSound}
                </Text>
              </View>
            </View>
            <ChevronRight color={theme.textSecondary} size={18} />
          </TouchableOpacity>
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

        <Text style={[styles.footerText, { color: theme.textSecondary }]}>
          Aplikasi e-istiwaain © 2026
        </Text>
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
  footerText: { textAlign: 'center', fontSize: 12, marginVertical: 24 },
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