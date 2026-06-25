import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { applyCityTheme, cityOptions, type CityTheme, type CityConfig } from '../../theme/cityTheme';
import { backendFetch, backendRoutes, getImageUrl } from '../../services/backendRoutes';
import { useApp } from '../../context/AppContext';
import { AddEditCityModal } from './components/AddEditCityModal';
import { CitySearchBar } from './components/CitySearchBar';
import { CityListItem } from './components/CityListItem';
import { CityPreviewCard } from './components/CityPreviewCard';

const onboardingBackgroundUrl = '/images/cidades-onboarding-fundo.jpg';
const onboardingBackgroundFallbackUrl =
  'https://images.unsplash.com/photo-1528909514045-2fa4ac7a08ba?auto=format&fit=crop&w=1680&q=80';

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function CityOnboardingScreen() {
  const navigate = useNavigate();
  const { user, cities, fetchCities } = useApp();

  const cards = useMemo(() => {
    return cities.length > 0 ? cities : cityOptions;
  }, [cities]);

  const [searchQuery, setSearchQuery] = useState('');
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoords({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.log('Error getting user geolocation or permission denied:', error);
        },
        { timeout: 10000 }
      );
    }
  }, []);

  const processedCities = useMemo(() => {
    let result = cards.filter((city) =>
      city.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (userCoords) {
      result = [...result].sort((a, b) => {
        const hasA = a.latitude !== undefined && a.longitude !== undefined;
        const hasB = b.latitude !== undefined && b.longitude !== undefined;

        if (hasA && hasB) {
          const distA = getDistance(userCoords.latitude, userCoords.longitude, a.latitude!, a.longitude!);
          const distB = getDistance(userCoords.latitude, userCoords.longitude, b.latitude!, b.longitude!);
          return distA - distB;
        }

        if (hasA) return -1;
        if (hasB) return 1;

        return a.label.localeCompare(b.label);
      });
    } else {
      result = [...result].sort((a, b) => a.label.localeCompare(b.label));
    }

    return result;
  }, [cards, searchQuery, userCoords]);

  const [promotedEvents, setPromotedEvents] = useState<any[]>([]);

  const userState = useMemo(() => {
    return processedCities[0]?.state || 'PR';
  }, [processedCities]);

  useEffect(() => {
    let isMounted = true;
    const fetchPromotions = async () => {
      try {
        const data = await backendFetch<any[]>(`${backendRoutes.promotedEvents}?state=${userState}`);
        if (isMounted) {
          setPromotedEvents(data);
        }
      } catch (err) {
        console.error('Error fetching promoted events:', err);
      }
    };
    fetchPromotions();
    return () => {
      isMounted = false;
    };
  }, [userState]);

  const [selectedCity, setSelectedCity] = useState<CityTheme | null>(null);
  const [hoveredCityId, setHoveredCityId] = useState<CityTheme | null>(null);

  // Admin Modal state
  const [showAddCityModal, setShowAddCityModal] = useState(false);
  const [editingCity, setEditingCity] = useState<CityConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const previewCity = processedCities.find((city) => city.id === hoveredCityId) ?? processedCities[0] ?? null;

  function handleSelectCity(cityId: CityTheme) {
    setSelectedCity(cityId);
    setHoveredCityId(cityId);
    const config = cards.find(c => c.id === cityId);
    if (config) {
      applyCityTheme(config);
    }
    localStorage.setItem('last_city', cityId);
    navigate(`/${cityId}`);
  }

  const handleStartEditCity = (city: CityConfig) => {
    setError('');
    setEditingCity(city);
    setShowAddCityModal(true);
  };

  const handleCloseModal = () => {
    setShowAddCityModal(false);
    setEditingCity(null);
    setError('');
  };

  const handleDeleteCity = async (cityId: string) => {
    const confirmDelete = window.confirm('Tem certeza que deseja excluir esta cidade? Todos os dados associados poderão ser perdidos.');
    if (!confirmDelete) return;

    try {
      await backendFetch(`${backendRoutes.cities}/${cityId}`, {
        method: 'DELETE',
      });
      await fetchCities();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir a cidade.');
    }
  };

  const handleSaveCity = async (payload: any, imageFile: File | null) => {
    setLoading(true);
    setError('');

    try {
      let savedCity: any;
      if (editingCity) {
        savedCity = await backendFetch<any>(`${backendRoutes.cities}/${editingCity.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        savedCity = await backendFetch<any>(backendRoutes.cities, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      // Se houver um arquivo de imagem física, faz o upload para o backend associando ao id da cidade
      if (imageFile && savedCity && savedCity.id) {
        const formData = new FormData();
        formData.append('image', imageFile);

        await backendFetch<any>(`${backendRoutes.cities}/${savedCity.id}/upload`, {
          method: 'POST',
          body: formData,
        });
      }

      handleCloseModal();
      await fetchCities();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar a cidade.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-brand-primary/10 via-surface to-brand-secondary/10 font-body" data-testid="city-onboarding-screen">
      <img
        src={onboardingBackgroundUrl}
        alt="Pessoas participando de atividades comunitarias"
        className="absolute inset-0 h-full w-full object-cover"
        onError={(event) => {
          event.currentTarget.src = onboardingBackgroundFallbackUrl;
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-b from-surface/75 via-surface/40 to-transparent md:bg-gradient-to-r md:from-surface/75 md:via-surface/50 md:to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(46,125,50,0.08),_transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(216,67,21,0.08),_transparent_40%)]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl items-start px-4 py-8 sm:px-6 md:px-8 md:py-10 lg:items-center">
        <div className="w-full">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div className="space-y-7">
              <div className="max-w-2xl">
                <p className="font-display text-3xl font-semibold leading-[1.02] tracking-[-0.03em] text-text sm:text-4xl md:text-6xl">
                  Escolha a cidade certa e encontre o que faz sentido para você.
                </p>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-text md:text-lg">
                  Para moradores, visitantes e quem quer divulgar algo na cidade.
                </p>
              </div>

              <div className="space-y-3">
                <CitySearchBar value={searchQuery} onChange={setSearchQuery} />

                {userCoords && (
                  <div className="flex items-center gap-1.5 px-1 py-0.5 text-xs font-bold text-brand-primary/95 animate-fadeIn">
                    <svg className="h-4 w-4 text-brand-primary/80 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Cidades ordenadas por proximidade</span>
                  </div>
                )}

                {processedCities.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-brand-primary/25 bg-brand-primary/5 p-6 text-center text-sm font-medium text-text/70 animate-fadeIn">
                    Nenhuma cidade encontrada para "{searchQuery}".
                  </div>
                ) : (
                  processedCities.map((city) => (
                    <CityListItem
                      key={city.id}
                      city={city}
                      isActive={previewCity?.id === city.id}
                      userCoords={userCoords}
                      onMouseEnter={() => setHoveredCityId(city.id)}
                      onClick={() => handleSelectCity(city.id)}
                      isAdmin={user?.role === 'ADMIN'}
                      onEdit={() => handleStartEditCity(city)}
                      onDelete={() => handleDeleteCity(city.id)}
                    />
                  ))
                )}

                {user?.role === 'ADMIN' && (
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setShowAddCityModal(true);
                    }}
                    className="w-full rounded-xl border-2 border-dashed border-brand-primary/45 bg-white/75 px-6 py-4 text-center text-sm font-bold text-brand-primary hover:border-brand-primary hover:bg-brand-primary/5 transition duration-300 shadow-sm"
                    data-testid="admin-add-city-button"
                  >
                    + Adicionar Nova Cidade
                  </button>
                )}
              </div>
            </div>

            <div className="hidden lg:block lg:sticky lg:top-8">
              <CityPreviewCard previewCity={previewCity} onSelect={handleSelectCity} />
            </div>
          </div>

          {promotedEvents.length > 0 && (
            <div className="mt-16 w-full animate-fadeIn">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-text sm:text-2xl flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-orange-500 animate-pulse" />
                    Eventos em Destaque na Região
                  </h3>
                  <p className="text-sm text-text/70 mt-1">
                    Eventos recomendados no estado de {userState} e em todo o país
                  </p>
                </div>
              </div>
              <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-brand-primary/20 scrollbar-track-transparent snap-x">
                {promotedEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => {
                      navigate(`/${event.city}?highlightEvent=${event.id}`);
                    }}
                    className="min-w-[280px] sm:min-w-[320px] max-w-[320px] bg-white/70 backdrop-blur-md border border-white/40 hover:border-brand-primary/30 rounded-2xl p-5 shadow-sm hover:shadow-md cursor-pointer transition-all duration-300 transform hover:-translate-y-1 snap-start flex flex-col justify-between"
                  >
                    <div>
                      {event.imageUrl && (
                        <img
                          src={getImageUrl(event.imageUrl)}
                          alt={event.title}
                          className="w-full h-40 object-cover rounded-xl mb-4"
                        />
                      )}
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-brand-primary/10 text-brand-primary">
                          {event.exposureLevel === 'COUNTRY' ? 'Nacional' : 'Regional'}
                        </span>
                        <span className="text-xs text-text/50 font-medium">
                          {new Date(event.date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <h4 className="font-display font-semibold text-lg text-text line-clamp-1">
                        {event.title}
                      </h4>
                      <p className="text-sm text-text/70 mt-1.5 line-clamp-2">
                        {event.description}
                      </p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-text/5 flex items-center justify-between">
                      <span className="text-xs font-semibold text-brand-primary flex items-center gap-1">
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {event.cityDetails?.label || event.city}
                      </span>
                      <span className="text-xs font-bold text-text/80 hover:text-brand-primary transition">
                        Ver detalhes &rarr;
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {showAddCityModal && (
        <AddEditCityModal
          editingCity={editingCity}
          onClose={handleCloseModal}
          onSave={handleSaveCity}
          loading={loading}
          error={error}
          setError={setError}
        />
      )}
    </section>
  );
}
