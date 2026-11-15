<div align="center">
  <img src="assets/e-Istiwaain-Logo/png/logo-color_512.png" alt="e-Istiwaain Logo" width="180" />
  <h1>e-Istiwaain Mobile</h1>
  <p><strong>Aplikasi Ilmu Falak Digital: Hisab Istiwa'aini 3D, Kompas &amp; AR Kiblat, Jadwal Shalat, serta Edukasi Instrumen Falak</strong></p>

  <p>
    <img src="https://img.shields.io/badge/Expo-SDK%2057-000020?style=flat-square&logo=expo" alt="Expo SDK 57" />
    <img src="https://img.shields.io/badge/React%20Native-0.86-61DAFB?style=flat-square&logo=react" alt="React Native 0.86" />
    <img src="https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Three.js-0.186-000000?style=flat-square&logo=three.js" alt="Three.js" />
    <img src="https://img.shields.io/badge/License-MIT-09473E?style=flat-square" alt="License MIT" />
  </p>
</div>

---

## Tentang Proyek

**e-Istiwaain** adalah aplikasi mobile berbasis React Native (Expo SDK 57) yang dirancang untuk membantu praktisi Ilmu Falak, santri, mahasiswa, dan masyarakat umum dalam melakukan penentuan arah kiblat secara akurat baik secara komputasi hisab maupun simulasi penggunaan instrumen **Istiwa'aini** karya **Drs. KH. Slamet Hambali, M.Si**.

Aplikasi ini mengintegrasikan perhitungan trigonometri bola (*Spherical Trigonometry*), visualisasi model 3D langsung dari berkas `assets/istiwaain.glb`, kompas magnetometer & kamera AR, jadwal shalat multi-metode lengkap dengan pemutar & notifikasi audio adzan lokal, serta modul pembelajaran Ilmu Falak.

---

## Fitur Utama

### 1. Dashboard & Waktu Istiwa' Real-Time
- **Dual-Clock Lokal & Istiwa':** Menampilkan waktu standar lokal (`WIB`/`WITA`/`WIT`/`UTC`) bersanding dengan **Waktu Istiwa'** (berbasis transit Matahari lokal) secara real-time.
- **Penanggalan Pasaran Jawa:** Menampilkan hari, pasaran Jawa, dan tanggal Masehi.
- **Hitung Mundur Shalat:** Countdown presisi menuju waktu shalat berikutnya disertai nama kecamatan/kota melalui reverse geocoding GPS.

### 2. Hisab Istiwa'aini & Simulasi 3D (`assets/istiwaain.glb`)
- **Kalkulasi Falak Lengkap:** Menghitung Deklinasi Matahari, *Equation of Time*, SBMD, Azimut Kiblat (`AK`), Azimut Matahari (`AM`), Tinggi Matahari / *Irtafa'*, **Beda Azimut (`BA = AK - AM`)**, panjang bayangan tongkat 15 cm, dan waktu **Rashdul Qibla** (Istiwa' & lokal).
- **Simulasi 3D Interaktif:** Memuat model 3D [`assets/istiwaain.glb`](assets/istiwaain.glb) menggunakan `GLTFLoader` (`three`) dengan kontrol putar sentuh 3D (*pan gesture*), bola Matahari, berkas sinar datang, bayangan ganda dari **Tongkat 0°** & **Tongkat Pusat**, serta busur penarikan garis Kiblat.
- **Dua Mode Orientasi Simulasi:**
  - `Mode: Bidik 0° ke ☀️` — memperagakan SOP nyata alat di lapangan (bayangan Tongkat 0° jatuh lurus menumbuk Tongkat Pusat dan garis Kiblat ditarik sebesar Beda Azimut `BA`).
  - `Mode: Peta UTSB` — memperagakan orientasi astronomis terhadap Utara Sejati (`0°`).
- **SOP Cara Pakai Alat:** Panduan 4 langkah sistematis penggunaan instrumen Istiwa'aini di lapangan.

