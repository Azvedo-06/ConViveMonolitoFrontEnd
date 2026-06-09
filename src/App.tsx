import { useState, useEffect } from 'react';
import { LoginScreen } from './features/auth/LoginScreen';
import { SignupScreen } from './features/auth/SignupScreen';
import { ProfileScreen } from './features/auth/ProfileScreen';
import { CityLandingScreen } from './features/city/CityLandingScreen';
import { CityOnboardingScreen } from './features/onboarding/CityOnboardingScreen';
import { applyCityTheme, cityOptions, type CityTheme, type CityConfig } from './theme/cityTheme';
import { backendFetch, backendRoutes, type UserResponseDto } from './services/backendRoutes';

const onboardingBackgroundUrl = '/images/cidades-onboarding-fundo.jpg';
const onboardingBackgroundFallbackUrl =
  'https://images.unsplash.com/photo-1528909514045-2fa4ac7a08ba?auto=format&fit=crop&w=1680&q=80';

export default function App() {
  const [selectedCity, setSelectedCity] = useState<CityTheme | null>(null);
  const [currentScreen, setCurrentScreen] = useState<'city' | 'login' | 'signup' | 'profile'>('city');
  const [user, setUser] = useState<UserResponseDto | null>(null);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [cities, setCities] = useState<CityConfig[]>([]);

  async function fetchUserProfile() {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const profile = await backendFetch<UserResponseDto>(backendRoutes.me);
      setUser(profile);
    } catch (err) {
      console.error('Failed to fetch user profile, clearing token:', err);
      localStorage.removeItem('token');
      setUser(null);
    }
  }

  async function fetchCities() {
    try {
      const data = await backendFetch<CityConfig[]>(backendRoutes.cities);
      setCities(data);
    } catch (err) {
      console.error('Failed to fetch cities, using static config fallback:', err);
      setCities(cityOptions);
    }
  }

  useEffect(() => {
    fetchUserProfile();
    fetchCities();
  }, []);

  function handleCitySelected(cityId: CityTheme) {
    const config = cities.find(c => c.id === cityId) || cityOptions.find(c => c.id === cityId);
    if (config) {
      applyCityTheme(config);
    }
    setSelectedCity(cityId);
    setCurrentScreen('city');
  }

  function handleBackToCitySelect() {
    setSelectedCity(null);
    setCurrentScreen('city');
  }

  function handleOpenLogin() {
    setSignupSuccess(false);
    setCurrentScreen('login');
  }

  function handleOpenSignup() {
    setSignupSuccess(false);
    setCurrentScreen('signup');
  }

  function handleBackFromLogin() {
    setCurrentScreen('city');
  }

  function handleBackFromSignup() {
    setCurrentScreen('city');
  }

  async function handleLoginSuccess() {
    await fetchUserProfile();
    setCurrentScreen('city');
  }

  function handleSignupAsUser() {
    setSignupSuccess(true);
    setCurrentScreen('login');
  }

  function handleSignupAsOrganizer() {
    setSignupSuccess(true);
    setCurrentScreen('login');
  }

  function handleLogout() {
    localStorage.removeItem('token');
    setUser(null);
  }

  if (currentScreen === 'login') {
    return (
      <LoginScreen
        city={selectedCity ?? undefined}
        cities={cities}
        onBack={handleBackFromLogin}
        onSignup={handleOpenSignup}
        onLoginSuccess={handleLoginSuccess}
        signupSuccess={signupSuccess}
      />
    );
  }

  if (currentScreen === 'signup') {
    return (
      <SignupScreen
        city={selectedCity ?? undefined}
        cities={cities}
        onBack={handleBackFromSignup}
        onSignupAsUser={handleSignupAsUser}
        onSignupAsOrganizer={handleSignupAsOrganizer}
      />
    );
  }

  if (currentScreen === 'profile') {
    return (
      <ProfileScreen
        city={selectedCity ?? undefined}
        cities={cities}
        user={user}
        onBack={() => setCurrentScreen('city')}
        onProfileUpdated={fetchUserProfile}
      />
    );
  }

  if (!selectedCity) {
    return (
      <CityOnboardingScreen
        backgroundImageUrl={onboardingBackgroundUrl}
        backgroundImageFallbackUrl={onboardingBackgroundFallbackUrl}
        onCitySelected={handleCitySelected}
        user={user}
        cities={cities}
        onCityAdded={fetchCities}
      />
    );
  }

  return (
    <CityLandingScreen
      city={selectedCity}
      cities={cities}
      user={user}
      onLogout={handleLogout}
      onBack={handleBackToCitySelect}
      onLogin={handleOpenLogin}
      onSignup={handleOpenSignup}
      onOpenProfile={() => setCurrentScreen('profile')}
    />
  );
}
