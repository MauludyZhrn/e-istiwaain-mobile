import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import {
  MapPin,
  Calculator,
  Compass,
  BookOpen,
  Grid,
} from 'lucide-react-native';
import * as Location from 'expo-location';

import { useAppStore } from '../../store/useAppStore';
import { colors } from '../../constants/colors';
import { useLocation } from '../../hooks/useLocation';
import { calculatePrayerTimes, getDefaultTimezone, getTimeZoneLabel } from '../../utils/falakMath';

// --- KOMPONEN RUNNING TEXT (MARQUEE) ---
const RunningText = ({ text, style }: { text: string; style: any }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const [textWidth, setTextWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (textWidth > containerWidth && containerWidth > 0) {
      const distance = textWidth - containerWidth + 24;
      const duration = distance * 40; // Kecepatan running text

      const animation = Animated.loop(
        Animated.sequence([
          Animated.delay(1500),
          Animated.timing(translateX, {
            toValue: -distance,
            duration: duration,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.delay(1500),
          Animated.timing(translateX, {
            toValue: 0,
            duration: duration,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [textWidth, containerWidth]);

  return (
    <View
      style={{ flex: 1, overflow: 'hidden' }}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      <Animated.Text
        onLayout={(e) => setTextWidth(e.nativeEvent.layout.width)}
        numberOfLines={1}
        style={[style, { transform: [{ translateX }] }]}
      >
        {text}
      </Animated.Text>
    </View>
  );
};

// --- HELPER UNTUK PASARAN JAWA ---
const getJavaneseDateFormatted = (date: Date) => {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const pasarans = ['Legi', 'Pahing', 'Pon', 'Wage', 'Kliwon'];

  // Perhitungan Pasaran berbasis Epoch
  const epoch = new Date(1970, 0, 1);
  const diffDays = Math.floor((date.getTime() - epoch.getTime()) / (1000 * 60 * 60 * 24));
  const pasaranIndex = (diffDays + 2) % 5;
  const pasaran = pasarans[pasaranIndex < 0 ? pasaranIndex + 5 : pasaranIndex];

  const dayName = days[date.getDay()];
  const dayNum = date.getDate();
  const monthName = months[date.getMonth()];
  const year = date.getFullYear();

  return `${dayName} (${pasaran.toLowerCase()}), ${dayNum} ${monthName} ${year}`;
};

// --- HELPER GREETING ---
const getGreeting = (hour: number) => {
  if (hour >= 3 && hour < 11) return 'Selamat Pagi';
  if (hour >= 11 && hour < 15) return 'Selamat Siang';
  if (hour >= 15 && hour < 18) return 'Selamat Sore';
  return 'Selamat Malam';
};

const formatTwoDigits = (n: number) => (n < 10 ? `0${n}` : `${n}`);

export const DashboardScreen = ({ navigation }: any) => {
  const isDarkMode = useAppStore((state) => state.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;
  const { location } = useLocation();
  const calculationMethod = useAppStore((state) => state.calculationMethod);

  const [now, setNow] = useState(new Date());
  const [addressName, setAddressName] = useState('Memuat lokasi...');
  const [nextPrayerInfo, setNextPrayerInfo] = useState({
    name: 'Imsak',
    time: '--:--',
    countdown: '-00:00:00',
  });
  const [timeIstiwaStr, setTimeIstiwaStr] = useState('--:--:-- Istiwa\'');

  // Update Jam Real-Time
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Reverse Geocoding (Ubah Koordinat Lat, Lng menjadi Nama Jalan/Kecamatan)
  useEffect(() => {
    const fetchAddress = async () => {
      if (location) {
        try {
          const [place] = await Location.reverseGeocodeAsync({
            latitude: location.latitude,
            longitude: location.longitude,
          });

          if (place) {
            const district = place.district || place.subregion || '';
            const city = place.city || place.subregion || place.region || '';
            const formatted = [district, city].filter(Boolean).join(', ');
            setAddressName(formatted || 'Lokasi Terdeteksi');
          } else {
            setAddressName('Lokasi Tidak Dikenal');
          }
        } catch (error) {
          setAddressName(`${location.latitude.toFixed(2)}°, ${location.longitude.toFixed(2)}°`);
        }
      } else {
        setAddressName('Mencari sinyal GPS...');
      }
    };

    fetchAddress();
  }, [location]);

  // 3. Hitung Waktu Shalat, Hitung Mundur, dan Jam Istiwa'
  useEffect(() => {
    if (location) {
      const tz = getDefaultTimezone(now);
      const prayerTimes = calculatePrayerTimes(
        now,
        location.latitude,
        location.longitude,
        tz,
        calculationMethod
      );

      const list = [
        { name: 'Imsak', timeStr: prayerTimes.Imsak },
        { name: 'Subuh', timeStr: prayerTimes.Subuh },
        { name: 'Dhuha', timeStr: prayerTimes.Dhuha },
        { name: 'Zuhur', timeStr: prayerTimes.Zuhur },
        { name: 'Asar', timeStr: prayerTimes.Asar },
        { name: 'Maghrib', timeStr: prayerTimes.Maghrib },
        { name: 'Isya', timeStr: prayerTimes.Isya },
      ];

      // Konversi Jam Lokal Sekarang ke Total Detik Hari Ini
      const currentSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

      // Cari Jadwal Shalat Terdekat Berikutnya
      let upcoming = list.find((item) => {
        const [h, m] = item.timeStr.split(':').map(Number);
        const itemSec = h * 3600 + m * 60;
        return itemSec > currentSec;
      });

      let diffSec = 0;
      if (upcoming) {
        const [h, m] = upcoming.timeStr.split(':').map(Number);
        const targetSec = h * 3600 + m * 60;
        diffSec = targetSec - currentSec;
      } else {
        // Jika seluruh shalat hari ini sudah lewat, targetkan Imsak esok hari
        upcoming = list[0];
        const [h, m] = upcoming.timeStr.split(':').map(Number);
        const targetSec = h * 3600 + m * 60 + 24 * 3600;
        diffSec = targetSec - currentSec;
      }

      // Format Countdown (-HH:MM:SS)
      const cHours = Math.floor(diffSec / 3600);
      const cMinutes = Math.floor((diffSec % 3600) / 60);
      const cSeconds = diffSec % 60;
      const countdownFormatted = `-${formatTwoDigits(cHours)}:${formatTwoDigits(cMinutes)}:${formatTwoDigits(cSeconds)}`;

      setNextPrayerInfo({
        name: upcoming.name,
        time: upcoming.timeStr,
        countdown: countdownFormatted,
      });

      // Hitung Waktu Istiwa' Real-Time (Kalkulasi Falak: Tepat Zuhur = 12:00:00 Istiwa')
      if (prayerTimes.Zuhur) {
        const [zh, zm] = prayerTimes.Zuhur.split(':').map(Number);
        const zuhurSec = zh * 3600 + zm * 60;
        const istiwaSecBase = 12 * 3600 + (currentSec - zuhurSec);

        let normalizedIstiwa = ((istiwaSecBase % 86400) + 86400) % 86400;
        const iH = Math.floor(normalizedIstiwa / 3600);
        const iM = Math.floor((normalizedIstiwa % 3600) / 60);
        const iS = Math.floor(normalizedIstiwa % 60);

        setTimeIstiwaStr(`${formatTwoDigits(iH)}:${formatTwoDigits(iM)}:${formatTwoDigits(iS)} Istiwa'`);
      }
    }
  }, [now, location, calculationMethod]);

  const userTzLabel = getTimeZoneLabel();
  const timeFormatted = `${formatTwoDigits(now.getHours())}:${formatTwoDigits(now.getMinutes())}:${formatTwoDigits(now.getSeconds())} ${userTzLabel}`;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header Greeting */}
        <Text style={[styles.greetingText, { color: theme.textPrimary }]}>
          {getGreeting(now.getHours())}
        </Text>

        {/* CARD UTAMA GREEN EMERALD */}
        <View style={[styles.mainCard, { backgroundColor: theme.cardPrimary }]}>
          {/* Tanggal & Pasaran */}
          <Text style={styles.cardDateText}>{getJavaneseDateFormatted(now)}</Text>

          {/* Jam Dual-Clock (WIB & Istiwa') */}
          <View style={styles.clockRow}>
            {/* Kolom Kiri: WIB */}
            <View style={styles.clockCol}>
              <Text style={styles.clockLabel}>Waktu UTC</Text>
              <Text style={[styles.clockValueWIB, { color: theme.accent }]}>{timeFormatted}</Text>
            </View>

            {/* Kolom Kanan: Istiwa' */}
            <View style={[styles.clockCol, { alignItems: 'flex-end' }]}>
              <Text style={styles.clockLabel}>Waktu Istiwa'</Text>
              <Text style={styles.clockValueIstiwa}>{timeIstiwaStr}</Text>
            </View>
          </View>

          {/* Countdown Imsak / Shalat */}
          <View style={styles.countdownSection}>
            <Text style={styles.countdownSub}>Menuju Imsak...</Text>
            <Text style={[styles.countdownMain, { color: theme.accent }]}>-03:45 Imsak</Text>
          </View>

          {/* Baris Lokasi (Dengan Running Text / Marquee) */}
          <View style={styles.locationContainer}>
            <MapPin color={theme.accent} size={18} style={styles.pinIcon} />
            <RunningText text={addressName} style={styles.locationText} />
          </View>
        </View>

        {/* SECTION LAYANAN UTAMA */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          Layanan Utama
        </Text>

        {/* 2x2 GRID CARD */}
        <View style={styles.gridContainer}>
          {/* Card 1: Hisab Istiwa'ani */}
          <TouchableOpacity
            style={[styles.menuCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
            activeOpacity={0.8}
            onPress={() => navigation?.navigate?.('Hisab')}
          >
            <View style={[styles.iconCircle, { backgroundColor: `${theme.primary}15` }]}>
              <Calculator color={theme.iconi} size={28} />
            </View>
            <Text style={[styles.menuTitle, { color: theme.textPrimary }]}>
              Hisab Istiwa'ani
            </Text>
          </TouchableOpacity>

          {/* Card 2: Kompas Arah Kiblat */}
          <TouchableOpacity
            style={[styles.menuCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
            activeOpacity={0.8}
            onPress={() => navigation?.navigate?.('Compass')}
          >
            <View style={[styles.iconCircle, { backgroundColor: `${theme.primary}15` }]}>
              <Compass color={theme.iconi} size={28} />
            </View>
            <Text style={[styles.menuTitle, { color: theme.textPrimary }]}>
              Kompas Arah Kiblat
            </Text>
          </TouchableOpacity>

          {/* Card 3: Modul Arah Kiblat */}
          <TouchableOpacity
            style={[styles.menuCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
            activeOpacity={0.8}
            onPress={() => navigation?.navigate?.('Modules')}
          >
            <View style={[styles.iconCircle, { backgroundColor: `${theme.primary}15` }]}>
              <BookOpen color={theme.iconi} size={28} />
            </View>
            <Text style={[styles.menuTitle, { color: theme.textPrimary }]}>
              Modul Arah Kiblat
            </Text>
          </TouchableOpacity>

          {/* Card 4: Komponen Istiwa'ani */}
          <TouchableOpacity
            style={[styles.menuCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
            activeOpacity={0.8}
            onPress={() => navigation?.navigate?.('Komponen')}
          >
            <View style={[styles.iconCircle, { backgroundColor: `${theme.primary}15` }]}>
              <Grid color={theme.iconi} size={28} />
            </View>
            <Text style={[styles.menuTitle, { color: theme.textPrimary }]}>
              Komponen Istiwa'ani
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingTop: 50, paddingBottom: 40 },

  greetingText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },

  // CARD UTAMA
  mainCard: {
    backgroundColor: '#006C4E', // Dark Emerald Green
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  cardDateText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  clockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  clockCol: {
    flex: 1,
  },
  clockLabel: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 12,
    marginBottom: 4,
  },
  clockValueWIB: {
    color: '#F59E0B', // Bright Amber/Yellow
    fontSize: 18,
    fontWeight: 'bold',
  },
  clockValueIstiwa: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  countdownSection: {
    marginBottom: 18,
  },
  countdownSub: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  countdownMain: {
    color: '#F59E0B',
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 2,
  },

  // LOCATION BAR WITH MARQUEE
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  pinIcon: {
    marginRight: 8,
  },
  locationText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },

  // LAYANAN UTAMA GRID
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  menuCard: {
    width: (Dimensions.get('window').width - 44) / 2,
    borderColor: '#006C4E',
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 85,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    flex: 1,
    lineHeight: 18,
  },
});