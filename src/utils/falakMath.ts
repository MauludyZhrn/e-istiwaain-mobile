// ============================================================================
// TYPES & TIPE DATA METODE PERHITUNGAN
// ============================================================================

export type CalculationMethod =
  | 'Kemenag RI (Falak)'
  | 'MWL'
  | 'Egyptian'
  | 'Umm al-Qura';

interface MethodConfig {
  fajrAngle: number;    // Sudut ketinggian Matahari untuk Subuh (negatif)
  ishaAngle: number;    // Sudut ketinggian Matahari untuk Isya (negatif)
  isFixedIsha: boolean; // Jika true, Isya dihitung dari durasi menit setelah Maghrib
  ishaMinutes: number; // Menit tambahan setelah Maghrib (Khusus Umm al-Qura)
}

/**
 * Konfigurasi Sudut Acuan Berdasarkan Standar Lembaga Falak Dunia
 */
const METHOD_CONFIGS: Record<CalculationMethod, MethodConfig> = {
  'Kemenag RI (Falak)': {
    fajrAngle: -20.0,
    ishaAngle: -18.0,
    isFixedIsha: false,
    ishaMinutes: 0,
  },
  MWL: {
    fajrAngle: -18.0,
    ishaAngle: -17.0,
    isFixedIsha: false,
    ishaMinutes: 0,
  },
  Egyptian: {
    fajrAngle: -19.5,
    ishaAngle: -17.5,
    isFixedIsha: false,
    ishaMinutes: 0,
  },
  'Umm al-Qura': {
    fajrAngle: -18.5,
    ishaAngle: 0,
    isFixedIsha: true,
    ishaMinutes: 90, // Fixed 90 menit setelah Maghrib
  },
};

// ============================================================================
// KOORDINAT PRESISI KA'BAH (MASJIDIL HARAM, MAKKAH)
// ============================================================================
export const KABA_COORDS = {
  latitude: 21.422539,  // 21° 25' 21.14" N
  longitude: 39.826164, // 39° 49' 34.19" E
};

// ============================================================================
// HELPER ZONA WAKTU & KONVERSI DERAJAT / DMS
// ============================================================================

export const toRadians = (deg: number): number => (deg * Math.PI) / 180;
export const toDegrees = (rad: number): number => (rad * 180) / Math.PI;

/**
 * Mengambil Offset Timezone Bawaan HP / Sistem Pengguna dalam Jam Desimal
 * Contoh: Indonesia WIB = +7, WITA = +8, WIT = +9, London = +0 / +1
 */
export const getDefaultTimezone = (date: Date = new Date()): number => {
  return -date.getTimezoneOffset() / 60;
};

/**
 * Mendapatkan Label Nama Zona Waktu Dinamis
 */
export const getTimeZoneLabel = (tz: number = getDefaultTimezone()): string => {
  if (tz === 7) return 'WIB';
  if (tz === 8) return 'WITA';
  if (tz === 9) return 'WIT';
  const sign = tz >= 0 ? '+' : '';
  return `UTC${sign}${tz}`;
};

/**
 * Konversi Derajat Desimal ke Format DMS (Degree, Minute, Second)
 * Contoh: -6.998055 => 6° 59' 53"
 */
export const toDMS = (deg: number): string => {
  const absolute = Math.abs(deg);
  const degrees = Math.floor(absolute);
  const minutesNotTruncated = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesNotTruncated);
  const seconds = Math.round((minutesNotTruncated - minutes) * 60);

  if (seconds === 60) {
    return `${degrees}° ${minutes + 1}' 00"`;
  }

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${degrees}° ${pad(minutes)}' ${pad(seconds)}"`;
};

/**
 * Konversi Jam Desimal ke Format HH:MM:SS
 */
