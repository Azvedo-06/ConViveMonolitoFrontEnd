import { useState } from 'react';
import { type CityConfig } from '../../../theme/cityTheme';
import { type SignupType } from '../SignupScreen';
import {
  formatCpf,
  formatCnpj,
  formatPhone,
  formatCep,
  isValidCpf,
  isValidCnpj,
} from '../../../utils/validation';
import { getImageUrl } from '../../../services/backendRoutes';

type SignupFormProps = {
  selectedCity: CityConfig;
  signupType: 'user' | 'organizer';
  onBack: () => void;
  loading: boolean;
  error: string;
  setError: (err: string) => void;
  onSubmit: (formData: any) => void;
};

export function SignupForm({
  selectedCity,
  signupType,
  onBack,
  loading,
  error,
  setError,
  onSubmit,
}: SignupFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [cep, setCep] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const cleanCpf = cpf.replace(/\D/g, '');
    const cleanPhone = phone.replace(/\D/g, '');
    const cleanCnpj = cnpj.replace(/\D/g, '');
    const cleanCep = cep.replace(/\D/g, '');

    if (!name || !email || !cleanCpf || !cleanPhone || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    if (!isValidCpf(cleanCpf)) {
      setError('Por favor, insira um CPF válido com 11 dígitos.');
      return;
    }

    const isOrganizer = signupType === 'organizer';
    if (isOrganizer && cleanCnpj && !isValidCnpj(cleanCnpj)) {
      setError('Por favor, insira um CNPJ válido com 14 dígitos.');
      return;
    }

    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      setError('O telefone deve conter 10 ou 11 dígitos numéricos.');
      return;
    }

    if (cleanCep && cleanCep.length !== 8) {
      setError('O CEP deve conter 8 dígitos numéricos.');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      setError('A senha deve conter no mínimo 8 caracteres, com pelo menos uma letra maiúscula, uma letra minúscula, um número e um caractere especial (ex: @$!%*?&).');
      return;
    }

    onSubmit({
      name,
      email,
      cpf: cleanCpf,
      cnpj: isOrganizer ? cleanCnpj : undefined,
      cep: cleanCep || undefined,
      phone: cleanPhone,
      password,
    });
  };

  const renderFormFields = () => (
    <>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-text/85">
          {signupType === 'organizer' ? 'Nome da organização / Responsável' : 'Nome completo'}
        </span>
        <input
          type="text"
          placeholder={signupType === 'organizer' ? 'Seu coletivo, ONG ou empresa' : 'Seu nome'}
          className="w-full rounded-md border border-brand-primary/25 bg-white px-3 py-2.5 text-sm text-text placeholder:text-text/45 outline-none transition focus:border-brand-primary/55 focus:ring-2 focus:ring-brand-primary/20"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-text/85">CPF</span>
          <input
            type="text"
            placeholder="123.456.789-10"
            maxLength={14}
            className="w-full rounded-md border border-brand-primary/25 bg-white px-3 py-2.5 text-sm text-text placeholder:text-text/45 outline-none transition focus:border-brand-primary/55 focus:ring-2 focus:ring-brand-primary/20"
            value={cpf}
            onChange={(e) => setCpf(formatCpf(e.target.value))}
            required
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-text/85">Telefone</span>
          <input
            type="tel"
            placeholder="(11) 91234-5678"
            maxLength={15}
            className="w-full rounded-md border border-brand-primary/25 bg-white px-3 py-2.5 text-sm text-text placeholder:text-text/45 outline-none transition focus:border-brand-primary/55 focus:ring-2 focus:ring-brand-primary/20"
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            required
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {signupType === 'organizer' ? (
          <>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-text/85">CNPJ (opcional)</span>
              <input
                type="text"
                placeholder="12.345.678/0001-90"
                maxLength={18}
                className="w-full rounded-md border border-brand-primary/25 bg-white px-3 py-2.5 text-sm text-text placeholder:text-text/45 outline-none transition focus:border-brand-primary/55 focus:ring-2 focus:ring-brand-primary/20"
                value={cnpj}
                onChange={(e) => setCnpj(formatCnpj(e.target.value))}
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
          <label className="block col-span-2">
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

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-text/85">E-mail</span>
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
        <span className="mb-1 block text-sm font-medium text-text/85">Senha</span>
        <input
          type="password"
          placeholder="Crie uma senha forte"
          className="w-full rounded-md border border-brand-primary/25 bg-white px-3 py-2.5 text-sm text-text placeholder:text-text/45 outline-none transition focus:border-brand-primary/55 focus:ring-2 focus:ring-brand-primary/20"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <span className="mt-1 block text-[11px] leading-normal text-text/60">
          A senha deve conter no mínimo 8 caracteres, com pelo menos uma letra maiúscula, uma letra minúscula, um número e um caractere especial (ex: @$!%*?&).
        </span>
      </label>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <label className="inline-flex items-center gap-2 text-sm text-text/80">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-brand-primary/30 bg-transparent"
          required
        />
        Concordo com os termos e condições
      </label>
    </>
  );

  const isOrganizer = signupType === 'organizer';

  return (
    <section
      className="min-h-screen bg-gradient-to-br from-brand-primary/15 via-surface to-brand-secondary/15 px-4 py-5 text-text md:px-8 md:py-8"
      data-testid={isOrganizer ? "signup-organizer-screen" : "signup-user-screen"}
    >
      <div className="mx-auto flex min-h-[calc(100vh-40px)] w-full max-w-5xl items-start md:min-h-[calc(100vh-64px)] md:items-center">
        <div className="w-full">
          <button
            type="button"
            onClick={onBack}
            className="mb-4 rounded border border-brand-primary/35 bg-white/90 px-4 py-2 text-sm font-medium text-brand-primary transition hover:bg-white"
            data-testid={isOrganizer ? "signup-organizer-back-button" : "signup-user-back-button"}
          >
            Voltar
          </button>

          <div className="overflow-hidden rounded-2xl border border-brand-primary/25 bg-white/95 shadow-cityCard backdrop-blur-sm">
            <div className="grid md:grid-cols-[1.05fr_1fr]">
              <div className="relative min-h-[240px] md:min-h-[560px]">
                <img
                  src={getImageUrl(selectedCity.imageUrl)}
                  alt={`Paisagem da cidade de ${selectedCity.label}`}
                  className="h-full w-full object-cover"
                  onError={(event) => {
                    event.currentTarget.src = getImageUrl(selectedCity.imageFallbackUrl);
                  }}
                  data-testid={isOrganizer ? "signup-organizer-city-image" : "signup-user-city-image"}
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-black/55 via-black/30 to-transparent" />
                <div className="absolute left-5 top-5 rounded-full border border-white/40 bg-black/25 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-white md:left-6 md:top-6">
                  {selectedCity.label}
                </div>
              </div>

              <div className="bg-gradient-to-b from-white to-brand-primary/5 p-6 md:p-10">
                <h1 className="font-display text-2xl leading-tight text-brand-primary md:text-4xl">
                  {isOrganizer ? 'Crie sua conta de organizador' : 'Crie sua conta de público'}
                </h1>
                <p className="mt-3 font-body text-sm text-text/75 md:text-base">
                  {isOrganizer
                    ? 'Divulgue eventos gratuitos ou venda ingressos com métricas em tempo real.'
                    : 'Descubra e reserve eventos perto de você.'}
                </p>

                {isOrganizer && (
                  <div className="mt-6 space-y-3 text-sm text-text/80">
                    <div className="flex gap-3">
                      <span className="flex-shrink-0 font-semibold text-brand-primary">✓</span>
                      <span>Divulgação gratuita para eventos públicos</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex-shrink-0 font-semibold text-brand-primary">✓</span>
                      <span>Venda de ingressos com taxa de 10%</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex-shrink-0 font-semibold text-brand-primary">✓</span>
                      <span>Painel de métricas e reservas</span>
                    </div>
                  </div>
                )}

                <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
                  {renderFormFields()}

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 w-full rounded-md bg-brand-primary px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-70 disabled:cursor-not-allowed"
                    data-testid={isOrganizer ? "signup-organizer-submit-button" : "signup-user-submit-button"}
                  >
                    {loading
                      ? 'Criando conta...'
                      : isOrganizer
                      ? 'Criar conta de organizador'
                      : 'Criar conta de público'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
