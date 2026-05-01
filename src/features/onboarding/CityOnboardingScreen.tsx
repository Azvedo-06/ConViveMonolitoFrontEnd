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

  const cards = useMemo(() => {
    return cityOptions.map((city, index) => {
      const isEven = index % 2 === 0;
      return {
        ...city,
        wrapperClassName: isEven ? 'md:ml-0 md:mr-16' : 'md:ml-16 md:mr-0',
        contentOrderClassName: isEven ? '' : 'md:flex-row-reverse',
      };
    });
  }, []);

  function handleSelectCity(city: CityTheme) {
    setSelectedCity(city);
    applyCityTheme(city);
    onCitySelected?.(city);
  }

  return (
    <section className="relative min-h-screen overflow-hidden bg-surface font-body text-text" data-testid="city-onboarding-screen">
      <img
        src={backgroundImageUrl}
        alt="Pessoas participando de atividades comunitarias"
        className="absolute inset-0 h-full w-full scale-105 object-cover blur-[2px]"
        onError={(event) => {
          event.currentTarget.src = backgroundImageFallbackUrl;
        }}
      />

      <div className="absolute inset-0 bg-black/60" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-3xl items-center px-6 py-14 md:px-8">
        <div className="w-full">
          <p className="mb-10 text-center font-display text-lg font-medium text-white md:text-2xl">
            Onde você quer descobrir projetos hoje?
          </p>

          <p className="mb-6 text-center font-body text-xs font-semibold uppercase tracking-[0.12em] text-white/80 md:text-sm">
            Clique em uma cidade para entrar
          </p>

          <div className="space-y-6">
            {cards.map((card) => {
              return (
                <button
                  type="button"
                  key={card.id}
                  onClick={() => handleSelectCity(card.id)}
                  data-testid={`city-onboarding-card-${card.id}`}
                  className={`
                    ${card.wrapperClassName}
                    group block w-full rounded-sm shadow-cityCard transition-transform duration-300
                    hover:scale-[1.01] hover:brightness-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80
                  `}
                >
                  <span
                    className={`
                      flex h-24 w-full items-stretch overflow-hidden rounded-sm md:h-28
                      ${card.contentOrderClassName}
                      ring-2 ring-white/70
                    `}
                  >
                    <span className="h-full w-[35%] md:w-[33%]">
                      <img
                        src={card.imageUrl}
                        alt={`Vista da cidade de ${card.label}`}
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.src = card.imageFallbackUrl;
                        }}
                      />
                    </span>
                    <span
                      className={`
                        ${card.accentClassName}
                        flex h-full flex-1 items-center justify-center px-3 text-base font-semibold md:text-2xl
                      `}
                    >
                      {card.label}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
