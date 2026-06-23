import { useState, useEffect } from 'react';
import { type CityTheme } from '../../../theme/cityTheme';
import { type CityFeedItem, type FeedCategory } from '../cityFeedData';
import { backendFetch, getImageUrl } from '../../../services/backendRoutes';

type CreateEditEventModalProps = {
  city: CityTheme;
  editingEvent: CityFeedItem | null;
  onClose: () => void;
  onSuccess: (savedEvent: any, isEdit: boolean) => void;
};

export function CreateEditEventModal({
  city,
  editingEvent,
  onClose,
  onSuccess,
}: CreateEditEventModalProps) {
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formCategory, setFormCategory] = useState<FeedCategory>('eventos');
  const [formType, setFormType] = useState<'COMMUNITY' | 'PRIVATE'>('COMMUNITY');
  const [formPrice, setFormPrice] = useState('');
  const [formMaxParticipants, setFormMaxParticipants] = useState('');
  const [formFile, setFormFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (editingEvent) {
      setFormTitle(editingEvent.title);
      setFormDescription(editingEvent.details);
      setFormLocation(editingEvent.location);
      let formattedDate = '';
      if (editingEvent.rawDate) {
        const d = new Date(editingEvent.rawDate);
        const tzoffset = d.getTimezoneOffset() * 60000;
        const localISOTime = new Date(d.getTime() - tzoffset).toISOString().slice(0, 16);
        formattedDate = localISOTime;
      }
      setFormDate(formattedDate);
      setFormCategory(editingEvent.category);
      setFormType(editingEvent.type || 'COMMUNITY');
      setFormPrice(editingEvent.price ? String(editingEvent.price) : '');
      setFormMaxParticipants(editingEvent.capacity ? String(editingEvent.capacity) : '');
      setPreviewUrl(editingEvent.imageUrl ? getImageUrl(editingEvent.imageUrl) : '');
      setFormFile(null);
    } else {
      setFormTitle('');
      setFormDescription('');
      setFormLocation('');
      setFormDate('');
      setFormCategory('eventos');
      setFormType('COMMUNITY');
      setFormPrice('');
      setFormMaxParticipants('');
      setPreviewUrl('');
      setFormFile(null);
    }
    setFormError('');
  }, [editingEvent]);

  async function handleSaveEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!formTitle || !formDescription || !formLocation || !formDate) {
      setFormError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setFormLoading(true);
    setFormError('');

    const payload = {
      title: formTitle,
      description: formDescription,
      location: formLocation,
      date: new Date(formDate).toISOString(),
      type: formType,
      category: formCategory,
      price: formType === 'PRIVATE' ? Number(formPrice) : null,
      maxParticipants: formType === 'PRIVATE' && formMaxParticipants ? Number(formMaxParticipants) : null,
      city: city,
      imageUrl: editingEvent?.imageUrl || null,
    };
  
    try {
      let savedEventData: any;
      if (editingEvent) {
        const response = await backendFetch<any>(`/events/${editingEvent.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        savedEventData = response.data || response;
      } else {
        const response = await backendFetch<any>('/events', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        savedEventData = response.data || response;
      }
  
      if (formFile) {
        const formData = new FormData();
        formData.append('image', formFile);
        const uploadResponse = await backendFetch<any>(`/events/${savedEventData.id}/upload`, {
          method: 'POST',
          body: formData,
        });
        const uploadData = uploadResponse.data || uploadResponse;
        savedEventData = {
          ...savedEventData,
          imageUrl: uploadData.imageUrl,
        };
      }
  
      onSuccess(savedEventData, !!editingEvent);
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar o conteúdo.');
    } finally {
      setFormLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-brand-primary/15 bg-white shadow-cityCard overflow-hidden">
        <header className="flex justify-between items-center border-b border-brand-primary/10 px-5 py-4">
          <h2 className="font-display text-xl font-bold text-brand-primary">
            {editingEvent ? 'Editar Conteúdo' : 'Criar Novo Conteúdo'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-brand-primary transition hover:bg-brand-primary/10"
            aria-label="Fechar modal"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        <form onSubmit={handleSaveEvent} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-text/85 mb-1">Título</label>
            <input
              type="text"
              required
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full rounded-xl border border-brand-primary/25 bg-white px-3 py-2 text-sm text-text outline-none focus:border-brand-primary/55 focus:ring-2 focus:ring-brand-primary/20"
              placeholder="Nome do evento, curso ou atividade"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text/85 mb-1">Categoria</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value as FeedCategory)}
                className="w-full rounded-xl border border-brand-primary/25 bg-white px-3 py-2 text-sm text-text outline-none focus:border-brand-primary/55"
              >
                <option value="eventos">Evento</option>
                <option value="cursos">Curso</option>
                <option value="atividades">Atividade</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text/85 mb-1">Acesso</label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as 'COMMUNITY' | 'PRIVATE')}
                className="w-full rounded-xl border border-brand-primary/25 bg-white px-3 py-2 text-sm text-text outline-none focus:border-brand-primary/55"
              >
                <option value="COMMUNITY">Gratuito (Comunidade)</option>
                <option value="PRIVATE">Pago (Privado)</option>
              </select>
            </div>
          </div>

          {formType === 'PRIVATE' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text/85 mb-1">Preço (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  className="w-full rounded-xl border border-brand-primary/25 bg-white px-3 py-2 text-sm text-text outline-none focus:border-brand-primary/55 focus:ring-2 focus:ring-brand-primary/20"
                  placeholder="Ex: 50.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text/85 mb-1">Vagas / Capacidade</label>
                <input
                  type="number"
                  required
                  value={formMaxParticipants}
                  onChange={(e) => setFormMaxParticipants(e.target.value)}
                  className="w-full rounded-xl border border-brand-primary/25 bg-white px-3 py-2 text-sm text-text outline-none focus:border-brand-primary/55 focus:ring-2 focus:ring-brand-primary/20"
                  placeholder="Ex: 100"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text/85 mb-1">Data e Horário</label>
              <input
                type="datetime-local"
                required
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full rounded-xl border border-brand-primary/25 bg-white px-3 py-2 text-sm text-text outline-none focus:border-brand-primary/55"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text/85 mb-1">Local</label>
              <input
                type="text"
                required
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
                className="w-full rounded-xl border border-brand-primary/25 bg-white px-3 py-2 text-sm text-text outline-none focus:border-brand-primary/55 focus:ring-2 focus:ring-brand-primary/20"
                placeholder="Ex: Auditório Principal"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text/85 mb-1.5">Foto do Curso/Evento</label>
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-brand-primary/20 rounded-2xl p-4 bg-surface/50 hover:bg-surface transition-colors cursor-pointer relative group">
              {previewUrl ? (
                <div className="relative w-full h-32 overflow-hidden rounded-xl">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-xl">
                    <span className="text-white text-xs font-semibold">Alterar Imagem</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-2 text-center">
                  <svg className="h-8 w-8 text-brand-primary/50 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs font-semibold text-brand-primary">Escolher imagem do seu computador</span>
                  <span className="text-[10px] text-text/60 mt-1">PNG, JPG, JPEG até 5MB</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setFormFile(file);
                  if (file) {
                    setPreviewUrl(URL.createObjectURL(file));
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text/85 mb-1">Descrição</label>
            <textarea
              rows={4}
              required
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full rounded-xl border border-brand-primary/25 bg-white px-3 py-2 text-sm text-text outline-none focus:border-brand-primary/55 resize-none focus:ring-2 focus:ring-brand-primary/20"
              placeholder="Descreva detalhadamente a programação..."
            />
          </div>

          {formError && <p className="text-sm text-red-500">{formError}</p>}

          <footer className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-brand-primary/25 px-4 py-2 text-sm font-semibold text-brand-primary transition hover:bg-brand-primary/10"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-75"
            >
              {formLoading ? 'Salvando...' : 'Salvar'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
