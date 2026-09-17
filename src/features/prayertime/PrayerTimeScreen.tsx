import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import {
  Calendar as CalendarIcon,
  MapPin,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  Clock,
  ChevronLeft,
  ChevronRight,
  List,
  Hourglass,
  Bell,
  BellOff,
  Volume2, 
  VolumeX,
} from 'lucide-react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { playAzanSound, stopAzanSound } from '../../services/soundService';
import { useAppStore } from '../../store/useAppStore';
import { colors } from '../../constants/colors';
import { useLocation } from '../../hooks/useLocation';
import { toDMS } from '../../utils/falakMath';

const isExpoGo = Constants.appOwnership === 'expo';

// Inisialisasi Handler hanya jika BUKAN di Expo Go
if (!isExpoGo) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () =>
        ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        } as any),
    });
  } catch (e) {
    // Safe fallback
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('adhan-notifications', {
      name: 'Notifikasi Azan',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#10B981',
      // Hapus baris sound: 'default' di sini agar Android otomatis memakai suara notifikasi default sistem
    });
  }
}

// --- FUNGSI KALKULASI WAKTU SHALAT ASTRONOMI (FALAK) ---
const calculatePrayerTimes = (
  date: Date,
  lat: number,
  lng: number,
  method: string = 'Kemenag RI (Falak)',
  timeZone: number = -date.getTimezoneOffset() / 60 // Otomatis deteksi UTC offset HP pengguna
) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // Tentukan parameter sudut berdasarkan metode
  let subuhAngle = -20;
  let isyaAngle = -18;
  let isyaFixedMinutes = 0;

  switch (method) {
    case 'MWL':
      subuhAngle = -18;
      isyaAngle = -17;
      break;
    case 'Egyptian':
      subuhAngle = -19.5;
      isyaAngle = -17.5;
      break;
    case 'Umm al-Qura':
      subuhAngle = -18.5;
      isyaFixedMinutes = 90; // Fixed 90 menit setelah Maghrib
      break;
    case 'Kemenag RI (Falak)':
    default:
      subuhAngle = -20;
      isyaAngle = -18;
      break;
  }

  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  const jd = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  const d = jd - 2451545.0;

  const g = (357.529 + 0.98560028 * d) % 360;
  const q = (280.459 + 0.98564736 * d) % 360;
  const L = (q + 1.915 * Math.sin((g * Math.PI) / 180) + 0.02 * Math.sin((2 * g * Math.PI) / 180)) % 360;
  const e = 23.439 - 0.00000036 * d;
  
  let ra = (Math.atan2(Math.cos((e * Math.PI) / 180) * Math.sin((L * Math.PI) / 180), Math.cos((L * Math.PI) / 180)) * 180) / Math.PI;
  ra = (ra + 360) % 360;

  const eqTime = (q - ra) / 15;
  const decl = (Math.asin(Math.sin((e * Math.PI) / 180) * Math.sin((L * Math.PI) / 180)) * 180) / Math.PI;

  const noon = 12 + timeZone - lng / 15 - eqTime + 2 / 60;

  const hourAngle = (angle: number) => {
    const radLat = (lat * Math.PI) / 180;
    const radDecl = (decl * Math.PI) / 180;
    const radAngle = (angle * Math.PI) / 180;
    const cosH = (Math.sin(radAngle) - Math.sin(radLat) * Math.sin(radDecl)) / (Math.cos(radLat) * Math.cos(radDecl));
    if (cosH > 1 || cosH < -1) return 0;
    return (Math.acos(cosH) * 180) / Math.PI / 15;
  };

  const subuhH = hourAngle(subuhAngle);
  const subuhTime = noon - subuhH;
  const imsakTime = subuhTime - 10 / 60;
  const terbitH = hourAngle(-0.833);
  const terbitTime = noon - terbitH;

  const phiMinusDelta = Math.abs(lat - decl);
  const asharAngle = (Math.atan(1 / (1 + Math.tan((phiMinusDelta * Math.PI) / 180))) * 180) / Math.PI;
  const asharH = hourAngle(asharAngle);
  const asharTime = noon + asharH;

  const maghribH = hourAngle(-0.833);
  const maghribTime = noon + maghribH;

  // Hitung Isya sesuai metode
  let isyaTime = 0;
  if (method === 'Umm al-Qura') {
    isyaTime = maghribTime + isyaFixedMinutes / 60;
  } else {
    const isyaH = hourAngle(isyaAngle);
    isyaTime = noon + isyaH;
  }

  const formatTimeString = (timeHours: number) => {
    const totalMin = Math.round(timeHours * 60);
    const h = Math.floor(totalMin / 60) % 24;
    const m = totalMin % 60;
    return `${h < 10 ? '0' : ''}${h}:${m < 10 ? '0' : ''}${m}`;
  };

  return {
    imsak: formatTimeString(imsakTime),
    subuh: formatTimeString(subuhTime),
    terbit: formatTimeString(terbitTime),
    dzuhur: formatTimeString(noon),
    ashar: formatTimeString(asharTime),
    maghrib: formatTimeString(maghribTime),
    isya: formatTimeString(isyaTime),
  };
};

