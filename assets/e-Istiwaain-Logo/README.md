# e-Istiwaain – Logo & Asset Aplikasi

| Folder | Isi |
|---|---|
| `svg/` | Master vektor (bisa diperbesar tanpa pecah). `logo-*` = ikon + teks, `icon-*` = ikon saja. Varian: `color`, `black`, `white`, `gold` (ikon saja). |
| `png/` | PNG transparan, sisi terpanjang 2048 px dan 512 px. |
| `jpg/` | JPG kualitas 95 (tanpa transparansi): latar putih; varian `white` memakai latar hijau tua `#09473E`. |
| `android/res/` | Siap salin ke `app/src/main/res/`: launcher legacy + round, adaptive icon (foreground, monochrome, XML), ikon notifikasi putih. |
| `android/playstore/` | `ic_launcher-512.png` (Play Console) dan `app_icon_1024.png`. |
| `web/` | `favicon.ico` (16–256 px), `icon_192.png`, `icon_512.png`. |
| `preview.png` | Ringkasan semua varian. |

## Pasang ikon di Android
1. Salin isi `android/res/` ke `app/src/main/res/` (timpa ikon lama).
2. Di `AndroidManifest.xml`:
   `android:icon="@mipmap/ic_launcher"` dan `android:roundIcon="@mipmap/ic_launcher_round"`
3. Ikon notifikasi: `@drawable/ic_stat_istiwaain` (putih transparan, sesuai aturan status bar).
4. Warna latar adaptive icon ada di `values/ic_launcher_background.xml` (`#FFFFFF`, ubah bila perlu).

## Warna
- Oranye `#F9A729`
- Hijau tua `#09473E`
- Teal `#117E86` (gradasi pada gelombang)
- Emas `#C39747`
