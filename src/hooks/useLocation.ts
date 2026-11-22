import { useAppStore } from '../store/useAppStore';
import {
  syncCurrentLocation,
  useLocationRuntimeStore,
} from '../services/locationService';

export const useLocation = () => {
  const location = useAppStore((state) => state.userLocation);
  const autoLocation = useAppStore((state) => state.autoLocation) ?? true;
  const refreshing = useLocationRuntimeStore((state) => state.loading);
  const errorMsg = useLocationRuntimeStore((state) => state.errorMsg);
  const status = useLocationRuntimeStore((state) => state.status);

  const loading = !location && refreshing;

  return {
    location,
    loading,
    refreshing,
    errorMsg,
    status,
    autoLocation,
    refetch: syncCurrentLocation,
  };
};
