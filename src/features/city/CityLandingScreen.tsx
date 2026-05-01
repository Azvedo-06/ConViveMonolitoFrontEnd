import { useMemo, useState } from 'react';
import { type CityTheme, cityOptions } from '../../theme/cityTheme';
import { cityFeedData, type CityFeedItem, type FeedCategory } from './cityFeedData';
import { cityCategoryOptions, filterCityFeed } from './cityFeedUtils';

type CityLandingScreenProps = {
  city: CityTheme;
  onBack: () => void;
  onLogin: () => void;
};

export function CityLandingScreen({ city, onBack, onLogin }: CityLandingScreenProps) {
  const [activeCategory, setActiveCategory] = useState<FeedCategory>('eventos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<CityFeedItem | null>(null);
  const selectedCity = cityOptions.find((option) => option.id === city);

  const filteredFeed = useMemo(() => {
    return filterCityFeed(cityFeedData, city, activeCategory, searchTerm);
  }, [city, activeCategory, searchTerm]);

  function handleCategoryChange(category: FeedCategory) {
    setActiveCategory(category);
    setSelectedItem(null);
  }

  const highlightedItem = useMemo(() => {
    if (!selectedItem) {
      return null;
    }

    return filteredFeed.find((item) => item.id === selectedItem.id) ?? null;
  }, [selectedItem, filteredFeed]);

  if (!selectedCity) {
    return null;
  }

  return (
    <section className="min-h-screen bg-surface text-text" data-testid="city-landing-screen">
      <header className="relative bg-brand-primary text-white">
        <div className="flex items-center justify-between px-4 py-4 md:px-8 md:py-5">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
            data-testid="city-brand-button"
          >
            <span className="font-display text-lg font-bold tracking-wide">CONVIVE</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/85 md:text-[11px]">
              {selectedCity.label}
            </span>
          </button>

          <button
            type="button"
            onClick={onLogin}
            className="rounded px-3 py-1.5 text-xs font-medium transition hover:bg-white/10 md:hidden"
            data-testid="city-login-button-mobile"
          >
            LOGIN
          </button>

          <nav className="hidden items-center gap-3 text-xs font-medium md:flex md:gap-6 md:text-sm">
            <button
              type="button"
              onClick={onLogin}
              className="rounded px-3 py-1.5 transition hover:bg-white/10"
              data-testid="city-login-button-desktop"
            >
              LOGIN
            </button>
            <button
              type="button"
              onClick={onBack}
              className="rounded px-3 py-1.5 transition hover:bg-white/10"
              data-testid="city-switch-button"
            >
              TROCAR CIDADE
            </button>
          </nav>
        </div>
      </header>

      <main className="min-h-[calc(100vh-76px)] px-4 py-6 md:min-h-[calc(100vh-84px)] md:px-8 md:py-8" data-testid="city-landing-main">
        <div className="mx-auto w-full max-w-6xl">
          <div className="relative h-[38vh] min-h-[260px] w-full overflow-hidden rounded-2xl shadow-cityCard md:h-[52vh] md:min-h-[420px]">
            <img
              src={selectedCity.imageUrl}
              alt={`Vista da cidade de ${selectedCity.label}`}
              className="h-full w-full object-cover"
              onError={(event) => {
                event.currentTarget.src = selectedCity.imageFallbackUrl;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 p-5 text-white md:p-8">
              <p className="font-body text-xs font-semibold uppercase tracking-[0.14em] text-white/85 md:text-sm">
                Cidade selecionada
              </p>
              <h1 className="mt-1 font-display text-3xl font-bold md:text-5xl">
                {selectedCity.label}
              </h1>
            </div>
          </div>

          <section className="mt-6 rounded-2xl border border-brand-primary/15 bg-white p-4 shadow-cityCard md:p-6" data-testid="city-feed-section">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap gap-2">
                {cityCategoryOptions.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleCategoryChange(category.id)}
                    className={`rounded-full border px-4 py-2 text-xs font-semibold tracking-wide transition md:text-sm ${
                      activeCategory === category.id
                        ? 'border-brand-primary bg-brand-primary text-white'
                        : 'border-brand-primary/25 text-brand-primary hover:bg-brand-primary/10'
                    }`}
                      data-testid={`city-category-${category.id}`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>

              <label className="block w-full md:w-80">
                <span className="sr-only">Buscar conteudo</span>
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.currentTarget.value)}
                  type="text"
                  placeholder="Buscar por titulo, local ou organizador"
                  className="w-full rounded-xl border border-brand-primary/25 bg-white px-4 py-2.5 text-sm text-text outline-none transition focus:border-brand-primary/60"
                  data-testid="city-feed-search"
                />
              </label>
            </div>

            <p className="mt-4 text-sm text-text/70">
              {filteredFeed.length} resultado(s) em {selectedCity.label} para {activeCategory}.
            </p>

            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredFeed.map((item) => (
                <article
                  key={item.id}
                  className="rounded-xl border border-brand-primary/15 bg-surface/70 p-4 transition hover:-translate-y-0.5 hover:shadow-cityCard"
                  data-testid={`city-feed-card-${item.id}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-brand-secondary/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-primary">
                      {item.category}
                    </span>
                    <span className="text-xs text-text/70">{item.date}</span>
                  </div>

                  <h3 className="mt-3 font-display text-lg leading-tight text-brand-primary">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-sm text-text/80">{item.summary}</p>

                  <div className="mt-4 space-y-1 text-xs text-text/70">
                    <p>Local: {item.location}</p>
                    <p>Responsavel: {item.organizer}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedItem(item)}
                    className="mt-4 rounded-lg border border-brand-primary/30 px-3 py-2 text-xs font-semibold text-brand-primary transition hover:bg-brand-primary/10"
                    data-testid={`city-feed-details-button-${item.id}`}
                  >
                    Ver detalhes
                  </button>
                </article>
              ))}
            </div>

            {filteredFeed.length === 0 && (
              <div className="mt-4 rounded-xl border border-dashed border-brand-primary/25 bg-brand-primary/5 p-5 text-sm text-text/80">
                Nenhum conteudo encontrado com esse filtro. Tente outro termo de busca.
              </div>
            )}

            {highlightedItem && (
              <section className="mt-6 rounded-xl border border-brand-primary/20 bg-white p-5 md:p-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-primary/80">
                      Detalhe do conteudo
                    </p>
                    <h2 className="mt-1 font-display text-2xl text-brand-primary">{highlightedItem.title}</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedItem(null)}
                    className="rounded-lg border border-brand-primary/30 px-3 py-2 text-xs font-semibold text-brand-primary transition hover:bg-brand-primary/10"
                    data-testid="city-feed-close-details"
                  >
                    Fechar detalhe
                  </button>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-text/85">{highlightedItem.details}</p>

                <div className="mt-4 grid gap-2 text-sm text-text/80 md:grid-cols-2">
                  <p>Data: {highlightedItem.date}</p>
                  <p>Local: {highlightedItem.location}</p>
                  <p>Responsavel: {highlightedItem.organizer}</p>
                  <p>Contato: {highlightedItem.contact}</p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {highlightedItem.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-brand-secondary/20 px-3 py-1 text-xs font-semibold text-brand-primary"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </section>
        </div>
      </main>
    </section>
  );
}