export const decimalToTime = (decimalHours: number): string => {
  let norm = (decimalHours + 24) % 24;
  const h = Math.floor(norm);
  const mNotTruncated = (norm - h) * 60;
  const m = Math.floor(mNotTruncated);
  const s = Math.round((mNotTruncated - m) * 60);

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  if (s === 60) {
    return `${pad(h)}:${pad(m + 1)}:00`;
  }
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

// ============================================================================
// ENGINE ASTRONOMI: JULIAN DAY & EPHEMERIS MATAHARI (METODE JEAN MEEUS)
// ============================================================================

/**
 * Menghitung Julian Day (JD) dari Tanggal & Waktu UTC Dinamis
 */
export const getJulianDay = (
  year: number,
  month: number,
  day: number,
  hour: number = 0,
  minute: number = 0,
  second: number = 0,
  timezone: number = getDefaultTimezone()
): number => {
  let Y = year;
  let M = month;
  if (M <= 2) {
    Y -= 1;
    M += 12;
  }

  const ut = hour + minute / 60 + second / 3600 - timezone;
  const dayFraction = day + ut / 24;

  const A = Math.floor(Y / 100);
  const B = 2 - A + Math.floor(A / 4);

  return (
    Math.floor(365.25 * (Y + 4716)) +
    Math.floor(30.6001 * (M + 1)) +
    dayFraction +
    B -
    1524.5
  );
};

/**
 * Perhitungan Presisi Ephemeris Matahari (Deklinasi & Equation of Time / EoT)
 */
export const getSolarEphemeris = (jd: number) => {
  const T = (jd - 2451545.0) / 36525.0; // Abad Julian

  let L0 = (280.46646 + 36000.76983 * T + 0.0003032 * Math.pow(T, 2)) % 360;
  if (L0 < 0) L0 += 360;

  let M = (357.52911 + 35999.05029 * T - 0.0001537 * Math.pow(T, 2)) % 360;
  if (M < 0) M += 360;

  const Mrad = toRadians(M);
  const L0rad = toRadians(L0);

  const e = 0.016708634 - 0.00042037 * T - 0.0000001267 * Math.pow(T, 2);

  const C =
    (1.914602 - 0.004817 * T - 0.000014 * Math.pow(T, 2)) * Math.sin(Mrad) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * Mrad) +
    0.000289 * Math.sin(3 * Mrad);

  const trueLong = L0 + C;
  const omega = 125.04 - 1934.136 * T;
  const lambda = trueLong - 0.00569 - 0.00478 * Math.sin(toRadians(omega));

  const eps0 = 23 + (26 + (21.448 - 46.815 * T) / 60) / 60;
  const epsilon = eps0 + 0.00256 * Math.cos(toRadians(omega));
  const epsRad = toRadians(epsilon);
  const lambdaRad = toRadians(lambda);

  const declinationRad = Math.asin(Math.sin(epsRad) * Math.sin(lambdaRad));
  const declination = toDegrees(declinationRad);

  const y = Math.pow(Math.tan(epsRad / 2), 2);
  const eotRad =
    y * Math.sin(2 * L0rad) -
    2 * e * Math.sin(Mrad) +
    4 * e * y * Math.sin(Mrad) * Math.cos(2 * L0rad) -
    0.5 * Math.pow(y, 2) * Math.sin(4 * L0rad) -
    1.25 * Math.pow(e, 2) * Math.sin(2 * Mrad);

  const equationOfTime = toDegrees(eotRad) * 4; // Dalam Menit

  return {
    declination,      // Deklinasi Matahari (Derajat)
    equationOfTime,   // Perataan Waktu / EoT (Menit)
    epsilon,          // Kemiringan Sumbu
  };
};

export const calculateSunPosition = (date: Date = new Date()) => {
  const jd = getJulianDay(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    getDefaultTimezone(date)
  );
  return getSolarEphemeris(jd);
};

// ============================================================================
// ENGINE QIBLAT: AZIMUTH, ARAH KIBLAT & SBMD
// ============================================================================

export const calculateQiblaAzimuth = (userLat: number, userLng: number): number => {
  const phi = toRadians(userLat);
  const phiK = toRadians(KABA_COORDS.latitude);
  const deltaLambda = toRadians(KABA_COORDS.longitude - userLng);

  const numerator = Math.sin(deltaLambda);
  const denominator =
    Math.cos(phi) * Math.tan(phiK) - Math.sin(phi) * Math.cos(deltaLambda);

  const qiblaRad = Math.atan2(numerator, denominator);
  let qiblaDeg = toDegrees(qiblaRad);
  return (qiblaDeg + 360) % 360;
};

// ============================================================================
// ENGINE MATAHARI & RASHDUL QIBLAT (HISAB FALAK LENGKAP)
// ============================================================================

