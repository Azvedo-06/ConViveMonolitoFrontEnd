import { useMemo, useState } from 'react';
import { applyCityTheme, cityOptions, type CityTheme, type CityConfig } from '../../theme/cityTheme';
import { backendFetch, backendRoutes, type UserResponseDto } from '../../services/backendRoutes';

type CityOnboardingScreenProps = {
  backgroundImageUrl: string;
  backgroundImageFallbackUrl: string;
  onCitySelected?: (city: CityTheme) => void;
  user?: UserResponseDto | null;
  cities?: CityConfig[];
  onCityAdded?: () => void;
};

function hexToRgbChannels(hex: string): string {
  const cleanHex = hex.replace(/^#/, '');
  const num = parseInt(cleanHex, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `${r} ${g} ${b}`;
}

function rgbChannelsToHex(channels: string): string {
  const parts = channels.split(' ').map(Number);
  if (parts.length === 3 && parts.every(p => !isNaN(p))) {
    const [r, g, b] = parts;
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }
  return '#2E7D32';
}

export function CityOnboardingScreen({
  backgroundImageUrl,
  backgroundImageFallbackUrl,
  onCitySelected,
  user,
  cities = [],
  onCityAdded,
}: CityOnboardingScreenProps) {
  const cards = useMemo(() => {
    return cities.length > 0 ? cities : cityOptions;
  }, [cities]);

  const [selectedCity, setSelectedCity] = useState<CityTheme | null>(null);
  const [hoveredCityId, setHoveredCityId] = useState<CityTheme | null>(cards[0]?.id ?? null);

  // Admin Modal state
  const [showAddCityModal, setShowAddCityModal] = useState(false);
  const [cityName, setCityName] = useState('');
  const [citySpotlight, setCitySpotlight] = useState('');
  const [cityImageUrl, setCityImageUrl] = useState('');
  const [colorPrimary, setColorPrimary] = useState('#2E7D32');
  const [colorSecondary, setColorSecondary] = useState('#66BB6A');
  const [cityTags, setCityTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingCityId, setEditingCityId] = useState<string | null>(null);

  const previewCity = cards.find((city) => city.id === hoveredCityId) ?? cards[0] ?? null;

  function handleSelectCity(cityId: CityTheme) {
    setSelectedCity(cityId);
    setHoveredCityId(cityId);
    const config = cards.find(c => c.id === cityId);
    if (config) {
      applyCityTheme(config);
    }
    onCitySelected?.(cityId);
  }

  const handleStartEditCity = (city: CityConfig) => {
    setError('');
    setCityName(city.label);
    setCitySpotlight(city.spotlight || '');
    setCityImageUrl(city.imageUrl || '');
    setCityTags(city.tags ? city.tags.join(', ') : '');
    setColorPrimary(rgbChannelsToHex(city.colorPrimary || '46 125 50'));
    setColorSecondary(rgbChannelsToHex(city.colorSecondary || '102 187 106'));
    setEditingCityId(city.id);
    setShowAddCityModal(true);
  };

  const handleCloseModal = () => {
    setShowAddCityModal(false);
    setEditingCityId(null);
    setCityName('');
    setCitySpotlight('');
    setCityImageUrl('');
    setCityTags('');
    setColorPrimary('#2E7D32');
    setColorSecondary('#66BB6A');
  };

  const handleDeleteCity = async (cityId: string) => {
    const confirmDelete = window.confirm('Tem certeza que deseja excluir esta cidade? Todos os dados associados poderão ser perdidos.');
    if (!confirmDelete) return;

    try {
      await backendFetch(`${backendRoutes.cities}/${cityId}`, {
        method: 'DELETE',
      });
      onCityAdded?.();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir a cidade.');
    }
  };

  const handleAddCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityName || !citySpotlight) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setLoading(true);
    setError('');

    const primaryRGB = hexToRgbChannels(colorPrimary);
    const secondaryRGB = hexToRgbChannels(colorSecondary);
    const tagsArray = cityTags
      ? cityTags.split(',').map((t) => t.trim()).filter(Boolean)
      : ['cultura', 'eventos'];

    const payload = {
      label: cityName,
      spotlight: citySpotlight,
      imageUrl: cityImageUrl || undefined,
      imageFallbackUrl: cityImageUrl || undefined,
      colorPrimary: primaryRGB,
      colorSecondary: secondaryRGB,
      tags: tagsArray,
    };

    try {
      if (editingCityId) {
        await backendFetch(`${backendRoutes.cities}/${editingCityId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await backendFetch(backendRoutes.cities, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      handleCloseModal();

      // Refresh parent cities list
      onCityAdded?.();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar a cidade.');
    } finally {
      setLoading(false);
    }
  };

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
                    <div
                      key={city.id}
                      className={`group relative w-full rounded-xl border border-brand-primary/20 bg-white transition duration-300 ${isActive ? 'border-brand-primary/30 bg-brand-primary/5 shadow-[0_10px_30px_rgba(0,0,0,0.1)]' : 'hover:border-brand-primary/40 hover:bg-brand-primary/5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)]'}`}
                    >
                      <button
                        type="button"
                        onMouseEnter={() => setHoveredCityId(city.id)}
                        onFocus={() => setHoveredCityId(city.id)}
                        onTouchStart={() => setHoveredCityId(city.id)}
                        onClick={() => handleSelectCity(city.id)}
                        data-testid={`city-onboarding-card-${city.id}`}
                        className="w-full text-left px-6 py-4 focus:outline-none rounded-xl"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-semibold text-white"
                            style={{ backgroundColor: `rgb(${city.colorPrimary || '46 125 50'})` }}
                          >
                            {city.label.slice(0, 1)}
                          </div>

                          <div className="min-w-0 flex-1 pr-24">
                            <h2 className="font-display text-2xl font-semibold text-text md:text-3xl">
                              {city.label}
                            </h2>
                          </div>
                        </div>

                        <span
                          className="mt-4 flex w-full items-center justify-center rounded-md px-5 py-3 text-sm font-semibold text-white lg:hidden"
                          style={{ backgroundColor: `rgb(${city.colorPrimary || '46 125 50'})` }}
                        >
                          Abrir {city.label}
                        </span>
                      </button>

                      {user?.role === 'ADMIN' && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2 z-20">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartEditCity(city);
                            }}
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary transition hover:bg-brand-primary hover:text-white shadow-sm"
                            title="Editar Cidade"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCity(city.id);
                            }}
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600 transition hover:bg-red-600 hover:text-white shadow-sm"
                            title="Excluir Cidade"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {user?.role === 'ADMIN' && (
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setShowAddCityModal(true);
                    }}
                    className="w-full rounded-xl border-2 border-dashed border-brand-primary/45 bg-white/75 px-6 py-4 text-center text-sm font-bold text-brand-primary hover:border-brand-primary hover:bg-brand-primary/5 transition duration-300 shadow-sm"
                    data-testid="admin-add-city-button"
                  >
                    + Adicionar Nova Cidade
                  </button>
                )}

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
                    <div
                      className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-20"
                      style={{ backgroundColor: `rgb(${previewCity.colorPrimary || '46 125 50'})` }}
                    />

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
                    <button
                      type="button"
                      onClick={() => handleSelectCity(previewCity.id)}
                      className="w-full rounded-md px-5 py-3 text-sm font-semibold text-white transition duration-300 hover:brightness-110"
                      style={{ backgroundColor: `rgb(${previewCity.colorPrimary || '46 125 50'})` }}
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

      {showAddCityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <button
            type="button"
            className="absolute inset-0 bg-transparent w-full h-full border-none outline-none cursor-default"
            onClick={handleCloseModal}
          />

          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-brand-primary/15 bg-white shadow-cityCard animate-slideUp">
            <header className="flex justify-between items-center border-b border-brand-primary/10 px-5 py-4 bg-brand-primary/5">
              <h2 className="font-display text-lg font-bold text-brand-primary">
                {editingCityId ? 'Editar Cidade' : 'Cadastrar Nova Cidade'}
              </h2>
              <button
                type="button"
                onClick={handleCloseModal}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-brand-primary transition hover:bg-brand-primary/10"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </header>

            <form onSubmit={handleAddCity} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-text/85 uppercase tracking-wider mb-1">Nome da Cidade *</label>
                <input
                  type="text"
                  required
                  value={cityName}
                  onChange={(e) => setCityName(e.target.value)}
                  className="w-full rounded-xl border border-brand-primary/25 bg-white px-3 py-2 text-sm text-text outline-none focus:border-brand-primary/55 focus:ring-2 focus:ring-brand-primary/20"
                  placeholder="Ex: Londrina"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text/85 uppercase tracking-wider mb-1">Destaque *</label>
                <input
                  type="text"
                  required
                  value={citySpotlight}
                  onChange={(e) => setCitySpotlight(e.target.value)}
                  className="w-full rounded-xl border border-brand-primary/25 bg-white px-3 py-2 text-sm text-text outline-none focus:border-brand-primary/55 focus:ring-2 focus:ring-brand-primary/20"
                  placeholder="Ex: Foco em eventos universitários e culturais."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text/85 uppercase tracking-wider mb-1">URL da Imagem (Opcional)</label>
                <input
                  type="url"
                  value={cityImageUrl}
                  onChange={(e) => setCityImageUrl(e.target.value)}
                  className="w-full rounded-xl border border-brand-primary/25 bg-white px-3 py-2 text-sm text-text outline-none focus:border-brand-primary/55 focus:ring-2 focus:ring-brand-primary/20"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text/85 uppercase tracking-wider mb-1">Tags (Separadas por vírgula)</label>
                <input
                  type="text"
                  value={cityTags}
                  onChange={(e) => setCityTags(e.target.value)}
                  className="w-full rounded-xl border border-brand-primary/25 bg-white px-3 py-2 text-sm text-text outline-none focus:border-brand-primary/55 focus:ring-2 focus:ring-brand-primary/20"
                  placeholder="Ex: inovação, cultura, lazer"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text/85 uppercase tracking-wider mb-1">Cor Principal *</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={colorPrimary}
                      onChange={(e) => setColorPrimary(e.target.value)}
                      className="h-10 w-12 cursor-pointer rounded-xl border border-brand-primary/25 bg-transparent p-0 overflow-hidden"
                    />
                    <input
                      type="text"
                      value={colorPrimary.toUpperCase()}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.startsWith('#') && val.length <= 7) {
                          setColorPrimary(val);
                        } else if (!val.startsWith('#') && val.length <= 6) {
                          setColorPrimary('#' + val);
                        }
                      }}
                      className="w-full rounded-xl border border-brand-primary/25 bg-white px-3 py-2 text-sm text-text outline-none focus:border-brand-primary/55"
                      placeholder="#2E7D32"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text/85 uppercase tracking-wider mb-1">Cor Secundária *</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={colorSecondary}
                      onChange={(e) => setColorSecondary(e.target.value)}
                      className="h-10 w-12 cursor-pointer rounded-xl border border-brand-primary/25 bg-transparent p-0 overflow-hidden"
                    />
                    <input
                      type="text"
                      value={colorSecondary.toUpperCase()}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.startsWith('#') && val.length <= 7) {
                          setColorSecondary(val);
                        } else if (!val.startsWith('#') && val.length <= 6) {
                          setColorSecondary('#' + val);
                        }
                      }}
                      className="w-full rounded-xl border border-brand-primary/25 bg-white px-3 py-2 text-sm text-text outline-none focus:border-brand-primary/55"
                      placeholder="#66BB6A"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-brand-primary/10">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-xl border border-brand-primary/30 px-4 py-2 text-xs font-semibold text-brand-primary transition hover:bg-brand-primary/5"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-brand-primary px-5 py-2 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-75"
                >
                  {loading ? 'Salvando...' : (editingCityId ? 'Salvar Alterações' : 'Salvar Cidade')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
