import { type CityTheme, cityOptions } from '../../theme/cityTheme';

type LoginScreenProps = {
  city: CityTheme;
  onBack: () => void;
};

export function LoginScreen({ city, onBack }: LoginScreenProps) {
  const selectedCity = cityOptions.find((option) => option.id === city);

  if (!selectedCity) {
    return null;
  }

  return (
    <section className="min-h-screen bg-gradient-to-br from-brand-primary/15 via-surface to-brand-secondary/15 px-4 py-5 text-text md:px-8 md:py-8" data-testid="login-screen">
      <div className="mx-auto flex min-h-[calc(100vh-40px)] w-full max-w-5xl items-start md:min-h-[calc(100vh-64px)] md:items-center">
        <div className="w-full">
          <button
            type="button"
            onClick={onBack}
            className="mb-4 rounded border border-brand-primary/35 bg-white/90 px-4 py-2 text-sm font-medium text-brand-primary transition hover:bg-white"
            data-testid="login-back-button"
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
                  data-testid="login-city-image"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-black/55 via-black/30 to-transparent" />
                <div className="absolute left-5 top-5 rounded-full border border-white/40 bg-black/25 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-white md:left-6 md:top-6">
                  {selectedCity.label}
                </div>
              </div>

              <div className="bg-gradient-to-b from-white to-brand-primary/5 p-6 md:p-10">
                <h1 className="font-display text-2xl leading-tight text-brand-primary md:text-4xl">
                  ConVive - Seu Hub de Projetos Comunitarios
                </h1>
                <p className="mt-3 font-body text-sm text-text/75 md:text-base">
                  Entre para acessar eventos, cursos, atividades e informativos da sua cidade.
                </p>

                <form className="mt-8 space-y-4" onSubmit={(event) => event.preventDefault()}>
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-text/85">E-mail</span>
                    <input
                      type="email"
                      placeholder="seuemail@exemplo.com"
                      className="w-full rounded-md border border-brand-primary/25 bg-white px-3 py-2.5 text-sm text-text placeholder:text-text/45 outline-none transition focus:border-brand-primary/55 focus:ring-2 focus:ring-brand-primary/20"
                      data-testid="login-email-input"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-text/85">Senha</span>
                    <input
                      type="password"
                      placeholder="Digite sua senha"
                      className="w-full rounded-md border border-brand-primary/25 bg-white px-3 py-2.5 text-sm text-text placeholder:text-text/45 outline-none transition focus:border-brand-primary/55 focus:ring-2 focus:ring-brand-primary/20"
                      data-testid="login-password-input"
                    />
                  </label>

                  <div className="flex items-center justify-between gap-3 pt-1 text-sm">
                    <label className="inline-flex items-center gap-2 text-text/80">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-brand-primary/30 bg-transparent"
                        data-testid="login-remember-checkbox"
                      />
                      Lembrar de mim
                    </label>
                    <button type="button" className="text-text/80 transition hover:text-text">
                      Esqueci a senha
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="mt-2 w-full rounded-md bg-brand-primary px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110"
                    data-testid="login-submit-button"
                  >
                    Entrar
                  </button>

                  <button
                    type="button"
                    className="w-full rounded-md border border-brand-primary/40 bg-white px-4 py-3 text-sm font-semibold text-brand-primary transition hover:bg-brand-primary/10"
                    data-testid="login-create-account-button"
                  >
                    Criar conta
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