export const calculateFullHisab = (params: {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  zone: number;
  latDeg: number;
  latMin: number;
  latSec: number;
  latDir: 'U' | 'S';
  lngDeg: number;
  lngMin: number;
  lngSec: number;
  lngDir: 'T' | 'B';
}) => {
  const latVal =
    (params.latDeg + params.latMin / 60 + params.latSec / 3600) *
    (params.latDir === 'S' ? -1 : 1);

  const lngVal =
    (params.lngDeg + params.lngMin / 60 + params.lngSec / 3600) *
    (params.lngDir === 'B' ? -1 : 1);

  const jd = getJulianDay(
    params.year,
    params.month,
    params.day,
    params.hour,
    params.minute,
    params.second,
    params.zone
  );

  const ephem = getSolarEphemeris(jd);

  const qiblaAzimuthNum = calculateQiblaAzimuth(latVal, lngVal);
  const qiblaDirectionDMS = `${toDMS(qiblaAzimuthNum)} UB`;

  const sbmdNum = Math.abs(270 - qiblaAzimuthNum);

  const meridianStd = params.zone * 15;
  const lngCorrMin = (lngVal - meridianStd) * 4;
  const tstMinutes =
    params.hour * 60 +
    params.minute +
    params.second / 60 +
    lngCorrMin +
    ephem.equationOfTime;

  const tSunDeg = (tstMinutes / 60 - 12) * 15;

  const phiRad = toRadians(latVal);
  const decRad = toRadians(ephem.declination);
  const tSunRad = toRadians(tSunDeg);

  const sinH =
    Math.sin(phiRad) * Math.sin(decRad) +
    Math.cos(phiRad) * Math.cos(decRad) * Math.cos(tSunRad);
  const hRad = Math.asin(sinH);

  const cosAz =
    (Math.sin(decRad) - Math.sin(phiRad) * sinH) /
    (Math.cos(phiRad) * Math.cos(hRad));

  let azSunDeg = toDegrees(Math.acos(Math.max(-1, Math.min(1, cosAz))));
  if (Math.sin(tSunRad) > 0) {
    azSunDeg = 360 - azSunDeg;
  }

  const h0Rad = toRadians(-1.0);
  const cosTSet =
    (Math.sin(h0Rad) - Math.sin(phiRad) * Math.sin(decRad)) /
    (Math.cos(phiRad) * Math.cos(decRad));

  const tSetDeg = toDegrees(Math.acos(Math.max(-1, Math.min(1, cosTSet))));

  const QRad = toRadians(qiblaAzimuthNum);
  const psiRad = Math.atan(Math.tan(QRad) * Math.sin(phiRad));

  const sinTRQ =
    (-Math.sin(QRad) * Math.tan(decRad) * Math.cos(phiRad)) /
    Math.sqrt(
      Math.pow(Math.cos(QRad), 2) +
        Math.pow(Math.sin(QRad), 2) * Math.pow(Math.sin(phiRad), 2)
    );

  let tRQRad = Math.asin(Math.max(-1, Math.min(1, sinTRQ))) + psiRad;
  let tRQDeg = toDegrees(tRQRad);

  const tstRQHours = 12 + tRQDeg / 15;
  const localRQHours = tstRQHours - ephem.equationOfTime / 60 - lngCorrMin / 60;

  const tzLabel = getTimeZoneLabel(params.zone);

  return {
    declination: toDMS(ephem.declination),
    latPlace: `${toDMS(Math.abs(latVal))} ${latVal < 0 ? 'LS' : 'LU'}`,
    lngPlace: `${toDMS(Math.abs(lngVal))} ${lngVal < 0 ? 'BB' : 'BT'}`,
    timeZone: `+${params.zone} (${tzLabel})`,
    eqOfTime: `${ephem.equationOfTime.toFixed(2)} m`,
    kabaLat: `${toDMS(KABA_COORDS.latitude)} LU`,
    kabaLng: `${toDMS(KABA_COORDS.longitude)} BT`,
    sbmd: toDMS(sbmdNum),

    qiblaDirection: qiblaDirectionDMS,
    qiblaAzimuth: toDMS(qiblaAzimuthNum),
    sunHourAngle: toDMS(Math.abs(tSunDeg)),
    sunDirection: toDMS(azSunDeg),
    sunAzimuth: toDMS(azSunDeg),
    sunSetHourAngle: toDMS(tSetDeg),
    bdgSdtWktSbt: toDMS(Math.abs(90 - tSetDeg)),

    rashdulIstiwa: decimalToTime(tstRQHours),
    rashdulWib: `${decimalToTime(localRQHours)} ${tzLabel}`,
  };
};

