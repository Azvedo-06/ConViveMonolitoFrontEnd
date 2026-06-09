import { useState, useEffect } from 'react';
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
          </div>
        </div>
      ) : null}
    </section>
  );
}
