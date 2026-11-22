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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Calculator, Eye, BookOpen, Sun, RotateCw, CheckCircle2 } from 'lucide-react-native';

import { useAppStore } from '../../store/useAppStore';
import { showAppDialog } from '../../components/ui/AppDialog';
import { colors } from '../../constants/colors';
import { useLocation } from '../../hooks/useLocation';
import { calculateFullHisab, getDefaultTimezone, getTimeZoneLabel } from '../../utils/falakMath';
import { IstiwaainiScene3D } from '../../components/IstiwaainiScene3D';

export const HisabScreen = () => {
  const isDarkMode = useAppStore((state) => state.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;
  const { location, refreshing, errorMsg, autoLocation, refetch } = useLocation();

  const [useGps, setUseGps] = useState<boolean>(autoLocation);

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
  const [modalTab, setModalTab] = useState<'3d' | 'guide'>('3d');
  const [replayKey, setReplayKey] = useState(0);

  // Handler Switch GPS
  useEffect(() => {
    if (useGps && location) {
      // Hitung Lintang
      const absLat = Math.abs(location.latitude);
      let lDeg = Math.floor(absLat);
      const lMinNot = (absLat - lDeg) * 60;
      let lMin = Math.floor(lMinNot);
      let lSec = Math.round((lMinNot - lMin) * 60);

      if (lSec === 60) {
        lSec = 0;
        lMin += 1;
      }
      if (lMin === 60) {
        lMin = 0;
        lDeg += 1;
      }

      setLatDeg(lDeg.toString());
      setLatMin(lMin.toString());
      setLatSec(lSec.toString());
      setLatDir(location.latitude < 0 ? 'S' : 'U');

      // Hitung Bujur
      const absLng = Math.abs(location.longitude);
      let gDeg = Math.floor(absLng);
      const gMinNot = (absLng - gDeg) * 60;
      let gMin = Math.floor(gMinNot);
      let gSec = Math.round((gMinNot - gMin) * 60);

      if (gSec === 60) {
        gSec = 0;
        gMin += 1;
      }
      if (gMin === 60) {
        gMin = 0;
        gDeg += 1;
      }

      setLngDeg(gDeg.toString());
      setLngMin(gMin.toString());
      setLngSec(gSec.toString());
      setLngDir(location.longitude >= 0 ? 'T' : 'B');
    } else if (!useGps) {
      setLatDeg('');
      setLatMin('');
      setLatSec('');
      setLngDeg('');
      setLngMin('');
      setLngSec('');
    }
  }, [useGps, location]);

  useEffect(() => {
    if (autoLocation) {
      setUseGps(true);
    }
  }, [autoLocation]);

  const handleGpsToggle = (value: boolean) => {
    setUseGps(value);
    if (value) {
      void refetch({ interactive: true });
    }
  };

  const gpsStatusText =
    useGps && refreshing && !location
      ? 'Mencari sinyal GPS...'
      : useGps && location
      ? location.addressName ||
        location.cityName ||
        `${location.latitude.toFixed(4)}°, ${location.longitude.toFixed(4)}°`
      : useGps && errorMsg
      ? errorMsg
      : 'Aktifkan untuk isi koordinat otomatis';

  // Fungsi Eksekusi Perhitungan Falak
  const handleCalculate = () => {
    if (!day || !month || !year || !hour || !minute || !second || !zone || !latDeg || !lngDeg) {
      showAppDialog({
        variant: 'warning',
        title: 'Data Belum Lengkap',
        message: 'Semua parameter tanggal, waktu, dan koordinat wajib diisi!',
        confirmText: 'Periksa Lagi',
      });
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
      latDeg: parseFloat(latDeg) || 0,
      latMin: parseFloat(latMin) || 0,
      latSec: parseFloat(latSec) || 0,
      latDir: latDir,
      lngDeg: parseFloat(lngDeg) || 0,
      lngMin: parseFloat(lngMin) || 0,
      lngSec: parseFloat(lngSec) || 0,
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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Title */}
        <Text style={[styles.title, { color: theme.textPrimary }]}>
          Hisab Istiwa'ani
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Kalkulasi Akurasi Tinggi Arah Kiblat & Posisi Matahari
        </Text>

        {/* Toggle Gunakan GPS */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.rowBetween}>
            <View style={[styles.row, { flex: 1, paddingRight: 10 }]}>
              <MapPin color={theme.accent} size={20} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={[styles.toggleLabel, { color: theme.textPrimary, marginLeft: 0 }]}>
                  Gunakan Koordinat GPS Saat Ini
                </Text>
                <Text
                  numberOfLines={1}
                  style={{ color: theme.textSecondary, fontSize: 11, marginTop: 2 }}
                >
                  {gpsStatusText}
                </Text>
              </View>
            </View>
            <Switch
              value={useGps}
              onValueChange={handleGpsToggle}
              trackColor={{ false: '#334155', true: '#10B981' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Form Waktu & Tanggal */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.sectionHeader, { color: theme.textPrimary }]}>PARAMETER WAKTU</Text>
          
          <View style={styles.rowInputs}>
            <TextInput style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]} placeholder="Tgl" placeholderTextColor={theme.textSecondary} value={day} onChangeText={setDay} keyboardType="numeric" />
            <TextInput style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]} placeholder="Bln" placeholderTextColor={theme.textSecondary} value={month} onChangeText={setMonth} keyboardType="numeric" />
            <TextInput style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]} placeholder="Thn" placeholderTextColor={theme.textSecondary} value={year} onChangeText={setYear} keyboardType="numeric" />
            <TextInput style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]} placeholder="Zona" placeholderTextColor={theme.textSecondary} value={zone} onChangeText={setZone} keyboardType="numeric" />
          </View>

          <View style={styles.rowInputs}>
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

            {/* TOMBOL ILUSTRASI VISUAL & CARA KERJA ALAT */}
            <TouchableOpacity
              style={styles.btnIllustration}
              onPress={() => {
                setModalTab('3d');
                setShowIllustration(true);
              }}
            >
              <Text style={styles.btnIllustrationText}>☀️ Ilustrasi Alat Istiwa'aini & Cara Pakai</Text>
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
                <Text style={[styles.resLabel, { color: theme.textSecondary }]}>Azm. Qiblat (AK)</Text>
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
                <Text style={[styles.resLabel, { color: theme.textSecondary }]}>Azm. Matahari (AM)</Text>
                <Text style={[styles.resVal, { color: theme.textPrimary }]}>{results.sunAzimuth}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={[styles.resLabel, { color: theme.textSecondary }]}>Tinggi Mthr (Irtafa')</Text>
                <Text style={[styles.resVal, { color: theme.textPrimary }]}>{results.sunAltitude}</Text>
              </View>
              <View style={[styles.resultRow, { backgroundColor: 'rgba(245, 158, 11, 0.08)', paddingHorizontal: 6, borderRadius: 6 }]}>
                <Text style={[styles.resLabel, { color: '#F59E0B', fontWeight: 'bold' }]}>Beda Azimut (BA = AK - AM)</Text>
                <Text style={[styles.resVal, { color: '#F59E0B', fontWeight: 'bold' }]}>{results.bedaAzimuth}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={[styles.resLabel, { color: theme.textSecondary }]}>Pjg. Bayangan (15cm)</Text>
                <Text style={[styles.resVal, { color: theme.textPrimary }]}>{results.shadowLength}</Text>
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

            {/* POP-UP MODAL ILUSTRASI & CARA KERJA ALAT */}
            <Modal
              visible={showIllustration}
              transparent
              animationType="fade"
              onRequestClose={() => setShowIllustration(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
                  {/* Segmented Control Switcher */}
                  <View style={styles.segmentContainer}>
                    <TouchableOpacity
                      style={[
                        styles.segmentBtn,
                        modalTab === '3d' && styles.segmentBtnActive,
                      ]}
                      onPress={() => setModalTab('3d')}
                    >
                      <Eye size={14} color={modalTab === '3d' ? '#FFFFFF' : theme.textSecondary} />
                      <Text
                        style={[
                          styles.segmentText,
                          modalTab === '3d' ? styles.segmentTextActive : { color: theme.textSecondary },
                        ]}
                      >
                        Simulasi 3D
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.segmentBtn,
                        modalTab === 'guide' && styles.segmentBtnActive,
                      ]}
                      onPress={() => setModalTab('guide')}
                    >
                      <BookOpen size={14} color={modalTab === 'guide' ? '#FFFFFF' : theme.textSecondary} />
                      <Text
                        style={[
                          styles.segmentText,
                          modalTab === 'guide' ? styles.segmentTextActive : { color: theme.textSecondary },
                        ]}
                      >
                        SOP Cara Pakai
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {modalTab === '3d' ? (
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center' }}>
                      <Text style={[styles.modalTitle, { color: theme.textPrimary, marginTop: 4 }]}>
                        Ilustrasi Alat Istiwa'aini 3D
                      </Text>
                      <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                        Simulasi Sinar Matahari, Bayangan Ganda & Penarikan Garis Kiblat
                      </Text>

                      <IstiwaainiScene3D
                        qiblaAzimuth={results.qiblaAzimuthNum ?? (parseFloat(results.qiblaAzimuth) || 0)}
                        sunAzimuth={results.sunAzimuthNum ?? (parseFloat(results.sunAzimuth) || 0)}
                        sunAltitude={results.sunAltitudeNum ?? 45}
                        bedaAzimuth={results.bedaAzimuthNum ?? 0}
                        replayKey={replayKey}
                        size={305}
                      />

                      <TouchableOpacity
                        onPress={() => setReplayKey((k) => k + 1)}
                        style={styles.replayButton}
                      >
                        <RotateCw size={14} color="#10B981" />
                        <Text style={{ color: '#10B981', fontWeight: 'bold', fontSize: 13 }}>
                          Putar Ulang Animasi
                        </Text>
                      </TouchableOpacity>

                      {/* DATA KUNCI CARA KERJA ALAT */}
                      <View style={styles.dataBadgeGrid}>
                        <View style={[styles.dataBadge, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
                          <Text style={styles.dataBadgeLabel}>☀️ Matahari (AM)</Text>
                          <Text style={[styles.dataBadgeVal, { color: '#F59E0B' }]}>{results.sunAzimuth}</Text>
                          <Text style={styles.dataBadgeSub}>Tinggi: {results.sunAltitude}</Text>
                        </View>
                        <View style={[styles.dataBadge, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                          <Text style={styles.dataBadgeLabel}>🕋 Kiblat (AK)</Text>
                          <Text style={[styles.dataBadgeVal, { color: '#10B981' }]}>{results.qiblaAzimuth}</Text>
                          <Text style={styles.dataBadgeSub}>Arah: {results.qiblaDirection}</Text>
                        </View>
                        <View style={[styles.dataBadge, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
                          <Text style={styles.dataBadgeLabel}>📐 Beda Azimut (BA)</Text>
                          <Text style={[styles.dataBadgeVal, { color: '#3B82F6' }]}>{results.bedaAzimuth}</Text>
                          <Text style={styles.dataBadgeSub}>Sudut Tarik Benang</Text>
                        </View>
                        <View style={[styles.dataBadge, { backgroundColor: 'rgba(148, 163, 184, 0.12)' }]}>
                          <Text style={styles.dataBadgeLabel}>📏 Bayangan (H=15cm)</Text>
                          <Text style={[styles.dataBadgeVal, { color: theme.textPrimary }]}>{results.shadowLength}</Text>
                          <Text style={styles.dataBadgeSub}>Arah Lawan Mthr</Text>
                        </View>
                      </View>
                    </ScrollView>
                  ) : (
                    <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
                      <Text style={[styles.modalTitle, { color: theme.textPrimary, marginTop: 4 }]}>
                        SOP Cara Penggunaan Alat Istiwa'aini
                      </Text>
                      <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                        Metode Penentuan Arah Kiblat karya Drs. KH. Slamet Hambali, M.Si
                      </Text>

                      {/* LANGKAH 1 */}
                      <View style={[styles.sopStepCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
                        <View style={styles.sopStepHeader}>
                          <View style={[styles.sopBadge, { backgroundColor: '#38BDF8' }]}>
                            <Text style={styles.sopBadgeText}>1</Text>
                          </View>
                          <Text style={[styles.sopStepTitle, { color: theme.textPrimary }]}>
                            Penyetelan Datar (Leveling / Waterpass)
                          </Text>
                        </View>
                        <Text style={[styles.sopStepDesc, { color: theme.textSecondary }]}>
                          Letakkan instrumen Istiwa'aini di tempat terbuka yang terkena sinar matahari langsung. Putar 3 baut penyetel kaki hingga gelembung waterpass tepat berada di tengah lingkaran. Pastikan kedua tongkat (tongkat pusat & tongkat 0°) berdiri tegak lurus (90°).
                        </Text>
                      </View>

                      {/* LANGKAH 2 */}
                      <View style={[styles.sopStepCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
                        <View style={styles.sopStepHeader}>
                          <View style={[styles.sopBadge, { backgroundColor: '#F59E0B' }]}>
                            <Text style={styles.sopBadgeText}>2</Text>
                          </View>
                          <Text style={[styles.sopStepTitle, { color: theme.textPrimary }]}>
                            Siapkan Data Beda Azimut (BA)
                          </Text>
                        </View>
                        <Text style={[styles.sopStepDesc, { color: theme.textSecondary }]}>
                          Hitung selisih sudut antara Azimut Kiblat (AK) dan Azimut Matahari (AM) pada jam pengukuran:
                        </Text>
                        <View style={styles.formulaBox}>
                          <Text style={styles.formulaTxt}>BA = AK - AM = {results.qiblaAzimuth} - {results.sunAzimuth} = {results.bedaAzimuth}</Text>
                        </View>
                      </View>

                      {/* LANGKAH 3 */}
                      <View style={[styles.sopStepCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
                        <View style={styles.sopStepHeader}>
                          <View style={[styles.sopBadge, { backgroundColor: '#DC2626' }]}>
                            <Text style={styles.sopBadgeText}>3</Text>
                          </View>
                          <Text style={[styles.sopStepTitle, { color: theme.textPrimary }]}>
                            Pembidikan Sinar Matahari (Titik 0°)
                          </Text>
                        </View>
                        <Text style={[styles.sopStepDesc, { color: theme.textSecondary }]}>
                          Arahkan atau putar piringan dial hingga tongkat yang berada di titik 0° lingkaran tepat menghadap ke arah datangnya matahari. Pembidikan dinyatakan tepat saat bayangan tongkat 0° jatuh memanjang lurus mengenai tongkat di titik pusat lingkaran dial.
                        </Text>
                      </View>

                      {/* LANGKAH 4 */}
                      <View style={[styles.sopStepCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
                        <View style={styles.sopStepHeader}>
                          <View style={[styles.sopBadge, { backgroundColor: '#10B981' }]}>
                            <Text style={styles.sopBadgeText}>4</Text>
                          </View>
                          <Text style={[styles.sopStepTitle, { color: theme.textPrimary }]}>
                            Penarikan Garis Arah Kiblat
                          </Text>
                        </View>
                        <Text style={[styles.sopStepDesc, { color: theme.textSecondary }]}>
                          Tarik seutas benang penunjuk dari <Text style={{ fontWeight: 'bold' }}>Tongkat Pusat</Text> ke angka derajat piringan dial sebesar nilai Beda Azimut (<Text style={{ color: '#10B981', fontWeight: 'bold' }}>{results.bedaAzimuth}</Text>).
                        </Text>
                        <Text style={[styles.sopStepDesc, { color: '#10B981', fontWeight: '600', marginTop: 4 }]}>
                          ✓ Garis lurus benang tersebut adalah Arah Kiblat hakiki yang presisi bebas dari gangguan medan magnet kompas.
                        </Text>
                      </View>
                    </ScrollView>
                  )}

                  <TouchableOpacity
                    style={styles.btnCloseModal}
                    onPress={() => setShowIllustration(false)}
                  >
                    <Text style={styles.btnCloseText}>Tutup</Text>
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
    padding: 12,
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
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxHeight: '92%',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.08)',
    borderRadius: 10,
    padding: 3,
    marginBottom: 12,
    width: '100%',
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  segmentBtnActive: {
    backgroundColor: '#0284C7',
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 12,
  },
  replayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  dataBadgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    width: '100%',
  },
  dataBadge: {
    flex: 1,
    minWidth: '47%',
    padding: 10,
    borderRadius: 10,
  },
  dataBadgeLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  dataBadgeVal: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
  },
  dataBadgeSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },

  // SOP Card Styles
  sopStepCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    width: '100%',
  },
  sopStepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  sopBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sopBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  sopStepTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    flex: 1,
  },
  sopStepDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  formulaBox: {
    backgroundColor: '#0F172A',
    padding: 8,
    borderRadius: 6,
    marginTop: 6,
  },
  formulaTxt: {
    color: '#FDE68A',
    fontSize: 11,
    fontFamily: 'monospace',
  },

  btnCloseModal: {
    marginTop: 14,
    width: '100%',
    backgroundColor: '#334155',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnCloseText: {
    color: '#F8FAFC',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