const getTimeZoneLabel = () => {
  const offset = -new Date().getTimezoneOffset() / 60;
  if (offset === 7) return 'WIB';
  if (offset === 8) return 'WITA';
  if (offset === 9) return 'WIT';
  return `UTC${offset >= 0 ? '+' : ''}${offset}`;
};

export const PrayerTimeScreen = () => {
  const insets = useSafeAreaInsets();
  const isDarkMode = useAppStore((state) => state.isDarkMode);

  const calculationMethod = useAppStore((state) => state.calculationMethod) ?? 'Kemenag RI (Falak)';
  
  const alarms = useAppStore((state) => state.alarms);
  const setAlarmToggle = useAppStore((state) => state.setAlarmToggle);
  const adhanSound = useAppStore((state) => state.adhanSound);
  const [isPlaying, setIsPlaying] = useState(false);
  const handleToggleAzan = async (prayerKey: string = 'dzuhur') => {
    if (isPlaying) {
      await stopAzanSound();
      setIsPlaying(false);
    } else {
      await playAzanSound(prayerKey);
      setIsPlaying(true);
    }
  };

  const theme = isDarkMode ? colors.dark : colors.light;
  const { location, loading } = useLocation();

  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const lat = location?.latitude ?? -6.9982;
  const lng = location?.longitude ?? 110.4079;
  const todayTimes = calculatePrayerTimes(now, lat, lng, calculationMethod);

  const createTodayPrayerDate = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    const d = new Date(now);
    d.setHours(h, m, 0, 0);
    return d;
  };

  const scheduleList = [
    { key: 'imsak', name: 'Imsak', time: todayTimes.imsak, dateObj: createTodayPrayerDate(todayTimes.imsak), icon: Sunrise, hasAlarm: false },
    { key: 'subuh', name: 'Subuh', time: todayTimes.subuh, dateObj: createTodayPrayerDate(todayTimes.subuh), icon: Sunrise, hasAlarm: true },
    { key: 'terbit', name: 'Terbit', time: todayTimes.terbit, dateObj: createTodayPrayerDate(todayTimes.terbit), icon: Sun, hasAlarm: false },
    { key: 'dzuhur', name: 'Dzuhur', time: todayTimes.dzuhur, dateObj: createTodayPrayerDate(todayTimes.dzuhur), icon: Sun, hasAlarm: true },
    { key: 'ashar', name: 'Ashar', time: todayTimes.ashar, dateObj: createTodayPrayerDate(todayTimes.ashar), icon: Sun, hasAlarm: true },
    { key: 'maghrib', name: 'Maghrib', time: todayTimes.maghrib, dateObj: createTodayPrayerDate(todayTimes.maghrib), icon: Sunset, hasAlarm: true },
    { key: 'isya', name: 'Isya', time: todayTimes.isya, dateObj: createTodayPrayerDate(todayTimes.isya), icon: Moon, hasAlarm: true },
  ];

  // Cari waktu shalat yang sedang berlangsung & waktu shalat berikutnya
  let activeIndex = -1;
  for (let i = 0; i < scheduleList.length; i++) {
    if (now >= scheduleList[i].dateObj) {
      activeIndex = i;
    } else {
      break;
    }
  }

  // Jika sebelum Imsak, aktifnya dianggap Isya
  if (activeIndex === -1) {
    activeIndex = scheduleList.length - 1;
  }

  let nextIndex = scheduleList.findIndex((item) => item.dateObj > now);
  let isNextDay = false;

  if (nextIndex === -1 || nextIndex >= scheduleList.length) {
    nextIndex = 0;
    isNextDay = true;
  }

  let nextPrayer = scheduleList[nextIndex];
  let targetTime = nextPrayer.dateObj.getTime();

  // Jika shalat berikutnya adalah besok hari (misal setelah Isya menuju Imsak/Subuh)
  if (isNextDay) {
    targetTime += 24 * 60 * 60 * 1000;
  }

  const diffMs = Math.max(0, targetTime - now.getTime());
  const hoursLeft = Math.floor(diffMs / (1000 * 60 * 60));
  const minsLeft = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const secsLeft = Math.floor((diffMs % (1000 * 60)) / 1000);

  const countdownText = `${hoursLeft < 10 ? '0' : ''}${hoursLeft}:${minsLeft < 10 ? '0' : ''}${minsLeft}:${secsLeft < 10 ? '0' : ''}${secsLeft}`;

  const toggleAlarm = async (prayerKey: string, prayerName: string, dateObj: Date) => {
    const isCurrentlyOn = !!alarms[prayerKey];
    const newStatus = !isCurrentlyOn;

    setAlarmToggle(prayerKey, newStatus);

    if (newStatus) {
      if (!isExpoGo) {
        try {
          // Jika waktu shalat hari ini sudah lewat, jadwalkan notifikasi untuk besok
          let targetDate = new Date(dateObj);
          if (targetDate.getTime() <= Date.now()) {
            targetDate.setDate(targetDate.getDate() + 1);
          }

          const triggerSeconds = Math.max(1, Math.floor((targetDate.getTime() - Date.now()) / 1000));

          await Notifications.scheduleNotificationAsync({
            content: {
              title: `🕌 Waktu Shalat ${prayerName} Telah Tiba!`,
              body: `Saatnya menunaikan ibadah shalat ${prayerName}.`,
              sound: adhanSound !== 'silent',
              categoryIdentifier: 'adhan',
            },
            trigger: { 
              seconds: triggerSeconds,
              channelId: 'adhan-notifications',
            } as any,
          });
        } catch (error) {
          // Fallback
        }
      }

      Alert.alert('Alarm Aktif', `Pengingat Azan ${prayerName} berhasil diaktifkan.`);
    } else {
      Alert.alert('Alarm Dimatikan', `Pengingat Azan ${prayerName} dinonaktifkan.`);
    }
  };

  const dateFormatted = currentDate.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const monthYearFormatted = currentDate.toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  });

  const changeMonth = (direction: 'next' | 'prev') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const generateMonthlyData = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const data = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const times = calculatePrayerTimes(d, lat, lng, calculationMethod);
      data.push({ day: i, ...times });
    }
    return data;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header dengan Dynamic Notch Padding */}
      <View style={[styles.header, { marginTop: insets.top + 10 }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>
            {viewMode === 'daily' ? 'Jadwal Shalat' : 'Jadwal Imsakiyah'}
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {viewMode === 'daily' ? 'Perhitungan Presisi Lokasi' : 'Kalender Bulanan'}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {/* Tombol Tes Audio Azan */}
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              {
                backgroundColor: isPlaying ? theme.accent : theme.surface,
                borderColor: theme.border,
              },
            ]}
            onPress={() => handleToggleAzan(nextPrayer.key)}
          >
            {isPlaying ? (
              <VolumeX color="#FFFFFF" size={20} />
            ) : (
              <Volume2 color={theme.iconi} size={20} />
            )}
          </TouchableOpacity>

          {/* Tombol Toggle Kalender */}
          <TouchableOpacity
            style={[styles.toggleBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => setViewMode(viewMode === 'daily' ? 'monthly' : 'daily')}
          >
            {viewMode === 'daily' ? (
              <CalendarIcon color={theme.iconi} size={20} />
            ) : (
              <List color={theme.primary} size={20} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Card Countdown */}
      {viewMode === 'daily' && (
        <View style={[styles.countdownCard, { backgroundColor: theme.cardPrimary }]}>
          <View style={styles.rowBetween}>
            <View style={styles.rowGap}>
              <Hourglass color={theme.accent} size={20} />
              <Text style={styles.countdownTitle}>Menuju {nextPrayer.name}</Text>
            </View>
            <Text style={[styles.countdownTimer, { color: theme.accent }]}>{countdownText}</Text>
          </View>
        </View>
      )}

      {/* Info Lokasi */}
      <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.rowBetween}>
          <View style={styles.rowGap}>
            <CalendarIcon color={theme.iconi} size={16} />
            <Text style={[styles.infoText, { color: theme.textPrimary }]}>
              {viewMode === 'daily' ? dateFormatted : monthYearFormatted}
            </Text>
          </View>

          {viewMode === 'monthly' && (
            <View style={styles.monthNav}>
              <TouchableOpacity onPress={() => changeMonth('prev')} style={styles.navBtn}>
                <ChevronLeft color={theme.textPrimary} size={18} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => changeMonth('next')} style={styles.navBtn}>
                <ChevronRight color={theme.textPrimary} size={18} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={[styles.rowGap, { marginTop: 8 }]}>
          <MapPin color={theme.accent} size={16} />
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            {loading
              ? 'Memuat koordinat GPS...'
              : location
              ? `${toDMS(location.latitude)} S | ${toDMS(location.longitude)} E`
              : 'Semarang, Jawa Tengah'}
          </Text>
        </View>
      </View>

      {/* MODE HARIAN */}
      {viewMode === 'daily' ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.listContainer}>
            {scheduleList.map((item, index) => {
              const IconComponent = item.icon;
              const isActive = index === activeIndex;
              const isAlarmOn = !!alarms[item.key];

              return (
                <View
                  key={item.key}
                  style={[
                    styles.scheduleItem,
                    {
                      backgroundColor: isActive ? theme.cardPrimary : theme.surface,
                      borderColor: isActive ? theme.accent : theme.border,
                      elevation: isActive ? 4 : 1,
                    },
                  ]}
                >
                  <View style={styles.scheduleLeft}>
                    <IconComponent color={isActive ? theme.accent : theme.cardPrimary} size={22} />
                    <View>
                      <Text
                        style={[
                          styles.scheduleName,
                          { color: isActive ? theme.textP : theme.textPrimary },
                        ]}
                      >
                        {item.name}
                      </Text>
                      {isActive && (
                        <Text style={[styles.activeBadge, { color: theme.accent }]}>
                          Sedang Berlangsung
                        </Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.scheduleRight}>
                    <Clock color={isActive ? theme.accent : theme.textSecondary} size={14} />
                    <Text
                      style={[
                        styles.scheduleTime,
                        { color: isActive ? theme.textP : theme.textPrimary },
                      ]}
                    >
                      {item.time} {getTimeZoneLabel()}
                    </Text>

                    {item.hasAlarm && (
                      <TouchableOpacity
                        style={styles.bellBtn}
                        onPress={() => toggleAlarm(item.key, item.name, item.dateObj)}
                      >
                        {isAlarmOn ? (
                          <Bell color={isActive ? theme.accent : theme.cardPrimary} size={20} />
                        ) : (
                          <BellOff color={isActive ? theme.border : theme.textSecondary} size={20} />
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      ) : (
        /* MODE BULANAN */
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View>
            <View style={[styles.tableHeader, { backgroundColor: theme.cardPrimary }]}>
              <Text style={[styles.th, { width: 45, color: theme.textP }]}>Tgl</Text>
              <Text style={[styles.th, { color: theme.textP }]}>Imsak</Text>
              <Text style={[styles.th, { color: theme.textP }]}>Subuh</Text>
              <Text style={[styles.th, { color: theme.textP }]}>Terbit</Text>
              <Text style={[styles.th, { color: theme.textP }]}>Dzuhur</Text>
              <Text style={[styles.th, { color: theme.textP }]}>Ashar</Text>
              <Text style={[styles.th, { color: theme.textP }]}>Maghrib</Text>
              <Text style={[styles.th, { color: theme.textP }]}>Isya</Text>
            </View>

            <ScrollView style={{ maxHeight: 420 }}>
              {generateMonthlyData().map((row) => (
                <View
                  key={row.day}
                  style={[
                    styles.tableRow,
                    {
                      backgroundColor: row.day % 2 === 0 ? theme.surface : theme.background,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text style={[styles.td, styles.tdBold, { width: 45, color: theme.textPrimary }]}>
                    {row.day}
                  </Text>
                  <Text style={[styles.td, { color: theme.textPrimary }]}>{row.imsak}</Text>
                  <Text style={[styles.td, { color: theme.textPrimary }]}>{row.subuh}</Text>
                  <Text style={[styles.td, { color: theme.textPrimary }]}>{row.terbit}</Text>
                  <Text style={[styles.td, { color: theme.textPrimary }]}>{row.dzuhur}</Text>
                  <Text style={[styles.td, { color: theme.textPrimary }]}>{row.ashar}</Text>
                  <Text style={[styles.td, { color: theme.textPrimary }]}>{row.maghrib}</Text>
                  <Text style={[styles.td, { color: theme.textPrimary }]}>{row.isya}</Text>
                </View>
              ))}
            </ScrollView>
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
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 20, fontWeight: 'bold' },
  subtitle: { fontSize: 13, marginTop: 2 },
  toggleBtn: { padding: 10, borderRadius: 12, borderWidth: 1, elevation: 2 },

  countdownCard: { borderRadius: 12, padding: 14, marginBottom: 12, elevation: 3 },
  countdownTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
  countdownTimer: { color: '#D4AF37', fontSize: 16, fontWeight: 'bold' },

  infoCard: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 16},
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowGap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontSize: 13, fontWeight: '500' },
  monthNav: { flexDirection: 'row', gap: 4 },
  navBtn: { padding: 4 },

  listContainer: { gap: 10, marginBottom: 30 },
  scheduleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  scheduleLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  scheduleName: { fontSize: 15, fontWeight: '600' },
  activeBadge: { fontSize: 10, color: '#D4AF37', fontWeight: 'bold', marginTop: 2 },
  scheduleRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  scheduleTime: { fontSize: 14, fontWeight: 'bold' },
  bellBtn: { padding: 4, marginLeft: 4 },

  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  th: { width: 65, color: '#FFF', fontWeight: 'bold', fontSize: 12, textAlign: 'center' },
  tableRow: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 8, borderBottomWidth: 1 },
  td: { width: 65, fontSize: 12, textAlign: 'center' },
  tdBold: { fontWeight: 'bold' },
});