import { useEffect, useMemo, useState } from 'react';
import { type CityTheme, cityOptions, type CityConfig } from '../../theme/cityTheme';
import { type CityFeedItem, type FeedCategory } from './cityFeedData';
import { cityCategoryOptions, filterCityFeed } from './cityFeedUtils';
import { backendFetch, backendRoutes, Role, type UserResponseDto } from '../../services/backendRoutes';

type CityLandingScreenProps = {
  city: CityTheme;
  cities?: CityConfig[];
  user: UserResponseDto | null;
  onLogout: () => void;
  onBack: () => void;
  onLogin: () => void;
  onSignup?: () => void;
  onOpenProfile: () => void;
};

export function CityLandingScreen({ city, cities = [], user, onLogout, onBack, onLogin, onSignup, onOpenProfile }: CityLandingScreenProps) {
  const [activeCategory, setActiveCategory] = useState<FeedCategory>('eventos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<CityFeedItem | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [liveEvents, setLiveEvents] = useState<CityFeedItem[]>([]);
  const [isJoining, setIsJoining] = useState(false);
  const [joinMessage, setJoinMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const selectedCity = cities.find((option) => option.id === city) || cityOptions.find((option) => option.id === city);

  const [showCreateEditModal, setShowCreateEditModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CityFeedItem | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formCategory, setFormCategory] = useState<FeedCategory>('eventos');
  const [formType, setFormType] = useState<'COMMUNITY' | 'PRIVATE'>('COMMUNITY');
  const [formPrice, setFormPrice] = useState('');
  const [formMaxParticipants, setFormMaxParticipants] = useState('');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (showCreateEditModal) {
      if (editingEvent) {
        setFormTitle(editingEvent.title);
        setFormDescription(editingEvent.details);
        setFormLocation(editingEvent.location);
        let formattedDate = '';
        if (editingEvent.rawDate) {
          const d = new Date(editingEvent.rawDate);
          const tzoffset = d.getTimezoneOffset() * 60000;
          const localISOTime = (new Date(d.getTime() - tzoffset)).toISOString().slice(0, 16);
          formattedDate = localISOTime;
        }
        setFormDate(formattedDate);
        setFormCategory(editingEvent.category);
        setFormType(editingEvent.type || 'COMMUNITY');
        setFormPrice(editingEvent.price ? String(editingEvent.price) : '');
        setFormMaxParticipants(editingEvent.capacity ? String(editingEvent.capacity) : '');
      } else {
        setFormTitle('');
        setFormDescription('');
        setFormLocation('');
        setFormDate('');
        setFormCategory('eventos');
        setFormType('COMMUNITY');
        setFormPrice('');
        setFormMaxParticipants('');
      }
      setFormError('');
    }
  }, [showCreateEditModal, editingEvent]);

  useEffect(() => {
    async function loadEvents() {
      try {
        const events = await backendFetch<any[]>(`${backendRoutes.events}?city=${city}`);
        const mappedEvents: CityFeedItem[] = events.map(event => ({
          id: String(event.id),
          city: event.city || city,
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
    loadEvents();
  }, [city]);

  const cityFeed = useMemo(() => {
    return liveEvents.filter((item) => item.city === city);
  }, [city, liveEvents]);

  const filteredFeed = useMemo(() => {
    return filterCityFeed(cityFeed, city, activeCategory, searchTerm);
  }, [cityFeed, city, activeCategory, searchTerm]);


  function handleCategoryChange(category: FeedCategory) {
    setActiveCategory(category);
    setSelectedItem(null);
    setJoinMessage(null);
  }

  const highlightedItem = useMemo(() => {
    if (!selectedItem) {
      return null;
    }

    return filteredFeed.find((item) => item.id === selectedItem.id) ?? null;
  }, [selectedItem, filteredFeed]);

  useEffect(() => {
    if (!mobileMenuOpen) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!selectedItem) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setSelectedItem(null);
        setJoinMessage(null);
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [selectedItem]);

  function closeEventDetails() {
    setSelectedItem(null);
    setJoinMessage(null);
  }

  async function handleJoinEvent(eventId: string) {
    const token = localStorage.getItem('token');
    if (!token) {
      closeEventDetails();
      onLogin();
      return;
    }

    setIsJoining(true);
    setJoinMessage(null);
    try {
      await backendFetch(backendRoutes.joinEvent(eventId), { method: 'POST' });
      setJoinMessage({ type: 'success', text: 'Participação confirmada!' });
    } catch (err: any) {
      setJoinMessage({ type: 'error', text: err.message || 'Erro ao participar do evento' });
    } finally {
      setIsJoining(false);
    }
  }

  async function handleSaveEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!formTitle || !formDescription || !formLocation || !formDate) {
      setFormError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setFormLoading(true);
    setFormError('');

    const payload = {
      title: formTitle,
      description: formDescription,
      location: formLocation,
      date: new Date(formDate).toISOString(),
      type: formType,
      category: formCategory,
      price: formType === 'PRIVATE' ? Number(formPrice) : null,
      maxParticipants: formType === 'PRIVATE' && formMaxParticipants ? Number(formMaxParticipants) : null,
      city: city,
    };

    try {
      if (editingEvent) {
        const response = await backendFetch<any>(`/events/${editingEvent.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        
        const updated = response.data || response;
        setLiveEvents((prev) =>
          prev.map((item) => {
            if (item.id === editingEvent.id) {
              return {
                ...item,
                title: updated.title,
                details: updated.description,
                summary: updated.description.substring(0, 100) + '...',
                location: updated.location,
                date: new Date(updated.date).toLocaleString('pt-BR'),
                rawDate: updated.date,
                category: updated.category,
                type: updated.type,
                access: updated.type === 'PRIVATE' ? 'pago' : 'gratuito',
                price: updated.price,
                ticketPrice: updated.price ? `R$ ${updated.price.toFixed(2)}` : undefined,
                capacity: updated.maxParticipants,
              };
            }
            return item;
          })
        );
      } else {
        const response = await backendFetch<any>('/events', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        
        const newEvent = response.data || response;
        const mapped: CityFeedItem = {
          id: String(newEvent.id),
          city: city,
          category: newEvent.category || 'eventos',
          access: newEvent.type === 'PRIVATE' ? 'pago' : 'gratuito',
          ticketPrice: newEvent.price ? `R$ ${newEvent.price.toFixed(2)}` : undefined,
          capacity: newEvent.maxParticipants,
          reservedSeats: 0,
          title: newEvent.title,
          summary: newEvent.description.substring(0, 100) + '...',
          details: newEvent.description,
          date: new Date(newEvent.date).toLocaleString('pt-BR'),
          location: newEvent.location,
          organizer: user?.name || 'Organizador',
          contact: user
            ? `${user.email}${user.phone ? ` / ${user.phone}` : ''}`
            : '',
          linkedin: user?.linkedin || '',
          instagram: user?.instagram || '',
          youtube: user?.youtube || '',
          tags: [newEvent.type.toLowerCase()],
          createdBy: newEvent.createdBy,
          rawDate: newEvent.date,
          price: newEvent.price,
          type: newEvent.type,
        };

        setLiveEvents((prev) => [mapped, ...prev]);
      }
      setShowCreateEditModal(false);
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar o conteúdo.');
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDeleteEvent(eventId: string) {
    if (!window.confirm('Tem certeza que deseja excluir este conteúdo?')) {
      return;
    }

    try {
      await backendFetch(`/events/${eventId}`, {
        method: 'DELETE',
      });
      setLiveEvents((prev) => prev.filter((item) => item.id !== eventId));
      closeEventDetails();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir o evento');
    }
  }

  if (!selectedCity) {
    return null;
  }

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  function handleMobileBack() {
    closeMobileMenu();
    onBack();
  }

  function handleMobileLogin() {
    closeMobileMenu();
    onLogin();
  }

  function handleMobileSignup() {
    closeMobileMenu();
    onSignup?.();
  }

  return (
    <section className="min-h-screen bg-surface text-text" data-testid="city-landing-screen">
      <header className="relative z-20 bg-brand-primary text-white">
        <div className="flex items-center justify-between px-4 py-4 md:px-8 md:py-5">
          <button
            type="button"
            onClick={onBack}
            className="hidden items-center gap-2 transition-opacity hover:opacity-80 md:flex"
            data-testid="city-brand-button"
          >
            <span className="font-display text-lg font-bold tracking-wide">CONVIVE</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/85 md:text-[11px]">
              {selectedCity.label}
            </span>
          </button>

          <div className="flex items-center gap-2 md:hidden" data-testid="city-brand-label">
            <span className="font-display text-lg font-bold tracking-wide">CONVIVE</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/85">
              {selectedCity.label}
            </span>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            {user && (
              <button
                type="button"
                onClick={onOpenProfile}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white/50"
                title={user.name}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </button>
            )}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="flex h-10 w-10 items-center justify-center rounded-md transition hover:bg-white/10"
              aria-expanded={mobileMenuOpen}
              aria-controls="city-mobile-menu"
              aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
              data-testid="city-mobile-menu-button"
            >
              {mobileMenuOpen ? (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              )}
            </button>
          </div>

          <nav className="hidden items-center gap-3 text-xs font-medium md:flex md:gap-6 md:text-sm">
            {user ? (
              <>
                <button
                  type="button"
                  onClick={onOpenProfile}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white/50"
                  title={user.name}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  className="rounded px-3 py-1.5 transition hover:bg-white/10"
                  data-testid="city-logout-button-desktop"
                >
                  SAIR
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onLogin}
                className="rounded px-3 py-1.5 transition hover:bg-white/10"
                data-testid="city-login-button-desktop"
              >
                LOGIN
              </button>
            )}
            <button
              type="button"
              onClick={onBack}
              className="rounded px-3 py-1.5 transition hover:bg-white/10"
              data-testid="city-switch-button"
            >
              TROCAR CIDADE
            </button>
          </nav>
        </div>

        {mobileMenuOpen ? (
          <>
            <button
              type="button"
              className="fixed inset-0 z-10 bg-black/30 md:hidden"
              aria-label="Fechar menu"
              onClick={closeMobileMenu}
              data-testid="city-mobile-menu-backdrop"
            />
            <nav
              id="city-mobile-menu"
              className="relative z-20 border-t border-white/20 px-4 py-3 md:hidden"
              data-testid="city-mobile-menu"
            >
              <ul className="space-y-1">

                <li>
                  <button
                    type="button"
                    onClick={handleMobileBack}
                    className="w-full rounded-lg px-3 py-3 text-left text-sm font-semibold transition hover:bg-white/10"
                    data-testid="city-switch-button-mobile"
                  >
                    TROCAR CIDADE
                  </button>
                </li>
                {user ? (
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        closeMobileMenu();
                        onLogout();
                      }}
                      className="w-full rounded-lg px-3 py-3 text-left text-sm font-semibold transition hover:bg-white/10"
                      data-testid="city-logout-button-mobile"
                    >
                      SAIR
                    </button>
                  </li>
                ) : (
                  <>
                    <li>
                      <button
                        type="button"
                        onClick={handleMobileLogin}
                        className="w-full rounded-lg px-3 py-3 text-left text-sm font-semibold transition hover:bg-white/10"
                        data-testid="city-login-button-mobile"
                      >
                        LOGIN
                      </button>
                    </li>
                    {onSignup ? (
                      <li>
                        <button
                          type="button"
                          onClick={handleMobileSignup}
                          className="w-full rounded-lg px-3 py-3 text-left text-sm font-semibold transition hover:bg-white/10"
                          data-testid="city-signup-button-mobile"
                        >
                          CADASTRO
                        </button>
                      </li>
                    ) : null}
                  </>
                )}
              </ul>
            </nav>
          </>
        ) : null}
      </header>

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

      {highlightedItem ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
          role="presentation"
          data-testid="city-feed-details-modal"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Fechar detalhes do evento"
            onClick={closeEventDetails}
            data-testid="city-feed-details-backdrop"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="city-feed-details-title"
            className="relative z-10 flex max-h-[min(90vh,720px)] w-full max-w-lg flex-col rounded-t-2xl border border-brand-primary/15 bg-white shadow-cityCard sm:max-h-[85vh] sm:rounded-2xl"
          >
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-brand-primary/10 px-5 py-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-brand-secondary/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-primary">
                    {highlightedItem.category}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${highlightedItem.access === 'pago' ? 'bg-brand-primary text-white' : 'bg-emerald-100 text-emerald-800'}`}
                  >
                    {highlightedItem.access === 'pago' ? (highlightedItem.ticketPrice ?? 'Pago') : 'Gratuito'}
                  </span>
                </div>
                <h2 id="city-feed-details-title" className="mt-2 font-display text-xl leading-tight text-brand-primary md:text-2xl">
                  {highlightedItem.title}
                </h2>
                <p className="mt-1 text-sm text-text/70">{highlightedItem.date}</p>
              </div>

              <button
                type="button"
                onClick={closeEventDetails}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-brand-primary transition hover:bg-brand-primary/10"
                aria-label="Fechar"
                data-testid="city-feed-close-details"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-4">
              <p className="text-sm leading-relaxed text-text">{highlightedItem.details}</p>

              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between gap-4 border-b border-brand-primary/10 pb-3">
                  <dt className="text-text/70">Entrada</dt>
                  <dd className="text-right font-medium text-text">
                    {highlightedItem.access === 'pago' ? (highlightedItem.ticketPrice ?? 'Pago') : 'Gratuita'}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-brand-primary/10 pb-3">
                  <dt className="text-text/70">Data</dt>
                  <dd className="text-right font-medium text-text">{highlightedItem.date}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-brand-primary/10 pb-3">
                  <dt className="text-text/70">Local</dt>
                  <dd className="text-right font-medium text-text">{highlightedItem.location}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-brand-primary/10 pb-3">
                  <dt className="text-text/70">Responsavel</dt>
                  <dd className="text-right font-medium text-text">{highlightedItem.organizer}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-brand-primary/10 pb-3">
                  <dt className="text-text/70">Contato</dt>
                  <dd className="text-right font-medium text-text">{highlightedItem.contact}</dd>
                </div>
                {(highlightedItem.linkedin || highlightedItem.instagram || highlightedItem.youtube) && (
                  <div className="flex justify-between items-center gap-4 border-b border-brand-primary/10 pb-3 flex-wrap">
                    <dt className="text-text/70">Redes Sociais</dt>
                    <dd className="flex gap-2">
                      {highlightedItem.linkedin && (
                        <a
                          href={highlightedItem.linkedin.startsWith('http') ? highlightedItem.linkedin : `https://${highlightedItem.linkedin}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs font-semibold text-brand-primary bg-brand-primary/10 hover:bg-brand-primary/20 px-2.5 py-1 rounded-md transition"
                          data-testid="organizer-linkedin"
                          title="LinkedIn"
                        >
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                          </svg>
                          LinkedIn
                        </a>
                      )}
                      {highlightedItem.instagram && (
                        <a
                          href={highlightedItem.instagram.startsWith('http') ? highlightedItem.instagram : `https://${highlightedItem.instagram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs font-semibold text-brand-primary bg-brand-primary/10 hover:bg-brand-primary/20 px-2.5 py-1 rounded-md transition"
                          data-testid="organizer-instagram"
                          title="Instagram"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                          </svg>
                          Instagram
                        </a>
                      )}
                      {highlightedItem.youtube && (
                        <a
                          href={highlightedItem.youtube.startsWith('http') ? highlightedItem.youtube : `https://${highlightedItem.youtube}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs font-semibold text-brand-primary bg-brand-primary/10 hover:bg-brand-primary/20 px-2.5 py-1 rounded-md transition"
                          data-testid="organizer-youtube"
                          title="YouTube"
                        >
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.108C19.524 3.545 12 3.545 12 3.545s-7.524 0-9.388.51a3.002 3.002 0 0 0-2.11 2.108C0 8.027 0 12 0 12s0 3.973.502 5.837a3.002 3.002 0 0 0 2.11 2.108c1.864.51 9.388.51 9.388.51s7.525 0 9.388-.51a3.002 3.002 0 0 0 2.11-2.108c.502-1.864.502-5.837.502-5.837s0-3.973-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                          </svg>
                          YouTube
                        </a>
                      )}
                    </dd>
                  </div>
                )}
                {highlightedItem.capacity ? (
                  <div className="flex justify-between gap-4 border-b border-brand-primary/10 pb-3">
                    <dt className="text-text/70">Capacidade</dt>
                    <dd className="text-right font-medium text-text">{highlightedItem.capacity}</dd>
                  </div>
                ) : null}
                {highlightedItem.reservedSeats ? (
                  <div className="flex justify-between gap-4 pb-1">
                    <dt className="text-text/70">Reservados</dt>
                    <dd className="text-right font-medium text-text">{highlightedItem.reservedSeats}</dd>
                  </div>
                ) : null}
              </dl>


            </div>

            <div className="shrink-0 border-t border-brand-primary/10 p-4">
              {joinMessage && (
                <div className={`mb-3 p-3 text-sm rounded-lg ${joinMessage.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                  {joinMessage.text}
                </div>
              )}
              {(user?.role === Role.ADMIN || (user?.role === Role.ORGANIZER && String(highlightedItem.createdBy) === String(user.id))) && (
                <div className="mb-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingEvent(highlightedItem);
                      setShowCreateEditModal(true);
                      closeEventDetails();
                    }}
                    className="flex-1 rounded-lg border border-brand-primary/35 py-2.5 text-xs font-semibold text-brand-primary transition hover:bg-brand-primary/5 md:text-sm"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteEvent(highlightedItem.id)}
                    className="flex-1 rounded-lg border border-red-200 py-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 md:text-sm"
                  >
                    Excluir
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={() => handleJoinEvent(highlightedItem.id)}
                disabled={isJoining}
                className="w-full rounded-lg bg-brand-primary px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-70 disabled:cursor-not-allowed"
                data-testid="city-feed-details-cta"
              >
                {isJoining ? 'Processando...' : (highlightedItem.ctaLabel ?? (highlightedItem.access === 'pago' ? 'Reservar ingresso' : 'Participar'))}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showCreateEditModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-brand-primary/15 bg-white shadow-cityCard overflow-hidden">
            <header className="flex justify-between items-center border-b border-brand-primary/10 px-5 py-4">
              <h2 className="font-display text-xl font-bold text-brand-primary">
                {editingEvent ? 'Editar Conteúdo' : 'Criar Novo Conteúdo'}
              </h2>
              <button
                type="button"
                onClick={() => setShowCreateEditModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-brand-primary transition hover:bg-brand-primary/10"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </header>

            <form onSubmit={handleSaveEvent} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-text/85 mb-1">Título</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full rounded-xl border border-brand-primary/25 bg-white px-3 py-2 text-sm text-text outline-none focus:border-brand-primary/55 focus:ring-2 focus:ring-brand-primary/20"
                  placeholder="Nome do evento, curso ou atividade"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text/85 mb-1">Categoria</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as FeedCategory)}
                    className="w-full rounded-xl border border-brand-primary/25 bg-white px-3 py-2 text-sm text-text outline-none focus:border-brand-primary/55"
                  >
                    <option value="eventos">Evento</option>
                    <option value="cursos">Curso</option>
                    <option value="atividades">Atividade</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text/85 mb-1">Acesso</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as 'COMMUNITY' | 'PRIVATE')}
                    className="w-full rounded-xl border border-brand-primary/25 bg-white px-3 py-2 text-sm text-text outline-none focus:border-brand-primary/55"
                  >
                    <option value="COMMUNITY">Gratuito (Comunidade)</option>
                    <option value="PRIVATE">Pago (Privado)</option>
                  </select>
                </div>
              </div>

              {formType === 'PRIVATE' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text/85 mb-1">Preço (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      className="w-full rounded-xl border border-brand-primary/25 bg-white px-3 py-2 text-sm text-text outline-none focus:border-brand-primary/55 focus:ring-2 focus:ring-brand-primary/20"
                      placeholder="Ex: 50.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text/85 mb-1">Vagas / Capacidade</label>
                    <input
                      type="number"
                      required
                      value={formMaxParticipants}
                      onChange={(e) => setFormMaxParticipants(e.target.value)}
                      className="w-full rounded-xl border border-brand-primary/25 bg-white px-3 py-2 text-sm text-text outline-none focus:border-brand-primary/55 focus:ring-2 focus:ring-brand-primary/20"
                      placeholder="Ex: 100"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text/85 mb-1">Data e Horário</label>
                  <input
                    type="datetime-local"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full rounded-xl border border-brand-primary/25 bg-white px-3 py-2 text-sm text-text outline-none focus:border-brand-primary/55"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text/85 mb-1">Local</label>
                  <input
                    type="text"
                    required
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full rounded-xl border border-brand-primary/25 bg-white px-3 py-2 text-sm text-text outline-none focus:border-brand-primary/55 focus:ring-2 focus:ring-brand-primary/20"
                    placeholder="Ex: Auditório Principal"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text/85 mb-1">Descrição</label>
                <textarea
                  rows={4}
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full rounded-xl border border-brand-primary/25 bg-white px-3 py-2 text-sm text-text outline-none focus:border-brand-primary/55 resize-none focus:ring-2 focus:ring-brand-primary/20"
                  placeholder="Descreva detalhadamente a programação..."
                />
              </div>

              {formError && <p className="text-sm text-red-500">{formError}</p>}

              <footer className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateEditModal(false)}
                  className="rounded-xl border border-brand-primary/25 px-4 py-2 text-sm font-semibold text-brand-primary transition hover:bg-brand-primary/10"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-75"
                >
                  {formLoading ? 'Salvando...' : 'Salvar'}
                </button>
              </footer>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
