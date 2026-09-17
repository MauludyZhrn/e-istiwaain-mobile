import { KiblatModule } from '../types/module';

export const kiblatModulesData: KiblatModule[] = [
  {
    id: 'hisab-kiblat-sains',
    slug: 'hisab-kiblat-sains',
    title: 'Hisab Kiblat: Sains di Balik Arah Sholat Umat Islam',
    subtitle:
      'Dari kompas sederhana abad ke-8 hingga algoritma trigonometri bola modern — perjalanan panjang umat Islam dalam menentukan arah menghadap Ka\'bah secara presisi.',
    category: 'pendahuluan',
    readTimeMinutes: 10,
    difficulty: 'menengah',
    iconName: 'compass',
    summary:
      'Kajian mendalam ilmu falak, sejarah penentuan kiblat, perbandingan metode Taqribi dan Tahqiqi, serta rumus trigonometri bola.',
    blocks: [
      {
        type: 'paragraph',
        content:
          'Setiap hari, lebih dari 1,8 miliar Muslim di seluruh penjuru bumi mengarahkan wajah ke satu titik yang sama: Ka\'bah di Masjidil Haram, Makkah. Tindakan sederhana ini menyimpan kedalaman ilmu yang mempertemukan fikih, astronomi, matematika, dan geografi dalam satu disiplin yang disebut ilmu falak atau hisab kiblat.',
      },
      {
        type: 'paragraph',
        content:
          'Pertanyaannya bukan sekadar "ke mana harus menghadap?" melainkan "bagaimana kita tahu arah itu benar?" Di atas permukaan bola bumi yang berdiameter hampir 12.800 kilometer, menentukan arah terdekat menuju satu titik koordinat adalah soal geometri bola — bukan geometri datar.',
      },
      {
        type: 'quote',
        text: 'Hadapkanlah wajahmu ke arah Masjidil Haram. Di mana pun kamu berada, hadapkanlah wajahmu ke arahnya.',
        source: 'QS. Al-Baqarah [2]: 144',
      },
      {
        type: 'paragraph',
        content:
          'Ayat ini mengakhiri periode singkat ketika umat Islam menghadap ke arah Baitul Maqdis (Yerusalem) sekaligus membuka babak baru kebutuhan mengembangkan metode penentuan arah yang akurat.',
      },
      {
        type: 'h2',
        content: 'Sejarah Panjang Penentuan Kiblat',
      },
      {
        type: 'paragraph',
        content:
          'Pada masa awal Islam, penentuan kiblat dilakukan secara kasar (taqribi) berbasis arah umum lokal. Lompatan besar terjadi pada abad ke-9 ketika Al-Khawarizmi mulai menerapkan trigonometri bola untuk menghitung kiblat dan menyajikan tabel koordinat lebih dari 2.400 kota.',
      },
      {
        type: 'illustration',
        caption:
          'Perbedaan antara rhumb line (sudut kompas konstan) dan great circle (jarak terpendek di bola bumi).',
        svgType: 'mercator_vs_great_circle',
      },
      {
        type: 'paragraph',
        content:
          'Astronomer Suriah, Ibn al-Shatir (1304–1375 M), menyempurnakan metode hisab kiblat dengan tabel trigonometri presisi tinggi menggunakan formula kosinus sferis yang setara dengan formula modern.',
      },
      {
        type: 'h2',
        content: 'Dua Mazhab Metode: Taqribi vs. Tahqiqi',
      },
      {
        type: 'paragraph',
        content:
          'Metode Taqribi mengandalkan tanda-tanda alam (posisi matahari, bintang Polaris, bayangan gnomon). Metode Tahqiqi menggunakan formula trigonometri bola dengan data lintang dan bujur lokasi sholat maupun Ka\'bah.',
      },
      {
        type: 'quote',
        text: 'Orang yang mampu melakukan hisab dan sengaja tidak melakukannya, lalu arah kiblatnya meleset jauh — maka sholatnya perlu diulangi. Demikian pendapat yang rajih dalam mazhab kami.',
        source: 'Al-Nawawi, Al-Majmu\' Syarh al-Muhadzdzab, Jil. 3',
      },
      {
        type: 'h2',
        content: 'Formula Hisab Kiblat: Trigonometri Bola',
      },
      {
        type: 'formula',
        title: 'Koordinat Referensi — Ka\'bah, Masjidil Haram',
        expression: 'φK = 21.4225° LU | λK = 39.8261° BT',
        explanation: 'Sumber data survei resmi General Authority for Survey (GAS), Arab Saudi.',
        variables: [
          { symbol: 'φK', meaning: 'Lintang Ka\'bah', value: '21.4225°' },
          { symbol: 'λK', meaning: 'Bujur Ka\'bah', value: '39.8261°' },
        ],
      },
      {
        type: 'formula',
        title: 'Formula Cotangent Sferis (Metode Klasik)',
        expression: 'Q = arctan [ sin(ΔL) / (cos(φP) · tan(φK) − sin(φP) · cos(ΔL)) ]',
        explanation: 'di mana ΔL = λK − λP. Nilai Q disesuaikan kuadrannya berdasarkan tanda ΔL.',
        variables: [
          { symbol: 'φP', meaning: 'Lintang Pengamat' },
          { symbol: 'λP', meaning: 'Bujur Pengamat' },
          { symbol: 'ΔL', meaning: 'Selisih Bujur (λK - λP)' },
        ],
      },
      {
        type: 'formula',
        title: 'Contoh Perhitungan: Jakarta (−6.2088°, 106.8456°)',
        expression: 'ΔL = −67.0195° | Q = (atan2(−0.8575, 0.4023) + 360°) mod 360° = 295.15°',
        explanation: 'Hasil: Kiblat Jakarta berada pada azimuth 295.15° (Barat-Barat Laut).',
      },
    ],
    cityReferences: [
      { cityName: 'Banda Aceh', latitude: 5.55, longitude: 95.32, formattedLat: '5.55° LU', formattedLng: '95.32° BT', qiblaAzimuth: 292.9, compassDirection: 'Barat-Barat Laut', distanceKm: 7128 },
      { cityName: 'Medan', latitude: 3.59, longitude: 98.67, formattedLat: '3.59° LU', formattedLng: '98.67° BT', qiblaAzimuth: 293.8, compassDirection: 'Barat-Barat Laut', distanceKm: 7348 },
      { cityName: 'Padang', latitude: -0.95, longitude: 100.37, formattedLat: '0.95° LS', formattedLng: '100.37° BT', qiblaAzimuth: 295.0, compassDirection: 'Barat-Barat Laut', distanceKm: 7573 },
      { cityName: 'Palembang', latitude: -2.92, longitude: 104.74, formattedLat: '2.92° LS', formattedLng: '104.74° BT', qiblaAzimuth: 295.7, compassDirection: 'Barat-Barat Laut', distanceKm: 7771 },
      { cityName: 'Jakarta', latitude: -6.21, longitude: 106.85, formattedLat: '6.21° LS', formattedLng: '106.85° BT', qiblaAzimuth: 295.2, compassDirection: 'Barat-Barat Laut', distanceKm: 7922 },
      { cityName: 'Bandung', latitude: -6.91, longitude: 107.61, formattedLat: '6.91° LS', formattedLng: '107.61° BT', qiblaAzimuth: 295.1, compassDirection: 'Barat-Barat Laut', distanceKm: 7966 },
      { cityName: 'Semarang', latitude: -6.97, longitude: 110.42, formattedLat: '6.97° LS', formattedLng: '110.42° BT', qiblaAzimuth: 294.4, compassDirection: 'Barat-Barat Laut', distanceKm: 8125 },
      { cityName: 'Yogyakarta', latitude: -7.80, longitude: 110.37, formattedLat: '7.80° LS', formattedLng: '110.37° BT', qiblaAzimuth: 294.1, compassDirection: 'Barat-Barat Laut', distanceKm: 8183 },
      { cityName: 'Surabaya', latitude: -7.26, longitude: 112.74, formattedLat: '7.26° LS', formattedLng: '112.74° BT', qiblaAzimuth: 293.5, compassDirection: 'Barat-Barat Laut', distanceKm: 8290 },
      { cityName: 'Denpasar', latitude: -8.65, longitude: 115.22, formattedLat: '8.65° LS', formattedLng: '115.22° BT', qiblaAzimuth: 292.7, compassDirection: 'Barat-Barat Laut', distanceKm: 8468 },
      { cityName: 'Mataram (NTB)', latitude: -8.58, longitude: 116.12, formattedLat: '8.58° LS', formattedLng: '116.12° BT', qiblaAzimuth: 292.5, compassDirection: 'Barat-Barat Laut', distanceKm: 8522 },
      { cityName: 'Makassar', latitude: -5.14, longitude: 119.43, formattedLat: '5.14° LS', formattedLng: '119.43° BT', qiblaAzimuth: 291.7, compassDirection: 'Barat-Barat Laut', distanceKm: 8626 },
      { cityName: 'Banjarmasin', latitude: -3.32, longitude: 114.59, formattedLat: '3.32° LS', formattedLng: '114.59° BT', qiblaAzimuth: 292.9, compassDirection: 'Barat-Barat Laut', distanceKm: 8380 },
      { cityName: 'Samarinda', latitude: -0.50, longitude: 117.16, formattedLat: '0.50° LS', formattedLng: '117.16° BT', qiblaAzimuth: 291.8, compassDirection: 'Barat-Barat Laut', distanceKm: 8571 },
      { cityName: 'Manado', latitude: 1.49, longitude: 124.84, formattedLat: '1.49° LU', formattedLng: '124.84° BT', qiblaAzimuth: 288.9, compassDirection: 'Barat-Barat Laut', distanceKm: 9015 },
      { cityName: 'Jayapura', latitude: -2.53, longitude: 140.72, formattedLat: '2.53° LS', formattedLng: '140.72° BT', qiblaAzimuth: 284.2, compassDirection: 'Barat-Barat Laut', distanceKm: 9894 },
    ],
    scholars: [
      { name: 'Al-Khawarizmi', initials: 'Kh', era: 'Abad ke-9 M', contribution: 'Bapak Aljabar, pelopor rumus trigonometri bola kiblat & tabulasi koordinat awal.' },
      { name: 'Al-Biruni', initials: 'Bi', era: 'Abad ke-11 M', contribution: 'Penyempurna formula kiblat sferis presisi tinggi.' },
      { name: 'Ibn al-Shatir', initials: 'Sh', era: 'Abad ke-14 M', contribution: 'Penyusun tabel trigonometri kiblat madrasah Timur Tengah.' },
    ],
    references: [
      'Al-Nawawi, Al-Majmu\', Jil. 3, Dar al-Fikr, Beirut',
      'Al-Biruni, Kitab al-Qanun al-Mas\'udi, terjemahan E. Sachau',
      'King, D.A., World-Maps for Finding the Direction and Distance to Mecca, 1999',
      'GAGAS, National Report of Saudi Arabia, XXIV FIG Congress, 2010',
    ],
  },
];