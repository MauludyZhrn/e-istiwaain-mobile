let azanSound: any = null;

const AZAN_AUDIO_MAP: Record<string, any> = {
  subuh: require('../../assets/audio/adzan_subuh.mp3'),
  biasa: require('../../assets/audio/adzan_biasa.mp3'),
};

// Fungsi aman memanggil modul expo-av tanpa bikin aplikasi crash saat start
const getAudioModule = () => {
  try {
    const { Audio } = require('expo-av');
    return Audio;
  } catch (e) {
    return null;
  }
};

export const playAzanSound = async (prayerName: string = 'dzuhur') => {
  try {
    const Audio = getAudioModule();
    
    if (!Audio) {
      console.warn('Modul Audio (expo-av) belum terhubung di biner aplikasi.');
      return;
    }

    if (azanSound) {
      await azanSound.unloadAsync();
    }

    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });

    const isSubuh = prayerName.toLowerCase() === 'subuh' || prayerName.toLowerCase() === 'fajr';
    const audioFile = isSubuh ? AZAN_AUDIO_MAP.subuh : AZAN_AUDIO_MAP.biasa;

    const { sound } = await Audio.Sound.createAsync(audioFile);
    azanSound = sound;
    await azanSound.playAsync();

    azanSound.setOnPlaybackStatusUpdate((status: any) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync();
        azanSound = null;
      }
    });
  } catch (error) {
    console.warn('Gagal memutar audio Azan:', error);
  }
};

export const stopAzanSound = async () => {
  try {
    if (azanSound) {
      await azanSound.stopAsync();
      await azanSound.unloadAsync();
      azanSound = null;
    }
  } catch (error) {
    console.warn('Gagal menghentikan audio:', error);
  }
};