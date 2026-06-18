import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { backendFetch, backendRoutes, type UserResponseDto } from '../services/backendRoutes';
import { cityOptions, type CityConfig } from '../theme/cityTheme';

type AppContextType = {
  user: UserResponseDto | null;
  setUser: (user: UserResponseDto | null) => void;
  cities: CityConfig[];
  loadingUser: boolean;
  loadingCities: boolean;
  fetchUserProfile: () => Promise<void>;
  fetchCities: () => Promise<void>;
  logout: () => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponseDto | null>(null);
  const [cities, setCities] = useState<CityConfig[]>([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingCities, setLoadingCities] = useState(true);

  const fetchUserProfile = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setLoadingUser(false);
      return;
    }
    try {
      const profile = await backendFetch<UserResponseDto>(backendRoutes.me);
      setUser(profile);
    } catch (err) {
      console.error('Failed to fetch user profile, clearing token:', err);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  }, []);

  const fetchCities = useCallback(async () => {
    setLoadingCities(true);
    try {
      const data = await backendFetch<CityConfig[]>(backendRoutes.cities);
      setCities(data);
    } catch (err) {
      console.error('Failed to fetch cities, using static config fallback:', err);
      setCities(cityOptions);
    } finally {
      setLoadingCities(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  useEffect(() => {
    async function init() {
      await fetchUserProfile();
      await fetchCities();
    }
    init();
  }, [fetchUserProfile, fetchCities]);

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        cities,
        loadingUser,
        loadingCities,
        fetchUserProfile,
        fetchCities,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
