import { useState } from 'react';
import { type CityTheme, cityOptions } from '../../theme/cityTheme';
import { backendFetch, backendRoutes, type UserResponseDto } from '../../services/backendRoutes';

type ProfileScreenProps = {
  city?: CityTheme;
  user: UserResponseDto | null;
  onBack: () => void;
  onProfileUpdated?: () => void;
};

export function ProfileScreen({ city, user, onBack, onProfileUpdated }: ProfileScreenProps) {
  const selectedCity = city ? cityOptions.find((option) => option.id === city) : null;
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name || !email || !phone) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const payload: any = {
      name,
      email,
      phone,
    };

    if (password) {
      if (password.length < 6) {
        setError('A nova senha deve ter pelo menos 6 caracteres.');
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
            placeholder="(11) 99999-9999"
            className="w-full rounded-md border border-brand-primary/25 bg-white px-3 py-2.5 text-sm text-text placeholder:text-text/45 outline-none transition focus:border-brand-primary/55 focus:ring-2 focus:ring-brand-primary/20"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
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
          <span className="mb-1 block text-sm font-medium text-text/85">Alterar Senha (Mín. 6 caracteres)</span>
          <input
            type="password"
            placeholder="Digite uma nova senha para alterar"
            className="w-full rounded-md border border-brand-primary/25 bg-white px-3 py-2.5 text-sm text-text placeholder:text-text/45 outline-none transition focus:border-brand-primary/55 focus:ring-2 focus:ring-brand-primary/20"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
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

          <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-brand-primary/25 bg-white/95 shadow-cityCard backdrop-blur-sm">
            <div className="bg-gradient-to-b from-white to-brand-primary/5 p-6 md:p-10">
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
        </div>
      </div>
    </section>
  );
}
