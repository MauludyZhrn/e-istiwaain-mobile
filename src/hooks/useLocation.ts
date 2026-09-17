import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { useAppStore } from '../store/useAppStore';

export const useLocation = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const setUserLocation = useAppStore((state) => state.setUserLocation);
  const userLocation = useAppStore((state) => state.userLocation);

  const fetchLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Izin akses lokasi ditolak');
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      try {
        const [place] = await Location.reverseGeocodeAsync(coords);
        const cityName = place?.city || place?.subregion || place?.region || 'Lokasi Terdeteksi';
        
        setUserLocation({ ...coords, cityName }); // Simpan ke Zustand bersama nama kota
      } catch {
        setUserLocation(coords);
      }

      setUserLocation(coords);
      setErrorMsg(null);
    } catch (err) {
      setErrorMsg('Gagal mengambil koordinat GPS');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userLocation) {
      fetchLocation();
    } else {
      setLoading(false);
    }
  }, []);

  return { location: userLocation, loading, errorMsg, refetch: fetchLocation };
};