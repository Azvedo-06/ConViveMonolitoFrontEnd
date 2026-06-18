import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cityOptions } from '../../theme/cityTheme';
import { backendFetch, backendRoutes, type UserResponseDto } from '../../services/backendRoutes';
import { useApp } from '../../context/AppContext';
import { ProfileForm } from './components/ProfileForm';
import { MyAgenda } from './components/MyAgenda';
import { EventAgendaDetailsModal } from './components/EventAgendaDetailsModal';

export function ProfileScreen() {
  const navigate = useNavigate();
  const { user, cities, fetchUserProfile } = useApp();

  const savedCityId = localStorage.getItem('last_city');
  const selectedCity = savedCityId
    ? cities.find((option) => option.id === savedCityId) ||
      cityOptions.find((option) => option.id === savedCityId)
    : null;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [myEvents, setMyEvents] = useState<{ created: any[]; joined: any[] }>({ created: [], joined: [] });
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  const handleBack = () => {
    navigate(savedCityId ? `/${savedCityId}` : '/');
  };

  async function loadMyEvents() {
    try {
      setLoadingEvents(true);
      const data = await backendFetch<{ created: any[]; joined: any[] }>(backendRoutes.myEvents);
      setMyEvents(data);
    } catch (err) {
      console.error('Failed to load user events:', err);
    } finally {
      setLoadingEvents(false);
    }
  }

  useEffect(() => {
    if (user) {
      loadMyEvents();
    }
  }, [user]);

  const handleProfileUpdate = async (payload: any) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await backendFetch<UserResponseDto>(backendRoutes.updateMe, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      setSuccess('Perfil atualizado com sucesso!');
      fetchUserProfile();
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar o perfil.');
    } finally {
      setLoading(false);
    }
  };

  const activeSelectedEvent = selectedEvent
    ? myEvents.joined.find((e: any) => e.id === selectedEvent.id) ||
      myEvents.created.find((e: any) => e.id === selectedEvent.id) ||
      selectedEvent
    : null;

  return (
    <section className="min-h-screen bg-gradient-to-br from-brand-primary/15 via-surface to-brand-secondary/15 px-4 py-5 text-text md:px-8 md:py-8" data-testid="profile-screen">
      <div className="mx-auto flex min-h-[calc(100vh-40px)] w-full max-w-4xl items-start md:min-h-[calc(100vh-64px)] md:items-center">
        <div className="w-full">
          <button
            type="button"
            onClick={handleBack}
            className="mb-4 rounded border border-brand-primary/35 bg-white/90 px-4 py-2 text-sm font-medium text-brand-primary transition hover:bg-white"
            data-testid="profile-back-button"
          >
            Voltar
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Coluna do Form (Esquerda) */}
            <div className="lg:col-span-7 overflow-hidden rounded-2xl border border-brand-primary/25 bg-white/95 shadow-cityCard backdrop-blur-sm">
              <div className="bg-gradient-to-b from-white to-brand-primary/5 p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="font-display text-2xl font-bold leading-tight text-brand-primary md:text-3xl">
                      Meu Perfil
                    </h1>
                    <p className="text-xs text-text/75 font-medium">
                      Gerencie suas informações pessoais do ConVive
                    </p>
                  </div>
                </div>

                <ProfileForm
                  user={user}
                  loading={loading}
                  error={error}
                  success={success}
                  setError={setError}
                  onSubmit={handleProfileUpdate}
                />
              </div>
            </div>

            {/* Coluna dos Eventos (Direita) */}
            <MyAgenda
              user={user}
              myEvents={myEvents}
              loadingEvents={loadingEvents}
              onEventClick={setSelectedEvent}
            />
          </div>
        </div>
      </div>

      {activeSelectedEvent && (
        <EventAgendaDetailsModal
          selectedEvent={activeSelectedEvent}
          user={user}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </section>
  );
}
