import { useState, useEffect, useRef, useMemo } from 'react';
import { type CityTheme, cityOptions, type CityConfig } from '../../theme/cityTheme';
import { backendFetch, backendRoutes, Role, type UserResponseDto } from '../../services/backendRoutes';

type ProfileScreenProps = {
  city?: CityTheme;
  cities?: CityConfig[];
  user: UserResponseDto | null;
  onBack: () => void;
  onProfileUpdated?: () => void;
};

export function ProfileScreen({ city, cities = [], user, onBack, onProfileUpdated }: ProfileScreenProps) {
  const selectedCity = city ? (cities.find((option) => option.id === city) || cityOptions.find((option) => option.id === city)) : null;
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [linkedin, setLinkedin] = useState(user?.linkedin || '');
  const [instagram, setInstagram] = useState(user?.instagram || '');
  const [youtube, setYoutube] = useState(user?.youtube || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [myEvents, setMyEvents] = useState<{ created: any[]; joined: any[] }>({ created: [], joined: [] });
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [activeTab, setActiveTab] = useState<'joined' | 'created'>('joined');
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  // Chat do Evento states
  const [activeModalTab, setActiveModalTab] = useState<'details' | 'chat'>('details');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatError, setChatError] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [viewingProfile, setViewingProfile] = useState<any | null>(null);

  useEffect(() => {
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
    if (user) {
      loadMyEvents();
    }
  }, [user]);

  // Load chat messages when modal opens and chat tab is selected
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

    fetchMsgs(); // Fetch immediately!

    const interval = setInterval(fetchMsgs, 4000); // Poll every 4 seconds

    return () => clearInterval(interval);
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
      setChatMessages((prev) => [...prev, newMsg]);
    } catch (err: any) {
      setChatError(err.message || 'Erro ao enviar a mensagem');
    }
  };

  const handleUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name || !email || !phone) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (phone.length < 10 || phone.length > 11) {
      setError('O telefone deve conter 10 ou 11 dígitos numéricos (com DDD).');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const payload: any = {
      name,
      email,
      phone,
      linkedin: linkedin || null,
      instagram: instagram || null,
      youtube: youtube || null,
    };

    if (password) {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(password)) {
        setError('A nova senha deve conter no mínimo 8 caracteres, com pelo menos uma letra maiúscula, uma letra minúscula, um número e um caractere especial (ex: @$!%*?&).');
        setLoading(false);
        return;
      }
      payload.password = password;
    }

    try {
      await backendFetch<UserResponseDto>(backendRoutes.updateMe, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      setSuccess('Perfil atualizado com sucesso!');
      setPassword(''); // Limpar senha após alteração bem-sucedida
      onProfileUpdated?.();
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar o perfil.');
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Administrador';
      case 'ORGANIZER':
        return 'Organizador';
      default:
        return 'Cidadão / Usuário';
    }
  };

  const renderFormContent = () => (
    <>
      {success && (
        <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex items-center gap-2" data-testid="profile-success-alert">
          <span className="font-bold">✓</span>
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3.5 bg-red-50 border border-red-200 text-red-800 text-sm rounded-xl flex items-center gap-2" data-testid="profile-error-alert">
          <span className="font-bold">⚠</span>
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-text/85">Nome Completo *</span>
          <input
            type="text"
            placeholder="Seu nome"
            className="w-full rounded-md border border-brand-primary/25 bg-white px-3 py-2.5 text-sm text-text placeholder:text-text/45 outline-none transition focus:border-brand-primary/55 focus:ring-2 focus:ring-brand-primary/20"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-text/85">CPF (Não alterável)</span>
          <input
            type="text"
            disabled
            className="w-full rounded-md border border-brand-primary/10 bg-surface px-3 py-2.5 text-sm text-text/60 outline-none cursor-not-allowed"
            value={user?.cpf || ''}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-text/85">E-mail *</span>
          <input
            type="email"
            placeholder="seuemail@exemplo.com"
            className="w-full rounded-md border border-brand-primary/25 bg-white px-3 py-2.5 text-sm text-text placeholder:text-text/45 outline-none transition focus:border-brand-primary/55 focus:ring-2 focus:ring-brand-primary/20"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-text/85">Telefone *</span>
          <input
            type="text"
            placeholder="Apenas números (DDD + número)"
            maxLength={11}
            className="w-full rounded-md border border-brand-primary/25 bg-white px-3 py-2.5 text-sm text-text placeholder:text-text/45 outline-none transition focus:border-brand-primary/55 focus:ring-2 focus:ring-brand-primary/20"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
            required
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-text/85">Tipo de Perfil</span>
          <input
            type="text"
            disabled
            className="w-full rounded-md border border-brand-primary/10 bg-surface px-3 py-2.5 text-sm text-text/60 outline-none cursor-not-allowed"
            value={getRoleLabel(user?.role)}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-text/85">Alterar Senha</span>
          <input
            type="password"
            placeholder="Digite uma nova senha forte para alterar"
            className="w-full rounded-md border border-brand-primary/25 bg-white px-3 py-2.5 text-sm text-text placeholder:text-text/45 outline-none transition focus:border-brand-primary/55 focus:ring-2 focus:ring-brand-primary/20"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <span className="mt-1 block text-[10px] leading-normal text-text/50">
            Mínimo 8 caracteres, uma letra maiúscula, uma letra minúscula, um número e um caractere especial (ex: @$!%*?&).
          </span>
        </label>
      </div>

      <div className="pt-4 border-t border-brand-primary/10">
        <h3 className="mb-3 text-sm font-semibold text-brand-primary uppercase tracking-wider">Redes Sociais (Divulgação)</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-text/85">LinkedIn</span>
            <input
              type="url"
              placeholder="https://linkedin.com/in/..."
              className="w-full rounded-md border border-brand-primary/25 bg-white px-3 py-2.5 text-sm text-text placeholder:text-text/45 outline-none transition focus:border-brand-primary/55 focus:ring-2 focus:ring-brand-primary/20"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-text/85">Instagram</span>
            <input
              type="url"
              placeholder="https://instagram.com/..."
              className="w-full rounded-md border border-brand-primary/25 bg-white px-3 py-2.5 text-sm text-text placeholder:text-text/45 outline-none transition focus:border-brand-primary/55 focus:ring-2 focus:ring-brand-primary/20"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-text/85">YouTube</span>
            <input
              type="url"
              placeholder="https://youtube.com/c/..."
              className="w-full rounded-md border border-brand-primary/25 bg-white px-3 py-2.5 text-sm text-text placeholder:text-text/45 outline-none transition focus:border-brand-primary/55 focus:ring-2 focus:ring-brand-primary/20"
              value={youtube}
              onChange={(e) => setYoutube(e.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-brand-primary/10">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-brand-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>
    </>
  );

  return (
    <section className="min-h-screen bg-gradient-to-br from-brand-primary/15 via-surface to-brand-secondary/15 px-4 py-5 text-text md:px-8 md:py-8" data-testid="profile-screen">
      <div className="mx-auto flex min-h-[calc(100vh-40px)] w-full max-w-4xl items-start md:min-h-[calc(100vh-64px)] md:items-center">
        <div className="w-full">
          <button
            type="button"
            onClick={onBack}
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

                <form className="space-y-4" onSubmit={handleUpdate}>
                  {renderFormContent()}
                </form>
              </div>
            </div>

            {/* Coluna dos Eventos (Direita) */}
            <div className="lg:col-span-5 overflow-hidden rounded-2xl border border-brand-primary/25 bg-white/95 shadow-cityCard backdrop-blur-sm p-6 md:p-8">
              <h2 className="font-display text-xl font-bold text-brand-primary mb-4 flex items-center gap-2">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                Minha Agenda
              </h2>

              <div className="flex border-b border-brand-primary/10 mb-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('joined')}
                  className={`flex-1 pb-2 text-xs font-semibold uppercase tracking-wider border-b-2 text-center transition ${
                    activeTab === 'joined'
                      ? 'border-brand-primary text-brand-primary'
                      : 'border-transparent text-text/60 hover:text-text'
                  }`}
                >
                  Presença Confirmada ({myEvents.joined.length})
                </button>
                {(user?.role === Role.ORGANIZER || user?.role === Role.ADMIN) && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('created')}
                    className={`flex-1 pb-2 text-xs font-semibold uppercase tracking-wider border-b-2 text-center transition ${
                      activeTab === 'created'
                        ? 'border-brand-primary text-brand-primary'
                        : 'border-transparent text-text/60 hover:text-text'
                    }`}
                  >
                    Criados por Mim ({myEvents.created.length})
                  </button>
                )}
              </div>

              {loadingEvents ? (
                <div className="py-10 text-center text-sm text-text/60">
                  Carregando eventos...
                </div>
              ) : (
                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                  {activeTab === 'joined' ? (
                    myEvents.joined.length === 0 ? (
                      <div className="py-8 text-center text-xs text-text/60 border border-dashed border-brand-primary/20 rounded-xl bg-brand-primary/5">
                        Você não se inscreveu em nenhum evento ainda.
                      </div>
                    ) : (
                      myEvents.joined.map((event: any) => (
                        <div key={event.id} onClick={() => setSelectedEvent(event)} className="p-3.5 rounded-xl border border-brand-primary/15 bg-white shadow-sm hover:border-brand-primary/45 transition cursor-pointer hover:shadow-md hover:-translate-y-0.5">
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-primary bg-brand-primary/5 px-2 py-0.5 rounded">
                              {event.category}
                            </span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${event.type === 'PRIVATE' ? 'bg-brand-primary text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                              {event.type === 'PRIVATE' ? (event.price ? `R$ ${event.price.toFixed(2)}` : 'Pago') : 'Gratuito'}
                            </span>
                          </div>
                          <h4 className="font-display font-bold text-sm text-brand-primary mt-1.5 line-clamp-1">
                            {event.title}
                          </h4>
                          <p className="text-[11px] text-text/70 mt-1 flex items-center gap-1">
                            <span>📅 {new Date(event.date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                          </p>
                          <p className="text-[11px] text-text/70 flex items-center gap-1 mt-0.5">
                            <span>📍 {event.location}</span>
                          </p>
                        </div>
                      ))
                    )
                  ) : (
                    myEvents.created.length === 0 ? (
                      <div className="py-8 text-center text-xs text-text/60 border border-dashed border-brand-primary/20 rounded-xl bg-brand-primary/5">
                        Você não criou nenhum evento ainda.
                      </div>
                    ) : (
                      myEvents.created.map((event: any) => (
                        <div key={event.id} onClick={() => setSelectedEvent(event)} className="p-3.5 rounded-xl border border-brand-primary/15 bg-white shadow-sm hover:border-brand-primary/45 transition cursor-pointer hover:shadow-md hover:-translate-y-0.5">
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-primary bg-brand-primary/5 px-2 py-0.5 rounded">
                              {event.category}
                            </span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${event.type === 'PRIVATE' ? 'bg-brand-primary text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                              {event.type === 'PRIVATE' ? (event.price ? `R$ ${event.price.toFixed(2)}` : 'Pago') : 'Gratuito'}
                            </span>
                          </div>
                          <h4 className="font-display font-bold text-sm text-brand-primary mt-1.5 line-clamp-1">
                            {event.title}
                          </h4>
                          <p className="text-[11px] text-text/70 mt-1 flex items-center gap-1">
                            <span>📅 {new Date(event.date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                          </p>
                          <p className="text-[11px] text-text/70 flex items-center gap-1 mt-0.5">
                            <span>📍 {event.location}</span>
                          </p>
                        </div>
                      ))
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedEvent ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4 animate-fadeIn"
          role="presentation"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/55 backdrop-blur-sm w-full h-full border-none outline-none cursor-default"
            aria-label="Fechar detalhes do evento"
            onClick={() => setSelectedEvent(null)}
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
                onClick={() => setSelectedEvent(null)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-brand-primary transition hover:bg-brand-primary/10"
                aria-label="Fechar"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
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
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
                      <svg className="h-10 w-10 mb-2 opacity-60 text-brand-primary mx-auto" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
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
                </div>

                <div className="shrink-0 border-t border-brand-primary/10 p-4">
                  <button
                    type="button"
                    onClick={() => setSelectedEvent(null)}
                    className="w-full rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
                  >
                    Fechar
                  </button>
                </div>
              </>
            )}
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
    </section>
  );
}
