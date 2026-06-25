import { useState, useEffect } from 'react';
import { type CityConfig } from '../../../theme/cityTheme';
import { getImageUrl } from '../../../services/backendRoutes';

type AddEditCityModalProps = {
  editingCity: CityConfig | null;
  onClose: () => void;
  onSave: (payload: any, imageFile: File | null) => Promise<void>;
  loading: boolean;
  error: string;
  setError: (err: string) => void;
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

export function AddEditCityModal({
  editingCity,
  onClose,
  onSave,
  loading,
  error,
  setError,
}: AddEditCityModalProps) {
  const [cityName, setCityName] = useState('');
  const [citySpotlight, setCitySpotlight] = useState('');
  const [cityImageUrl, setCityImageUrl] = useState('');
  const [colorPrimary, setColorPrimary] = useState('#2E7D32');
  const [colorSecondary, setColorSecondary] = useState('#66BB6A');
  const [cityTags, setCityTags] = useState('');
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    setImageFile(null);
    setImagePreview('');
    if (editingCity) {
      setCityName(editingCity.label);
      setCitySpotlight(editingCity.spotlight || '');
      setCityImageUrl(editingCity.imageUrl || '');
      setCityTags(editingCity.tags ? editingCity.tags.join(', ') : '');
      setColorPrimary(rgbChannelsToHex(editingCity.colorPrimary || '46 125 50'));
      setColorSecondary(rgbChannelsToHex(editingCity.colorSecondary || '102 187 106'));
      setLatitude(editingCity.latitude !== undefined ? String(editingCity.latitude) : '');
      setLongitude(editingCity.longitude !== undefined ? String(editingCity.longitude) : '');
    } else {
      setCityName('');
      setCitySpotlight('');
      setCityImageUrl('');
      setCityTags('');
      setColorPrimary('#2E7D32');
      setColorSecondary('#66BB6A');
      setLatitude('');
      setLongitude('');
    }
  }, [editingCity]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setCityImageUrl(''); // Limpa a URL se o usuário escolheu fazer o upload
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityName || !citySpotlight) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

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
      latitude: latitude !== '' ? Number(latitude) : undefined,
      longitude: longitude !== '' ? Number(longitude) : undefined,
    };

    await onSave(payload, imageFile);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <button
        type="button"
        className="absolute inset-0 bg-transparent w-full h-full border-none outline-none cursor-default"
        onClick={onClose}
        aria-label="Fechar modal"
      />

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-brand-primary/15 bg-white shadow-cityCard animate-slideUp">
        <header className="flex justify-between items-center border-b border-brand-primary/10 px-5 py-4 bg-brand-primary/5">
          <h2 className="font-display text-lg font-bold text-brand-primary">
            {editingCity ? 'Editar Cidade' : 'Cadastrar Nova Cidade'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-brand-primary transition hover:bg-brand-primary/10"
            aria-label="Fechar"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
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
            <label className="block text-xs font-semibold text-text/85 uppercase tracking-wider mb-1">Foto da Cidade (Upload ou URL)</label>
            <div className="flex flex-col gap-3">
              {/* Área de upload de arquivos */}
              <div className="flex items-center gap-3">
                <label className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-dashed border-brand-primary/45 bg-brand-primary/5 px-4 py-2.5 text-xs font-bold text-brand-primary hover:bg-brand-primary/10 transition cursor-pointer">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span>{imageFile ? 'Trocar Imagem' : 'Upload de Imagem'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    data-testid="admin-city-image-file-input"
                  />
                </label>
                {imagePreview ? (
                  <div className="relative h-11 w-11 rounded-lg overflow-hidden border border-brand-primary/15 shrink-0 bg-neutral-100">
                    <img src={imagePreview} alt="Prévia" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview('');
                      }}
                      className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition text-white text-[10px] font-bold"
                    >
                      Remover
                    </button>
                  </div>
                ) : editingCity?.imageUrl ? (
                  <div className="relative h-11 w-11 rounded-lg overflow-hidden border border-brand-primary/15 shrink-0 bg-neutral-100">
                    <img src={getImageUrl(editingCity.imageUrl)} alt="Atual" className="h-full w-full object-cover" />
                  </div>
                ) : null}
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-neutral-200"></div>
                <span className="flex-shrink mx-3 text-neutral-400 text-[10px] font-semibold uppercase tracking-wider">ou URL externa</span>
                <div className="flex-grow border-t border-neutral-200"></div>
              </div>

              {/* Input de URL externa */}
              <input
                type="url"
                value={cityImageUrl}
                onChange={(e) => {
                  setCityImageUrl(e.target.value);
                  if (e.target.value) {
                    setImageFile(null);
                    setImagePreview('');
                  }
                }}
                className="w-full rounded-xl border border-brand-primary/25 bg-white px-3 py-2 text-sm text-text outline-none focus:border-brand-primary/55 focus:ring-2 focus:ring-brand-primary/20"
                placeholder="https://images.unsplash.com/..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text/85 uppercase tracking-wider mb-1">Latitude</label>
              <input
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="w-full rounded-xl border border-brand-primary/25 bg-white px-3 py-2 text-sm text-text outline-none focus:border-brand-primary/55 focus:ring-2 focus:ring-brand-primary/20"
                placeholder="Ex: -24.0439"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text/85 uppercase tracking-wider mb-1">Longitude</label>
              <input
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="w-full rounded-xl border border-brand-primary/25 bg-white px-3 py-2 text-sm text-text outline-none focus:border-brand-primary/55 focus:ring-2 focus:ring-brand-primary/20"
                placeholder="Ex: -52.3781"
              />
            </div>
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
              onClick={onClose}
              className="rounded-xl border border-brand-primary/30 px-4 py-2 text-xs font-semibold text-brand-primary transition hover:bg-brand-primary/5"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-brand-primary px-5 py-2 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-75"
            >
              {loading ? 'Salvando...' : (editingCity ? 'Salvar Alterações' : 'Salvar Cidade')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
