import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cityOptions, type CityTheme } from '../../theme/cityTheme';
import { backendFetch, backendRoutes } from '../../services/backendRoutes';
import { useApp } from '../../context/AppContext';
import { SignupCitySelect } from './components/SignupCitySelect';
import { SignupRoleSelect } from './components/SignupRoleSelect';
import { SignupForm } from './components/SignupForm';

export type SignupType = 'user' | 'organizer' | null;

export function SignupScreen() {
  const navigate = useNavigate();
  const { cities } = useApp();

  const savedCityId = localStorage.getItem('last_city');

  const [signupType, setSignupType] = useState<SignupType>(null);
  const [selectedCityId, setSelectedCityId] = useState<CityTheme | null>(
    savedCityId ?? null
  );

  const currentCities = cities.length > 0 ? cities : cityOptions;
  const selectedCity = currentCities.find((option) => option.id === selectedCityId);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFormSubmit = async (formData: any) => {
    setLoading(true);
    setError('');

    try {
      await backendFetch(backendRoutes.createUser, {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          role: signupType === 'organizer' ? 'ORGANIZER' : 'USER',
        }),
      });

      // Save city configuration in case it is configured
      if (selectedCityId) {
        localStorage.setItem('last_city', selectedCityId);
      }

      navigate('/login', { state: { signupSuccess: true } });
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar cadastro.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(selectedCityId ? `/${selectedCityId}` : '/');
  };

  // Step 1: Select City
  if (!selectedCityId) {
    return (
      <SignupCitySelect
        currentCities={currentCities}
        setSelectedCityId={setSelectedCityId}
        handleBack={handleBack}
      />
    );
  }

  if (!selectedCity) {
    return null;
  }

  // Step 2: Select Role / Account Type
  if (signupType === null) {
    return (
      <SignupRoleSelect
        selectedCity={selectedCity}
        onBack={handleBack}
        setSignupType={setSignupType}
      />
    );
  }

  // Step 3: Registration Form (User or Organizer)
  return (
    <SignupForm
      selectedCity={selectedCity}
      signupType={signupType}
      onBack={() => setSignupType(null)}
      loading={loading}
      error={error}
      setError={setError}
      onSubmit={handleFormSubmit}
    />
  );
}
