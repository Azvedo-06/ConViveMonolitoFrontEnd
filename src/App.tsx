import { RouterProvider, createBrowserRouter, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { LoginScreen } from './features/auth/LoginScreen';
import { SignupScreen } from './features/auth/SignupScreen';
import { ProfileScreen } from './features/auth/ProfileScreen';
import { CityLandingScreen } from './features/city/CityLandingScreen';
import { CityOnboardingScreen } from './features/onboarding/CityOnboardingScreen';

const router = createBrowserRouter([
  {
    path: '/',
    element: <HomeRoute />,
  },
  {
    path: '/login',
    element: <CityRequiredRoute element={<LoginScreen />} />,
  },
  {
    path: '/signup',
    element: <CityRequiredRoute element={<SignupScreen />} />,
  },
  {
    path: '/profile',
    element: <ProtectedRoute element={<ProfileScreen />} />,
  },
  {
    path: '/:cityId',
    element: <CityLandingScreen />,
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

function CityRequiredRoute({ element }: { element: React.JSX.Element }) {
  const savedCity = localStorage.getItem('last_city');
  if (!savedCity) {
    return <Navigate to="/" replace />;
  }
  return element;
}

function HomeRoute() {
  const { loadingUser } = useApp();
  const savedCity = localStorage.getItem('last_city');

  if (loadingUser) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-neutral-200 border-t-brand-primary" />
      </div>
    );
  }

  if (savedCity) {
    return <Navigate to={`/${savedCity}`} replace />;
  }

  return <CityOnboardingScreen />;
}

function ProtectedRoute({ element }: { element: React.JSX.Element }) {
  const { user, loadingUser } = useApp();

  if (loadingUser) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-neutral-200 border-t-brand-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return element;
}

export default function App() {
  return (
    <AppProvider>
      <RouterProvider router={router} />
    </AppProvider>
  );
}
