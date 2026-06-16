import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cityOptions, applyCityTheme } from '../../theme/cityTheme';
import { type CityFeedItem, type FeedCategory } from './cityFeedData';
import { cityCategoryOptions, filterCityFeed } from './cityFeedUtils';
import { backendFetch, backendRoutes, Role } from '../../services/backendRoutes';
import { CityHeader } from './components/CityHeader';
import { CreateEditEventModal } from './components/CreateEditEventModal';
import { PaymentModal } from './components/PaymentModal';
import { EventDetailsModal } from './components/EventDetailsModal';
import { useApp } from '../../context/AppContext';

export function CityLandingScreen() {
  const { cityId } = useParams<{ cityId: string }>();
  const navigate = useNavigate();
  const { user, cities, logout } = useApp();

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

  // Apply theme when city changes
  useEffect(() => {
    if (selectedCity) {
      applyCityTheme(selectedCity);
      localStorage.setItem('last_city', selectedCity.id);
    }
  }, [selectedCity]);

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
          <div className="relative h-[38vh] min-h-[260px] w-full overflow-hidden rounded-2xl shadow-cityCard md:h-[52vh] md:min-h-[420px]">
            <img
              src={selectedCity.imageUrl}
              alt={`Vista da cidade de ${selectedCity.label}`}
              className="h-full w-full object-cover"
              onError={(event) => {
                event.currentTarget.src = selectedCity.imageFallbackUrl;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 p-5 text-white md:p-8">
              <div className="max-w-3xl">
                <p className="font-body text-xs font-semibold uppercase tracking-[0.14em] text-white/85 md:text-sm">
                  Eventos e atividades na cidade
                </p>
                <h1 className="mt-1 font-display text-3xl font-bold md:text-5xl">
                  {selectedCity.label}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/90 md:text-base">
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

            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredFeed.map((item) => (
                <article
                  key={item.id}
                  className="rounded-xl border border-brand-primary/15 bg-surface/70 p-4 transition hover:-translate-y-0.5 hover:shadow-cityCard"
                  data-testid={`city-feed-card-${item.id}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-brand-secondary/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-primary">
                        {item.category}
                      </span>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${item.access === 'pago' ? 'bg-brand-primary text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                        {item.access === 'pago' ? (item.ticketPrice ?? 'Pago') : 'Gratuito'}
                      </span>
                    </div>
                    <span className="text-xs text-text/70">{item.date}</span>
                  </div>

                  <h3 className="mt-3 font-display text-lg leading-tight text-brand-primary">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-sm text-text/80">{item.summary}</p>

                  <div className="mt-4 space-y-1 text-xs text-text/70">
                    <p>Local: {item.location}</p>
                    <p>Responsavel: {item.organizer}</p>
                    {item.capacity ? <p>Capacidade: {item.capacity}{item.reservedSeats ? ` | Reservados: ${item.reservedSeats}` : ''}</p> : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedItem(item)}
                    className="mt-4 rounded-lg border border-brand-primary/30 px-3 py-2 text-xs font-semibold text-brand-primary transition hover:bg-brand-primary/10"
                    data-testid={`city-feed-details-button-${item.id}`}
                  >
                    {item.ctaLabel ?? (item.access === 'pago' ? 'Reservar ingresso' : 'Ver detalhes')}
                  </button>
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
