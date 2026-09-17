import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView} from 'react-native-safe-area-context';
import { MapPin, Calculator } from 'lucide-react-native';

import { useAppStore } from '../../store/useAppStore';
import { colors } from '../../constants/colors';
import { useLocation } from '../../hooks/useLocation';
import { calculateFullHisab, getDefaultTimezone, getTimeZoneLabel } from '../../utils/falakMath';

export const HisabScreen = () => {
  
  const isDarkMode = useAppStore((state) => state.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;
  const { location } = useLocation();

  const [useGps, setUseGps] = useState(false);

  // Input Parameter Tanggal & Waktu
  const now = new Date();
  const [day, setDay] = useState(now.getDate().toString());
  const [month, setMonth] = useState((now.getMonth() + 1).toString());
  const [year, setYear] = useState(now.getFullYear().toString());
  const [hour, setHour] = useState(now.getHours().toString());
  const [minute, setMinute] = useState(now.getMinutes().toString());
  const [second, setSecond] = useState(now.getSeconds().toString());
  const [zone, setZone] = useState(getDefaultTimezone().toString());


  // Input Parameter Lintang & Bujur (DMS)
  const [latDeg, setLatDeg] = useState('');
  const [latMin, setLatMin] = useState('');
  const [latSec, setLatSec] = useState('');
  const [latDir, setLatDir] = useState<'U' | 'S'>('S');

  const [lngDeg, setLngDeg] = useState('');
  const [lngMin, setLngMin] = useState('');
  const [lngSec, setLngSec] = useState('');
  const [lngDir, setLngDir] = useState<'T' | 'B'>('T');

  // State Hasil Kalkulasi
  const [results, setResults] = useState<any>(null);
  const [showIllustration, setShowIllustration] = useState(false);

  // Handler Switch GPS
  useEffect(() => {
    if (useGps && location) {
      // Hitung Lintang
      const absLat = Math.abs(location.latitude);
      const lDeg = Math.floor(absLat);
      const lMinNot = (absLat - lDeg) * 60;
      const lMin = Math.floor(lMinNot);
      const lSec = Math.round((lMinNot - lMin) * 60);

      setLatDeg(lDeg.toString());
      setLatMin(lMin.toString());
      setLatSec(lSec.toString());
      setLatDir(location.latitude < 0 ? 'S' : 'U');

      // Hitung Bujur
      const absLng = Math.abs(location.longitude);
      const gDeg = Math.floor(absLng);
      const gMinNot = (absLng - gDeg) * 60;
      const gMin = Math.floor(gMinNot);
      const gSec = Math.round((gMinNot - gMin) * 60);

      setLngDeg(gDeg.toString());
      setLngMin(gMin.toString());
      setLngSec(gSec.toString());
      setLngDir(location.longitude >= 0 ? 'T' : 'B');
    } else if (!useGps) {
      // Reset input koordinat saat switch dimatikan
      setLatDeg('');
      setLatMin('');
      setLatSec('');
      setLngDeg('');
      setLngMin('');
      setLngSec('');
    }
  }, [useGps, location]); // Berjalan tiap kali useGps atau location berubah

  // Handler Switch cukup ubah state useGps saja
  const handleGpsToggle = (value: boolean) => {
    setUseGps(value);
  };

  // Fungsi Eksekusi Perhitungan Falak
  const handleCalculate = () => {
    if (!day || !month || !year || !hour || !minute || !second || !zone || !latDeg || !lngDeg) {
      Alert.alert('Data Belum Lengkap', 'Semua parameter wajib diisi!');
      return;
    }

    const calcResults = calculateFullHisab({
      year: parseInt(year),
      month: parseInt(month),
      day: parseInt(day),
      hour: parseInt(hour),
      minute: parseInt(minute),
      second: parseInt(second),
      zone: parseFloat(zone),
      latDeg: parseFloat(latDeg),
      latMin: parseFloat(latMin),
      latSec: parseFloat(latSec),
      latDir: latDir,
      lngDeg: parseFloat(lngDeg),
      lngMin: parseFloat(lngMin),
      lngSec: parseFloat(lngSec),
      lngDir: lngDir,
    });

    setResults(calcResults);
  };

  const handleReset = () => {
    setYear('');
    setMonth('');
    setDay('');
    setHour('');
    setMinute('');
    setSecond('');
    setLatDeg('');
    setLatMin('');
    setLatSec('');
    setLngDeg('');
    setLngMin('');
    setLngSec('');
    setResults(null);
    setUseGps(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={
        styles.scrollContent}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Hisab Istiwa'aini</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Masukkan parameter untuk perhitungan
        </Text>

        {/* Switch Lokasi GPS */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.rowBetween}>
            <View style={styles.row}>
              <MapPin color={theme.accent} size={20} />
              <Text style={[styles.toggleLabel, { color: theme.textPrimary }]}>
                Gunakan Lokasi Saat ini
              </Text>
            </View>
            <Switch 
              value={useGps} 
              onValueChange={handleGpsToggle} 
              trackColor={{ false: theme.border, true: theme.border }}
              thumbColor={useGps ? theme.accent : theme.surface}
              />
          </View>
        </View>

        {/* Form Tanggal & Waktu */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.sectionHeader, { color: theme.textPrimary }]}>TANGGAL & WAKTU</Text>
          <View style={styles.rowInputs}>
            <TextInput style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]} placeholder="Tgl" placeholderTextColor={theme.textSecondary} value={day} onChangeText={setDay} keyboardType="numeric" />
            <TextInput style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]} placeholder="Bln" placeholderTextColor={theme.textSecondary} value={month} onChangeText={setMonth} keyboardType="numeric" />
            <TextInput style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]} placeholder="Thn" placeholderTextColor={theme.textSecondary} value={year} onChangeText={setYear} keyboardType="numeric" />
          </View>
          <View style={styles.rowInputs}>
            <TextInput style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]} placeholder="Zona" placeholderTextColor={theme.textSecondary} value={zone} onChangeText={setZone} keyboardType="numeric" />
            <TextInput style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]} placeholder="Jam" placeholderTextColor={theme.textSecondary} value={hour} onChangeText={setHour} keyboardType="numeric" />
            <TextInput style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]} placeholder="Mnt" placeholderTextColor={theme.textSecondary} value={minute} onChangeText={setMinute} keyboardType="numeric" />
            <TextInput style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]} placeholder="Dtk" placeholderTextColor={theme.textSecondary} value={second} onChangeText={setSecond} keyboardType="numeric" />
          </View>
        </View>

        {/* Form Koordinat Lokasi */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.sectionHeader, { color: theme.textPrimary }]}>KOORDINAT LOKASI</Text>
          
          <Text style={[styles.inputSubLabel, { color: theme.textSecondary }]}>Lintang</Text>
          <View style={styles.rowInputs}>
            <TextInput style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]} value={latDeg} onChangeText={setLatDeg} keyboardType="numeric" placeholder="°" />
            <TextInput style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]} value={latMin} onChangeText={setLatMin} keyboardType="numeric" placeholder="'" />
            <TextInput style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]} value={latSec} onChangeText={setLatSec} keyboardType="numeric" placeholder='"' />
            <TouchableOpacity style={[styles.dirBtn, { borderColor: theme.border }]} onPress={() => setLatDir(latDir === 'S' ? 'U' : 'S')}>
              <Text style={{ color: theme.textPrimary, fontWeight: 'bold' }}>{latDir}</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.inputSubLabel, { color: theme.textSecondary, marginTop: 8 }]}>Bujur</Text>
          <View style={styles.rowInputs}>
            <TextInput style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]} value={lngDeg} onChangeText={setLngDeg} keyboardType="numeric" placeholder="°" />
            <TextInput style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]} value={lngMin} onChangeText={setLngMin} keyboardType="numeric" placeholder="'" />
            <TextInput style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]} value={lngSec} onChangeText={setLngSec} keyboardType="numeric" placeholder='"' />
            <TouchableOpacity style={[styles.dirBtn, { borderColor: theme.border }]} onPress={() => setLngDir(lngDir === 'T' ? 'B' : 'T')}>
              <Text style={{ color: theme.textPrimary, fontWeight: 'bold' }}>{lngDir}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.calcButton, { backgroundColor: '#10B981' }]}
            onPress={handleCalculate}
          >
            <Text style={styles.calcBtnText}>HITUNG SEKARANG</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnReset, { borderColor: '#EF4444' }]}
            onPress={handleReset}
          >
            <Text style={[styles.btnResetText, { color: '#EF4444' }]}>HAPUS</Text>
          </TouchableOpacity>
        </View>

        {/* HASIL KALKULASI */}
        {results && (
          <View style={{ marginTop: 10 }}>
            <Text style={[styles.sectionHeader, { color: theme.textPrimary }]}>
              Hasil Kalkulasi
            </Text>

            {/* TOMBOL ILUSTRASI VISUAL */}
            <TouchableOpacity
              style={styles.btnIllustration}
              onPress={() => setShowIllustration(true)}
            >
              <Text style={styles.btnIllustrationText}>🗺️ Lihat Ilustrasi Visual Arah</Text>
            </TouchableOpacity>

            {/* CARD 1: PARAMETER KALKULASI UTAMA */}
            <View style={[styles.card, { backgroundColor: theme.surface }]}>
              <View style={styles.resultRow}>
                <Text style={[styles.resLabel, { color: theme.textSecondary }]}>Declinasi</Text>
                <Text style={[styles.resVal, { color: theme.textPrimary }]}>{results.declination}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={[styles.resLabel, { color: theme.textSecondary }]}>L. Tempat</Text>
                <Text style={[styles.resVal, { color: theme.textPrimary }]}>{results.latPlace}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={[styles.resLabel, { color: theme.textSecondary }]}>B. Tempat</Text>
                <Text style={[styles.resVal, { color: theme.textPrimary }]}>{results.lngPlace}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={[styles.resLabel, { color: theme.textSecondary }]}>Z. Waktu</Text>
                <Text style={[styles.resVal, { color: theme.textPrimary }]}>{results.timeZone}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={[styles.resLabel, { color: theme.textSecondary }]}>Eq. of Time</Text>
                <Text style={[styles.resVal, { color: theme.textPrimary }]}>{results.eqOfTime}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={[styles.resLabel, { color: theme.textSecondary }]}>Lintang Ka'bah</Text>
                <Text style={[styles.resVal, { color: theme.textPrimary }]}>{results.kabaLat}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={[styles.resLabel, { color: theme.textSecondary }]}>Bujur Ka'bah</Text>
                <Text style={[styles.resVal, { color: theme.textPrimary }]}>{results.kabaLng}</Text>
              </View>
              <View style={[styles.resultRow, { borderBottomWidth: 0 }]}>
                <Text style={[styles.resLabel, { color: theme.textSecondary }]}>SBMD</Text>
                <Text style={[styles.resVal, { color: theme.textPrimary }]}>{results.sbmd}</Text>
              </View>
            </View>

            {/* CARD 2: HASIL ARAH & AZIMUTH */}
            <View style={[styles.card, { backgroundColor: theme.surface }]}>
              <View style={styles.resultRow}>
                <Text style={[styles.resLabel, { color: theme.textSecondary }]}>Arah Qiblat</Text>
                <Text style={[styles.resVal, { color: theme.textPrimary }]}>{results.qiblaDirection}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={[styles.resLabel, { color: theme.textSecondary }]}>Azm. Qiblat</Text>
                <Text style={[styles.resVal, { color: theme.textPrimary }]}>{results.qiblaAzimuth}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={[styles.resLabel, { color: theme.textSecondary }]}>Sudut Wkt. Mthr</Text>
                <Text style={[styles.resVal, { color: theme.textPrimary }]}>{results.sunHourAngle}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={[styles.resLabel, { color: theme.textSecondary }]}>Arah Matahari</Text>
                <Text style={[styles.resVal, { color: theme.textPrimary }]}>{results.sunDirection}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={[styles.resLabel, { color: theme.textSecondary }]}>Azm. Matahari</Text>
                <Text style={[styles.resVal, { color: theme.textPrimary }]}>{results.sunAzimuth}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={[styles.resLabel, { color: theme.textSecondary }]}>Sdt. Wkt. Sbt Mthr</Text>
                <Text style={[styles.resVal, { color: theme.textPrimary }]}>{results.sunSetHourAngle}</Text>
              </View>
              <View style={[styles.resultRow, { borderBottomWidth: 0 }]}>
                <Text style={[styles.resLabel, { color: theme.textSecondary }]}>Bdg. Sdt Wkt Sbt</Text>
                <Text style={[styles.resVal, { color: theme.textPrimary }]}>{results.bdgSdtWktSbt}</Text>
              </View>
            </View>

            {/* CARD 3: BANNER RASHDUL QIBLAT */}
            <View style={styles.rashdulCard}>
              <Text style={styles.rashdulTitle}>WAKTU RASHDUL QIBLAT</Text>
              <View style={styles.rashdulRow}>
                <View style={styles.rashdulCol}>
                  <Text style={styles.rashdulLabel}>Waktu Istiwa'</Text>
                  <Text style={styles.rashdulValWhite}>{results.rashdulIstiwa}</Text>
                </View>
                <View style={[styles.rashdulCol, { alignItems: 'flex-end' }]}>
                  <Text style={styles.rashdulLabel}>Waktu WIB</Text>
                  <Text style={styles.rashdulValAmber}>{results.rashdulWib}</Text>
                </View>
              </View>
            </View>

            {/* POP-UP MODAL ILUSTRASI */}
            <Modal
              visible={showIllustration}
              transparent
              animationType="fade"
              onRequestClose={() => setShowIllustration(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
                  <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                    Ilustrasi Arah Azimuth
                  </Text>
                  <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                    Visualisasi Posisi Kiblat & Matahari dari Utara (0°)
                  </Text>

                  {/* KOMPAS VISUAL */}
                  <View style={styles.compassCircle}>
                    <Text style={[styles.cardinalText, { top: 6 }]}>U (0°)</Text>
                    <Text style={[styles.cardinalText, { right: 8 }]}>T (90°)</Text>
                    <Text style={[styles.cardinalText, { bottom: 6 }]}>S (180°)</Text>
                    <Text style={[styles.cardinalText, { left: 8 }]}>B (270°)</Text>

                    {/* Jarum Kiblat */}
                    <View
                      style={[
                        styles.needleContainer,
                        { transform: [{ rotate: `${parseFloat(results.qiblaAzimuth) || 0}deg` }] },
                      ]}
                    >
                      <View style={[styles.needlePointer, { backgroundColor: '#10B981' }]} />
                      <View style={styles.qiblaBadge}>
                        <Text style={styles.badgeText}>🕋 Kiblat</Text>
                      </View>
                    </View>

                    {/* Jarum Matahari */}
                    <View
                      style={[
                        styles.needleContainer,
                        { transform: [{ rotate: `${parseFloat(results.sunAzimuth) || 0}deg` }] },
                      ]}
                    >
                      <View style={[styles.needlePointer, { backgroundColor: '#F59E0B' }]} />
                      <View style={styles.sunBadge}>
                        <Text style={styles.badgeText}>☀️ Mthr</Text>
                      </View>
                    </View>

                    <View style={styles.centerDot} />
                  </View>

                  {/* KETERANGAN / LEGEND */}
                  <View style={styles.legendContainer}>
                    <View style={styles.legendItem}>
                      <View style={[styles.dotLegend, { backgroundColor: '#10B981' }]} />
                      <Text style={[styles.legendText, { color: theme.textPrimary }]}>
                        Azm. Kiblat: <Text style={{ fontWeight: 'bold' }}>{results.qiblaAzimuth}</Text>
                      </Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.dotLegend, { backgroundColor: '#F59E0B' }]} />
                      <Text style={[styles.legendText, { color: theme.textPrimary }]}>
                        Azm. Matahari: <Text style={{ fontWeight: 'bold' }}>{results.sunAzimuth}</Text>
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.btnCloseModal}
                    onPress={() => setShowIllustration(false)}
                  >
                    <Text style={styles.btnCloseText}>Tutup Ilustrasi</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  scrollContent: {
    padding: 12, // Memastikan scroll tidak tertutup bottom navbar
  },
  title: { fontSize: 20, fontWeight: 'bold', marginTop: 12 },
  subtitle: { fontSize: 13, marginBottom: 16 },
  card: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 12 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
  toggleLabel: { marginLeft: 8, fontSize: 14, fontWeight: '600' },
  sectionHeader: { fontSize: 12, fontWeight: 'bold', marginBottom: 10, letterSpacing: 0.5 },
  rowInputs: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  input: { flex: 1, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, textAlign: 'center', fontSize: 13 },
  inputSubLabel: { fontSize: 11, marginBottom: 4 },
  dirBtn: { flex: 1, borderWidth: 1, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    marginBottom: 8,
  },
  calcButton: { flex: 2, justifyContent: 'center', alignItems: 'center', padding: 14, borderRadius: 10 },
  calcBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  btnReset: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  btnResetText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  btnIllustration: {
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  btnIllustrationText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#E2E8F0' },
  resLabel: { fontSize: 13 },
  resVal: { fontSize: 13, fontWeight: 'bold' },
  rashdulCard: {
    backgroundColor: '#006C4E',
    borderRadius: 20,
    padding: 16,
    marginTop: 6,
  },
  rashdulTitle: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  rashdulRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rashdulCol: { flex: 1 },
  rashdulLabel: { color: '#E2E8F0', fontSize: 11, marginBottom: 4 },
  rashdulValWhite: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  rashdulValAmber: { color: '#F59E0B', fontSize: 18, fontWeight: 'bold' },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },

  // Compass Visualiser
  compassCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: '#334155',
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cardinalText: {
    position: 'absolute',
    color: '#64748B',
    fontSize: 11,
    fontWeight: 'bold',
  },
  centerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F8FAFC',
    zIndex: 10,
  },
  needleContainer: {
    position: 'absolute',
    width: 4,
    height: 170,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  needlePointer: {
    width: 4,
    height: 75,
    borderRadius: 2,
  },
  qiblaBadge: {
    position: 'absolute',
    top: -12,
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sunBadge: {
    position: 'absolute',
    top: -12,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },

  // Legend & Modal Close
  legendContainer: {
    marginTop: 20,
    width: '100%',
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dotLegend: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 13,
  },
  btnCloseModal: {
    marginTop: 20,
    width: '100%',
    backgroundColor: '#334155',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnCloseText: {
    color: '#F8FAFC',
    fontWeight: 'bold',
  },
});