export interface IstiwaComponentItem {
  id: string;
  name: string;
  arabicName: string;
  functionText: string;
  specs: string;
  sopText: string;
  iconName: string;
}

export const istiwaComponentsData: IstiwaComponentItem[] = [
  {
    id: 'gnomon',
    name: 'Gnomon (Tongkat Istiwa)',
    arabicName: 'الشخاص (Asy-Syakhas)',
    functionText: 'Batang vertikal tegak lurus yang berfungsi memproyeksikan bayangan sinar matahari ke atas bidang dial.',
    specs: 'Bahan kuningan/stainles steel anti karat, tinggi presisi 10-15 cm, ujung runcing 0.5 mm.',
    sopText: 'Pastikan gnomon berada persis di titik pusat lingkaran dial ($90^\circ$ vertikal terhadap bidang).',
    iconName: 'pin',
  },
  {
    id: 'dial-plate',
    name: 'Bidang Dial (Plat Azimuth)',
    arabicName: 'قرص الظل (Qursy Azh-Zhil)',
    functionText: 'Papan datar bergraduasi skala derajat $0^\circ - 360^\circ$ untuk membaca arah sudut bayangan dan posisi kiblat.',
    specs: 'Plat akrilik/kuningan tebal 3 mm, skala ukur dengan ketelitian hingga $0.5^\circ$.',
    sopText: 'Posisikan garis $0^\circ - 180^\circ$ sejajar dengan garis utara-selatan sejati.',
    iconName: 'disc',
  },
  {
    id: 'waterpass',
    name: 'Waterpass (Nivo Tabung/Gelembung)',
    arabicName: 'Mizan al-Ma\' (ميزان الماء)',
    functionText: 'Alat ukur kerataan horizontal untuk memastikan bidang dial berada pada posisi datar sempurna ($0^\circ$ kemiringan).',
    specs: 'Nivo gelembung ganda (dua aksis X dan Y) sensitivitas tinggi.',
    sopText: 'Atur sekrup penyangga di 3 titik alas sampai gelembung nivo berada tepat di tengah lingkaran.',
    iconName: 'check-circle',
  },
  {
    id: 'plumb-line',
    name: 'Tali Sifat / Untang-Untang',
    arabicName: 'الشاقول (Asy-Syaqul)',
    functionText: 'Tali berbeban untuk memverifikasi ketegaklurusan Gnomon terhadap bidang bumi secara gravitasi.',
    specs: 'Benang nilon halus dengan pemberat tembaga simetris.',
    sopText: 'Gantungkan tali di samping gnomon saat pengujian awal sebelum pengukuran di lapangan.',
    iconName: 'align-center',
  },
  {
    id: 'qibla-scale',
    name: 'Skala Busur Azimuth Kiblat',
    arabicName: 'قوس القبلة (Qaus al-Qiblah)',
    functionText: 'Penanda sudut khusus kiblat lokasi setempat yang dihitung dari azimuth matahari saat rasdul kiblat atau bayangan hisab.',
    specs: 'Skala penanda fleksibel yang dapat digeser sesuai koordinat lokasi pengamatan.',
    sopText: 'Setel penunjuk azimuth kiblat sesuai hasil kalkulasi menu Hisab Istiwa\'ani.',
    iconName: 'navigation',
  },
];