### 3. Kompas & AR Arah Kiblat + Rincian Hisab
- **Kompas 2D Stabil:** Pembacaan sensor magnetometer dengan filter *Exponential Moving Average* (EMA) pada koordinat polar $\sin/\cos$ agar jarum stabil dan mulus di transisi $0^\circ \leftrightarrow 360^\circ$.
- **Kamera AR Kiblat:** Overlay arah Kiblat langsung di atas tampilan kamera perangkat secara real-time.
- **Tab Perhitungan Falak:** Menampilkan langkah matematis penentuan arah kiblat menggunakan koordinat presisi Ka'bah (`21° 25' 21" LU`, `39° 49' 34" BT`) dan rumus trigonometri bola.

### 4. Jadwal Shalat, Imsakiyah & Audio Adzan
- **Multi Metode Perhitungan:** Mendukung metode **Kemenag RI (Falak)**, **MWL**, **Egyptian**, dan **Umm al-Qura**.
- **Jadwal Harian & Bulanan:** Tampilan daftar waktu shalat harian serta tabel kalender Imsakiyah bulanan.
- **Audio & Notifikasi Adzan:** Terintegrasi dengan [`assets/audio/adzan_subuh.mp3`](assets/audio/adzan_subuh.mp3) (khusus waktu Subuh) dan [`assets/audio/adzan_biasa.mp3`](assets/audio/adzan_biasa.mp3) (Dzuhur, Ashar, Maghrib, Isya), penjadwalan notifikasi lokal Android, pemicu otomatis saat masuk waktu shalat, serta kontrol putar/henti manual.

### 5. Modul Edukasi & Anatomi Istiwa'aini
- **Modul Arah Kiblat:** Materi terstruktur lengkap dengan rumus, variabel falak, kutipan referensi, dan kota acuan.
- **Komponen Istiwa'aini:** Penjelasan anatomi fisik tiap komponen instrumen beserta spesifikasi dan SOP kalibrasi.

### 6. Pengaturan Kustomisasi
- Mode Gelap / Terang (*Dark / Light Theme*), GPS otomatis, pemilihan metode Falak, pengaturan suara notifikasi adzan, serta tombol tes suara Adzan Biasa dan Adzan Subuh.

---

## Struktur Direktori

```text
e-istiwaain/
├── assets/
│   ├── audio/                 # Audio adzan_biasa.mp3 & adzan_subuh.mp3
│   ├── e-Istiwaain-Logo/      # Paket aset ikon, logo, android res & web favicon
│   └── istiwaain.glb          # Model 3D instrumen Istiwa'aini (glTF 2.0 binary)
├── plugins/
│   └── withTransparentAndroidSplashIcon.js # Menjaga launch bridge Android tetap #09473E tanpa ikon statis ganda
├── src/
│   ├── components/
│   │   ├── IstiwaainiScene3D.tsx # Loader & renderer 3D GLB
│   │   └── splash/               # Animated Celestial Fluid Motion splash (2.5s)
│   ├── constants/                # Tema warna, data modul & komponen Istiwa'aini
│   ├── features/
│   │   ├── compass/           # CompassScreen.tsx (Kompas 2D, AR & Rumus Falak)
│   │   ├── dashboard/         # DashboardScreen.tsx (Jam Istiwa' & Ringkasan)
│   │   ├── hisab/             # HisabScreen.tsx (Kalkulator Falak & Modal 3D/SOP)
│   │   ├── modules/           # ModuleDetailScreen.tsx & IstiwaComponentScreen.tsx
│   │   ├── prayertime/        # PrayerTimeScreen.tsx (Jadwal Shalat & Alarm Adzan)
│   │   └── settings/          # SettingsScreen.tsx (Tema, Metode & Audio Adzan)
│   ├── hooks/                 # useLocation.ts
│   ├── navigation/            # RootNavigator.tsx
│   ├── services/              # soundService.ts (Playback & Notifikasi Adzan)
│   ├── store/                 # useAppStore.ts (Zustand + AsyncStorage)
│   ├── types/                 # Definisi tipe TypeScript
│   └── utils/                 # falakMath.ts (Mesin perhitungan Ilmu Falak)
├── App.tsx
├── app.json
├── eas.json
├── index.ts
├── metro.config.js            # Asset ekstensi .glb/.gltf & resolusi modul three
└── package.json
```

---

## Cara Menjalankan Proyek

### Prasyarat
- Node.js (disarankan v20+)
- Android Studio / Android SDK (untuk build native lokal) atau akun Expo EAS

### 1. Instalasi Dependensi
```bash
npm install
```

### 2. Menjalankan Development Server
```bash
npx expo start
```

### 3. Build & Jalankan di Android (Development Build)
Karena aplikasi ini menggunakan modul native seperti `expo-audio`, `expo-notifications`, `expo-camera`, dan `expo-sensors`, disarankan menggunakan **Development Build**:

```bash
# Generate folder native android dari app.json
npx expo prebuild --platform android

# Build & jalankan ke perangkat/emulator Android
npx expo run:android
```

Atau menggunakan **EAS Build**:
```bash
# Development build
eas build --platform android --profile development

# Internal preview APK (termasuk native splash bridge & expo-updates)
eas build --platform android --profile preview
```

---

## EAS Update (OTA) & Kebijakan Rilis

Aplikasi menggunakan `expo-updates` (`runtimeVersion.policy: "appVersion"`, `checkAutomatically: "ON_LOAD"`, `fallbackToCacheTimeout: 0`, `useEmbeddedUpdate: true`) sehingga app langsung terbuka memakai bundle lokal/cache (tetap bekerja offline) dan mengunduh pembaruan JS/aset secara asynchronous untuk diterapkan pada peluncuran berikutnya.

### Pemetaan Channel & Build Profile (`eas.json`)
- `development` → channel `development` (`developmentClient: true`, distribusi internal)
- `preview` → channel `preview` (distribusi internal APK)
- `production` → channel `production` (`autoIncrement: true`)

### Perintah Publikasi OTA Update

**Preview channel (pengujian internal):**
```bash
eas update --channel preview --message "Update description" --environment preview
```

**Production channel (rilis pengguna):**
```bash
eas update --channel production --message "Update description" --environment production
```

### Batasan OTA Update vs Build Native Baru
- **Bisa lewat OTA (`eas update`):** perubahan kode JavaScript/TypeScript, perbaikan UI/logika, dan aset terbundel yang kompatibel dengan native runtime terpasang.
- **Wajib Build Native Baru (`eas build`):** menambah/mengubah dependensi native, izin Android/iOS, `AndroidManifest`, konfigurasi native splash, upgrade Expo SDK / React Native, atau perubahan integrasi native lainnya.
- Jangan ubah `runtimeVersion` untuk update JS biasa. Saat ada perubahan native, naikkan `expo.version` pada `app.json` (karena memakai policy `appVersion`) lalu buat build APK/AAB baru.

### Kebijakan Pengembangan Lanjutan
Utamakan pemakaian ulang pustaka yang sudah terpasang (`react-native-reanimated`, `react-native-svg`, `zustand`, `@react-navigation/*`, `three`, serta modul Expo untuk GPS, audio, sensor, kamera, dan notifikasi) sebelum menambah dependensi baru.

---

## Pemeriksaan Tipe (TypeScript)
```bash
npx tsc --noEmit
```

---

## Lisensi
Proyek ini menggunakan lisensi [MIT](LICENSE).
