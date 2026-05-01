import { useState } from 'react';
import { LoginScreen } from './features/auth/LoginScreen';
import { CityLandingScreen } from './features/city/CityLandingScreen';
import { CityOnboardingScreen } from './features/onboarding/CityOnboardingScreen';
import { applyCityTheme, type CityTheme } from './theme/cityTheme';

const onboardingBackgroundUrl = '/images/cidades-onboarding-fundo.jpg';
const onboardingBackgroundFallbackUrl =
  'https://images.unsplash.com/photo-1528909514045-2fa4ac7a08ba?auto=format&fit=crop&w=1680&q=80';

export default function App() {
  const [selectedCity, setSelectedCity] = useState<CityTheme | null>(null);
  const [currentScreen, setCurrentScreen] = useState<'city' | 'login'>('city');

  function handleCitySelected(city: CityTheme) {
    applyCityTheme(city);
    setSelectedCity(city);
    setCurrentScreen('city');
  }

  function handleBackToCitySelect() {
    setSelectedCity(null);
    setCurrentScreen('city');
  }

  function handleOpenLogin() {
    setCurrentScreen('login');
  }

  function handleBackFromLogin() {
    setCurrentScreen('city');
  }

  if (!selectedCity) {
    return (
      <CityOnboardingScreen
        backgroundImageUrl={onboardingBackgroundUrl}
        backgroundImageFallbackUrl={onboardingBackgroundFallbackUrl}
        onCitySelected={handleCitySelected}
      />
    );
  }

  if (currentScreen === 'login') {
    return <LoginScreen city={selectedCity} onBack={handleBackFromLogin} />;
  }

  return (
    <CityLandingScreen
      city={selectedCity}
      onBack={handleBackToCitySelect}
      onLogin={handleOpenLogin}
    />
  );
}
