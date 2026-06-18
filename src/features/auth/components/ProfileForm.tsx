import { useState } from 'react';
import { type UserResponseDto } from '../../../services/backendRoutes';
import {
  formatCpf,
  formatCnpj,
  formatPhone,
  formatCep,
} from '../../../utils/validation';

type ProfileFormProps = {
  user: UserResponseDto | null;
  loading: boolean;
  error: string;
  success: string;
  setError: (err: string) => void;
  onSubmit: (formData: any) => void;
};

export function ProfileForm({
  user,
  loading,
  error,
  success,
  setError,
  onSubmit,
}: ProfileFormProps) {
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone ? formatPhone(user.phone) : '');
  const [cnpj] = useState(user?.cnpj ? formatCnpj(user.cnpj) : '');
  const [cep, setCep] = useState(user?.cep ? formatCep(user.cep) : '');
  const [linkedin, setLinkedin] = useState(user?.linkedin || '');
  const [instagram, setInstagram] = useState(user?.instagram || '');
  const [youtube, setYoutube] = useState(user?.youtube || '');
  const [password, setPassword] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '');
    const cleanCep = cep.replace(/\D/g, '');

    if (!name || !email || !cleanPhone) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      setError('O telefone deve conter 10 ou 11 dígitos numéricos (com DDD).');
      return;
    }

    if (cleanCep && cleanCep.length !== 8) {
      setError('O CEP deve conter 8 dígitos numéricos.');
      return;
    }

    const payload: any = {
      name,
      email,
      phone: cleanPhone,
      cep: cleanCep || null,
      linkedin: linkedin || null,
      instagram: instagram || null,
      youtube: youtube || null,
    };

    if (password) {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(password)) {
        setError('A nova senha deve conter no mínimo 8 caracteres, com pelo menos uma letra maiúscula, uma letra minúscula, um número e um caractere especial (ex: @$!%*?&).');
        return;
      }
      payload.password = password;
    }

    onSubmit(payload);
    setPassword(''); // clear password field after submit trigger
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

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
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
            value={user?.cpf ? formatCpf(user.cpf) : ''}
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
            placeholder="(11) 91234-5678"
            maxLength={15}
            className="w-full rounded-md border border-brand-primary/25 bg-white px-3 py-2.5 text-sm text-text placeholder:text-text/45 outline-none transition focus:border-brand-primary/55 focus:ring-2 focus:ring-brand-primary/20"
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            required
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {user?.role === 'ORGANIZER' ? (
          <>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-text/85">CNPJ (Não alterável)</span>
              <input
                type="text"
                disabled
                className="w-full rounded-md border border-brand-primary/10 bg-surface px-3 py-2.5 text-sm text-text/60 outline-none cursor-not-allowed"
                value={cnpj}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-text/85">CEP</span>
              <input
                type="text"
                placeholder="12345-678"
                maxLength={9}
                className="w-full rounded-md border border-brand-primary/25 bg-white px-3 py-2.5 text-sm text-text placeholder:text-text/45 outline-none transition focus:border-brand-primary/55 focus:ring-2 focus:ring-brand-primary/20"
                value={cep}
                onChange={(e) => setCep(formatCep(e.target.value))}
              />
            </label>
          </>
        ) : (
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-sm font-medium text-text/85">CEP</span>
            <input
              type="text"
              placeholder="12345-678"
              maxLength={9}
              className="w-full rounded-md border border-brand-primary/25 bg-white px-3 py-2.5 text-sm text-text placeholder:text-text/45 outline-none transition focus:border-brand-primary/55 focus:ring-2 focus:ring-brand-primary/20"
              value={cep}
              onChange={(e) => setCep(formatCep(e.target.value))}
            />
          </label>
        )}
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
    </form>
  );
}
