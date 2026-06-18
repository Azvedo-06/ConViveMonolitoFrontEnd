import { type CityConfig, type CityTheme } from '../../../theme/cityTheme';
import { type SignupType } from '../SignupScreen';
import { getImageUrl } from '../../../services/backendRoutes';

type SignupRoleSelectProps = {
  selectedCity: CityConfig;
  onBack: () => void;
  setSignupType: (type: SignupType) => void;
};

export function SignupRoleSelect({ selectedCity, onBack, setSignupType }: SignupRoleSelectProps) {
  return (
    <section className="min-h-screen bg-gradient-to-br from-brand-primary/15 via-surface to-brand-secondary/15 px-4 py-5 text-text md:px-8 md:py-8" data-testid="signup-screen">
      <div className="mx-auto flex min-h-[calc(100vh-40px)] w-full max-w-5xl items-start md:min-h-[calc(100vh-64px)] md:items-center">
        <div className="w-full">
          <button
            type="button"
            onClick={onBack}
            className="mb-4 rounded border border-brand-primary/35 bg-white/90 px-4 py-2 text-sm font-medium text-brand-primary transition hover:bg-white"
            data-testid="signup-back-button"
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
