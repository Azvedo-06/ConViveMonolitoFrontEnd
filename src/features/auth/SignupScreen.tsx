import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cityOptions, type CityTheme, type CityConfig } from '../../theme/cityTheme';
import { backendFetch, backendRoutes } from '../../services/backendRoutes';
import { useApp } from '../../context/AppContext';

export type SignupType = 'user' | 'organizer' | null;

function isValidCpf(cpfStr: string): boolean {
  const cleanCpf = cpfStr.replace(/\D/g, '');
  if (cleanCpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleanCpf)) return false; // Bloqueia CPFs com dígitos todos repetidos
  let sum = 0;
  let remainder;
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleanCpf.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCpf.substring(9, 10))) return false;
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleanCpf.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCpf.substring(10, 11))) return false;
  return true;
}

function isValidCnpj(cnpjStr: string): boolean {
  const cleanCnpj = cnpjStr.replace(/\D/g, '');
  if (cleanCnpj.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cleanCnpj)) return false;

  let size = cleanCnpj.length - 2;
  let numbers = cleanCnpj.substring(0, size);
  const digits = cleanCnpj.substring(size);
  let sum = 0;
  let pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;

  size = size + 1;
  numbers = cleanCnpj.substring(0, size);
  sum = 0;
  pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;

  return true;
}

function formatCpf(val: string): string {
  const digits = val.replace(/\D/g, '').slice(0, 11);
  let masked = '';
  if (digits.length > 0) masked += digits.slice(0, 3);
  if (digits.length > 3) masked += '.' + digits.slice(3, 6);
  if (digits.length > 6) masked += '.' + digits.slice(6, 9);
  if (digits.length > 9) masked += '-' + digits.slice(9, 11);
  return masked;
}

function formatCnpj(val: string): string {
  const digits = val.replace(/\D/g, '').slice(0, 14);
  let masked = '';
  if (digits.length > 0) masked += digits.slice(0, 2);
  if (digits.length > 2) masked += '.' + digits.slice(2, 5);
  if (digits.length > 5) masked += '.' + digits.slice(5, 8);
  if (digits.length > 8) masked += '/' + digits.slice(8, 12);
  if (digits.length > 12) masked += '-' + digits.slice(12, 14);
  return masked;
}

function formatPhone(val: string): string {
  const digits = val.replace(/\D/g, '').slice(0, 11);
  let masked = '';
  if (digits.length > 0) {
    masked += '(' + digits.slice(0, 2);
  }
  if (digits.length > 2) {
    masked += ') ' + digits.slice(2, 7);
  }
  if (digits.length > 7) {
    masked += '-' + digits.slice(7, 11);
  }
  return masked;
}

function formatCep(val: string): string {
  const digits = val.replace(/\D/g, '').slice(0, 8);
  let masked = '';
  if (digits.length > 0) masked += digits.slice(0, 5);
  if (digits.length > 5) masked += '-' + digits.slice(5, 8);
  return masked;
}

