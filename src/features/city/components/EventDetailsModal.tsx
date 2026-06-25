import { useState, useEffect, useMemo, useRef } from 'react';
import { type CityFeedItem } from '../cityFeedData';
import { UserProfileModal } from './UserProfileModal';
import { io } from 'socket.io-client';
import { backendFetch, backendRoutes, Role, type UserResponseDto, API_BASE_URL } from '../../../services/backendRoutes';

type EventDetailsModalProps = {
  selectedItem: CityFeedItem;
  user: UserResponseDto | null;
  onClose: () => void;
  onLogin: () => void;
  onEditClick: (item: CityFeedItem) => void;
  onDeleteSuccess: (eventId: string) => void;
  onJoinSuccess: () => void;
  onStartPayment: (event: CityFeedItem) => void;
};

export function EventDetailsModal({
  selectedItem,
  user,
  onClose,
  onLogin,
  onEditClick,
  onDeleteSuccess,
  onJoinSuccess,
  onStartPayment,
}: EventDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'chat'>('details');
  const [eventParticipants, setEventParticipants] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatError, setChatError] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [viewingProfile, setViewingProfile] = useState<any | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [joinMessage, setJoinMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isPromoting, setIsPromoting] = useState<string | null>(null);
  const [promotionError, setPromotionError] = useState('');
  const [localPromotion, setLocalPromotion] = useState<{
    exposureLevel?: 'NONE' | 'CITY' | 'STATE' | 'COUNTRY';
    promotionUntil?: string | null;
  }>({});

  const isUserCreator = useMemo(() => {
    return !!(user && String(selectedItem.createdBy) === String(user.id));
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
    let isSubscribed = true;

    async function loadEventData() {
      try {
        const parts = await backendFetch<any[]>(backendRoutes.eventParticipants(selectedItem.id));
        if (!isSubscribed) return;
        setEventParticipants(parts);

        const isCreator = String(selectedItem.createdBy) === String(user?.id);
        const isAdmin = user?.role === Role.ADMIN;
        const isPart = parts.some((p: any) => String(p.id) === String(user?.id));

        if (user && (isCreator || isAdmin || isPart)) {
          const msgs = await backendFetch<any[]>(backendRoutes.eventMessages(selectedItem.id));
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

  // WebSocket setup for chat
  useEffect(() => {
    if (activeTab !== 'chat' || !hasChatAccess) {
      return;
    }

    const eventId = selectedItem.id;

    // Load messages initially
    async function fetchMsgs() {
      try {
        const msgs = await backendFetch<any[]>(backendRoutes.eventMessages(eventId));
        setChatMessages(msgs);
      } catch (err) {
        console.error('Erro ao buscar mensagens do chat', err);
      }
    }
    fetchMsgs();

    // Establish WebSocket connection
    const socket = io(API_BASE_URL);

    socket.on('connect', () => {
      console.log('Conectado ao WebSocket do evento', eventId);
      socket.emit('joinEvent', { eventId });
    });

    socket.on('newMessage', (newMessage: any) => {
      setChatMessages((prev) => {
        if (prev.some((m) => m.id === newMessage.id)) {
          return prev;
        }
        return [...prev, newMessage];
      });
    });

    socket.on('disconnect', () => {
      console.log('Desconectado do WebSocket do evento', eventId);
    });

    return () => {
      socket.emit('leaveEvent', { eventId });
      socket.disconnect();
    };
  }, [selectedItem.id, activeTab, hasChatAccess]);

  // Scroll to bottom
  useEffect(() => {
    if (activeTab === 'chat' && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  // Esc overlay block
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  async function handleSendChatMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const text = chatInput.trim();
    setChatInput('');
    setChatError('');

    try {
      const newMsg = await backendFetch<any>(backendRoutes.eventMessages(selectedItem.id), {
        method: 'POST',
        body: JSON.stringify({ message: text }),
      });
      setChatMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) {
          return prev;
        }
        return [...prev, newMsg];
      });
    } catch (err: any) {
      setChatError(err.message || 'Erro ao enviar a mensagem');
    }
  }

  async function handleJoinEvent(eventId: string) {
    const token = localStorage.getItem('token');
    if (!token) {
      onClose();
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
      setActiveTab('chat'); // Automatically switch to chat tab
      onJoinSuccess();
    } catch (err: any) {
      setJoinMessage({ type: 'error', text: err.message || 'Erro ao participar do evento' });
    } finally {
      setIsJoining(false);
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
      onDeleteSuccess(eventId);
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir o evento');
    }
  }

  async function handlePromoteEvent(level: 'CITY' | 'STATE' | 'COUNTRY') {
    setIsPromoting(level);
    setPromotionError('');
    try {
      if (isUserAdmin) {
        const response = await backendFetch<any>(backendRoutes.promoteEvent(selectedItem.id), {
          method: 'POST',
          body: JSON.stringify({ exposureLevel: level }),
        });
        setLocalPromotion({
          exposureLevel: response.data.exposureLevel,
          promotionUntil: response.data.promotionUntil,
        });
        alert('Evento promovido com sucesso (Destaque Admin Gratuito)!');
        onJoinSuccess();
        setIsPromoting(null);
      } else {
        const response = await backendFetch<{ url: string }>(backendRoutes.checkoutPromotion, {
          method: 'POST',
          body: JSON.stringify({
            eventId: Number(selectedItem.id),
            exposureLevel: level,
          }),
        });
        if (response.url) {
          window.location.href = response.url;
        } else {
          throw new Error('URL de pagamento não retornada pelo servidor.');
        }
      }
    } catch (err: any) {
      setPromotionError(err.message || 'Erro ao iniciar o processo de promoção.');
      setIsPromoting(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      role="presentation"
      data-testid="city-feed-details-modal"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Fechar detalhes do evento"
        onClick={onClose}
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
                {selectedItem.category}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${selectedItem.access === 'pago' ? 'bg-brand-primary text-white' : 'bg-emerald-100 text-emerald-800'}`}
              >
                {selectedItem.access === 'pago' ? (selectedItem.ticketPrice ?? 'Pago') : 'Gratuito'}
              </span>
            </div>
            <h2 id="city-feed-details-title" className="mt-2 font-display text-xl leading-tight text-brand-primary md:text-2xl">
              {selectedItem.title}
            </h2>
            <p className="mt-1 text-sm text-text/70">{selectedItem.date}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-brand-primary transition hover:bg-brand-primary/10"
            aria-label="Fechar"
            data-testid="city-feed-close-details"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
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
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
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
                  <svg className="h-10 w-10 mb-2 opacity-60 text-brand-primary mx-auto" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-sm font-semibold text-text/80">Nenhuma mensagem ainda</p>
                  <p className="text-xs text-text/60">Envie a primeira mensagem para iniciar a conversa!</p>
                </div>
              ) : (
                chatMessages.map((msg: any) => {
                  const isMe = user && msg.userId === user.id;
                  const isMsgCreator = msg.userId === selectedItem.createdBy;
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
                className="flex-1 rounded-xl border border-brand-primary/20 bg-surface/50 px-4 py-2.5 text-sm text-text outline-none focus:border-brand-primary/55 focus:bg-white transition"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-primary text-white transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Enviar mensagem"
              >
                <svg className="h-5 w-5 rotate-90" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
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
              <p className="text-sm leading-relaxed text-text">{selectedItem.details}</p>

              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between gap-4 border-b border-brand-primary/10 pb-3">
                  <dt className="text-text/70">Entrada</dt>
                  <dd className="text-right font-medium text-text">
                    {selectedItem.access === 'pago' ? (selectedItem.ticketPrice ?? 'Pago') : 'Gratuita'}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-brand-primary/10 pb-3">
                  <dt className="text-text/70">Data</dt>
                  <dd className="text-right font-medium text-text">{selectedItem.date}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-brand-primary/10 pb-3">
                  <dt className="text-text/70">Local</dt>
                  <dd className="text-right font-medium text-text">{selectedItem.location}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-brand-primary/10 pb-3">
                  <dt className="text-text/70">Responsavel</dt>
                  <dd className="text-right font-medium text-text">{selectedItem.organizer}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-brand-primary/10 pb-3">
                  <dt className="text-text/70">Contato</dt>
                  <dd className="text-right font-medium text-text">{selectedItem.contact}</dd>
                </div>
                {(selectedItem.linkedin || selectedItem.instagram || selectedItem.youtube) && (
                  <div className="flex justify-between items-center gap-4 border-b border-brand-primary/10 pb-3 flex-wrap">
                    <dt className="text-text/70">Redes Sociais</dt>
                    <dd className="flex gap-2">
                      {selectedItem.linkedin && (
                        <a
                          href={selectedItem.linkedin.startsWith('http') ? selectedItem.linkedin : `https://${selectedItem.linkedin}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs font-semibold text-brand-primary bg-brand-primary/10 hover:bg-brand-primary/20 px-2.5 py-1 rounded-md transition"
                          data-testid="organizer-linkedin"
                          title="LinkedIn"
                        >
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                          </svg>
                          LinkedIn
                        </a>
                      )}
                      {selectedItem.instagram && (
                        <a
                          href={selectedItem.instagram.startsWith('http') ? selectedItem.instagram : `https://${selectedItem.instagram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs font-semibold text-brand-primary bg-brand-primary/10 hover:bg-brand-primary/20 px-2.5 py-1 rounded-md transition"
                          data-testid="organizer-instagram"
                          title="Instagram"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
                            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                          </svg>
                          Instagram
                        </a>
                      )}
                      {selectedItem.youtube && (
                        <a
                          href={selectedItem.youtube.startsWith('http') ? selectedItem.youtube : `https://${selectedItem.youtube}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs font-semibold text-brand-primary bg-brand-primary/10 hover:bg-brand-primary/20 px-2.5 py-1 rounded-md transition"
                          data-testid="organizer-youtube"
                          title="YouTube"
                        >
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.108C19.524 3.545 12 3.545 12 3.545s-7.524 0-9.388.51a3.002 3.002 0 0 0-2.11 2.108C0 8.027 0 12 0 12s0 3.973.502 5.837a3.002 3.002 0 0 0 2.11 2.108c1.864.51 9.388.51 9.388.51s7.525 0 9.388-.51a3.002 3.002 0 0 0 2.11-2.108c.502-1.864.502-5.837.502-5.837s0-3.973-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                          </svg>
                          YouTube
                        </a>
                      )}
                    </dd>
                  </div>
                )}
                {selectedItem.capacity ? (
                  <div className="flex justify-between gap-4 border-b border-brand-primary/10 pb-3">
                    <dt className="text-text/70">Capacidade</dt>
                    <dd className="text-right font-medium text-text">{selectedItem.capacity}</dd>
                  </div>
                ) : null}
                {selectedItem.reservedSeats ? (
                  <div className="flex justify-between gap-4 pb-1">
                    <dt className="text-text/70">Reservados</dt>
                    <dd className="text-right font-medium text-text">{selectedItem.reservedSeats}</dd>
                  </div>
                ) : null}
              </dl>

              {(isUserCreator || isUserAdmin) && (() => {
                const currentExposureLevel = localPromotion.exposureLevel || selectedItem.exposureLevel;
                const currentPromotionUntil = localPromotion.promotionUntil || selectedItem.promotionUntil;
                const isPromotionActive = currentExposureLevel && currentExposureLevel !== 'NONE' && currentPromotionUntil && new Date(currentPromotionUntil) > new Date();

                return (
                  <div className="mt-6 border-t border-brand-primary/10 pt-4 animate-fadeIn">
                    <h4 className="text-sm font-bold text-brand-primary mb-2.5">
                      Promover Evento {isUserAdmin ? '(Destaque Admin Grátis)' : '(Destaque Pago)'}
                    </h4>

                    {isPromotionActive ? (
                      <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 text-xs text-amber-900 font-semibold flex items-center gap-2">
                        <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                        <span>
                          Destaque ativo no nível{' '}
                          <strong>
                            {currentExposureLevel === 'CITY'
                              ? 'Municipal (Cidade)'
                              : currentExposureLevel === 'STATE'
                              ? 'Regional (Estado)'
                              : 'Nacional (País)'}
                          </strong>{' '}
                          até {new Date(currentPromotionUntil!).toLocaleDateString('pt-BR')}.
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-xs text-text/70 mb-3">
                          {isUserAdmin
                            ? 'Como Administrador, você pode destacar este evento de graça no feed regional ou nacional:'
                            : 'Deixe seu evento mais exposto. Selecione um dos planos abaixo para destacar por 30 dias:'}
                        </p>
                        <div className="grid grid-cols-3 gap-2.5">
                          {[
                            { level: 'CITY', label: 'Cidade', price: isUserAdmin ? 'Grátis' : 'R$ 20' },
                            { level: 'STATE', label: 'Estado', price: isUserAdmin ? 'Grátis' : 'R$ 50' },
                            { level: 'COUNTRY', label: 'País', price: isUserAdmin ? 'Grátis' : 'R$ 100' },
                          ].map((plan) => (
                            <button
                              key={plan.level}
                              type="button"
                              disabled={isPromoting !== null}
                              onClick={() => handlePromoteEvent(plan.level as any)}
                              className="flex flex-col items-center justify-center border border-brand-primary/20 hover:border-brand-primary bg-white hover:bg-brand-primary/5 py-2.5 rounded-xl transition duration-200 group text-center shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <span className="text-[10px] font-bold text-text/60 group-hover:text-brand-primary uppercase tracking-wider">
                                {plan.label}
                              </span>
                              <span className="text-sm font-bold text-brand-primary mt-1">
                                {plan.price}
                              </span>
                            </button>
                          ))}
                        </div>
                        {isPromoting && (
                          <div className="text-[10px] font-bold text-brand-primary/80 animate-pulse flex items-center gap-1">
                            <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            {isUserAdmin ? 'Ativando destaque gratuito...' : `Redirecionando para o Stripe Checkout (plano ${isPromoting})...`}
                          </div>
                        )}
                        {promotionError && (
                          <p className="text-[11px] text-red-500 font-medium">{promotionError}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
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
                    onClick={() => onEditClick(selectedItem)}
                    className="flex-1 rounded-lg border border-brand-primary/35 py-2.5 text-xs font-semibold text-brand-primary transition hover:bg-brand-primary/5 md:text-sm"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteEvent(selectedItem.id)}
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
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Inscrição Confirmada!</span>
                </button>
              ) : isUserCreator ? (
                <div className="text-center text-xs font-semibold text-brand-primary py-2.5 bg-brand-primary/10 rounded-lg">
                  Você é o organizador deste evento
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (selectedItem.access === 'pago' && !isUserAdmin) {
                      onStartPayment(selectedItem);
                    } else {
                      handleJoinEvent(selectedItem.id);
                    }
                  }}
                  disabled={isJoining}
                  className="w-full rounded-lg bg-brand-primary px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-70 disabled:cursor-not-allowed"
                  data-testid="city-feed-details-cta"
                >
                  {isJoining ? 'Processando...' : (selectedItem.ctaLabel ?? (selectedItem.access === 'pago' ? (isUserAdmin ? 'Participar (Admin Grátis)' : 'Reservar ingresso') : 'Participar'))}
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {viewingProfile && (
        <UserProfileModal
          viewingProfile={viewingProfile}
          onClose={() => setViewingProfile(null)}
        />
      )}
    </div>
  );
}
