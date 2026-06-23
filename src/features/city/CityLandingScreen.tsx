import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cityOptions, applyCityTheme } from '../../theme/cityTheme';
import { type CityFeedItem, type FeedCategory } from './cityFeedData';
import { cityCategoryOptions, filterCityFeed } from './cityFeedUtils';
import { backendFetch, backendRoutes, Role, getImageUrl } from '../../services/backendRoutes';
import { CityHeader } from './components/CityHeader';
import { CreateEditEventModal } from './components/CreateEditEventModal';
import { PaymentModal } from './components/PaymentModal';
import { EventDetailsModal } from './components/EventDetailsModal';
import { useApp } from '../../context/AppContext';

export function CityLandingScreen() {
  const { cityId } = useParams<{ cityId: string }>();
  const navigate = useNavigate();
  const { user, cities, logout, loadingCities } = useApp();

  const [activeCategory, setActiveCategory] = useState<FeedCategory>('eventos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<CityFeedItem | null>(null);
  const [liveEvents, setLiveEvents] = useState<CityFeedItem[]>([]);

  const selectedCity = useMemo(() => {
    return (
      cities.find((option) => option.id === cityId) ||
      cityOptions.find((option) => option.id === cityId)
    );
  }, [cities, cityId]);

  const [showCreateEditModal, setShowCreateEditModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CityFeedItem | null>(null);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentEvent, setPaymentEvent] = useState<CityFeedItem | null>(null);
  const [paymentNotification, setPaymentNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Redirect to home if city does not exist (e.g. was deleted)
  useEffect(() => {
    if (!loadingCities && cityId) {
      const cityExists =
        cities.some((option) => option.id === cityId) ||
        cityOptions.some((option) => option.id === cityId);

      if (!cityExists) {
        if (localStorage.getItem('last_city') === cityId) {
          localStorage.removeItem('last_city');
        }
        navigate('/', { replace: true });
      }
    }
  }, [loadingCities, cities, cityId, navigate]);

  // Apply theme when city changes
  useEffect(() => {
    if (selectedCity) {
      applyCityTheme(selectedCity);
      localStorage.setItem('last_city', selectedCity.id);
    }
  }, [selectedCity]);

  // Handle Stripe Payment Redirect parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');

    if (paymentStatus === 'success') {
      setPaymentNotification({
        type: 'success',
        text: 'Pagamento confirmado e inscrição realizada com sucesso!',
      });
      // Clear query parameters
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    } else if (paymentStatus === 'cancel') {
      setPaymentNotification({
        type: 'error',
        text: 'O pagamento foi cancelado pelo usuário.',
      });
      // Clear query parameters
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  async function loadEvents() {
    if (!cityId) return;
    try {
      const events = await backendFetch<any[]>(`${backendRoutes.events}?city=${cityId}`);
      const mappedEvents: CityFeedItem[] = events.map((event) => ({
        id: String(event.id),
        city: event.city || cityId,
        category: (event.category as FeedCategory) || 'eventos',
        access: event.type === 'PRIVATE' ? 'pago' : 'gratuito',
        ticketPrice: event.price ? `R$ ${event.price.toFixed(2)}` : undefined,
        capacity: event.maxParticipants,
        reservedSeats: event.participants?.length,
        title: event.title,
        summary: event.description?.substring(0, 100) + '...',
        details: event.description,
        date: new Date(event.date).toLocaleString('pt-BR'),
        location: event.location,
        organizer: event.creator?.name || event.createdBy?.name || 'Organizador',
        contact: event.creator
          ? `${event.creator.email}${event.creator.phone ? ` / ${event.creator.phone}` : ''}`
          : '',
        linkedin: event.creator?.linkedin || '',
        instagram: event.creator?.instagram || '',
        youtube: event.creator?.youtube || '',
        tags: [event.type.toLowerCase()],
        createdBy: typeof event.createdBy === 'object' ? event.createdBy?.id : event.createdBy,
        rawDate: event.date,
        price: event.price,
        type: event.type,
        imageUrl: event.imageUrl,
      }));
      setLiveEvents(mappedEvents);
    } catch (err) {
      console.error('Failed to load live events', err);
    }
  }

  useEffect(() => {
    loadEvents();
  }, [cityId]);

  const cityFeed = useMemo(() => {
    if (!cityId) return [];
    return liveEvents.filter((item) => item.city === cityId);
  }, [cityId, liveEvents]);

  const filteredFeed = useMemo(() => {
    if (!cityId) return [];
    return filterCityFeed(cityFeed, cityId, activeCategory, searchTerm);
  }, [cityFeed, cityId, activeCategory, searchTerm]);

  function handleCategoryChange(category: FeedCategory) {
    setActiveCategory(category);
    setSelectedItem(null);
  }

  const highlightedItem = useMemo(() => {
    if (!selectedItem) {
      return null;
    }
    return filteredFeed.find((item) => item.id === selectedItem.id) ?? null;
  }, [selectedItem, filteredFeed]);

  function handleSaveSuccess(savedEvent: any, isEdit: boolean) {
    if (!cityId) return;
    if (isEdit) {
      setLiveEvents((prev) =>
        prev.map((item) => {
          if (item.id === String(savedEvent.id)) {
            return {
              ...item,
              title: savedEvent.title,
              details: savedEvent.description,
              summary: savedEvent.description.substring(0, 100) + '...',
              location: savedEvent.location,
              date: new Date(savedEvent.date).toLocaleString('pt-BR'),
              rawDate: savedEvent.date,
              category: savedEvent.category,
              type: savedEvent.type,
              access: savedEvent.type === 'PRIVATE' ? 'pago' : 'gratuito',
              price: savedEvent.price,
              ticketPrice: savedEvent.price ? `R$ ${savedEvent.price.toFixed(2)}` : undefined,
              capacity: savedEvent.maxParticipants,
              imageUrl: savedEvent.imageUrl,
            };
          }
          return item;
        })
      );
    } else {
      const mapped: CityFeedItem = {
        id: String(savedEvent.id),
        city: cityId,
        category: savedEvent.category || 'eventos',
        access: savedEvent.type === 'PRIVATE' ? 'pago' : 'gratuito',
        ticketPrice: savedEvent.price ? `R$ ${savedEvent.price.toFixed(2)}` : undefined,
        capacity: savedEvent.maxParticipants,
        reservedSeats: 0,
        title: savedEvent.title,
        summary: savedEvent.description.substring(0, 100) + '...',
        details: savedEvent.description,
        date: new Date(savedEvent.date).toLocaleString('pt-BR'),
        location: savedEvent.location,
        organizer: user?.name || 'Organizador',
        contact: user
          ? `${user.email}${user.phone ? ` / ${user.phone}` : ''}`
          : '',
        linkedin: user?.linkedin || '',
        instagram: user?.instagram || '',
        youtube: user?.youtube || '',
        tags: [savedEvent.type.toLowerCase()],
        createdBy: savedEvent.createdBy,
        rawDate: savedEvent.date,
        price: savedEvent.price,
        type: savedEvent.type,
        imageUrl: savedEvent.imageUrl,
      };
      setLiveEvents((prev) => [mapped, ...prev]);
    }
    setShowCreateEditModal(false);
  }

  function handleDeleteSuccess(eventId: string) {
    setLiveEvents((prev) => prev.filter((item) => item.id !== eventId));
    setSelectedItem(null);
  }

  function handlePaymentSuccess() {
    setShowPaymentModal(false);
    loadEvents();
    if (paymentEvent) {
      setSelectedItem(paymentEvent);
    }
  }

  function handleBackToCitySelect() {
    localStorage.removeItem('last_city');
    navigate('/');
  }

  if (!selectedCity || !cityId) {
    return null;
  }

  return (
    <section className="min-h-screen bg-surface text-text" data-testid="city-landing-screen">
      <CityHeader
        selectedCity={selectedCity}
        user={user}
        onLogout={logout}
        onBack={handleBackToCitySelect}
        onLogin={() => navigate('/login')}
        onSignup={() => navigate('/signup')}
        onOpenProfile={() => navigate('/profile')}
      />

      <main className="min-h-[calc(100vh-76px)] px-4 py-6 md:min-h-[calc(100vh-84px)] md:px-8 md:py-8" data-testid="city-landing-main">
        <div className="mx-auto w-full max-w-6xl">
          {paymentNotification && (
            <div
              className={`mb-6 p-4 rounded-xl border text-sm font-medium flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-4 duration-300 ${
                paymentNotification.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              <div className="flex items-center gap-3">
                {paymentNotification.type === 'success' ? (
                  <svg className="h-5 w-5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-red-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <span>{paymentNotification.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setPaymentNotification(null)}
                className="text-neutral-450 hover:text-neutral-650 transition"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
          )}
          <div className="relative h-[180px] w-full overflow-hidden rounded-2xl shadow-cityCard md:h-[220px]">
            <img
              src={getImageUrl(selectedCity.imageUrl)}
              alt={`Vista da cidade de ${selectedCity.label}`}
              className="h-full w-full object-cover brightness-[0.45] contrast-[0.95] saturate-[0.8]"
              onError={(event) => {
                event.currentTarget.src = getImageUrl(selectedCity.imageFallbackUrl);
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-transparent" />
            <div className="absolute bottom-0 left-0 p-4 text-white md:p-6">
              <div className="max-w-3xl">
                <p className="font-body text-[10px] font-semibold uppercase tracking-[0.14em] text-white/80 md:text-xs">
                  Eventos e atividades na cidade
                </p>
                <h1 className="mt-0.5 font-display text-2xl font-bold md:text-3xl">
                  {selectedCity.label}
                </h1>
                <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-white/85 md:text-sm">
                  O ponto central para descobrir, divulgar e reservar eventos gratuitos ou pagos na cidade, com foco em organizadores independentes e público local.
                </p>
              </div>
            </div>
          </div>

          <section className="mt-4 rounded-2xl border border-brand-primary/15 bg-white p-4 shadow-cityCard md:mt-6 md:p-6" data-testid="city-feed-section">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                {cityCategoryOptions.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleCategoryChange(category.id)}
                    className={`rounded-full border px-4 py-2 text-xs font-semibold tracking-wide transition md:text-sm ${
                      activeCategory === category.id
                        ? 'border-brand-primary bg-brand-primary text-white'
                        : 'border-brand-primary/25 text-brand-primary hover:bg-brand-primary/10'
                    }`}
                    data-testid={`city-category-${category.id}`}
                  >
                    {category.label}
                  </button>
                ))}
                {(user?.role === Role.ORGANIZER || user?.role === Role.ADMIN) && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingEvent(null);
                      setShowCreateEditModal(true);
                    }}
                    className="ml-2 rounded-full bg-brand-primary px-4 py-2 text-xs font-semibold text-white transition hover:brightness-110 md:text-sm"
                    data-testid="city-create-event-button"
                  >
                    + Criar Conteúdo
                  </button>
                )}
              </div>

              <label className="block w-full md:w-80">
                <span className="sr-only">Buscar conteudo</span>
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.currentTarget.value)}
                  type="text"
                  placeholder="Buscar por titulo, local ou organizador"
                  className="w-full rounded-xl border border-brand-primary/25 bg-white px-4 py-2.5 text-sm text-text outline-none transition focus:border-brand-primary/60"
                  data-testid="city-feed-search"
                />
              </label>
            </div>

            <p className="mt-4 text-sm text-text/70">
              {filteredFeed.length} resultado(s) em {selectedCity.label} para {activeCategory}. Eventos gratuitos ficam em destaque para ampliar o alcance local.
            </p>

            <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredFeed.map((item) => (
                <article
                  key={item.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-brand-primary/10 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                  data-testid={`city-feed-card-${item.id}`}
                >
                  {/* Card Image Area */}
                  <div className="relative h-44 w-full overflow-hidden bg-neutral-100">
                    <img
                      src={getImageUrl(item.imageUrl)}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(event) => {
                        event.currentTarget.src = getFallbackCategoryImageUrl(item.category);
                      }}
                    />
                    {/* Floating Badges */}
                    <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-primary shadow-sm">
                        {item.category}
                      </span>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm ${item.access === 'pago' ? 'bg-brand-primary text-white' : 'bg-emerald-500 text-white'}`}>
                        {item.access === 'pago' ? (item.ticketPrice ?? 'Pago') : 'Gratuito'}
                      </span>
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="flex flex-1 flex-col p-4 md:p-5">
                    {/* Event Date */}
                    <div className="flex items-center gap-1.5 text-xs text-text/60">
                      <svg className="h-3.5 w-3.5 text-text/50" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{item.date}</span>
                    </div>

                    {/* Event Title */}
                    <h3 className="mt-2 font-display text-lg font-bold leading-snug text-brand-primary line-clamp-1 group-hover:text-brand-primary/80 transition-colors">
                      {item.title}
                    </h3>

                    {/* Summary */}
                    <p className="mt-1.5 flex-1 text-sm text-text/75 line-clamp-2 leading-relaxed">
                      {item.summary}
                    </p>

                    {/* Meta/Location Info */}
                    <div className="mt-4 border-t border-brand-primary/5 pt-3 space-y-2 text-xs text-text/70">
                      <div className="flex items-center gap-2">
                        <svg className="h-4 w-4 shrink-0 text-brand-primary/70" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="truncate">Local: {item.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="h-4 w-4 shrink-0 text-brand-primary/70" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="truncate">Responsável: {item.organizer}</span>
                      </div>
                      {item.capacity ? (
                        <div className="flex items-center gap-2">
                          <svg className="h-4 w-4 shrink-0 text-brand-primary/70" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <span>Capacidade: {item.capacity}{item.reservedSeats ? ` | Reservados: ${item.reservedSeats}` : ''}</span>
                        </div>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedItem(item)}
                      className="mt-4 w-full rounded-xl bg-brand-primary/5 py-2.5 text-xs font-semibold text-brand-primary transition-all duration-200 hover:bg-brand-primary hover:text-white"
                      data-testid={`city-feed-details-button-${item.id}`}
                    >
                      {item.ctaLabel ?? (item.access === 'pago' ? 'Reservar ingresso' : 'Ver detalhes')}
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {filteredFeed.length === 0 && (
              <div className="mt-4 rounded-xl border border-dashed border-brand-primary/25 bg-brand-primary/5 p-5 text-sm text-text/80">
                Nenhum conteudo encontrado com esse filtro. Tente outro termo de busca.
              </div>
            )}
          </section>
        </div>
      </main>

      {highlightedItem && (
        <EventDetailsModal
          selectedItem={highlightedItem}
          user={user}
          onClose={() => setSelectedItem(null)}
          onLogin={() => navigate('/login')}
          onEditClick={(item) => {
            setEditingEvent(item);
            setShowCreateEditModal(true);
            setSelectedItem(null);
          }}
          onDeleteSuccess={handleDeleteSuccess}
          onJoinSuccess={loadEvents}
          onStartPayment={(event) => {
            setPaymentEvent(event);
            setShowPaymentModal(true);
          }}
        />
      )}

      {showCreateEditModal && (
        <CreateEditEventModal
          city={cityId}
          editingEvent={editingEvent}
          onClose={() => setShowCreateEditModal(false)}
          onSuccess={handleSaveSuccess}
        />
      )}

      {showPaymentModal && paymentEvent && (
        <PaymentModal
          paymentEvent={paymentEvent}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </section>
  );
}

function getFallbackCategoryImageUrl(category?: FeedCategory): string {
  switch (category) {
    case 'cursos':
      return 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=600&q=80'; // Class / study
    case 'atividades':
      return 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80'; // Workshop / social collab
    case 'eventos':
    default:
      return 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=600&q=80'; // Event / conference hall
  }
}