export function SignupScreen() {
  const navigate = useNavigate();
  const { cities } = useApp();

  const savedCityId = localStorage.getItem('last_city');

  const [signupType, setSignupType] = useState<SignupType>(null);
  const [selectedCityId, setSelectedCityId] = useState<CityTheme | null>(
    savedCityId ?? null
  );

  const currentCities = cities.length > 0 ? cities : cityOptions;
  const selectedCity = currentCities.find((option) => option.id === selectedCityId);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [cep, setCep] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async (event: React.FormEvent, isOrganizer: boolean) => {
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

    setLoading(true);
    setError('');

    try {
      await backendFetch(backendRoutes.createUser, {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          cpf: cleanCpf,
          cnpj: isOrganizer ? cleanCnpj : undefined,
          cep: cleanCep || undefined,
          phone: cleanPhone,
          password,
          role: isOrganizer ? 'ORGANIZER' : 'USER',
        }),
      });

      // Save city configuration in case it is configured
      if (selectedCityId) {
        localStorage.setItem('last_city', selectedCityId);
      }

      navigate('/login', { state: { signupSuccess: true } });
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar cadastro.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(selectedCityId ? `/${selectedCityId}` : '/');
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

  if (!selectedCityId) {
    return (
      <section className="min-h-screen bg-gradient-to-br from-brand-primary/15 via-surface to-brand-secondary/15 px-4 py-5 text-text md:px-8 md:py-8" data-testid="signup-city-screen">
        <div className="mx-auto flex min-h-[calc(100vh-40px)] w-full max-w-5xl items-start md:min-h-[calc(100vh-64px)] md:items-center">
          <div className="w-full">
            <button
              type="button"
              onClick={handleBack}
              className="mb-4 rounded border border-brand-primary/35 bg-white/90 px-4 py-2 text-sm font-medium text-brand-primary transition hover:bg-white"
              data-testid="signup-back-button"
            >
              Voltar
            </button>

            <div className="overflow-hidden rounded-3xl border border-brand-primary/20 bg-white/95 shadow-cityCard backdrop-blur-sm">
              <div className="bg-gradient-to-br from-brand-primary via-brand-primary to-brand-secondary px-6 py-8 text-white md:px-10 md:py-10">
                <p className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/85">
                  Cadastro
                </p>
                <h1 className="mt-4 font-display text-3xl leading-tight md:text-5xl">
                  Primeiro escolha sua cidade
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/85 md:text-base">
                  Seu cadastro fica vinculado à cidade que você quer acompanhar ou administrar.
                </p>
              </div>

              <div className="p-6 md:p-10">
                <div className="grid gap-4 md:grid-cols-2">
                  {currentCities.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setSelectedCityId(option.id)}
                      className="group overflow-hidden rounded-2xl border border-brand-primary/15 bg-white text-left shadow-cityCard transition hover:-translate-y-0.5 hover:border-brand-primary/40"
                      data-testid={`signup-city-option-${option.id}`}
                    >
                      <div className="relative h-36 overflow-hidden">
                        <img
                          src={option.imageUrl}
                          alt={`Vista da cidade de ${option.label}`}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
                        <div className="absolute bottom-0 left-0 p-4 text-white">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/80">Cidade</p>
                          <h2 className="mt-1 font-display text-2xl">{option.label}</h2>
                        </div>
                      </div>
                      <div className="p-4">
                        <p className="text-sm leading-relaxed text-text/80">
                          Cadastre-se para acompanhar eventos, cursos e atividades dessa cidade.
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!selectedCity) {
    return null;
  }

  if (signupType === null) {
    return (
      <section className="min-h-screen bg-gradient-to-br from-brand-primary/15 via-surface to-brand-secondary/15 px-4 py-5 text-text md:px-8 md:py-8" data-testid="signup-screen">
        <div className="mx-auto flex min-h-[calc(100vh-40px)] w-full max-w-5xl items-start md:min-h-[calc(100vh-64px)] md:items-center">
          <div className="w-full">
            <button
              type="button"
              onClick={() => setSelectedCityId(null)}
              className="mb-4 rounded border border-brand-primary/35 bg-white/90 px-4 py-2 text-sm font-medium text-brand-primary transition hover:bg-white"
              data-testid="signup-back-button"
            >
              Voltar
            </button>

            <div className="overflow-hidden rounded-2xl border border-brand-primary/25 bg-white/95 shadow-cityCard backdrop-blur-sm">
              <div className="grid md:grid-cols-[1.05fr_1fr]">
                <div className="relative min-h-[240px] md:min-h-[560px]">
                  <img
                    src={selectedCity.imageUrl}
                    alt={`Paisagem da cidade de ${selectedCity.label}`}
                    className="h-full w-full object-cover"
                    onError={(event) => {
                      event.currentTarget.src = selectedCity.imageFallbackUrl;
                    }}
                    data-testid="signup-city-image"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/55 via-black/30 to-transparent" />
                  <div className="absolute left-5 top-5 rounded-full border border-white/40 bg-black/25 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-white md:left-6 md:top-6">
                    {selectedCity.label}
                  </div>
                </div>

                <div className="bg-gradient-to-b from-white to-brand-primary/5 p-6 md:p-10">
                  <h1 className="font-display text-2xl leading-tight text-brand-primary md:text-4xl">
                    Escolha seu tipo de conta
                  </h1>
                  <p className="mt-3 font-body text-sm text-text/75 md:text-base">
                    Crie sua conta como público ou organizador de eventos.
                  </p>

                  <div className="mt-8 space-y-4">
                    <button
                      type="button"
                      onClick={() => setSignupType('user')}
                      className="w-full rounded-xl border-2 border-brand-primary/20 bg-white p-5 text-left transition hover:border-brand-primary/60 hover:bg-brand-primary/5"
                      data-testid="signup-user-option"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-brand-primary">Sou público</h3>
                          <p className="mt-2 text-sm text-text/80">Descubra, reserve e participe de eventos, cursos e atividades da sua cidade.</p>
                        </div>
                        <div className="mt-1 h-5 w-5 rounded-full border-2 border-brand-primary/30" />
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSignupType('organizer')}
                      className="w-full rounded-xl border-2 border-brand-primary/20 bg-white p-5 text-left transition hover:border-brand-primary/60 hover:bg-brand-primary/5"
                      data-testid="signup-organizer-option"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-brand-primary">Sou organizador</h3>
                          <p className="mt-2 text-sm text-text/80">Cadastre eventos gratuitos ou pagos, gerencie reservas e acompanhe métricas.</p>
                        </div>
                        <div className="mt-1 h-5 w-5 rounded-full border-2 border-brand-primary/30" />
                      </div>
                    </button>
                  </div>

                  <p className="mt-8 text-center text-xs text-text/60">
                    Você pode mudar de tipo de conta depois
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (signupType === 'user') {
    return (
      <section className="min-h-screen bg-gradient-to-br from-brand-primary/15 via-surface to-brand-secondary/15 px-4 py-5 text-text md:px-8 md:py-8" data-testid="signup-user-screen">
        <div className="mx-auto flex min-h-[calc(100vh-40px)] w-full max-w-5xl items-start md:min-h-[calc(100vh-64px)] md:items-center">
          <div className="w-full">
            <button
              type="button"
              onClick={() => setSignupType(null)}
              className="mb-4 rounded border border-brand-primary/35 bg-white/90 px-4 py-2 text-sm font-medium text-brand-primary transition hover:bg-white"
              data-testid="signup-user-back-button"
            >
              Voltar
            </button>

            <div className="overflow-hidden rounded-2xl border border-brand-primary/25 bg-white/95 shadow-cityCard backdrop-blur-sm">
              <div className="grid md:grid-cols-[1.05fr_1fr]">
                <div className="relative min-h-[240px] md:min-h-[560px]">
                  <img
                    src={selectedCity.imageUrl}
                    alt={`Paisagem da cidade de ${selectedCity.label}`}
                    className="h-full w-full object-cover"
                    onError={(event) => {
                      event.currentTarget.src = selectedCity.imageFallbackUrl;
                    }}
                    data-testid="signup-user-city-image"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/55 via-black/30 to-transparent" />
                  <div className="absolute left-5 top-5 rounded-full border border-white/40 bg-black/25 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-white md:left-6 md:top-6">
                    {selectedCity.label}
                  </div>
                </div>

                <div className="bg-gradient-to-b from-white to-brand-primary/5 p-6 md:p-10">
                  <h1 className="font-display text-2xl leading-tight text-brand-primary md:text-4xl">
                    Crie sua conta de público
                  </h1>
                  <p className="mt-3 font-body text-sm text-text/75 md:text-base">
                    Descubra e reserve eventos perto de você.
                  </p>

                  <form className="mt-8 space-y-4" onSubmit={(e) => handleSignup(e, false)}>
                    {renderFormFields()}

                    <button
                      type="submit"
                      disabled={loading}
                      className="mt-2 w-full rounded-md bg-brand-primary px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-70 disabled:cursor-not-allowed"
                      data-testid="signup-user-submit-button"
                    >
                      {loading ? 'Criando conta...' : 'Criar conta de público'}
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

  if (signupType === 'organizer') {
    return (
      <section className="min-h-screen bg-gradient-to-br from-brand-primary/15 via-surface to-brand-secondary/15 px-4 py-5 text-text md:px-8 md:py-8" data-testid="signup-organizer-screen">
        <div className="mx-auto flex min-h-[calc(100vh-40px)] w-full max-w-5xl items-start md:min-h-[calc(100vh-64px)] md:items-center">
          <div className="w-full">
            <button
              type="button"
              onClick={() => setSignupType(null)}
              className="mb-4 rounded border border-brand-primary/35 bg-white/90 px-4 py-2 text-sm font-medium text-brand-primary transition hover:bg-white"
              data-testid="signup-organizer-back-button"
            >
              Voltar
            </button>

            <div className="overflow-hidden rounded-2xl border border-brand-primary/25 bg-white/95 shadow-cityCard backdrop-blur-sm">
              <div className="grid md:grid-cols-[1.05fr_1fr]">
                <div className="relative min-h-[240px] md:min-h-[560px]">
                  <img
                    src={selectedCity.imageUrl}
                    alt={`Paisagem da cidade de ${selectedCity.label}`}
                    className="h-full w-full object-cover"
                    onError={(event) => {
                      event.currentTarget.src = selectedCity.imageFallbackUrl;
                    }}
                    data-testid="signup-organizer-city-image"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/55 via-black/30 to-transparent" />
                  <div className="absolute left-5 top-5 rounded-full border border-white/40 bg-black/25 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-white md:left-6 md:top-6">
                    {selectedCity.label}
                  </div>
                </div>

                <div className="bg-gradient-to-b from-white to-brand-primary/5 p-6 md:p-10">
                  <h1 className="font-display text-2xl leading-tight text-brand-primary md:text-4xl">
                    Crie sua conta de organizador
                  </h1>
                  <p className="mt-3 font-body text-sm text-text/75 md:text-base">
                    Divulgue eventos gratuitos ou venda ingressos com métricas em tempo real.
                  </p>

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

                  <form className="mt-8 space-y-4" onSubmit={(e) => handleSignup(e, true)}>
                    {renderFormFields()}

                    <button
                      type="submit"
                      disabled={loading}
                      className="mt-2 w-full rounded-md bg-brand-primary px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-70 disabled:cursor-not-allowed"
                      data-testid="signup-organizer-submit-button"
                    >
                      {loading ? 'Criando conta...' : 'Criar conta de organizador'}
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

  return null;
}
