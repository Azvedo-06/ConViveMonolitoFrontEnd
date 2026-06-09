import { useMemo, useState } from 'react';
import { applyCityTheme, cityOptions, type CityTheme } from '../../theme/cityTheme';

type CityOnboardingScreenProps = {
  backgroundImageUrl: string;
  backgroundImageFallbackUrl: string;
  onCitySelected?: (city: CityTheme) => void;
};

export function CityOnboardingScreen({
  backgroundImageUrl,
  backgroundImageFallbackUrl,
  onCitySelected,
}: CityOnboardingScreenProps) {
  const [selectedCity, setSelectedCity] = useState<CityTheme | null>(null);
  const [hoveredCityId, setHoveredCityId] = useState<CityTheme | null>(cityOptions[0]?.id ?? null);

  const cards = useMemo(() => {
    return cityOptions.map((city) => {
      return {
        ...city,
      };
    });
  }, []);

  const previewCity = cards.find((city) => city.id === hoveredCityId) ?? cards[0] ?? null;

  function handleSelectCity(city: CityTheme) {
    setSelectedCity(city);
    setHoveredCityId(city);
    applyCityTheme(city);
    onCitySelected?.(city);
  }

  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-brand-primary/10 via-surface to-brand-secondary/10 font-body" data-testid="city-onboarding-screen">
      <img
        src={backgroundImageUrl}
        alt="Pessoas participando de atividades comunitarias"
        className="absolute inset-0 h-full w-full object-cover"
        onError={(event) => {
          event.currentTarget.src = backgroundImageFallbackUrl;
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-b from-surface/75 via-surface/40 to-transparent md:bg-gradient-to-r md:from-surface/75 md:via-surface/50 md:to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(46,125,50,0.08),_transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(216,67,21,0.08),_transparent_40%)]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl items-start px-4 py-8 sm:px-6 md:px-8 md:py-10 lg:items-center">
        <div className="w-full">

          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div className="space-y-7">
              <div className="max-w-2xl">
                <p className="font-display text-3xl font-semibold leading-[1.02] tracking-[-0.03em] text-text sm:text-4xl md:text-6xl">
                  Escolha a cidade certa e encontre o que faz sentido para você.
                </p>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-text md:text-lg">
                  Para moradores, visitantes e quem quer divulgar algo na cidade.
                </p>
              </div>

              <div className="space-y-3">
                {cards.map((city) => {
                  const isActive = previewCity?.id === city.id;

                  return (
                    <button
                      type="button"
                      key={city.id}
                      onMouseEnter={() => setHoveredCityId(city.id)}
                      onFocus={() => setHoveredCityId(city.id)}
                      onTouchStart={() => setHoveredCityId(city.id)}
                      onClick={() => handleSelectCity(city.id)}
                      data-testid={`city-onboarding-card-${city.id}`}
                      className={`group w-full rounded-xl border border-brand-primary/20 bg-white px-6 py-4 text-left transition duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/20 ${isActive ? 'border-brand-primary/30 bg-brand-primary/5 shadow-[0_10px_30px_rgba(0,0,0,0.1)]' : 'hover:border-brand-primary/40 hover:bg-brand-primary/5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)]'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-semibold ${city.accentClassName}`}>
                          {city.label.slice(0, 1)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h2 className="font-display text-2xl font-semibold text-text md:text-3xl">
                            {city.label}
                          </h2>
                          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-text md:text-base">
                            {city.description}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`mt-4 flex w-full items-center justify-center rounded-md px-5 py-3 text-sm font-semibold lg:hidden ${city.accentClassName}`}
                      >
                        Abrir {city.label}
                      </span>
                    </button>
                  );
                })}

              </div>
            </div>

            <div className="hidden lg:block lg:sticky lg:top-8">
              {previewCity ? (
                <div className="overflow-hidden rounded-2xl border border-brand-primary/20 bg-white shadow-cityCard">
                  <div className="relative h-[320px]">
                    <img
                      src={previewCity.imageUrl}
                      alt={`Prévia visual da cidade de ${previewCity.label}`}
                      className="h-full w-full object-cover"
                      onError={(event) => {
                        event.currentTarget.src = previewCity.imageFallbackUrl;
                      }}
                    />
                    <div className={`absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent ${previewCity.accentClassName} opacity-20`} />

                    <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                      <h3 className="mt-3 font-display text-4xl font-semibold md:text-5xl">
                        {previewCity.label}
                      </h3>
                      <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/95 md:text-base">
                        {previewCity.spotlight}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-5 p-6">
                    <p className="text-sm leading-relaxed text-text/90 md:text-base">
                      {previewCity.description}
                    </p>

                    <button
                      type="button"
                      onClick={() => handleSelectCity(previewCity.id)}
                      className={`w-full rounded-md px-5 py-3 text-sm font-semibold transition duration-300 hover:brightness-110 ${previewCity.accentClassName}`}
                      data-testid={`city-onboarding-open-${previewCity.id}`}
                    >
                      Abrir {previewCity.label}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
