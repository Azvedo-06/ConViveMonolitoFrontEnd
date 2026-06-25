import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { backendFetch, backendRoutes, Role, API_BASE_URL, type UserResponseDto } from '../../../services/backendRoutes';
import { UserProfileModal } from '../../city/components/UserProfileModal';

type EventAgendaDetailsModalProps = {
  selectedEvent: any;
  user: UserResponseDto | null;
  onClose: () => void;
};

export function EventAgendaDetailsModal({
  selectedEvent,
  user,
  onClose,
}: EventAgendaDetailsModalProps) {
  const [activeModalTab, setActiveModalTab] = useState<'details' | 'chat'>('details');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatError, setChatError] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [viewingProfile, setViewingProfile] = useState<any | null>(null);
  const [isPromoting, setIsPromoting] = useState<string | null>(null);
  const [promotionError, setPromotionError] = useState('');
  const [localPromotion, setLocalPromotion] = useState<{
    exposureLevel?: 'NONE' | 'CITY' | 'STATE' | 'COUNTRY';
    promotionUntil?: string | null;
  }>({});

  const isUserCreator = user && String(selectedEvent.createdBy) === String(user.id);
  const isUserAdmin = user && user.role === Role.ADMIN;

  // WebSocket setup for chat
  useEffect(() => {
    if (!selectedEvent || !user || activeModalTab !== 'chat') {
      return;
    }

    const eventId = selectedEvent.id;

    async function fetchMsgs() {
      try {
        const msgs = await backendFetch<any[]>(backendRoutes.eventMessages(eventId));
        setChatMessages(msgs);
      } catch (err) {
        console.error('Erro ao carregar mensagens do chat', err);
      }
    }
    fetchMsgs();

    const socket = io(API_BASE_URL);

    socket.on('connect', () => {
      console.log('Conectado ao WebSocket do evento (Perfil)', eventId);
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
      console.log('Desconectado do WebSocket do evento (Perfil)', eventId);
    });

    return () => {
      socket.emit('leaveEvent', { eventId });
      socket.disconnect();
    };
  }, [selectedEvent, user, activeModalTab]);

  // Scroll to bottom
  useEffect(() => {
    if (activeModalTab === 'chat' && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeModalTab]);

  // Reset chat state when selectedEvent is closed or changes
  useEffect(() => {
    setChatMessages([]);
    setChatInput('');
    setChatError('');
    setActiveModalTab('details');
  }, [selectedEvent]);

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedEvent) return;

    const text = chatInput.trim();
    setChatInput('');
    setChatError('');

    try {
      const newMsg = await backendFetch<any>(backendRoutes.eventMessages(selectedEvent.id), {
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
  };

  async function handlePromoteEvent(level: 'CITY' | 'STATE' | 'COUNTRY') {
    setIsPromoting(level);
    setPromotionError('');
    try {
      if (isUserAdmin) {
        const response = await backendFetch<any>(backendRoutes.promoteEvent(selectedEvent.id), {
          method: 'POST',
          body: JSON.stringify({ exposureLevel: level }),
        });
        setLocalPromotion({
          exposureLevel: response.data.exposureLevel,
          promotionUntil: response.data.promotionUntil,
        });
        alert('Evento promovido com sucesso (Destaque Admin Gratuito)!');
        setIsPromoting(null);
      } else {
        const response = await backendFetch<{ url: string }>(backendRoutes.checkoutPromotion, {
          method: 'POST',
          body: JSON.stringify({
            eventId: Number(selectedEvent.id),
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
    <>
      <div
        className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4 animate-fadeIn"
        role="presentation"
      >
        <button
          type="button"
          className="absolute inset-0 bg-black/55 backdrop-blur-sm w-full h-full border-none outline-none cursor-default"
          aria-label="Fechar detalhes do evento"
          onClick={onClose}
        />

        <div
          role="dialog"
          aria-modal="true"
          className="relative z-10 flex max-h-[min(90vh,720px)] w-full max-w-lg flex-col rounded-t-2xl border border-brand-primary/15 bg-white shadow-cityCard sm:max-h-[85vh] sm:rounded-2xl overflow-hidden animate-slideUp"
        >
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-brand-primary/10 px-5 py-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-brand-secondary/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-primary">
                  {selectedEvent.category}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${selectedEvent.type === 'PRIVATE' ? 'bg-brand-primary text-white' : 'bg-emerald-100 text-emerald-800'}`}
                >
                  {selectedEvent.type === 'PRIVATE' ? (selectedEvent.price ? `R$ ${selectedEvent.price.toFixed(2)}` : 'Pago') : 'Gratuito'}
                </span>
              </div>
              <h2 className="mt-2 font-display text-xl font-bold leading-tight text-brand-primary md:text-2xl">
                {selectedEvent.title}
              </h2>
              <p className="mt-1 text-sm text-text/70">
                {new Date(selectedEvent.date).toLocaleString('pt-BR')}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-brand-primary transition hover:bg-brand-primary/10"
              aria-label="Fechar"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          {/* Tab Bar */}
          <div className="flex border-b border-brand-primary/10 bg-surface/50 shrink-0">
            <button
              type="button"
              onClick={() => setActiveModalTab('details')}
              className={`flex-1 py-3 text-center text-xs md:text-sm font-semibold border-b-2 transition ${
                activeModalTab === 'details'
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-text/60 hover:text-text hover:bg-brand-primary/5'
              }`}
            >
              Detalhes
            </button>
            <button
              type="button"
              onClick={() => setActiveModalTab('chat')}
              className={`flex-1 py-3 text-center text-xs md:text-sm font-semibold border-b-2 transition flex items-center justify-center gap-2 ${
                activeModalTab === 'chat'
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

          {activeModalTab === 'chat' ? (
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
                    const isMsgCreator = msg.userId === selectedEvent.createdBy;
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
                <p className="text-sm leading-relaxed text-text whitespace-pre-wrap">{selectedEvent.description}</p>

                <dl className="mt-5 space-y-3 text-sm">
                  <div className="flex justify-between gap-4 border-b border-brand-primary/10 pb-3">
                    <dt className="text-text/70">Entrada</dt>
                    <dd className="text-right font-medium text-text">
                      {selectedEvent.type === 'PRIVATE' ? (selectedEvent.price ? `R$ ${selectedEvent.price.toFixed(2)}` : 'Pago') : 'Gratuita'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-brand-primary/10 pb-3">
                    <dt className="text-text/70">Data e Hora</dt>
                    <dd className="text-right font-medium text-text">
                      {new Date(selectedEvent.date).toLocaleString('pt-BR')}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-brand-primary/10 pb-3">
                    <dt className="text-text/70">Local</dt>
                    <dd className="text-right font-medium text-text">{selectedEvent.location}</dd>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-brand-primary/10 pb-3">
                    <dt className="text-text/70">Responsável</dt>
                    <dd className="text-right font-medium text-text">
                      {selectedEvent.creator?.name || 'Organizador'}
                    </dd>
                  </div>
                  {selectedEvent.creator && (
                    <div className="flex justify-between gap-4 border-b border-brand-primary/10 pb-3">
                      <dt className="text-text/70">Contato</dt>
                      <dd className="text-right font-medium text-text">
                        {selectedEvent.creator.email}{selectedEvent.creator.phone ? ` / ${selectedEvent.creator.phone}` : ''}
                      </dd>
                    </div>
                  )}
                  {selectedEvent.creator && (selectedEvent.creator.linkedin || selectedEvent.creator.instagram || selectedEvent.creator.youtube) && (
                    <div className="flex justify-between items-center gap-4 border-b border-brand-primary/10 pb-3 flex-wrap">
                      <dt className="text-text/70">Redes Sociais</dt>
                      <dd className="flex gap-2">
                        {selectedEvent.creator.linkedin && (
                          <a
                            href={selectedEvent.creator.linkedin.startsWith('http') ? selectedEvent.creator.linkedin : `https://${selectedEvent.creator.linkedin}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs font-semibold text-brand-primary bg-brand-primary/10 hover:bg-brand-primary/20 px-2.5 py-1 rounded-md transition"
                          >
                            LinkedIn
                          </a>
                        )}
                        {selectedEvent.creator.instagram && (
                          <a
                            href={selectedEvent.creator.instagram.startsWith('http') ? selectedEvent.creator.instagram : `https://${selectedEvent.creator.instagram}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs font-semibold text-brand-primary bg-brand-primary/10 hover:bg-brand-primary/20 px-2.5 py-1 rounded-md transition"
                          >
                            Instagram
                          </a>
                        )}
                        {selectedEvent.creator.youtube && (
                          <a
                            href={selectedEvent.creator.youtube.startsWith('http') ? selectedEvent.creator.youtube : `https://${selectedEvent.creator.youtube}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs font-semibold text-brand-primary bg-brand-primary/10 hover:bg-brand-primary/20 px-2.5 py-1 rounded-md transition"
                          >
                            YouTube
                          </a>
                        )}
                      </dd>
                    </div>
                  )}
                  {selectedEvent.maxParticipants ? (
                <div className="flex justify-between gap-4 pb-1">
                  <dt className="text-text/70">Capacidade Máxima</dt>
                  <dd className="text-right font-medium text-text">{selectedEvent.maxParticipants} pessoas</dd>
                </div>
              ) : null}
            </dl>

            {(isUserCreator || isUserAdmin) && (() => {
              const currentExposureLevel = localPromotion.exposureLevel || selectedEvent.exposureLevel;
              const currentPromotionUntil = localPromotion.promotionUntil || selectedEvent.promotionUntil;
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
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
                >
                  Fechar
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {viewingProfile && (
        <UserProfileModal
          viewingProfile={viewingProfile}
          onClose={() => setViewingProfile(null)}
        />
      )}
    </>
  );
}
