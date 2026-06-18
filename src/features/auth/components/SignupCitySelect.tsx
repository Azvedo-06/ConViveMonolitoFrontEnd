import { type CityConfig, type CityTheme } from '../../../theme/cityTheme';
import { getImageUrl } from '../../../services/backendRoutes';

type SignupCitySelectProps = {
  currentCities: CityConfig[];
  setSelectedCityId: (id: CityTheme) => void;
  handleBack: () => void;
};

export function SignupCitySelect({ currentCities, setSelectedCityId, handleBack }: SignupCitySelectProps) {
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
                        src={getImageUrl(option.imageUrl)}
                        alt={`Vista da cidade de ${option.label}`}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
                      <div className="absolute bottom-0 left-0 p-4 text-white">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/85">Cidade</p>
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
