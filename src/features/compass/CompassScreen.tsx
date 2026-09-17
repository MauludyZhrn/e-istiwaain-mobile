import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions } from 'react-native';
import { Magnetometer } from 'expo-sensors';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Compass, Camera, Navigation } from 'lucide-react-native';

import { useAppStore } from '../../store/useAppStore';
import { colors } from '../../constants/colors';
import { useLocation } from '../../hooks/useLocation';
import { calculateQiblaAzimuth, toDMS } from '../../utils/falakMath';

const { width } = Dimensions.get('window');

export const CompassScreen = () => {
  const isDarkMode = useAppStore((state) => state.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;
  const { location } = useLocation();

  // Mode: 2D Compass vs AR Camera
  const [isCameraMode, setIsCameraMode] = useState<boolean>(false);
  const [permission, requestPermission] = useCameraPermissions();

  // Sensor Magnetometer State
  const [heading, setHeading] = useState<number>(0);

  useEffect(() => {
    Magnetometer.setUpdateInterval(100);

    const subscription = Magnetometer.addListener((data) => {
      let { x, y } = data;
      
      // Rumus standar Heading HP (0° = Top HP menunjuk ke Utara Sejati)
      let angle = Math.atan2(-x, y) * (180 / Math.PI);
      let calculatedHeading = (angle + 360) % 360;
      
      setHeading(Math.round(calculatedHeading));
    });

    return () => subscription.remove();
  }, []);

  // Hitung Azimuth Kiblat berdasarkan GPS
  const userLat = location?.latitude ?? -6.9982;
  const userLng = location?.longitude ?? 110.4079;
  const qiblaAzimuth = Math.round(calculateQiblaAzimuth(userLat, userLng));

  // Selisih sudut presisi (-180° s/d 180°) untuk petunjuk putar Kiri / Kanan
  const angleDiff = ((qiblaAzimuth - heading + 540) % 360) - 180;
  const isFacingQibla = Math.abs(angleDiff) < 4;

  const getDirectionHint = () => {
    if (isFacingQibla) return 'Arah Kiblat Tepat! 🕋';
    return angleDiff > 0
      ? `Putar ${Math.round(angleDiff)}° ke Kanan ➡️`
      : `Putar ${Math.round(Math.abs(angleDiff))}° ke Kiri ⬅️`;
  };

  // Toggle Mode Kamera AR
  const toggleCameraMode = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) return;
    }
    setIsCameraMode(!isCameraMode);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header & Toggle Mode */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Kompas & AR Kiblat</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Azimuth Kiblat: {qiblaAzimuth}° ({toDMS(qiblaAzimuth)})
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.toggleBtn, { backgroundColor: isCameraMode ? theme.primary : theme.surface, borderColor: theme.border }]}
          onPress={toggleCameraMode}
        >
          {isCameraMode ? <Compass color="#FFFFFF" size={20} /> : <Camera color={theme.iconi} size={20} />}
        </TouchableOpacity>
      </View>

      {/* TAMPILAN 1: MODE KAMERA AR */}
      {isCameraMode ? (
        <View style={styles.cameraContainer}>
          <CameraView style={StyleSheet.absoluteFill} facing="back" />

          <View style={styles.arOverlay}>
            <View style={[styles.reticle, { borderColor: isFacingQibla ? theme.accent : theme.border }]}>
              <Navigation
                color={isFacingQibla ? theme.accent : '#FFFFFF'}
                size={48}
                style={{ transform: [{ rotate: `${angleDiff}deg` }] }}
              />
            </View>
            <Text style={[styles.arText, { backgroundColor: isFacingQibla ? theme.accent : 'rgba(0,0,0,0.7)' }]}>
              {getDirectionHint()}
            </Text>
          </View>
        </View>
      ) : (
        /* TAMPILAN 2: MODE KOMPAS DIGITAL 2D */
        <View style={styles.compassWrapper}>
          {/* Penunjuk Depan HP (Fixed Top Marker) */}
          <View style={[styles.topPointer, { backgroundColor: isFacingQibla ? theme.accent : theme.primary }]} />

          {/* Piringan Kompas Utama (Berputar Sejalan Heading HP) */}
          <View
            style={[
              styles.dial,
              {
                borderColor: theme.border,
                backgroundColor: theme.surface,
                transform: [{ rotate: `${-heading}deg` }],
              },
            ]}
          >
            {/* Titik Mata Angin Kardinal */}
            <Text style={[styles.cardinalText, { top: 10, color: theme.accent, fontWeight: 'bold' }]}>U</Text>
            <Text style={[styles.cardinalText, { right: 14, color: theme.textSecondary }]}>T</Text>
            <Text style={[styles.cardinalText, { bottom: 10, color: theme.textSecondary }]}>S</Text>
            <Text style={[styles.cardinalText, { left: 14, color: theme.textSecondary }]}>B</Text>

            {/* Jarum Kompas Penunjuk Kiblat */}
            <View
              style={[
                styles.needleContainer,
                { transform: [{ rotate: `${qiblaAzimuth}deg` }] },
              ]}
            >
              <View style={[styles.needlePointer, { backgroundColor: theme.accent }]} />
              <Text style={[styles.kabaBadge, { color: theme.accent }]}>🕋 KIBLAT</Text>
            </View>

            {/* Center Cap */}
            <View style={[styles.centerCap, { backgroundColor: theme.primary }]} />
          </View>

          {/* Status Petunjuk Putar */}
          <Text style={[styles.statusHintText, { color: isFacingQibla ? theme.accent : theme.textPrimary }]}>
            {getDirectionHint()}
          </Text>

          {/* Info Card Status */}
          <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Heading HP (Arah HP):</Text>
              <Text style={[styles.infoVal, { color: theme.textPrimary }]}>{heading}°</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Azimuth Kiblat:</Text>
              <Text style={[styles.infoVal, { color: theme.textPrimary }]}>{qiblaAzimuth}°</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: {
    marginTop: 40,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 20, fontWeight: 'bold' },
  subtitle: { fontSize: 13, marginTop: 2 },
  toggleBtn: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 2,
  },
  compassWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topPointer: {
    width: 4,
    height: 16,
    borderRadius: 2,
    marginBottom: 8,
    zIndex: 10,
  },
  dial: {
    width: width * 0.75,
    height: width * 0.75,
    borderRadius: (width * 0.75) / 2,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    elevation: 4,
  },
  cardinalText: {
    position: 'absolute',
    fontSize: 16,
  },
  needleContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
  needlePointer: {
    width: 6,
    height: width * 0.3,
    borderRadius: 3,
    position: 'absolute',
    top: 30,
  },
  kabaBadge: {
    position: 'absolute',
    top: 8,
    fontSize: 10,
    fontWeight: 'bold',
  },
  centerCap: { width: 16, height: 16, borderRadius: 8 },
  statusHintText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
  },
  infoCard: {
    width: '100%',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 20,
    gap: 8,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  infoLabel: { fontSize: 13 },
  infoVal: { fontSize: 13, fontWeight: 'bold' },
  cameraContainer: { flex: 1, borderRadius: 16, overflow: 'hidden', marginBottom: 20 },
  arOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reticle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  arText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
});