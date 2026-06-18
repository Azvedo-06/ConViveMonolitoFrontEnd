import { useState } from 'react';
import { type UserResponseDto, Role } from '../../../services/backendRoutes';

type MyAgendaProps = {
  user: UserResponseDto | null;
  myEvents: { created: any[]; joined: any[] };
  loadingEvents: boolean;
  onEventClick: (event: any) => void;
};

export function MyAgenda({ user, myEvents, loadingEvents, onEventClick }: MyAgendaProps) {
  const [activeTab, setActiveTab] = useState<'joined' | 'created'>('joined');

  return (
    <div className="lg:col-span-5 overflow-hidden rounded-2xl border border-brand-primary/25 bg-white/95 shadow-cityCard backdrop-blur-sm p-6 md:p-8">
      <h2 className="font-display text-xl font-bold text-brand-primary mb-4 flex items-center gap-2">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
        Minha Agenda
      </h2>

      <div className="flex border-b border-brand-primary/10 mb-4">
        <button
          type="button"
          onClick={() => setActiveTab('joined')}
          className={`flex-1 pb-2 text-xs font-semibold uppercase tracking-wider border-b-2 text-center transition ${
            activeTab === 'joined'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-text/60 hover:text-text'
          }`}
        >
          Presença Confirmada ({myEvents.joined.length})
        </button>
        {(user?.role === Role.ORGANIZER || user?.role === Role.ADMIN) && (
          <button
            type="button"
            onClick={() => setActiveTab('created')}
            className={`flex-1 pb-2 text-xs font-semibold uppercase tracking-wider border-b-2 text-center transition ${
              activeTab === 'created'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-text/60 hover:text-text'
            }`}
          >
            Criados por Mim ({myEvents.created.length})
          </button>
        )}
      </div>

      {loadingEvents ? (
        <div className="py-10 text-center text-sm text-text/60">
          Carregando eventos...
        </div>
      ) : (
        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
          {activeTab === 'joined' ? (
            myEvents.joined.length === 0 ? (
              <div className="py-8 text-center text-xs text-text/60 border border-dashed border-brand-primary/20 rounded-xl bg-brand-primary/5">
                Você não se inscreveu em nenhum evento ainda.
              </div>
            ) : (
              myEvents.joined.map((event: any) => (
                <div key={event.id} onClick={() => onEventClick(event)} className="p-3.5 rounded-xl border border-brand-primary/15 bg-white shadow-sm hover:border-brand-primary/45 transition cursor-pointer hover:shadow-md hover:-translate-y-0.5">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-primary bg-brand-primary/5 px-2 py-0.5 rounded">
                      {event.category}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${event.type === 'PRIVATE' ? 'bg-brand-primary text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                      {event.type === 'PRIVATE' ? (event.price ? `R$ ${event.price.toFixed(2)}` : 'Pago') : 'Gratuito'}
                    </span>
                  </div>
                  <h4 className="font-display font-bold text-sm text-brand-primary mt-1.5 line-clamp-1">
                    {event.title}
                  </h4>
                  <p className="text-[11px] text-text/70 mt-1 flex items-center gap-1">
                    <span>📅 {new Date(event.date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                  </p>
                  <p className="text-[11px] text-text/70 flex items-center gap-1 mt-0.5">
                    <span>📍 {event.location}</span>
                  </p>
                </div>
              ))
            )
          ) : (
            myEvents.created.length === 0 ? (
              <div className="py-8 text-center text-xs text-text/60 border border-dashed border-brand-primary/20 rounded-xl bg-brand-primary/5">
                Você não criou nenhum evento ainda.
              </div>
            ) : (
              myEvents.created.map((event: any) => (
                <div key={event.id} onClick={() => onEventClick(event)} className="p-3.5 rounded-xl border border-brand-primary/15 bg-white shadow-sm hover:border-brand-primary/45 transition cursor-pointer hover:shadow-md hover:-translate-y-0.5">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-primary bg-brand-primary/5 px-2 py-0.5 rounded">
                      {event.category}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${event.type === 'PRIVATE' ? 'bg-brand-primary text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                      {event.type === 'PRIVATE' ? (event.price ? `R$ ${event.price.toFixed(2)}` : 'Pago') : 'Gratuito'}
                    </span>
                  </div>
                  <h4 className="font-display font-bold text-sm text-brand-primary mt-1.5 line-clamp-1">
                    {event.title}
                  </h4>
                  <p className="text-[11px] text-text/70 mt-1 flex items-center gap-1">
                    <span>📅 {new Date(event.date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                  </p>
                  <p className="text-[11px] text-text/70 flex items-center gap-1 mt-0.5">
                    <span>📍 {event.location}</span>
                  </p>
                </div>
              ))
            )
          )}
        </div>
      )}
    </div>
  );
}
