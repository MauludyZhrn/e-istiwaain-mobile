import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Magnetometer } from 'expo-sensors';
import { CameraView, useCameraPermissions } from 'expo-camera';
import {
  Compass,
  Camera,
  ArrowUp,
  Calculator,
  MapPin,
  CheckCircle2,
  RotateCw,
  Info,
} from 'lucide-react-native';

import { useAppStore } from '../../store/useAppStore';
import { colors } from '../../constants/colors';
import { useLocation } from '../../hooks/useLocation';
import {
  calculateQiblaDetails,
  QiblaCalculationDetail,
} from '../../utils/falakMath';

const { width } = Dimensions.get('window');
const COMPASS_SIZE = Math.min(width * 0.78, 310);

type ScreenTab = 'compass' | 'camera' | 'falak';

export const CompassScreen = () => {
  const isDarkMode = useAppStore((state) => state.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;
  const { location } = useLocation();

  // Mode Tampilan: Kompas 2D, Kamera AR, atau Detail Perhitungan Falak
  const [activeTab, setActiveTab] = useState<ScreenTab>('compass');
  const [permission, requestPermission] = useCameraPermissions();

  // Sensor Magnetometer State dengan Smoothing Filter (EMA Vektor)
  const [heading, setHeading] = useState<number>(0);
  const smoothSinRef = useRef<number>(0);
  const smoothCosRef = useRef<number>(1);
  const isInitializedRef = useRef<boolean>(false);

  useEffect(() => {
    Magnetometer.setUpdateInterval(60);

    const subscription = Magnetometer.addListener((data) => {
      const x = data?.x ?? 0;
      const y = data?.y ?? 0;
      if (x === 0 && y === 0) return;

      // Sudut polar terhadap sumbu layar ponsel (0° = Top HP menunjuk ke Utara Magnetik)
      const rawAngle = Math.atan2(-x, y) * (180 / Math.PI);
      if (isNaN(rawAngle)) return;
      const rawHeading = (rawAngle + 360) % 360;

      const rad = (rawHeading * Math.PI) / 180;
      const curSin = Math.sin(rad);
      const curCos = Math.cos(rad);

      // Low-pass filter (Exponential Moving Average) pada koordinat polar sin/cos
      // Mencegah jittering jarum dan menangani transisi 0° <-> 360° secara mulus
      const alpha = isInitializedRef.current ? 0.22 : 1.0;
      smoothSinRef.current = smoothSinRef.current * (1 - alpha) + curSin * alpha;
      smoothCosRef.current = smoothCosRef.current * (1 - alpha) + curCos * alpha;
      isInitializedRef.current = true;

      const smoothed =
        (Math.atan2(smoothSinRef.current, smoothCosRef.current) * (180 / Math.PI) +
          360) %
        360;

      setHeading(Math.round(smoothed));
    });

    return () => subscription.remove();
  }, []);

  // Hitung Data Presisi Falak Arah Kiblat
  const userLat = location?.latitude ?? -6.9982;
  const userLng = location?.longitude ?? 110.4079;

  const qiblaData: QiblaCalculationDetail = useMemo(() => {
    return calculateQiblaDetails(userLat, userLng);
  }, [userLat, userLng]);

  const qiblaAzimuth = qiblaData.qiblaAzimuth;

  // Selisih sudut relatif terhadap arah HP (-180° s/d 180°)
  const angleDiff = ((qiblaAzimuth - heading + 540) % 360) - 180;
  const isFacingQibla = Math.abs(angleDiff) <= 3;
  const isUltraPrecise = Math.abs(angleDiff) <= 1;

  const getDirectionHint = () => {
    if (isUltraPrecise) return 'Arah Kiblat Sangat Presisi! 🕋';
    if (isFacingQibla) return 'Arah Kiblat Tepat! 🕋';
    return angleDiff > 0
      ? `Putar ${Math.round(angleDiff)}° ke Kanan ➡️`
      : `Putar ${Math.round(Math.abs(angleDiff))}° ke Kiri ⬅️`;
  };

  const handleToggleCamera = async () => {
    if (activeTab === 'camera') {
      setActiveTab('compass');
      return;
    }
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) return;
    }
    setActiveTab('camera');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* HEADER UTAMA */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>
            Kompas & Hisab Kiblat
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Azimuth: {qiblaAzimuth.toFixed(2)}° ({qiblaData.qiblaAzimuthDMS})
          </Text>
        </View>

        {/* Action Buttons: Kamera AR & Tab Hisab */}
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              {
                backgroundColor:
                  activeTab === 'camera' ? theme.accent : theme.surface,
                borderColor: theme.border,
              },
            ]}
            onPress={handleToggleCamera}
            accessibilityLabel="Buka Kamera AR"
          >
            <Camera
              color={activeTab === 'camera' ? '#FFFFFF' : theme.iconi}
              size={20}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleBtn,
              {
                backgroundColor:
                  activeTab === 'falak' ? theme.accent : theme.surface,
                borderColor: theme.border,
              },
            ]}
            onPress={() =>
              setActiveTab(activeTab === 'falak' ? 'compass' : 'falak')
            }
            accessibilityLabel="Lihat Perhitungan Falak"
          >
            <Calculator
              color={activeTab === 'falak' ? '#FFFFFF' : theme.iconi}
              size={20}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* SEGMENTED TAB SELECTOR */}
      <View
        style={[
          styles.tabBar,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'compass' && {
              backgroundColor: theme.primary,
            },
          ]}
          onPress={() => setActiveTab('compass')}
        >
          <Compass
            size={16}
            color={activeTab === 'compass' ? '#FFFFFF' : theme.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === 'compass' ? '#FFFFFF' : theme.textSecondary,
                fontWeight: activeTab === 'compass' ? '700' : '500',
              },
            ]}
          >
            Kompas 2D
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'camera' && {
              backgroundColor: theme.primary,
            },
          ]}
          onPress={handleToggleCamera}
        >
          <Camera
            size={16}
            color={activeTab === 'camera' ? '#FFFFFF' : theme.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === 'camera' ? '#FFFFFF' : theme.textSecondary,
                fontWeight: activeTab === 'camera' ? '700' : '500',
              },
            ]}
          >
            Kamera AR
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'falak' && {
              backgroundColor: theme.primary,
            },
          ]}
          onPress={() => setActiveTab('falak')}
        >
          <Calculator
            size={16}
            color={activeTab === 'falak' ? '#FFFFFF' : theme.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === 'falak' ? '#FFFFFF' : theme.textSecondary,
                fontWeight: activeTab === 'falak' ? '700' : '500',
              },
            ]}
          >
            Hisab Falak
          </Text>
        </TouchableOpacity>
      </View>

      {/* TAMPILAN 1: MODE KAMERA AR */}
      {activeTab === 'camera' && (
        <View style={styles.cameraContainer}>
          <CameraView style={StyleSheet.absoluteFill} facing="back" />

          <View style={styles.arOverlay}>
            <View
              style={[
                styles.reticle,
                {
                  borderColor: isFacingQibla ? theme.accent : 'rgba(255,255,255,0.7)',
                  backgroundColor: isFacingQibla
                    ? 'rgba(245, 158, 11, 0.25)'
                    : 'rgba(0,0,0,0.45)',
                },
              ]}
            >
              <ArrowUp
                color={isFacingQibla ? theme.accent : '#FFFFFF'}
                size={52}
                style={{ transform: [{ rotate: `${angleDiff}deg` }] }}
              />
            </View>

            <View
              style={[
                styles.arBadge,
                {
                  backgroundColor: isFacingQibla
                    ? '#059669'
                    : 'rgba(15, 23, 42, 0.85)',
                  borderColor: isFacingQibla ? '#10B981' : '#334155',
                },
              ]}
            >
              <Text style={styles.arBadgeText}>{getDirectionHint()}</Text>
              <Text style={styles.arSubText}>
                Heading HP: {heading}° | Target Kiblat: {qiblaAzimuth.toFixed(1)}°
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* TAMPILAN 2: KOMPAS 2D INTERAKTIF */}
      {activeTab === 'compass' && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          <View style={styles.compassWrapper}>
            {/* Penunjuk Depan HP (Fixed Top Marker) */}
            <View
              style={[
                styles.topPointer,
                {
                  backgroundColor: isFacingQibla ? theme.accent : '#EF4444',
                  shadowColor: isFacingQibla ? theme.accent : '#EF4444',
                  shadowOpacity: 0.8,
                  shadowRadius: 6,
                },
              ]}
            />

            {/* Piringan Kompas Utama (Berputar Sejalan -heading HP) */}
            <View
              style={[
                styles.dial,
                {
                  width: COMPASS_SIZE,
                  height: COMPASS_SIZE,
                  borderRadius: COMPASS_SIZE / 2,
                  borderColor: isFacingQibla ? theme.accent : theme.border,
                  backgroundColor: theme.surface,
                  transform: [{ rotate: `${-heading}deg` }],
                  shadowColor: isFacingQibla ? theme.accent : '#000',
                  shadowOpacity: isFacingQibla ? 0.35 : 0.1,
                  shadowRadius: 10,
                  elevation: 6,
                },
              ]}
            >
              {/* Garis Penanda Derajat (Tick Marks Keliling Kompas) */}
              {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(
                (deg) => (
                  <View
                    key={deg}
                    style={[
                      styles.tickMark,
                      {
                        height: deg % 90 === 0 ? 12 : 6,
                        width: deg % 90 === 0 ? 3 : 1.5,
                        backgroundColor:
                          deg === 0
                            ? '#EF4444'
                            : deg % 90 === 0
                            ? theme.textPrimary
                            : theme.textSecondary,
                        transform: [
                          { rotate: `${deg}deg` },
                          { translateY: -(COMPASS_SIZE / 2 - 14) },
                        ],
                      },
                    ]}
                  />
                )
              )}

              {/* Titik Mata Angin Kardinal Utama */}
              <Text
                style={[
                  styles.cardinalText,
                  { top: 18, color: '#EF4444', fontWeight: 'bold' },
                ]}
              >
                U
              </Text>
              <Text
                style={[
                  styles.cardinalText,
                  { right: 18, color: theme.textSecondary },
                ]}
              >
                T
              </Text>
              <Text
                style={[
                  styles.cardinalText,
                  { bottom: 18, color: theme.textSecondary },
                ]}
              >
                S
              </Text>
              <Text
                style={[
                  styles.cardinalText,
                  { left: 18, color: theme.textSecondary },
                ]}
              >
                B
              </Text>

              {/* Jarum Magnetik Utara-Selatan (Jarum Navigasi) */}
              <View style={styles.magneticNeedleWrapper}>
                <View style={styles.northNeedle} />
                <View
                  style={[
                    styles.southNeedle,
                    { backgroundColor: isDarkMode ? '#64748B' : '#94A3B8' },
                  ]}
                />
              </View>

              {/* Jarum Penunjuk Kiblat (Berputar ke Arah Azimuth Kiblat) */}
              <View
                style={[
                  styles.qiblaNeedleWrapper,
                  { transform: [{ rotate: `${qiblaAzimuth}deg` }] },
                ]}
              >
                <View
                  style={[
                    styles.qiblaPointer,
                    {
                      backgroundColor: theme.accent,
                      shadowColor: theme.accent,
                      shadowOpacity: 0.9,
                      shadowRadius: 5,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.kabaBadge,
                    { backgroundColor: theme.accent, borderColor: '#FFFFFF' },
                  ]}
                >
                  <Text style={styles.kabaBadgeText}>🕋 KIBLAT</Text>
                </View>
              </View>

              {/* Center Cap Lingkaran Pusat */}
              <View
                style={[
                  styles.centerCap,
                  {
                    backgroundColor: isFacingQibla
                      ? theme.accent
                      : theme.primary,
                    borderColor: theme.surface,
                  },
                ]}
              />
            </View>

            {/* Status & Petunjuk Putar Real-Time */}
            <View
              style={[
                styles.statusContainer,
                {
                  backgroundColor: isFacingQibla
                    ? `${theme.accent}20`
                    : `${theme.primary}12`,
                  borderColor: isFacingQibla ? theme.accent : theme.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.statusHintText,
                  { color: isFacingQibla ? theme.accent : theme.textPrimary },
                ]}
              >
                {getDirectionHint()}
              </Text>
            </View>

            {/* Card Ringkasan Navigasi */}
            <View
              style={[
                styles.infoCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                  Heading Ponsel:
                </Text>
                <Text style={[styles.infoVal, { color: theme.textPrimary }]}>
                  {heading}°
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                  Azimuth Kiblat (UTSB):
                </Text>
                <Text style={[styles.infoVal, { color: theme.accent }]}>
                  {qiblaAzimuth.toFixed(2)}° ({qiblaData.qiblaAzimuthDMS})
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                  Sudut dari Titik Barat (SBMD):
                </Text>
                <Text style={[styles.infoVal, { color: theme.textPrimary }]}>
                  {qiblaData.sbmd.toFixed(2)}° ({qiblaData.sbmdDMS}) ke Utara
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                  Jarak ke Ka'bah:
                </Text>
                <Text style={[styles.infoVal, { color: theme.textPrimary }]}>
                  {qiblaData.distanceKm.toLocaleString('id-ID')} km
                </Text>
              </View>
            </View>

            {/* Tombol Pintas ke Detail Hisab Falak */}
            <TouchableOpacity
              style={[
                styles.openDetailBtn,
                { backgroundColor: theme.primary, borderColor: theme.border },
              ]}
              onPress={() => setActiveTab('falak')}
            >
              <Calculator size={18} color="#FFFFFF" />
              <Text style={styles.openDetailBtnText}>
                Buka Rincian Perhitungan Falak Lengkap
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* TAMPILAN 3: RINCIAN PERHITUNGAN FALAK LENGKAP */}
      {activeTab === 'falak' && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 30 }}
        >
          {/* BANNER HASIL UTAMA */}
          <View
            style={[
              styles.falakBanner,
              { backgroundColor: theme.cardPrimary },
            ]}
          >
            <Text style={styles.bannerSubTitle}>HASIL HISAB FALAK KIBLAT</Text>
            <Text style={[styles.bannerMainAzimuth, { color: theme.accent }]}>
              {qiblaAzimuth.toFixed(4)}°
            </Text>
            <Text style={styles.bannerDmsText}>
              {qiblaData.qiblaAzimuthDMS} (True North / UTSB)
            </Text>

            <View style={styles.bannerDivider} />

            <View style={styles.bannerGrid}>
              <View style={styles.bannerGridCol}>
                <Text style={styles.bannerColLabel}>SBMD (Barat ke Utara)</Text>
                <Text style={styles.bannerColVal}>
                  {qiblaData.sbmd.toFixed(2)}° ({qiblaData.sbmdDMS})
                </Text>
              </View>

              <View style={[styles.bannerGridCol, { alignItems: 'flex-end' }]}>
                <Text style={styles.bannerColLabel}>Arah Mata Angin</Text>
                <Text style={styles.bannerColVal}>
                  {qiblaData.cardinalDirection}
                </Text>
              </View>
            </View>
          </View>

          {/* SECTION 1: DATA KOORDINAT DASAR */}
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            1. DATA KOORDINAT GEODETIK (WGS84)
          </Text>
          <View
            style={[
              styles.cardBox,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <View style={styles.dataRow}>
              <View style={styles.dataColLeft}>
                <MapPin size={16} color={theme.accent} />
                <Text style={[styles.dataTitle, { color: theme.textPrimary }]}>
                  Titik Pengamat
                </Text>
              </View>
              <View style={styles.dataColRight}>
                <Text style={[styles.dataValue, { color: theme.textPrimary }]}>
                  {qiblaData.userLatDMS} ({qiblaData.userLat.toFixed(4)}°)
                </Text>
                <Text style={[styles.dataValue, { color: theme.textPrimary }]}>
                  {qiblaData.userLngDMS} ({qiblaData.userLng.toFixed(4)}°)
                </Text>
              </View>
            </View>

            <View style={[styles.rowDivider, { backgroundColor: theme.border }]} />

            <View style={styles.dataRow}>
              <View style={styles.dataColLeft}>
                <Text style={{ fontSize: 16 }}>🕋</Text>
                <Text style={[styles.dataTitle, { color: theme.textPrimary }]}>
                  Ka'bah (Makkah)
                </Text>
              </View>
              <View style={styles.dataColRight}>
                <Text style={[styles.dataValue, { color: theme.textPrimary }]}>
                  {qiblaData.kabaLatDMS} ({qiblaData.kabaLat.toFixed(6)}°)
                </Text>
                <Text style={[styles.dataValue, { color: theme.textPrimary }]}>
                  {qiblaData.kabaLngDMS} ({qiblaData.kabaLng.toFixed(6)}°)
                </Text>
              </View>
            </View>

            <View style={[styles.rowDivider, { backgroundColor: theme.border }]} />

            <View style={styles.dataRow}>
              <Text style={[styles.dataLabel, { color: theme.textSecondary }]}>
                Selisih Bujur (Δλ = |λP - λK|):
              </Text>
              <Text style={[styles.dataValueBold, { color: theme.accent }]}>
                {qiblaData.deltaLambda.toFixed(4)}° ({qiblaData.deltaLambdaDMS})
              </Text>
            </View>

            <View style={styles.dataRow}>
              <Text style={[styles.dataLabel, { color: theme.textSecondary }]}>
                Jarak Geodesik (Great Circle):
              </Text>
              <Text style={[styles.dataValueBold, { color: theme.textPrimary }]}>
                {qiblaData.distanceKm.toLocaleString('id-ID')} km
              </Text>
            </View>
          </View>

          {/* SECTION 2: RUMUS & KOMPUTASI TRIGONOMETRI BOLA */}
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            2. FORMULA TRIGONOMETRI BOLA (TAHQIQI)
          </Text>
          <View
            style={[
              styles.cardBox,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <View
              style={[
                styles.formulaBox,
                { backgroundColor: isDarkMode ? '#0F172A' : '#F1F5F9' },
              ]}
            >
              <Text style={[styles.formulaText, { color: theme.textPrimary }]}>
                tan Q = sin(λK - λP) / [cos φP · tan φK - sin φP · cos(λK - λP)]
              </Text>
              <Text style={[styles.formulaSubText, { color: theme.textSecondary }]}>
                Q = atan2( Pembilang , Penyebut ) mod 360°
              </Text>
            </View>

            <View style={styles.calcStepItem}>
              <Text style={[styles.stepLabel, { color: theme.textSecondary }]}>
                • Pembilang (X = sin Δλ):
              </Text>
              <Text style={[styles.stepVal, { color: theme.textPrimary }]}>
                {qiblaData.formulaValues.sinDeltaLambda.toFixed(6)}
              </Text>
            </View>

            <View style={styles.calcStepItem}>
              <Text style={[styles.stepLabel, { color: theme.textSecondary }]}>
                • Suku I (cos φP · tan φK):
              </Text>
              <Text style={[styles.stepVal, { color: theme.textPrimary }]}>
                {(
                  qiblaData.formulaValues.cosPhi *
                  qiblaData.formulaValues.tanPhiK
                ).toFixed(6)}
              </Text>
            </View>

            <View style={styles.calcStepItem}>
              <Text style={[styles.stepLabel, { color: theme.textSecondary }]}>
                • Suku II (sin φP · cos Δλ):
              </Text>
              <Text style={[styles.stepVal, { color: theme.textPrimary }]}>
                {(
                  qiblaData.formulaValues.sinPhi *
                  qiblaData.formulaValues.cosDeltaLambda
                ).toFixed(6)}
              </Text>
            </View>

            <View style={styles.calcStepItem}>
              <Text style={[styles.stepLabel, { color: theme.textSecondary }]}>
                • Penyebut (Y = Suku I - Suku II):
              </Text>
              <Text style={[styles.stepVal, { color: theme.textPrimary }]}>
                {qiblaData.formulaValues.denominator.toFixed(6)}
              </Text>
            </View>

            <View style={styles.calcStepItem}>
              <Text style={[styles.stepLabel, { color: theme.textSecondary }]}>
                • Sudut Radian atan2(X, Y):
              </Text>
              <Text style={[styles.stepVal, { color: theme.accent }]}>
                {(
                  Math.atan2(
                    qiblaData.formulaValues.numerator,
                    qiblaData.formulaValues.denominator
                  ) *
                  (180 / Math.PI)
                ).toFixed(4)}
                °
              </Text>
            </View>
          </View>

          {/* SECTION 3: FORMULA FALAK KLASIK (KITAB KUNING) */}
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            3. RUMUS COTANGENT FALAK KLASIK (RUBU' MUJAYYAB)
          </Text>
          <View
            style={[
              styles.cardBox,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <View
              style={[
                styles.formulaBox,
                { backgroundColor: isDarkMode ? '#0F172A' : '#F1F5F9' },
              ]}
            >
              <Text style={[styles.formulaText, { color: theme.textPrimary }]}>
                cot B = (cos φ · tan φK / sin Δλ) - (sin φ · cot Δλ)
              </Text>
              <Text style={[styles.formulaSubText, { color: theme.textSecondary }]}>
                Azimuth Kiblat Q = 360° - B (diukur dari Utara ke Barat)
              </Text>
            </View>

            <View style={styles.calcStepItem}>
              <Text style={[styles.stepLabel, { color: theme.textSecondary }]}>
                • Nilai cot B:
              </Text>
              <Text style={[styles.stepVal, { color: theme.textPrimary }]}>
                {qiblaData.formulaValues.cotB.toFixed(6)}
              </Text>
            </View>

            <View style={styles.calcStepItem}>
              <Text style={[styles.stepLabel, { color: theme.textSecondary }]}>
                • Sudut B (Utara ke Barat / UB):
              </Text>
              <Text style={[styles.stepVal, { color: theme.textPrimary }]}>
                {qiblaData.formulaValues.angleB.toFixed(4)}° ({qiblaData.ubAngleDMS})
              </Text>
            </View>

            <View style={styles.calcStepItem}>
              <Text style={[styles.stepLabel, { color: theme.textSecondary }]}>
                • Azimuth Kiblat Sejati (360° - B):
              </Text>
              <Text style={[styles.stepVal, { color: theme.accent }]}>
                {qiblaAzimuth.toFixed(4)}° ({qiblaData.qiblaAzimuthDMS})
              </Text>
            </View>
          </View>

          {/* SECTION 4: PANDUAN KALIBRASI & AKURASI */}
          <View
            style={[
              styles.noteCard,
              { backgroundColor: `${theme.accent}15`, borderColor: theme.accent },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Info size={18} color={theme.accent} />
              <Text style={[styles.noteTitle, { color: theme.accent }]}>
                Panduan Kalibrasi & Akurasi Kompas
              </Text>
            </View>
            <Text style={[styles.noteDesc, { color: theme.textPrimary }]}>
              1. Jauhkan ponsel dari benda logam, magnet, atau perangkat elektronik besar saat membidik.
              {'\n'}2. Putar ponsel membentuk pola angka 8 (delapan) di udara untuk mengkalibrasi sensor magnetometer.
              {'\n'}3. Perhitungan hisab falak di atas bersifat matematis absolut berdasarkan koordinat GPS WGS84 Masjidil Haram Ka'bah.
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: {
    marginTop: 40,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 20, fontWeight: 'bold' },
  subtitle: { fontSize: 13, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 8 },
  toggleBtn: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 2,
  },

  // SEGMENTED TAB
  tabBar: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  tabText: {
    fontSize: 12,
  },

  // 2D COMPASS
  compassWrapper: { alignItems: 'center', justifyContent: 'center' },
  topPointer: {
    width: 6,
    height: 18,
    borderRadius: 3,
    marginBottom: 8,
    zIndex: 10,
  },
  dial: {
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  tickMark: {
    position: 'absolute',
    borderRadius: 1,
  },
  cardinalText: {
    position: 'absolute',
    fontSize: 16,
  },
  magneticNeedleWrapper: {
    position: 'absolute',
    width: 10,
    height: COMPASS_SIZE * 0.72,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  northNeedle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: COMPASS_SIZE * 0.32,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#EF4444',
  },
  southNeedle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: COMPASS_SIZE * 0.32,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#94A3B8',
  },
  qiblaNeedleWrapper: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  qiblaPointer: {
    width: 6,
    height: COMPASS_SIZE * 0.38,
    borderRadius: 3,
    position: 'absolute',
    top: 26,
  },
  kabaBadge: {
    position: 'absolute',
    top: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    elevation: 3,
  },
  kabaBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  centerCap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    zIndex: 10,
  },

  // STATUS & PETUNJUK
  statusContainer: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    marginTop: 18,
    alignItems: 'center',
  },
  statusHintText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  infoCard: {
    width: '100%',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 14,
    gap: 10,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { fontSize: 13 },
  infoVal: { fontSize: 13, fontWeight: 'bold' },
  openDetailBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 14,
    gap: 8,
    elevation: 2,
  },
  openDetailBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },

  // AR CAMERA
  cameraContainer: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 10,
  },
  arOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reticle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arBadge: {
    marginTop: 24,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  arBadgeText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  arSubText: {
    color: '#E2E8F0',
    fontSize: 11,
    marginTop: 4,
  },

  // DETAIL HISAB FALAK
  falakBanner: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    elevation: 4,
  },
  bannerSubTitle: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  bannerMainAzimuth: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 4,
  },
  bannerDmsText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  bannerDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: 14,
  },
  bannerGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bannerGridCol: { flex: 1 },
  bannerColLabel: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 11,
    marginBottom: 2,
  },
  bannerColVal: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 10,
  },
  cardBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
    gap: 8,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dataColLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dataColRight: {
    alignItems: 'flex-end',
  },
  dataTitle: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  dataLabel: {
    fontSize: 12,
  },
  dataValue: {
    fontSize: 12,
    fontWeight: '500',
  },
  dataValueBold: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  rowDivider: {
    height: 1,
    marginVertical: 4,
  },
  formulaBox: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  formulaText: {
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  formulaSubText: {
    fontSize: 11,
    marginTop: 4,
    fontStyle: 'italic',
  },
  calcStepItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  stepLabel: {
    fontSize: 12,
  },
  stepVal: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  noteCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginTop: 4,
    gap: 8,
  },
  noteTitle: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  noteDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
});
