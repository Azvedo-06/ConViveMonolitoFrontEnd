import { useEffect, useMemo, useState, useRef } from 'react';
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

  // Chat do Evento states
  const [activeTab, setActiveTab] = useState<'details' | 'chat'>('details');
  const [eventParticipants, setEventParticipants] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatError, setChatError] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [viewingProfile, setViewingProfile] = useState<any | null>(null);
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
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Estados para Simulação de Pagamento
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentEvent, setPaymentEvent] = useState<CityFeedItem | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');
  const [paymentStep, setPaymentStep] = useState<'select' | 'processing' | 'success'>('select');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardFocus, setCardFocus] = useState<'number' | 'name' | 'expiry' | 'cvv' | ''>('');
  const [paymentError, setPaymentError] = useState('');
  const [pixTimer, setPixTimer] = useState(300);
  const [pixKeyCopied, setPixKeyCopied] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');

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

  // Countdown Timer do Pix
  useEffect(() => {
    if (!showPaymentModal || paymentMethod !== 'pix' || paymentStep !== 'select' || pixTimer <= 0) {
      return;
    }
    const interval = setInterval(() => {
      setPixTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [showPaymentModal, paymentMethod, paymentStep, pixTimer]);

  const formatPixTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getCardType = (num: string) => {
    const cleanNum = num.replace(/\D/g, '');
    if (cleanNum.startsWith('4')) return 'VISA';
    if (/^5[1-5]/.test(cleanNum)) return 'MASTERCARD';
    if (/^3[47]/.test(cleanNum)) return 'AMEX';
    if (/^(6011|65|64[4-9])/.test(cleanNum)) return 'DISCOVER';
    return 'CRÉDITO';
  };

  const formatCardNumberPreview = (num: string) => {
    const cleanNum = num.replace(/\D/g, '');
    let formatted = '';
    for (let i = 0; i < 16; i++) {
      if (i > 0 && i % 4 === 0) formatted += ' ';
      formatted += cleanNum[i] || '•';
    }
    return formatted;
  };

  const handleCardNumberChange = (value: string) => {
    const cleanNum = value.replace(/\D/g, '').slice(0, 16);
    let formatted = '';
    for (let i = 0; i < cleanNum.length; i++) {
      if (i > 0 && i % 4 === 0) formatted += ' ';
      formatted += cleanNum[i];
    }
    setCardNumber(formatted);
  };

  const handleCardExpiryChange = (value: string) => {
    const cleanNum = value.replace(/\D/g, '').slice(0, 4);
    if (cleanNum.length > 2) {
      setCardExpiry(`${cleanNum.slice(0, 2)}/${cleanNum.slice(2)}`);
    } else {
      setCardExpiry(cleanNum);
    }
  };

  const handleCardCvvChange = (value: string) => {
    const cleanNum = value.replace(/\D/g, '').slice(0, 4);
    setCardCvv(cleanNum);
  };

  const handleCopyPixKey = () => {
    const pixKey = `00020101021226830014br.gov.bcb.pix25610014convive.pagar2534${paymentEvent?.id}5204000053039865405${paymentEvent?.price?.toFixed(2) || '0.00'}5802BR5915ConVive Pagamentos6009CM-Mambore62070503***6304`;
    navigator.clipboard.writeText(pixKey);
    setPixKeyCopied(true);
    setTimeout(() => setPixKeyCopied(false), 2000);
  };


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

  const isUserCreator = useMemo(() => {
    return !!(user && selectedItem && String(selectedItem.createdBy) === String(user.id));
  }, [user, selectedItem]);

  const isUserAdmin = useMemo(() => {
    return !!(user && user.role === Role.ADMIN);
  }, [user]);

  const isUserParticipant = useMemo(() => {
    return !!(user && eventParticipants.some((p: any) => String(p.id) === String(user.id)));
  }, [user, eventParticipants]);

  const hasChatAccess = useMemo(() => {
    return !!(user && (isUserCreator || isUserAdmin || isUserParticipant));
  }, [user, isUserCreator, isUserAdmin, isUserParticipant]);

  // Load participants and messages
  useEffect(() => {
    if (!selectedItem || !user) {
      setEventParticipants([]);
      setChatMessages([]);
      setActiveTab('details');
      return;
    }

    let isSubscribed = true;

    async function loadEventData() {
      try {
        const parts = await backendFetch<any[]>(backendRoutes.eventParticipants(selectedItem!.id));
        if (!isSubscribed) return;
        setEventParticipants(parts);

        const isCreator = String(selectedItem!.createdBy) === String(user!.id);
        const isAdmin = user!.role === Role.ADMIN;
        const isPart = parts.some((p: any) => String(p.id) === String(user!.id));

        if (isCreator || isAdmin || isPart) {
          const msgs = await backendFetch<any[]>(backendRoutes.eventMessages(selectedItem!.id));
          if (!isSubscribed) return;
          setChatMessages(msgs);
        }
      } catch (err) {
        console.error('Erro ao carregar dados do evento/chat', err);
      }
    }

    loadEventData();

    return () => {
      isSubscribed = false;
    };
  }, [selectedItem, user]);

  // Polling for chat messages
  useEffect(() => {
    if (!selectedItem || !user || activeTab !== 'chat' || !hasChatAccess) {
      return;
    }

    const eventId = selectedItem.id;

    async function fetchMsgs() {
      try {
        const msgs = await backendFetch<any[]>(backendRoutes.eventMessages(eventId));
        setChatMessages(msgs);
      } catch (err) {
        console.error('Erro no polling do chat', err);
      }
    }

    fetchMsgs(); // Fetch immediately!

    const interval = setInterval(fetchMsgs, 4000);

    return () => clearInterval(interval);
  }, [selectedItem, user, activeTab, hasChatAccess]);

  // Scroll to bottom
  useEffect(() => {
    if (activeTab === 'chat' && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  function closeEventDetails() {
    setSelectedItem(null);
    setJoinMessage(null);
    setActiveTab('details');
  }

  async function handleSendChatMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim() || !selectedItem) return;

    const text = chatInput.trim();
    setChatInput('');
    setChatError('');

    try {
      const newMsg = await backendFetch<any>(backendRoutes.eventMessages(selectedItem.id), {
        method: 'POST',
        body: JSON.stringify({ message: text }),
      });
      setChatMessages((prev) => [...prev, newMsg]);
    } catch (err: any) {
      setChatError(err.message || 'Erro ao enviar a mensagem');
    }
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
      
      // Reload participants list dynamically
      const parts = await backendFetch<any[]>(backendRoutes.eventParticipants(eventId));
      setEventParticipants(parts);
      setActiveTab('chat'); // Automatically switch to chat tab since they're in!
    } catch (err: any) {
      setJoinMessage({ type: 'error', text: err.message || 'Erro ao participar do evento' });
    } finally {
      setIsJoining(false);
    }
  }

  const handleSimulatePayment = async () => {
    setPaymentError('');
    
    // Validations for Credit Card
    if (paymentMethod === 'card') {
      const cleanCard = cardNumber.replace(/\D/g, '');
      if (cleanCard.length < 16) {
        setPaymentError('O número do cartão deve ter 16 dígitos.');
        return;
      }
      if (!cardName.trim()) {
        setPaymentError('Insira o nome impresso no cartão.');
        return;
      }
      if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
        setPaymentError('A data de validade deve estar no formato MM/AA.');
        return;
      }
      const [expMonth, expYear] = cardExpiry.split('/').map(Number);
      if (expMonth < 1 || expMonth > 12) {
        setPaymentError('Mês de validade inválido.');
        return;
      }
      if (cardCvv.replace(/\D/g, '').length < 3) {
        setPaymentError('O CVV deve ter pelo menos 3 dígitos.');
        return;
      }
    }

    setPaymentStep('processing');
    
    // Simulate steps of transaction
    const steps = [
      'Conectando com o gateway de pagamento...',
      paymentMethod === 'pix' ? 'Validando transação Pix no Banco Central...' : 'Validando dados do cartão e limites...',
      paymentMethod === 'pix' ? 'Aguardando liquidação imediata...' : 'Processando transação com a operadora...',
      'Autorizando sua inscrição no evento...',
    ];

    for (let i = 0; i < steps.length; i++) {
      setProcessingStatus(steps[i]);
      await new Promise((resolve) => setTimeout(resolve, i === 0 ? 1000 : 800));
    }

    setPaymentStep('success');
    
    // After success, join event and close payment modal
    setTimeout(async () => {
      if (paymentEvent) {
        try {
          await handleJoinEvent(paymentEvent.id);
          setShowPaymentModal(false);
        } catch (err: any) {
          // If join failed, show error back in checkout select step
          setPaymentStep('select');
          setPaymentError(err.message || 'Erro ao realizar inscrição pós-pagamento.');
        }
      }
    }, 1500);
  };

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

            {hasChatAccess && (
              <div className="flex border-b border-brand-primary/10 bg-surface/50 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('details')}
                  className={`flex-1 py-3 text-center text-xs md:text-sm font-semibold border-b-2 transition ${
                    activeTab === 'details'
                      ? 'border-brand-primary text-brand-primary'
                      : 'border-transparent text-text/60 hover:text-text hover:bg-brand-primary/5'
                  }`}
                >
                  Detalhes
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('chat')}
                  className={`flex-1 py-3 text-center text-xs md:text-sm font-semibold border-b-2 transition flex items-center justify-center gap-2 ${
                    activeTab === 'chat'
                      ? 'border-brand-primary text-brand-primary'
                      : 'border-transparent text-text/60 hover:text-text hover:bg-brand-primary/5'
                  }`}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>Chat do Evento</span>
                </button>
              </div>
            )}

            {hasChatAccess && activeTab === 'chat' ? (
              <div className="flex flex-1 flex-col overflow-hidden min-h-[350px]">
                {/* Chat Messages List */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-surface/30 max-h-[350px]">
                  {chatMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-text/50 py-10 text-center">
                      <svg className="h-10 w-10 mb-2 opacity-60 text-brand-primary mx-auto" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <p className="text-sm font-semibold text-text/80">Nenhuma mensagem ainda</p>
                      <p className="text-xs text-text/60">Envie a primeira mensagem para iniciar a conversa!</p>
                    </div>
                  ) : (
                    chatMessages.map((msg: any) => {
                      const isMe = user && msg.userId === user.id;
                      const isMsgCreator = msg.userId === highlightedItem.createdBy;
                      const senderName = msg.user?.name || 'Usuário';
                      const formattedTime = new Date(msg.createdAt).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          <div className="flex items-center gap-1 mb-0.5 px-1">
                            <button
                              type="button"
                              onClick={() => setViewingProfile(msg.user || user)}
                              className="text-[10px] font-semibold text-text/60 hover:text-brand-primary hover:underline transition-colors focus:outline-none cursor-pointer"
                            >
                              {isMe ? 'Você' : senderName}
                            </button>
                            {isMsgCreator && (
                              <span className="text-[8px] font-bold uppercase tracking-wider bg-brand-primary/10 text-brand-primary px-1 py-0.2 rounded border border-brand-primary/20">
                                Organizador
                              </span>
                            )}
                          </div>
                          <div
                            className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm leading-relaxed ${
                              isMe
                                ? 'bg-brand-primary text-white rounded-tr-none'
                                : 'bg-white text-text border border-brand-primary/10 rounded-tl-none'
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                            <p
                              className={`text-[8px] text-right mt-1 ${
                                isMe ? 'text-white/75' : 'text-text/50'
                              }`}
                            >
                              {formattedTime}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat Input Bar */}
                <form
                  onSubmit={handleSendChatMessage}
                  className="shrink-0 border-t border-brand-primary/10 p-3 bg-white flex gap-2"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Escreva uma mensagem..."
                    className="flex-1 rounded-xl border border-brand-primary/20 bg-surface/50 px-4 py-2.5 text-sm text-text outline-none focus:border-brand-primary/50 focus:bg-white transition"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim()}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-primary text-white transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Enviar mensagem"
                  >
                    <svg className="h-5 w-5 rotate-90" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </form>
                {chatError && (
                  <p className="text-xs text-red-500 px-4 pb-2 bg-white">{chatError}</p>
                )}
              </div>
            ) : (
              <>
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
                  {(isUserCreator || isUserAdmin) && (
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

                  {isUserParticipant ? (
                    <button
                      type="button"
                      disabled
                      className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white opacity-95 cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Inscrição Confirmada!</span>
                    </button>
                  ) : (isUserCreator || isUserAdmin) ? (
                    <div className="text-center text-xs font-semibold text-brand-primary py-2.5 bg-brand-primary/10 rounded-lg">
                      Você é o organizador deste evento
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (highlightedItem.access === 'pago') {
                          const token = localStorage.getItem('token');
                          if (!token) {
                            closeEventDetails();
                            onLogin();
                            return;
                          }
                          setPaymentEvent(highlightedItem);
                          setPaymentStep('select');
                          setPaymentMethod('pix');
                          setCardNumber('');
                          setCardName('');
                          setCardExpiry('');
                          setCardCvv('');
                          setCardFocus('');
                          setPaymentError('');
                          setPixTimer(300);
                          setShowPaymentModal(true);
                        } else {
                          handleJoinEvent(highlightedItem.id);
                        }
                      }}
                      disabled={isJoining}
                      className="w-full rounded-lg bg-brand-primary px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-70 disabled:cursor-not-allowed"
                      data-testid="city-feed-details-cta"
                    >
                      {isJoining ? 'Processando...' : (highlightedItem.ctaLabel ?? (highlightedItem.access === 'pago' ? 'Reservar ingresso' : 'Participar'))}
                    </button>
                  )}
                </div>
              </>
            )}
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

      {viewingProfile ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl border border-brand-primary/15 bg-white shadow-cityCard overflow-hidden transform transition-all scale-100 animate-in fade-in zoom-in duration-200">
            <header className="relative bg-brand-primary text-white px-5 py-6 flex flex-col items-center">
              <button
                type="button"
                onClick={() => setViewingProfile(null)}
                className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/25 text-white transition focus:outline-none"
                aria-label="Fechar perfil"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
              
              <div className="h-16 w-16 rounded-full bg-white/20 border-2 border-white flex items-center justify-center text-2xl font-bold uppercase select-none">
                {viewingProfile.name?.charAt(0) || '?'}
              </div>
              
              <h3 className="mt-3 font-display text-lg font-bold text-center">
                {viewingProfile.name}
              </h3>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-white/15 px-2.5 py-0.5 rounded-full mt-1">
                {viewingProfile.role === Role.ADMIN ? 'Administrador' : viewingProfile.role === Role.ORGANIZER ? 'Organizador' : 'Participante'}
              </span>
            </header>

            <div className="p-5 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-text/80">
                  <svg className="h-4 w-4 text-brand-primary shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="break-all font-medium">{viewingProfile.email}</span>
                </div>

                {viewingProfile.phone && (
                  <div className="flex items-center gap-3 text-sm text-text/80">
                    <svg className="h-4 w-4 text-brand-primary shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="font-medium">{viewingProfile.phone}</span>
                  </div>
                )}
              </div>

              {(viewingProfile.linkedin || viewingProfile.instagram || viewingProfile.youtube) ? (
                <div className="border-t border-brand-primary/10 pt-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-text/60 mb-2">Redes Sociais</h4>
                  <div className="flex flex-col gap-2">
                    {viewingProfile.linkedin && (
                      <a
                        href={viewingProfile.linkedin.startsWith('http') ? viewingProfile.linkedin : `https://${viewingProfile.linkedin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs font-semibold text-brand-primary bg-brand-primary/5 hover:bg-brand-primary/10 px-3 py-2 rounded-xl transition"
                      >
                        <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                        </svg>
                        <span>LinkedIn</span>
                      </a>
                    )}
                    {viewingProfile.instagram && (
                      <a
                        href={viewingProfile.instagram.startsWith('http') ? viewingProfile.instagram : `https://${viewingProfile.instagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs font-semibold text-brand-primary bg-brand-primary/5 hover:bg-brand-primary/10 px-3 py-2 rounded-xl transition"
                      >
                        <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                        </svg>
                        <span>Instagram</span>
                      </a>
                    )}
                    {viewingProfile.youtube && (
                      <a
                        href={viewingProfile.youtube.startsWith('http') ? viewingProfile.youtube : `https://${viewingProfile.youtube}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs font-semibold text-brand-primary bg-brand-primary/5 hover:bg-brand-primary/10 px-3 py-2 rounded-xl transition"
                      >
                        <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.108C19.524 3.545 12 3.545 12 3.545s-7.524 0-9.388.51a3.002 3.002 0 0 0-2.11 2.108C0 8.027 0 12 0 12s0 3.973.502 5.837a3.002 3.002 0 0 0 2.11 2.108c1.864.51 9.388.51 9.388.51s7.525 0 9.388-.51a3.002 3.002 0 0 0 2.11-2.108c.502-1.864.502-5.837.502-5.837s0-3.973-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                        <span>YouTube</span>
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div className="border-t border-brand-primary/10 pt-4 text-center text-xs text-text/50">
                  Nenhuma rede social configurada no perfil.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {showPaymentModal && paymentEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-brand-primary/15 bg-white shadow-cityCard overflow-hidden transform transition-all scale-100 animate-in fade-in zoom-in duration-200">
            <header className="relative bg-brand-primary text-white px-5 py-5 flex flex-col">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/25 text-white transition focus:outline-none"
                aria-label="Fechar checkout"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/75">
                Checkout de Pagamento
              </span>
              <h3 className="mt-1 font-display text-lg font-bold truncate pr-8">
                {paymentEvent.title}
              </h3>
              <div className="mt-3 flex justify-between items-end border-t border-white/10 pt-3">
                <div>
                  <span className="block text-[10px] text-white/60">Data do Evento</span>
                  <span className="text-xs font-medium">{paymentEvent.date}</span>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] text-white/60">Valor do Ingresso</span>
                  <span className="text-lg font-bold">{paymentEvent.ticketPrice ?? 'Pago'}</span>
                </div>
              </div>
            </header>

            {paymentStep === 'select' && (
              <div className="p-5">
                {/* Payment Method Tabs */}
                <div className="flex bg-neutral-100 p-1 rounded-xl mb-5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('pix')}
                    className={`flex-1 py-2 text-center text-xs font-semibold rounded-lg transition ${
                      paymentMethod === 'pix'
                        ? 'bg-white text-brand-primary shadow-sm'
                        : 'text-neutral-500 hover:text-neutral-800'
                    }`}
                  >
                    PIX (Imediato)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`flex-1 py-2 text-center text-xs font-semibold rounded-lg transition ${
                      paymentMethod === 'card'
                        ? 'bg-white text-brand-primary shadow-sm'
                        : 'text-neutral-500 hover:text-neutral-800'
                    }`}
                  >
                    Cartão de Crédito
                  </button>
                </div>

                {paymentMethod === 'pix' ? (
                  <div className="space-y-4 text-center">
                    {/* Simulated Pix QR Code */}
                    <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100 inline-block mx-auto">
                      <svg className="w-36 h-36 mx-auto text-neutral-800" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="100" height="100" rx="12" fill="white"/>
                        <path d="M10 10h20v20H10V10zm5 5v10h10V15H15zm55-5h20v20H70V10zm5 5v10h10V15H75zM10 70h20v20H10V70zm5 5v10h10V75H15z" fill="currentColor"/>
                        <path d="M40 10h5v10h-5zm10 0h5v5h-5zm10 5h5v5h-5zm-20 10h10v5H40zm15 0h10v5H55zm-15 10h5v10h-5zm10 5h15v5H50zm-10 10h10v5H40zm25-10h5v5h-5zm5 5h10v5H70zm10 5h10v5H80zm-70 15h5v5H10zm15 5h15v5H25zm10 10h5v5H35zm20-15h15v5H55zm5 10h10v5H60zm10 5h20v5H70zm10-10h5v5H80zm5-10h5v5H85zm-45-15h5v5H40zm15 5h5v10H55z" fill="currentColor"/>
                        <rect x="36" y="36" width="28" height="28" rx="8" fill="#32bcad"/>
                        <path d="M44 50l6-6 6 6-6 6-6-6zm2 0l4-4 4 4-4 4-4-4z" fill="white"/>
                        <circle cx="50" cy="50" r="1.5" fill="white"/>
                      </svg>
                    </div>

                    <div className="text-xs text-neutral-500 flex flex-col gap-0.5">
                      <span>Escaneie o QR Code acima ou use a chave copia e cola</span>
                      <span className="font-semibold text-brand-primary">
                        Código expira em: {formatPixTimer(pixTimer)}
                      </span>
                    </div>

                    {/* Copia e Cola box */}
                    <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-xl p-2.5">
                      <div className="flex-1 text-left text-[10px] font-mono truncate select-all text-neutral-600">
                        {`00020101021226830014br.gov.bcb.pix25610014convive.pagar2534${paymentEvent.id}5204000053039865405${paymentEvent.price?.toFixed(2) || '0.00'}5802BR5915ConVive Pagamentos6009CM-Mambore62070503***6304`}
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyPixKey}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition ${
                          pixKeyCopied
                            ? 'bg-emerald-600 text-white'
                            : 'bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20'
                        }`}
                      >
                        {pixKeyCopied ? 'Copiado!' : 'Copiar'}
                      </button>
                    </div>

                    {paymentError && (
                      <p className="text-xs font-medium text-red-600">{paymentError}</p>
                    )}

                    <div className="pt-2 border-t border-neutral-100 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowPaymentModal(false)}
                        className="flex-1 py-3 text-xs font-semibold rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleSimulatePayment}
                        className="flex-1 py-3 text-xs font-semibold rounded-xl bg-brand-primary text-white transition hover:brightness-110"
                      >
                        Confirmar Pagamento
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Interactive 3D Card Preview */}
                    <div className="relative mx-auto w-full max-w-[300px] h-44 [perspective:1000px] mb-5 select-none font-mono text-white">
                      <div className={`relative w-full h-full duration-700 [transform-style:preserve-3d] ${cardFocus === 'cvv' ? '[transform:rotateY(180deg)]' : ''}`}>
                        {/* Front of Card */}
                        <div className="absolute inset-0 w-full h-full rounded-2xl p-4 bg-gradient-to-br from-neutral-800 to-neutral-955 border border-white/10 [backface-visibility:hidden] flex flex-col justify-between shadow-md">
                          <div className="flex justify-between items-start">
                            <div className="w-8 h-6 bg-amber-400/80 rounded border border-amber-300/30 flex items-center justify-center overflow-hidden">
                              <div className="grid grid-cols-3 gap-0.5 w-full h-full p-1 opacity-55">
                                {[...Array(9)].map((_, i) => (
                                  <div key={i} className="border border-neutral-900/40 rounded-sm" />
                                ))}
                              </div>
                            </div>
                            <div className="text-right text-[10px] font-bold tracking-widest italic opacity-90">
                              {getCardType(cardNumber)}
                            </div>
                          </div>
                          <div className="text-base tracking-[0.15em] font-semibold text-center my-2 min-h-[24px]">
                            {formatCardNumberPreview(cardNumber)}
                          </div>
                          <div className="flex justify-between items-end text-[9px] uppercase tracking-wider">
                            <div className="max-w-[70%]">
                              <span className="block text-[7px] opacity-65">Titular</span>
                              <span className="block font-medium truncate min-h-[14px]">{cardName || 'NOME DO TITULAR'}</span>
                            </div>
                            <div>
                              <span className="block text-[7px] opacity-65">Validade</span>
                              <span className="block font-medium">{cardExpiry || 'MM/AA'}</span>
                            </div>
                          </div>
                        </div>
                        {/* Back of Card */}
                        <div className="absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-br from-neutral-800 to-neutral-955 border border-white/10 [backface-visibility:hidden] [transform:rotateY(180deg)] flex flex-col justify-between py-4 shadow-md">
                          <div className="w-full h-8 bg-neutral-950 mt-1" />
                          <div className="px-4 flex items-center justify-between gap-3">
                            <div className="flex-1 h-7 bg-neutral-200 rounded-sm" />
                            <div className="w-12 h-7 bg-white text-neutral-900 rounded-sm flex items-center justify-center font-bold text-xs">
                              {cardCvv || 'CVV'}
                            </div>
                          </div>
                          <div className="px-4 text-[7px] opacity-55 text-center leading-normal">
                            Apenas para simulação e teste de pagamento na plataforma.
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-neutral-600 mb-1">Número do Cartão</label>
                        <input
                          type="text"
                          required
                          value={cardNumber}
                          onChange={(e) => handleCardNumberChange(e.target.value)}
                          onFocus={() => setCardFocus('number')}
                          onBlur={() => setCardFocus('')}
                          placeholder="0000 0000 0000 0000"
                          className="w-full rounded-xl border border-neutral-200 px-3.5 py-2 text-sm text-neutral-800 outline-none focus:border-brand-primary/50 transition font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-neutral-600 mb-1">Nome Impresso no Cartão</label>
                        <input
                          type="text"
                          required
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value.toUpperCase())}
                          onFocus={() => setCardFocus('name')}
                          onBlur={() => setCardFocus('')}
                          placeholder="EX: JOÃO S SILVA"
                          className="w-full rounded-xl border border-neutral-200 px-3.5 py-2 text-sm text-neutral-800 outline-none focus:border-brand-primary/50 transition"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-neutral-600 mb-1">Validade</label>
                          <input
                            type="text"
                            required
                            value={cardExpiry}
                            onChange={(e) => handleCardExpiryChange(e.target.value)}
                            onFocus={() => setCardFocus('expiry')}
                            onBlur={() => setCardFocus('')}
                            placeholder="MM/AA"
                            className="w-full rounded-xl border border-neutral-200 px-3.5 py-2 text-sm text-neutral-800 outline-none focus:border-brand-primary/50 transition font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-neutral-600 mb-1">Código CVV</label>
                          <input
                            type="text"
                            required
                            value={cardCvv}
                            onChange={(e) => handleCardCvvChange(e.target.value)}
                            onFocus={() => setCardFocus('cvv')}
                            onBlur={() => setCardFocus('')}
                            placeholder="123"
                            className="w-full rounded-xl border border-neutral-200 px-3.5 py-2 text-sm text-neutral-800 outline-none focus:border-brand-primary/50 transition font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {paymentError && (
                      <p className="text-xs font-medium text-red-600">{paymentError}</p>
                    )}

                    <div className="pt-2 border-t border-neutral-100 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowPaymentModal(false)}
                        className="flex-1 py-3 text-xs font-semibold rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleSimulatePayment}
                        className="flex-1 py-3 text-xs font-semibold rounded-xl bg-brand-primary text-white transition hover:brightness-110"
                      >
                        Pagar {paymentEvent.ticketPrice}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {paymentStep === 'processing' && (
              <div className="p-10 flex flex-col items-center justify-center text-center space-y-4 min-h-[300px]">
                <div className="w-12 h-12 rounded-full border-4 border-neutral-200 border-t-brand-primary animate-spin" />
                <h4 className="font-semibold text-sm text-neutral-800">Processando Pagamento...</h4>
                <p className="text-xs text-neutral-500 italic max-w-xs">{processingStatus}</p>
              </div>
            )}

            {paymentStep === 'success' && (
              <div className="p-10 flex flex-col items-center justify-center text-center space-y-4 min-h-[300px]">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 scale-100 animate-bounce">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h4 className="font-display text-lg font-bold text-emerald-600">Pagamento Aprovado!</h4>
                <p className="text-xs text-neutral-500">Sua inscrição foi confirmada com sucesso.</p>
                <p className="text-[10px] text-neutral-400">Redirecionando para o chat do evento...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