// ============================================================================
// ENGINE WAKTU SHOLAT UNIVERSAL (MULTI ZONA & MULTI METODE FALAK)
// ============================================================================

/**
 * Menghitung Waktu Shalat Berdasarkan Lokasi, Date, Timezone, dan Metode Acuan Dunia
 */
export const calculatePrayerTimes = (
  date: Date,
  lat: number,
  lng: number,
  tz: number = getDefaultTimezone(date),
  method: CalculationMethod = 'Kemenag RI (Falak)'
) => {
  const jd = getJulianDay(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    12,
    0,
    0,
    tz
  );
  const ephem = getSolarEphemeris(jd);

  const phiRad = toRadians(lat);
  const decRad = toRadians(ephem.declination);
  const meridianStd = tz * 15;
  const lngCorrHours = (lng - meridianStd) / 15;

  // Dapatkan parameter acuan berdasarkan metode
  const config = METHOD_CONFIGS[method] ?? METHOD_CONFIGS['Kemenag RI (Falak)'];

  // Zuhur (Saat Transit + Ihtiyath 2 menit)
  const zuhurHours = 12 - ephem.equationOfTime / 60 - lngCorrHours + 2 / 60;

  // Helper Jam Waktu Sholat berdasarkan Altitude (h)
  const getTimeForAltitude = (
    hDeg: number,
    isMorning: boolean,
    ihtiyathMin: number = 2
  ): { timeString: string; rawHours: number } => {
    const hRad = toRadians(hDeg);
    const cosT =
      (Math.sin(hRad) - Math.sin(phiRad) * Math.sin(decRad)) /
      (Math.cos(phiRad) * Math.cos(decRad));

    if (cosT < -1 || cosT > 1) {
      return { timeString: '--:--', rawHours: 0 };
    }

    const tHours = toDegrees(Math.acos(cosT)) / 15;
    const time = isMorning
      ? 12 - tHours - ephem.equationOfTime / 60 - lngCorrHours + ihtiyathMin / 60
      : 12 + tHours - ephem.equationOfTime / 60 - lngCorrHours + ihtiyathMin / 60;

    return {
      timeString: decimalToTime(time).substring(0, 5),
      rawHours: time,
    };
  };

  // Asar (Bayangan benda = panjang benda + bayangan zenith)
  const tanHAsar = 1 + Math.abs(Math.tan(phiRad - decRad));
  const hAsarDeg = toDegrees(Math.atan(1 / tanHAsar));
  const asar = getTimeForAltitude(hAsarDeg, false, 2);

  // Maghrib (-1.0° refraksi + semi-diameter)
  const maghrib = getTimeForAltitude(-1.0, false, 2);

  // Subuh (Sesuai sudut metode)
  const subuh = getTimeForAltitude(config.fajrAngle, true, 2);

  // Imsak (Subuh - 10 Menit)
  const imsakRaw = subuh.rawHours - 10 / 60;
  const imsakTime = decimalToTime(imsakRaw).substring(0, 5);

  // Isya (Sesuai sudut metode atau Menit Statis setelah Maghrib)
  let isyaTime = '--:--';
  if (config.isFixedIsha) {
    const isyaRaw = maghrib.rawHours + config.ishaMinutes / 60;
    isyaTime = decimalToTime(isyaRaw).substring(0, 5);
  } else {
    isyaTime = getTimeForAltitude(config.ishaAngle, false, 2).timeString;
  }

  return {
    Imsak: imsakTime,
    Subuh: subuh.timeString,
    Terbit: getTimeForAltitude(-1.0, true, -2).timeString,
    Dhuha: getTimeForAltitude(4.5, true, 2).timeString,
    Zuhur: decimalToTime(zuhurHours).substring(0, 5),
    Asar: asar.timeString,
    Maghrib: maghrib.timeString,
    Isya: isyaTime,
  };
};