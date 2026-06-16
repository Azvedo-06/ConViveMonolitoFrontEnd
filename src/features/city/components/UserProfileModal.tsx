import { Role } from '../../../services/backendRoutes';

type UserProfileModalProps = {
  viewingProfile: any;
  onClose: () => void;
};

export function UserProfileModal({ viewingProfile, onClose }: UserProfileModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" role="presentation">
      <div className="w-full max-w-sm rounded-2xl border border-brand-primary/15 bg-white shadow-cityCard overflow-hidden transform transition-all scale-100 animate-in fade-in zoom-in duration-200" role="dialog" aria-modal="true" aria-label="Perfil do Usuário">
        <header className="relative bg-brand-primary text-white px-5 py-6 flex flex-col items-center">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/25 text-white transition focus:outline-none"
            aria-label="Fechar perfil"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          
          <div className="h-16 w-16 rounded-full bg-white/20 border-2 border-white flex items-center justify-center text-2xl font-bold uppercase select-none">
            {viewingProfile.name?.charAt(0) || '?'}
          </div>
          
          <h3 className="mt-3 font-display text-lg font-bold text-center">
            {viewingProfile.name}
          </h3>
          <span className="text-[10px] font-semibold uppercase tracking-wider bg-white/15 px-2.5 py-0.5 rounded-full mt-1">
            {viewingProfile.role === Role.ADMIN ? 'Administrador' : viewingProfile.role === Role.ORGANIZER ? 'Organizador' : 'Participante'}
          </span>
        </header>

        <div className="p-5 space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-text/80">
              <svg className="h-4 w-4 text-brand-primary shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="break-all font-medium">{viewingProfile.email}</span>
            </div>

            {viewingProfile.phone && (
              <div className="flex items-center gap-3 text-sm text-text/80">
                <svg className="h-4 w-4 text-brand-primary shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="font-medium">{viewingProfile.phone}</span>
              </div>
            )}
          </div>

          {(viewingProfile.linkedin || viewingProfile.instagram || viewingProfile.youtube) ? (
            <div className="border-t border-brand-primary/10 pt-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text/60 mb-2">Redes Sociais</h4>
              <div className="flex flex-col gap-2">
                {viewingProfile.linkedin && (
                  <a
                    href={viewingProfile.linkedin.startsWith('http') ? viewingProfile.linkedin : `https://${viewingProfile.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs font-semibold text-brand-primary bg-brand-primary/5 hover:bg-brand-primary/10 px-3 py-2 rounded-xl transition"
                  >
                    <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                    <span>LinkedIn</span>
                  </a>
                )}
                {viewingProfile.instagram && (
                  <a
                    href={viewingProfile.instagram.startsWith('http') ? viewingProfile.instagram : `https://${viewingProfile.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs font-semibold text-brand-primary bg-brand-primary/5 hover:bg-brand-primary/10 px-3 py-2 rounded-xl transition"
                  >
                    <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                    </svg>
                    <span>Instagram</span>
                  </a>
                )}
                {viewingProfile.youtube && (
                  <a
                    href={viewingProfile.youtube.startsWith('http') ? viewingProfile.youtube : `https://${viewingProfile.youtube}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs font-semibold text-brand-primary bg-brand-primary/5 hover:bg-brand-primary/10 px-3 py-2 rounded-xl transition"
                  >
                    <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.108C19.524 3.545 12 3.545 12 3.545s-7.524 0-9.388.51a3.002 3.002 0 0 0-2.11 2.108C0 8.027 0 12 0 12s0 3.973.502 5.837a3.002 3.002 0 0 0 2.11 2.108c1.864.51 9.388.51 9.388.51s7.525 0 9.388-.51a3.002 3.002 0 0 0 2.11-2.108c.502-1.864.502-5.837.502-5.837s0-3.973-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                    <span>YouTube</span>
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="border-t border-brand-primary/10 pt-4 text-center text-xs text-text/50">
              Nenhuma rede social configurada no perfil.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
